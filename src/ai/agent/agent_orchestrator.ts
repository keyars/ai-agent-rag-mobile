import { AIProvider } from '../providers/types';
import { currentTimeTool } from '../../tools/current_time';
import { KnowledgeBase } from '../../rag/knowledge_base';
import { AgentResult } from '../../types';
import { buildGroundedPrompt, GROUNDING_SYSTEM } from '../../rag/grounding';

export class AgentOrchestrator {
  constructor(private readonly provider: AIProvider, private readonly knowledgeBase: KnowledgeBase) {}
  async run(question: string): Promise<AgentResult> {
    const normalized = question.trim().toLowerCase();
    if (/\b(what time|current time|time is it)\b/.test(normalized)) return { answer: currentTimeTool(), sources: [], tool: 'current_time' };
    const results = await this.knowledgeBase.search(question, this.provider, 5, 0.18);
    if (results.length === 0) {
      if (this.provider.name === 'demo') return { answer: 'I could not find relevant information in the knowledge base.', sources: [], tool: 'knowledge_search' };
      const answer = await this.provider.chat(question, { system: `${GROUNDING_SYSTEM}\nNo relevant context was retrieved.` });
      return { answer, sources: [], tool: 'direct' };
    }
    const answer = await this.provider.chat(buildGroundedPrompt(question, results), {
      system: GROUNDING_SYSTEM,
      context: results,
    });
    const sourceIds = new Set(results.map((result) => result.chunk.documentId));
    return { answer, sources: this.knowledgeBase.documents().filter((doc) => sourceIds.has(doc.id)), tool: 'knowledge_search' };
  }
}
