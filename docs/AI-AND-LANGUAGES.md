# Languages and personal assistants

The English/Spanish picker appears on the login page and in the app header. It stores a device cookie for one year; it does not change the other person's language. The first visit uses supported browser preferences, with Spanish as the fallback. USD amounts use a decimal point in both languages. Dates display with localized month names; stored dates remain ISO.

Both members share confirmed records, documents, review drafts, goals and explicit memories. Chat history is scoped to the authenticated email, so one person's English conversation does not fill the other person's Spanish chat. Original document text and user-entered names are preserved. The assistant's next response and new extraction explanations use the selected language. Existing messages and notes are not automatically translated.

## Connect chat and document reading independently

In **Household / Hogar**, there are two connection cards:

1. **Choose your AI assistant:** choose OpenRouter, Grok (xAI), Groq, Gemini, or an OpenAI-compatible endpoint. Enter a provider key if none is connected, load current models, choose a model with tool support, and save. Grok and Groq are different providers.
2. **Receipt and document reader:** defaults to Google AI Studio's Gemini. Follow the key link, enter an existing Gemini API key, load available models and save one that supports the documents you use. This works even if chat is not connected. You can use another provider for reading too.

An AI Studio account alone is not an API credential. Create or select a key in [Google AI Studio](https://aistudio.google.com/apikey). The app tests key/model availability while saving. This does not prove a model's OCR accuracy or that your account has generation quota. Try a small receipt and compare its extracted amounts before relying on it. [Google API keys](https://ai.google.dev/gemini-api/docs/api-key), [native PDF input](https://ai.google.dev/gemini-api/docs/document-processing), [structured output](https://ai.google.dev/gemini-api/docs/structured-output).

Model lists come from provider catalogs at request time. OpenRouter catalog prices are shown when supplied; other providers link to their own pricing. No silent fallback or provider-owned file index is configured. Photos and scanned PDFs go to the chosen reader. Searchable PDFs are extracted locally first; CSV import is deterministic. Files stay limited to 4 MB and extraction stays subject to the configured output limit; split long statements.

Keys entered in the app are encrypted with AES-256-GCM using `AUTH_SECRET` and stored in a separate household/provider table. They are never returned by settings APIs or included in the ledger, audit or JSON export. Environment keys remain supported. Back up `AUTH_SECRET` separately; after rotating it, reconnect any keys stored through the UI. Model settings use optimistic revisions to reject concurrent stale edits.

## Agent actions

The coach uses Vercel AI SDK 7 with at most four model calls per response, no automatic retries, and a final response step reserved within a 110-second deadline. Each actual provider request reserves a slot in the shared daily call allowance before it is sent. The call allowance is not a dollar cap; set a monetary cap with the provider as well.

The model can call these household-scoped tools:

| Tool                 | Behavior                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `money_checkin`      | Return record-based next steps, payday outflows and review counts.                                                                               |
| `check_purchase`     | Check an additional one-time cash purchase against the 30-day forecast and buffer; withhold estimates when facts are missing.                    |
| `search_documents`   | Retrieve original source excerpts and explicit preferences in English or Spanish.                                                                |
| `cash_flow`          | Calculate a 1–90 day forecast and show missing facts.                                                                                            |
| `spending_summary`   | Total confirmed spending by category, separately from borrowing, transfers and loan repayments.                                                  |
| `compare_debt_plans` | Calculate avalanche and snowball scenarios with missing-rate and affordability limits.                                                           |
| `check_balances`     | Compare statement balances with the ledger without inventing balancing entries.                                                                  |
| `prepare_entries`    | Prepare up to ten validated accounts, expenses, debts, calendar items, tasks, preferences, category budgets, goals or balance checks for review. |

Prepared entries and both chat messages commit together after a successful final response. None of these tools can confirm a draft, make a payment, contact a lender, apply for credit, trade, or execute arbitrary code. The UI shows which checks ran. Uploaded instructions are treated as untrusted evidence. The financial engine remains deterministic; the natural-language interpretation is model-generated and needs review.

BM25 retrieval reuses the CGC ranker plus English/Spanish financial query expansion. Confirmed memories provide persistent household context; there is no model fine-tuning or vector-service bill. New facts are available on the next turn. Original sources remain the reference when statements conflict.

## Current verification

Automated tests use synthetic local mock responses for SDK tool loops, Spanish answers, native Gemini PDF/image transport, response validation, usage accounting, secret exclusion, key recovery, household isolation and independent reader configuration. They do not establish live OCR accuracy. Live connections require the household's API keys, which were not found in the inspected personal project or environment.
