import { describe, expect, it } from 'vitest';
import { AgentOrchestrator } from '../src/ai/agent/agent_orchestrator';
import { AIProvider } from '../src/ai/providers/types';
import { KnowledgeBase } from '../src/rag/knowledge_base';

class FakeProvider implements AIProvider {
  readonly name = 'fake';
  async embed(text: string) { const vector = new Array<number>(8).fill(0); for (const char of text.toLowerCase()) vector[char.charCodeAt(0) % 8] += 1; const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1; return vector.map((v) => v / norm); }
  async chat(prompt: string) { return `Grounded: ${prompt.includes('PostgreSQL') ? 'PostgreSQL' : 'context received'}`; }
}

describe('agent orchestrator', () => {
  it('routes time questions to the current-time tool', async () => {
    const result = await new AgentOrchestrator(new FakeProvider(), new KnowledgeBase()).run('What time is it?');
    expect(result.tool).toBe('current_time'); expect(result.answer).not.toBe('');
  });
  it('uses retrieved knowledge and returns sources', async () => {
    const provider = new FakeProvider(); const kb = new KnowledgeBase();
    await kb.ingest({ name: 'alpha.md', text: 'Project Alpha uses PostgreSQL as its primary database.' }, provider);
    const result = await new AgentOrchestrator(provider, kb).run('What database does Project Alpha use?');
    expect(result.tool).toBe('knowledge_search'); expect(result.sources[0]?.name).toBe('alpha.md'); expect(result.answer).toContain('PostgreSQL');
  });
});
