import { Chunk, SearchResult } from '../types';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, aNorm = 0, bNorm = 0;
  for (let i = 0; i < a.length; i += 1) { const av = a[i] ?? 0, bv = b[i] ?? 0; dot += av * bv; aNorm += av * av; bNorm += bv * bv; }
  if (aNorm === 0 || bNorm === 0) return 0;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export class InMemoryVectorStore {
  private items: Array<{ chunk: Chunk; vector: number[] }> = [];
  upsert(chunk: Chunk, vector: number[]) { this.items.push({ chunk, vector }); }
  search(vector: number[], topK = 5, threshold = 0.25): SearchResult[] {
    return this.items.map(({ chunk, vector: stored }) => ({ chunk, score: cosineSimilarity(vector, stored) }))
      .filter((result) => result.score >= threshold).sort((a, b) => b.score - a.score).slice(0, topK);
  }
  clear() { this.items = []; }
}
