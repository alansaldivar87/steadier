# Delivery status

Updated September 11, 2026. This document distinguishes implemented code from connected live services.

## Implemented and locally verified

- Standard Next.js application and production build.
- English/Spanish UI, language cookies, localized forms/errors/coach responses and Spanish intake guide.
- UI model selection for OpenRouter, Grok/xAI, Groq, Gemini and compatible endpoints; independent Google AI Studio document reader.
- Vercel AI SDK tool loop for financial calculations, bilingual retrieval and validated review proposals; member-scoped conversations.
- Provider credentials encrypted separately and excluded from API responses, audit and exports.
- Exact household email allowlist, Google OAuth integration, server-side membership checks, development-only loopback access.
- Accounts, integer-cent transactions, category targets, goals, reconciliation, debt snapshots and comparisons, tasks, household preferences.
- Date-based cash forecast, unpaid overdue bills, monthly recurrence, missing-data checks.
- Calendar settlement/linking/reopening with atomic writes and revision checks.
- Persistent file upload, hash identity, CSV staging, PDF text extraction, provider-backed vision/structured extraction paths, reviewed imports, retryable job state.
- Shared coach context, source retrieval, explicit memory, proposal review and durable AI call limits.
- Local MCP stdio transport with protocol-level tests; optional WebMCP registration code.
- Export, CI template, Vercel/Docker configuration, intake worksheets and operations documentation.

## Validation

Final local checks: **32 automated tests passed**, TypeScript passed, and the optimized Next.js build passed. HTTP checks against the production build returned a sign-in redirect for the home page, 401 for unauthenticated household/document/export/write requests, and 403 for a cross-origin write. Follow-up checks also verified that AI settings and chat reject unauthenticated requests, cross-origin AI settings writes are rejected, and both English and Spanish login pages render successfully. The local-development write path reaches input validation. No test household records were added to the real workspace.

Automated tests cover money parsing, invalid dates, card payment accounting, cash advances, future transactions, month-end recurrence, overdue obligations, within-day shortfalls, incomplete data, statement differences, payoff assumptions, CSV parsing, allowlist rules, production access gating, CGC retrieval, stale revisions, source identity, duplicate confirmation, debt snapshot updates, calendar consistency, linked payments, document retries, household isolation, AI adapter validation/usage cap, and MCP negotiation/read/proposal/error paths.

AI tests use synthetic local HTTP servers and mocked provider responses, including native Gemini image/PDF transport and independent OCR configuration. It verifies the adapter contract and usage guard, not a live provider's extraction quality. Financial data used by tests is isolated from the real household.

## Still needs the household's connections

- Google Cloud OAuth client ID/secret. The two supplied Gmail addresses are configured locally.
- Personal chat/reader API keys and selected models. The inspected personal Studio checkout and local environment contained no reusable OpenRouter, Groq or xAI key; an AI Studio account still needs a Gemini API key.
- Remote libSQL database and private object store for shared hosting.
- A signed-in personal Vercel account/project and final Google callback domain.

Until these are connected, the app works as a local workspace. Google sign-in, live AI receipt extraction and shared access from phones have not been verified against actual accounts. There is no deployed household URL yet. Browser checks covered English/Spanish switching, the provider/reader settings and the Spanish home screen. Live provider generation, real receipt OCR, phone-camera permissions and actual Google login still require the household connections.

## GitHub workflow authorization

The personal GitHub authorization can create the private repository and push app code but lacks the `workflow` scope. `ci/github-actions.yml` is ready to move into `.github/workflows/check.yml` after an appropriately scoped login. No GitHub Actions run is claimed for this delivery. Local release checks passed.

## Explicit capability limits

USD only; no automatic bank feed; no model fine-tuning; no scheduled notifications; no payments, lender communications, legal filings, credit applications, or investments executed; no offline financial writes; no one-click cloud migration/restore. These are not represented as connected features in the UI.
