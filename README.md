# AI Agent RAG Mobile

A small React Native + Expo reference application demonstrating a practical mobile AI architecture: **agent orchestration + RAG + embeddings + vector retrieval + source-aware answers + multiple LLM providers**.

## What it demonstrates

- React Native + TypeScript mobile UI
- Local document ingestion for TXT, Markdown, CSV and JSON
- Deterministic chunking with overlap
- Embedding provider abstraction
- In-memory cosine-similarity retrieval
- Grounded RAG prompts with source metadata
- Small agent router with a knowledge-search tool and current-time tool
- OpenAI, Google Gemini and Anthropic Claude provider adapters
- Offline/demo mode for UI and architecture testing without API credentials
- Local persistence of imported documents and settings
- Unit tests for chunking, retrieval and agent routing
- GitHub Actions quality checks

## Run locally

Requirements: Node.js 22+, npm, and Expo Go or an Android/iOS development environment.

```bash
npm install
npm start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go. Web is also available with `npm run web`.

## Test without an API key

The default provider is **Demo**. Open the app, go to **Knowledge**, choose **Load Samples**, then ask:

1. `What database does Project Alpha use?` → PostgreSQL 16
2. `Which authentication protocol is used?` → OAuth 2.0
3. `What does the running guide say about long runs?` → once per week
4. `What time is it?` → handled by the local agent tool
5. `What is the capital of France?` → should not be answered from the sample knowledge base

The sample set deliberately contains Markdown, plain text and JSON content so retrieval can be exercised across different document formats.

## Test with real providers

Open **Settings**, choose OpenAI, Gemini or Claude, enter the provider key locally, save, and return to Chat. The app never commits API keys. For production deployments, provider credentials should be moved behind a trusted backend rather than embedded in a mobile application.

## Automated tests

```bash
npm run typecheck
npm test
npm run format:check
```

The test suite covers empty and long-document chunking, cosine similarity, retrieval ordering, agent routing to the current-time tool, knowledge retrieval and source attribution.

## Architecture

```text
React Native UI
      |
      v
Agent Orchestrator
  |             |
  v             v
RAG Search   Local Tool
  |
Query Embedding
  |
Vector Retrieval
  |
Relevant Chunks
  |
Grounded Prompt
  |
AI Provider
  +-- OpenAI
  +-- Gemini
  +-- Claude
  +-- Demo
```

## Important design note

This repository is intentionally a **mobile reference implementation**, not a production SaaS backend. The vector store is in memory and documents are persisted locally. That keeps the project small, reproducible and easy to inspect. A future repository can demonstrate a hosted vector database, backend token brokerage, authentication and multi-user synchronization.

## Limitations

- PDF extraction is not included in the first version; the picker accepts text-based formats.
- Claude generation is supported, while its adapter uses the app's local deterministic embedding implementation because Anthropic does not provide a native general-purpose embedding endpoint.
- The demo embedding is deliberately deterministic and is not marketed as a semantic model.
- API keys entered directly in a mobile app are suitable for local experimentation only.

## License

MIT
