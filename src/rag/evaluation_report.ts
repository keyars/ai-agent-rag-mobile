import { RetrievalCase, RAGEvaluationSummary, evaluateRetrieval, meetsThresholds, summarizeEvaluations, DEFAULT_EVALUATION_THRESHOLDS } from './evaluation';
import { AIProvider } from '../ai/providers/types';
import { KnowledgeBase } from './knowledge_base';

export async function runRetrievalEvaluation(
  knowledgeBase: KnowledgeBase,
  provider: AIProvider,
  cases: RetrievalCase[],
): Promise<RAGEvaluationSummary> {
  const results = [];
  for (const testCase of cases) {
    const retrieved = await knowledgeBase.search(testCase.query, provider, 5, 0.2);
    results.push(evaluateRetrieval(testCase, retrieved));
  }
  return summarizeEvaluations(results);
}

export function formatEvaluationReport(summary: RAGEvaluationSummary): string {
  const status = meetsThresholds(summary) ? 'PASS' : 'FAIL';
  return [
    `RAG Evaluation: ${status}`,
    `Cases: ${summary.cases.length}`,
    `Pass rate: ${(summary.passRate * 100).toFixed(1)}%`,
    `Precision: ${summary.meanPrecision.toFixed(3)} (min ${DEFAULT_EVALUATION_THRESHOLDS.minPrecision.toFixed(3)})`,
    `Recall: ${summary.meanRecall.toFixed(3)} (min ${DEFAULT_EVALUATION_THRESHOLDS.minRecall.toFixed(3)})`,
    `MRR: ${summary.meanReciprocalRank.toFixed(3)} (min ${DEFAULT_EVALUATION_THRESHOLDS.minMRR.toFixed(3)})`,
  ].join('\n');
}
