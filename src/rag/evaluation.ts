import { SearchResult } from '../types';

export interface RetrievalCase {
  id: string;
  query: string;
  expectedDocuments: string[];
  expectedKeywords?: string[];
  shouldRetrieve: boolean;
}

export interface RetrievalEvaluation {
  id: string;
  retrievedDocuments: string[];
  expectedDocuments: string[];
  hit: boolean;
  precision: number;
  recall: number;
  reciprocalRank: number;
  passed: boolean;
}

export interface RAGEvaluationSummary {
  cases: RetrievalEvaluation[];
  meanPrecision: number;
  meanRecall: number;
  meanReciprocalRank: number;
  passRate: number;
}

export interface EvaluationThresholds {
  minPrecision: number;
  minRecall: number;
  minMRR: number;
  minPassRate: number;
}

export const DEFAULT_EVALUATION_THRESHOLDS: EvaluationThresholds = {
  minPrecision: 0.55,
  minRecall: 0.65,
  minMRR: 0.65,
  minPassRate: 0.75,
};

export function evaluateRetrieval(testCase: RetrievalCase, results: SearchResult[]): RetrievalEvaluation {
  const expected = new Set(testCase.expectedDocuments);
  const retrieved = results.map((result) => result.chunk.documentName);
  const uniqueRetrieved = [...new Set(retrieved)];
  const relevant = uniqueRetrieved.filter((name) => expected.has(name)).length;
  const precision = uniqueRetrieved.length === 0 ? 0 : relevant / uniqueRetrieved.length;
  const recall = expected.size === 0 ? (testCase.shouldRetrieve ? 0 : 1) : relevant / expected.size;
  const rank = retrieved.findIndex((name) => expected.has(name));
  const reciprocalRank = rank === -1 ? 0 : 1 / (rank + 1);
  const hit = testCase.shouldRetrieve ? relevant > 0 : uniqueRetrieved.length === 0;
  return {
    id: testCase.id,
    retrievedDocuments: uniqueRetrieved,
    expectedDocuments: testCase.expectedDocuments,
    hit,
    precision,
    recall,
    reciprocalRank,
    passed: hit && (testCase.shouldRetrieve ? recall > 0 : true),
  };
}

export function summarizeEvaluations(cases: RetrievalEvaluation[]): RAGEvaluationSummary {
  if (cases.length === 0) return { cases: [], meanPrecision: 0, meanRecall: 0, meanReciprocalRank: 0, passRate: 0 };
  const average = (selector: (item: RetrievalEvaluation) => number) => cases.reduce((sum, item) => sum + selector(item), 0) / cases.length;
  return {
    cases,
    meanPrecision: average((item) => item.precision),
    meanRecall: average((item) => item.recall),
    meanReciprocalRank: average((item) => item.reciprocalRank),
    passRate: average((item) => (item.passed ? 1 : 0)),
  };
}

export function meetsThresholds(summary: RAGEvaluationSummary, thresholds = DEFAULT_EVALUATION_THRESHOLDS): boolean {
  return summary.meanPrecision >= thresholds.minPrecision &&
    summary.meanRecall >= thresholds.minRecall &&
    summary.meanReciprocalRank >= thresholds.minMRR &&
    summary.passRate >= thresholds.minPassRate;
}
