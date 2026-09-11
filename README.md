# Steadier

A shared household budget and debt workspace for two Google accounts. Built to make the next useful action obvious: capture a receipt, review a statement, record an expense, or handle an urgent housing deadline.

## Start here

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js. This checkout has a private `.env.local` for loopback-only local development. For a fresh clone, copy `.env.example` to `.env.local` and generate `AUTH_SECRET`. Local access only works in development on localhost/127.0.0.1; deployed requests always require Google authentication.

- [Idiomas, modelos y asistentes / Languages and AI](docs/AI-AND-LANGUAGES.md)
- [Guía para empezar en español](intake/EMPEZAR-AQUI.md)
- [Daily workspace and remaining product gaps](docs/DAILY-WORKSPACE.md)
- [Connection and Vercel setup](docs/SETUP.md)
- [Start gathering your household documents](intake/START-HERE.md)
- [Mortgage call worksheet](intake/HOUSING-FIRST.md)
- [Architecture and agent flows](docs/ARCHITECTURE.md)
- [Accounting rules](docs/ACCOUNTING.md)
- [CGC reuse record](docs/CGC-REUSE.md)
- [MCP setup](docs/MCP.md)
- [Operations and recovery](docs/OPERATIONS.md)
- [Validation and remaining connections](docs/STATUS.md)

## Working features

English/Spanish UI and per-device language preference; member-scoped conversations; independent Gemini document reader; switchable OpenRouter, Grok, Groq, Gemini and compatible models; Vercel AI SDK tool loops; Next.js App Router + strict TypeScript; Google sign-in with exact email allowlist; shared durable ledger; integer-cent arithmetic; account balances; income, expenses, transfers, borrowing and loan payments; monthly category budgets; savings goals; date-based cash forecasts; overdue housing tasks; debt snapshots and payoff comparisons; recurring bill/payday calendar; atomic payment recording/linking; editable review drafts; statement balance reconciliation; phone camera and file intake; CSV import; PDF text extraction and configurable vision extraction; cited document retrieval; household memory; conversational proposals; append-only audit history; export; local MCP server; daily AI call cap; CI template and Docker/Vercel configuration.

The app starts empty. No invented balances, debts, or sample household data are seeded into the real ledger.

## Portability

- Standard Next.js, deployable on Vercel or a Node host.
- SQLite/libSQL repository: local SQLite or remote libSQL (including Turso's libSQL databases).
- File adapter: local disk, private Vercel Blob, or S3-compatible storage.
- AI model selection in Household: change providers and models without editing code; a separate reader can use Google AI Studio while chat uses another provider. Environment defaults and custom compatible endpoints remain supported. Model must support the required modalities; providers are not interchangeable at the feature level.
- RAG uses CGC's local BM25 retrieval, plus English/Spanish financial query expansion, with no vector database or provider-owned file store required.
- Household preferences and reviewed corrections form application memory. No model fine-tuning occurs.

## Verify

```sh
npm run typecheck
npm test
npm run build
npm run doctor
```

`doctor` reports missing connections without printing secrets. It exits nonzero until production connections are supplied. Tests use isolated databases and synthetic data. The full application can be explored locally; shared Google access and real model responses require the connections in the setup guide.
