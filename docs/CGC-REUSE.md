# CGC reuse record

Reviewed local sources (read-only):

- `C:/Users/Emerald/github/cgc/HANDOFF-ai-agent-platform-2026-08-07.md`
- `C:/Users/Emerald/github/cgc/PLAN-mobile-agentic-chat-2026-07-27.md`
- `C:/Users/Emerald/github/cgc/cgc-admin/src/lib/ai/rag/bm25.ts`
- `C:/Users/Emerald/github/cgc/cgc-admin/src/lib/ai/provider.ts`
- `C:/Users/Emerald/github/cgc/cgc-admin/src/lib/ai/prompt-guard.ts`
- `C:/Users/Emerald/github/cgc/cgc-admin/src/lib/ai/token-budget.ts`

The BM25 module was copied to `src/lib/ai/bm25.ts` with its provenance comment retained. It provides retrieval without vendor lock-in and is exercised by tests. The provider abstraction, source-grounded responses, versioned prompt markers, proposal review and usage ledger concepts were adapted into new household-specific code.

CGC's Xano endpoints, tenant authorization, feature flags, support ticket logic, organization prompts, UI framework, runtime keys and customer data were not copied. The in-memory token counter was replaced with a durable call-reservation table; it is a limit on calls, not a claimed token/dollar cap. No changes were made to CGC. This repository is saved privately in the user's personal GitHub account.
