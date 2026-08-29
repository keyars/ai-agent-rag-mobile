import { SearchResult } from '../types';

export interface AnswerEvaluationCase {
  id: string;
  question: string;
  answer: string;
  evidence: SearchResult[];
  expectedSources: string[];
  expectedKeywords: string[];
  shouldAnswer: boolean;
}

export interface AnswerEvaluation {
  id: string;
  grounded: boolean;
  keywordCoverage: number;
  sourceAccuracy: number;
  unsupported: boolean;
  passed: boolean;
}

export function evaluateAnswer(testCase: AnswerEvaluationCase): AnswerEvaluation {
  const normalized = testCase.answer.toLowerCase();
  const keywordHits = testCase.expectedKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
  const keywordCoverage = testCase.expectedKeywords.length === 0 ? 1 : keywordHits / testCase.expectedKeywords.length;
  const retrievedSources = new Set(testCase.evidence.map((item) => item.chunk.documentName));
  const expectedSources = new Set(testCase.expectedSources);
  const sourceHits = [...expectedSources].filter((source) => retrievedSources.has(source)).length;
  const sourceAccuracy = expectedSources.size === 0 ? (retrievedSources.size === 0 ? 1 : 0) : sourceHits / expectedSources.size;
  const refusal = /not available|not found|don't have enough|cannot answer|unable to answer|no relevant/i.test(testCase.answer);
  const grounded = !testCase.shouldAnswer ? refusal : keywordCoverage > 0 && sourceAccuracy > 0;
  const unsupported = testCase.shouldAnswer ? keywordCoverage === 0 || sourceAccuracy === 0 : !refusal;
  return { id: testCase.id, grounded, keywordCoverage, sourceAccuracy, unsupported, passed: grounded && !unsupported };
}

export function summarizeAnswerEvaluations(results: AnswerEvaluation[]) {
  if (results.length === 0) return { results, groundedRate: 0, sourceAccuracy: 0, passRate: 0 };
  const average = (fn: (r: AnswerEvaluation) => number) => results.reduce((sum, r) => sum + fn(r), 0) / results.length;
  return {
    results,
    groundedRate: average((r) => (r.grounded ? 1 : 0)),
    sourceAccuracy: average((r) => r.sourceAccuracy),
    passRate: average((r) => (r.passed ? 1 : 0)),
  };
}
