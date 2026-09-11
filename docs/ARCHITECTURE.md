# Architecture

## Boundaries

The browser is a mobile-friendly Next.js working surface. Server routes authenticate household membership, validate input, call domain services, and return plain JSON. Financial arithmetic is deterministic TypeScript. The model cannot write ledger rows directly or run arbitrary SQL. All agent financial proposals become review drafts.

```
Phone camera / PDF / CSV / chat
           |
           v
Authenticated intake -> original file + durable document state
           |
   CSV parser / PDF text / vision model
           |
           v
Source-linked drafts -> household review -> validated transaction
           |                                    |
           v                                    v
Searchable document chunks             ledger + audit (atomic)
           |                                    |
           +----> retrieved evidence <---- cash-flow engine
                              |
                        household coach
                              |
                  answer + citations + proposals
```

## Persistence

`records` contains validated typed JSON rows with household, kind, stable ID and revision. The composite primary key and household/kind index enforce namespace and access boundaries. Shared writes use a libSQL write transaction. Stale edits are rejected, financial confirmation and audit append happen together, and unique keys prevent replayed imports. `audit` is append-only through the application. `ai_usage` records call reservations/outcomes and tokens; it reserves under a write lock before issuing an external call.

Provider secrets live in a separate `ai_credentials` table, encrypted with AES-256-GCM and never included in `records`, `audit` or JSON exports. Non-secret AI selections use revisioned records.

Schema initialization is idempotent. Future schema changes should be versioned SQL migrations; changing a JSON shape must preserve older data through defaults or explicit migration. Account, transaction, debt, calendar, budget, goal, reconciliation, task, memory and settings shapes live in `src/lib/domain.ts`.

## RAG and memory

The copied CGC BM25 ranker supplies lexical retrieval, accent folding, bilingual stopword handling, deterministic ranking and source-centered excerpts. Documents are chunked at retrieval time with overlap. Financial query expansion matches common English and Spanish terms across source languages. Each result includes its original filename, source ID and authenticated original-document link. Household memories are explicit, editable records, not inferred hidden profiles. Official guidance is dated and distinguished from household evidence.

This is retrieval-augmented generation, not fine-tuning. A newer statement can update a selected debt snapshot at review. A memory correction takes effect on the next coach turn. Unknown financial values remain review issues. The index can later be replaced or complemented by embeddings through the retrieval module without changing ledger behavior.

## Agent flows

1. **Intake:** validate size/type -> hash -> save original -> write uploaded document record.
2. **Extraction:** acquire revision/120-second lease -> parse deterministic CSV or PDF text -> model extraction if needed -> atomically stage drafts and final document status.
3. **Review:** edit fields -> select existing snapshot when applicable -> validate references and duplicates -> commit ledger row, audit and reviewed draft atomically.
4. **Coach:** get household, calculate forecast, retrieve bilingual sources and member-scoped history -> Vercel AI SDK loop using search, cash flow, spending, payoff, balance-check and proposal tools -> validate proposals -> atomically persist all drafts and both messages after a successful final answer. Four provider calls maximum; last step reserved for the response.
5. **Calendar:** mark a specific occurrence paid by linking an imported transaction or atomically creating a new one; use actual payment date; keep a link preventing accidental edits/deletion of settled money.
6. **Reconciliation:** compare statement closing balance with calculated ledger balance; mismatches block extra-spending estimates until resolved.
7. **MCP:** read snapshot/search/drafts, calculate spending/debt comparisons/statement checks, or stage an expense. It cannot accept drafts, pay lenders, apply for credit or trade.

Extraction runs in an authenticated request with a 60-second runtime limit and a 50-second provider timeout. The uploaded original and state survive a killed request. A later retry can reclaim an expired lease. This is a durable recoverable workflow, not an external background queue. No scheduled notifications are currently activated.

## AI adapter

`src/lib/ai/provider.ts` uses Vercel AI SDK with native Google and OpenAI-compatible model adapters. `config.ts` resolves independently selected chat and document providers from encrypted credentials or environment defaults. Provider/model selections are available in the bilingual Household UI. JSON output is checked by Zod. Failed/truncated output is never directly posted as financial truth. Daily call reservations persist; a failed request still consumes a call because the provider may have charged for it. Token usage may be unknown on a failed request. There is no advertised exact cost calculation or silent fallback.

## Access and portability

Google authentication is app-owned. Membership is rechecked server-side on each request. Client state is refreshed every 20 seconds and on tab focus; optimistic revisions reject concurrent stale writes. The shared database, not browser localStorage, holds household money. Local development access is limited to an explicit development flag and loopback host and disabled on Vercel/production.

The app targets USD initially. Financial records never mix currencies. Database, model and file storage modules are isolated adapters; replacing a service does not change the finance engine. Google sign-in is intentionally retained because it is the household's requested identity method.
