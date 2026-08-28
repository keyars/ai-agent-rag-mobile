import { DemoProvider } from '../src/ai/providers/demo_provider';
import { KnowledgeBase } from '../src/rag/knowledge_base';
import { formatEvaluationReport, runRetrievalEvaluation } from '../src/rag/evaluation_report';
import { RetrievalCase } from '../src/rag/evaluation';
import { SAMPLE_RAG_DOCUMENTS } from '../tests/fixtures/sample-rag-docs';

const cases: RetrievalCase[] = [
  { id: 'database', query: 'What database does Project Alpha use?', expectedDocuments: ['project-alpha.md'], expectedKeywords: ['PostgreSQL'], shouldRetrieve: true },
  { id: 'auth', query: 'Which authentication protocol is used?', expectedDocuments: ['project-alpha.md'], expectedKeywords: ['OAuth 2.0'], shouldRetrieve: true },
  { id: 'running', query: 'How often should long runs be done?', expectedDocuments: ['running-guide.txt'], expectedKeywords: ['once per week'], shouldRetrieve: true },
  { id: 'json', query: 'What is the release channel?', expectedDocuments: ['release.json'], expectedKeywords: ['stable'], shouldRetrieve: true },
  { id: 'irrelevant', query: 'What is the capital of France?', expectedDocuments: [], shouldRetrieve: false },
  { id: 'unknown', query: 'What is the office cafeteria menu?', expectedDocuments: [], shouldRetrieve: false },
];

async function main() {
  const provider = new DemoProvider();
  const knowledgeBase = new KnowledgeBase();
  for (const document of SAMPLE_RAG_DOCUMENTS) await knowledgeBase.ingest(document, provider);
  const summary = await runRetrievalEvaluation(knowledgeBase, provider, cases);
  console.log(formatEvaluationReport(summary));
  for (const item of summary.cases) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.id}: ${item.retrievedDocuments.join(', ') || '(none)'}`);
  if (!summary.cases.every((item) => item.passed)) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
