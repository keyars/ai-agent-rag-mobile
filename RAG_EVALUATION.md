# RAG Evaluation

This repository now includes a deterministic retrieval evaluation layer.

## Metrics

- **Precision** — how many unique retrieved documents are relevant.
- **Recall** — how many expected relevant documents were retrieved.
- **MRR** — how highly the first relevant document ranked.
- **Pass rate** — whether each test case met its expected retrieval/no-retrieval behaviour.

## Dataset

The regression corpus covers Markdown, plain text and JSON documents, relevant questions, irrelevant questions, unknown questions and an imported document containing prompt-injection text.

## Running it

```bash
npm run test:rag
```

The evaluation uses the deterministic Demo provider, so the regression gate does not require API credentials and does not depend on network availability.

## Interpretation

The evaluation is deliberately separate from LLM-generated answer quality. Retrieval metrics tell us whether the RAG layer selected the right evidence; a later evaluation layer can assess groundedness and citation correctness using controlled answer fixtures.

CI treats a failed retrieval case as a regression. Thresholds are also exposed through `meetsThresholds()` for future release gates.
