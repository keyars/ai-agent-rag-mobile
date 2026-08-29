import { describe, expect, it } from 'vitest';
import { evaluateAnswer, summarizeAnswerEvaluations } from '../src/rag/answer_evaluation';
import { SearchResult } from '../src/types';

const evidence: SearchResult[] = [{ score: 0.92, chunk: { id: 'a-0', documentId: 'a', documentName: 'project-alpha.md', index: 0, text: 'Project Alpha uses PostgreSQL 16.' } }];

describe('grounded answer evaluation', () => {
  it('accepts an answer whose claims match evidence and expected source', () => {
    const result = evaluateAnswer({ id: 'grounded', question: 'database?', answer: 'Project Alpha uses PostgreSQL 16.', evidence, expectedSources: ['project-alpha.md'], expectedKeywords: ['PostgreSQL'], shouldAnswer: true });
    expect(result.grounded).toBe(true);
    expect(result.sourceAccuracy).toBe(1);
    expect(result.passed).toBe(true);
  });

  it('rejects an answer that lacks expected evidence', () => {
    const result = evaluateAnswer({ id: 'unsupported', question: 'database?', answer: 'It uses MongoDB.', evidence, expectedSources: ['project-alpha.md'], expectedKeywords: ['PostgreSQL'], shouldAnswer: true });
    expect(result.unsupported).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('requires an explicit no-answer response when evidence should not exist', () => {
    const result = evaluateAnswer({ id: 'no-answer', question: 'cafeteria?', answer: 'The information is not available in the knowledge base.', evidence: [], expectedSources: [], expectedKeywords: [], shouldAnswer: false });
    expect(result.grounded).toBe(true);
    expect(result.passed).toBe(true);
  });

  it('summarizes groundedness and source accuracy', () => {
    const results = [
      evaluateAnswer({ id: 'a', question: 'database?', answer: 'PostgreSQL', evidence, expectedSources: ['project-alpha.md'], expectedKeywords: ['PostgreSQL'], shouldAnswer: true }),
      evaluateAnswer({ id: 'b', question: 'unknown?', answer: 'Not available.', evidence: [], expectedSources: [], expectedKeywords: [], shouldAnswer: false }),
    ];
    const summary = summarizeAnswerEvaluations(results);
    expect(summary.groundedRate).toBe(1);
    expect(summary.sourceAccuracy).toBe(1);
    expect(summary.passRate).toBe(1);
  });
});
