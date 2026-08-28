import { describe, expect, it } from 'vitest';
import { evaluateRetrieval, meetsThresholds, summarizeEvaluations } from '../src/rag/evaluation';
import { SearchResult } from '../src/types';

const result = (name: string, score: number): SearchResult => ({
  score,
  chunk: { id: `${name}-0`, documentId: name, documentName: name, index: 0, text: `${name} content` },
});

describe('RAG evaluation', () => {
  it('computes precision, recall and reciprocal rank', () => {
    const evaluation = evaluateRetrieval(
      { id: 'alpha', query: 'database', expectedDocuments: ['alpha.md'], shouldRetrieve: true },
      [result('noise.md', 0.9), result('alpha.md', 0.8)],
    );
    expect(evaluation.precision).toBe(0.5);
    expect(evaluation.recall).toBe(1);
    expect(evaluation.reciprocalRank).toBeCloseTo(0.5);
    expect(evaluation.hit).toBe(true);
  });

  it('passes an explicit no-relevant-document case only when nothing is retrieved', () => {
    const evaluation = evaluateRetrieval(
      { id: 'none', query: 'unknown', expectedDocuments: [], shouldRetrieve: false },
      [],
    );
    expect(evaluation.hit).toBe(true);
    expect(evaluation.recall).toBe(1);
  });

  it('aggregates evaluation results and applies regression thresholds', () => {
    const summary = summarizeEvaluations([
      evaluateRetrieval({ id: 'a', query: 'a', expectedDocuments: ['a.md'], shouldRetrieve: true }, [result('a.md', 1)]),
      evaluateRetrieval({ id: 'none', query: 'z', expectedDocuments: [], shouldRetrieve: false }, []),
    ]);
    expect(summary.meanPrecision).toBeGreaterThan(0.4);
    expect(summary.meanRecall).toBe(1);
    expect(summary.meanReciprocalRank).toBe(0.5);
    expect(summary.passRate).toBe(1);
    expect(meetsThresholds(summary, { minPrecision: 0.5, minRecall: 0.5, minMRR: 0.4, minPassRate: 1 })).toBe(true);
  });
});
