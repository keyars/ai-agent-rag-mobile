export type ProviderName = 'demo' | 'openai' | 'gemini' | 'claude';

export interface DocumentRecord {
  id: string;
  name: string;
  mimeType?: string;
  text: string;
  chunkCount: number;
  createdAt: string;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  index: number;
  text: string;
}

export interface SearchResult { chunk: Chunk; score: number; }
export interface AgentResult { answer: string; sources: DocumentRecord[]; tool: 'knowledge_search' | 'current_time' | 'direct'; }
