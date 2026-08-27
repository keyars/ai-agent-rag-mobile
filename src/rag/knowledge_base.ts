import { AIProvider } from '../ai/providers/types';
import { chunkText } from './chunker';
import { InMemoryVectorStore } from './vector_store';
import { Chunk, DocumentRecord, SearchResult } from '../types';

export interface IngestInput { name: string; text: string; mimeType?: string; }

export class KnowledgeBase {
  private docs = new Map<string, DocumentRecord>();
  private chunks: Chunk[] = [];
  private vectors = new InMemoryVectorStore();
  private embeddingProvider = 'local';
  private reindexPromise: Promise<void> | null = null;

  async ingest(input: IngestInput, provider: AIProvider): Promise<DocumentRecord> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const parts = chunkText(input.text);
    if (parts.length === 0) throw new Error(`${input.name} is empty.`);
    const doc: DocumentRecord = { id, name: input.name, text: input.text, mimeType: input.mimeType, chunkCount: parts.length, createdAt: new Date().toISOString() };
    this.docs.set(id, doc);
    this.embeddingProvider = provider.name;
    for (let index = 0; index < parts.length; index += 1) {
      const chunk: Chunk = { id: `${id}-${index}`, documentId: id, documentName: input.name, index, text: parts[index] ?? '' };
      this.chunks.push(chunk);
      this.vectors.upsert(chunk, await provider.embed(chunk.text));
    }
    return doc;
  }

  hydrate(documents: DocumentRecord[]) { this.clear(); for (const doc of documents) this.docs.set(doc.id, doc); }

  async reindex(provider: AIProvider): Promise<void> {
    const expected = this.documents().reduce((sum, doc) => sum + doc.chunkCount, 0);
    if (this.embeddingProvider === provider.name && this.chunks.length === expected) return;
    if (this.reindexPromise) return this.reindexPromise;
    this.reindexPromise = (async () => {
      this.vectors.clear(); this.chunks = [];
      for (const doc of this.docs.values()) {
        const parts = chunkText(doc.text);
        for (let index = 0; index < parts.length; index += 1) {
          const chunk: Chunk = { id: `${doc.id}-${index}`, documentId: doc.id, documentName: doc.name, index, text: parts[index] ?? '' };
          this.chunks.push(chunk); this.vectors.upsert(chunk, await provider.embed(chunk.text));
        }
      }
      this.embeddingProvider = provider.name;
    })().finally(() => { this.reindexPromise = null; });
    return this.reindexPromise;
  }

  async search(query: string, provider: AIProvider, topK = 5, threshold = 0.2): Promise<SearchResult[]> {
    await this.reindex(provider);
    return this.vectors.search(await provider.embed(query), topK, threshold);
  }
  documents(): DocumentRecord[] { return [...this.docs.values()]; }
  clear() { this.docs.clear(); this.chunks = []; this.vectors.clear(); this.embeddingProvider = 'local'; this.reindexPromise = null; }
}
