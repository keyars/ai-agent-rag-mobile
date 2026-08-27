import { describe, expect, it } from 'vitest';
import { AIProvider } from '../src/ai/providers/types';
import { KnowledgeBase } from '../src/rag/knowledge_base';

class KeywordProvider implements AIProvider {
  readonly name = 'keyword-test';
  async embed(text: string) {
    const value = text.toLowerCase();
    return [
      value.includes('postgresql') || value.includes('database') ? 1 : 0,
      value.includes('oauth') ? 1 : 0,
      value.includes('redis') || value.includes('cache') ? 1 : 0,
      value.includes('running') || value.includes('long run') ? 1 : 0,
    ];
  }
  async chat() { return 'test'; }
}

describe('knowledge base integration', () => {
  it('indexes Markdown, text and JSON content and retrieves the right source', async () => {
    const provider = new KeywordProvider();
    const kb = new KnowledgeBase();
    await kb.ingest({ name: 'architecture.md', mimeType: 'text/markdown', text: 'Authentication uses OAuth 2.0. PostgreSQL is the primary database.' }, provider);
    await kb.ingest({ name: 'operations.txt', mimeType: 'text/plain', text: 'Redis is used for caching and rate limiting.' }, provider);
    await kb.ingest({ name: 'training.json', mimeType: 'application/json', text: JSON.stringify({ topic: 'running', longRun: 'once per week' }) }, provider);

    expect((await kb.search('Which database is used?', provider, 2, 0.5))[0]?.chunk.documentName).toBe('architecture.md');
    expect((await kb.search('What cache technology is used?', provider, 2, 0.5))[0]?.chunk.documentName).toBe('operations.txt');
    expect((await kb.search('What does the running guide cover?', provider, 2, 0.5))[0]?.chunk.documentName).toBe('training.json');
    expect(kb.documents()).toHaveLength(3);
  });
});
