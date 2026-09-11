# Connect a local agent

The included MCP server uses the official TypeScript SDK over stdio. It shares the app's repository, retrieval module and environment, so agent reads use the same records as the app.

`scripts/mcp-server.ts` exposes:

| Tool/resource                | Effect                                                  |
| ---------------------------- | ------------------------------------------------------- |
| `household_snapshot`         | Reads balances, debts, forecast and missing information |
| `search_household_documents` | Reads source-labeled document excerpts                  |
| `list_review_drafts`         | Reads pending review items                              |
| `propose_expense`            | Creates a review draft; does not post a transaction     |
| `steadier://intake`          | Reads the staged household intake guide                 |

Copy the server entry from `.mcp.example.json` into your agent's MCP configuration, adapting absolute paths after moving the checkout. Run under your own OS account; the local process uses the household database credentials in `.env.local`. It is not an unauthenticated remote HTTP server. Do not expose stdio through a public bridge.

The web page also feature-detects the proposed WebMCP registry. Supported browsers can read `household_summary` or open the entry form with `start_expense_entry`. These are optional browser capabilities; standard forms do not depend on them. Live WebMCP browser validation was unavailable in this build. The stdio MCP protocol is exercised through a real SDK client in tests.

No MCP tool can transfer money, accept an agreement, access Gmail, apply for debt, or confirm review drafts. The household completes financial recording in the app.
