# The daily money workspace

The home screen starts with four actions: record spending, record earned income, upload a photo or document, and open the coach. Navigation uses a sidebar on desktop and four bottom destinations on smaller screens. Household settings remain in the header; the chat bubble sits above the mobile navigation.

## Guidance based on actual records

The next-step helper prioritizes recorded housing catch-up and projected cash shortfalls, then missing accounts, income, bills, imports and statement differences. Completing a form does not automatically assert that the household's entire account, income or bill list is complete. Those confirmations remain explicit in Household.

The payday view uses the same deterministic forecast as the Plan screen. It includes outflows on the payday itself because deposits may arrive later in the day, and uses seven days when no payday is recorded in the 30-day window. Debt balances remain dated statement snapshots. The home screen does not infer net worth, paid-off debt or financial success from absent records.

The purchase checker models an **additional, one-time cash purchase today**, not already included in the ledger or calendar. It subtracts the amount from the lowest projected cash balance over 30 days after protecting the household buffer. Missing facts suppress the resulting spending estimate. This is not a test for financing, credit purchases, recurring costs or a guarantee. It never creates a transaction.

The check-in lists pending documents, unsorted spending, upcoming outflows and recorded statement differences. The unsorted shortcut includes earlier months. It is a live review checklist, not a persisted weekly completion or a scheduled notification.

## Daily entry and the ledger

The quick form records expenses or earned income through the existing authenticated, validated, idempotent records endpoint. It keeps account and date visible, supports existing categories and offers the detailed form for borrowing, transfers and additional information. It points existing calendar bills and paydays back to settlement so users can avoid duplicate forecast effects.

The ledger provides account, type, date and text filters, date groups, pagination and totals for the visible records. Transfers and card payments remain separate from purchases; borrowing remains separate from earnings. Future entries are labeled. The default view ends today.

## Coach and roadmap

`money_checkin` and `check_purchase` expose the same calculations to the Vercel AI SDK coach and local MCP server. The educational roadmap links to real setup, calendar, savings and debt actions. Longer-term planning opens a suggested chat message for the user to review and send. The roadmap is not a financial score or a claim of completing a stage.

General learning material links to the [CFPB toolkit](https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/) and [emergency savings guide](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/), checked September 11, 2026.

## Remaining connections and product gaps

Live model keys, Google OAuth, shared database/storage and deployment still require configuration. Bank feeds, background reminders, household invitations beyond the current allowlist, automated reconciliation, investment-account holdings and a full net-worth ledger are not connected or implemented. The interface should never imply that those services are running. Real account statements are still needed before this household can receive reliable personalized calculations.
