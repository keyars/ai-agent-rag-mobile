import { describe, expect, it } from 'vitest';
import { InMemoryVectorStore, cosineSimilarity } from '../src/rag/vector_store';

describe('vector store', () => {
  it('calculates cosine similarity', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it('returns the highest scoring chunk first', () => {
    const store = new InMemoryVectorStore();
    store.upsert({ id: 'a', documentId: 'd', documentName: 'a', index: 0, text: 'alpha' }, [1, 0]);
    store.upsert({ id: 'b', documentId: 'd', documentName: 'b', index: 0, text: 'beta' }, [0, 1]);
    const results = store.search([0.9, 0.1], 2, 0);
    expect(results[0]?.chunk.id).toBe('a');
  });
});
