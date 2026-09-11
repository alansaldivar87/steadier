export const knowledge = [
  {
    id: 'housing-first',
    title: 'Overdue housing: prepare for a servicer call',
    path: 'https://www.consumerfinance.gov/ask-cfpb/if-i-cant-pay-my-mortgage-loan-what-are-my-options-en-268/',
    source: 'CFPB · checked 2026-09-10',
    text: 'For a U.S. mortgage, contact the servicer promptly when a payment is missed or at risk. Gather income, expenses, current cash, the forbearance agreement and latest notice. Ask what assistance application and supporting documents are required. HUD-approved housing counseling can help. Imminent foreclosure or legal papers may require an attorney. Eligibility depends on the actual loan and circumstances; do not promise approval, delay, or home retention.',
  },
  {
    id: 'ledger-rules',
    title: 'How Steadier counts money',
    path: 'internal:ledger-rules',
    source: 'Steadier application rules',
    text: 'Amounts are integer cents in USD. Opening balances are at the start of the chosen date. Expenses reduce the paying account; income, refunds and borrowing increase it. Transfers move value between two accounts. Borrowing is not earned income. A credit card purchase is spending; a transfer to pay the card is not new spending. Debt balances are as-of snapshots, updated from statements; they do not automatically decrease by total payments because interest and fees are unknown.',
  },
  {
    id: 'forecast-rules',
    title: 'What available to plan means',
    path: 'internal:forecast-rules',
    source: 'Steadier application rules',
    text: 'The 30-day projection uses confirmed cash accounts, unpaid scheduled income and outflows, and future ledger entries. The lowest projected cash balance minus the household buffer is the amount available to plan. It is unavailable until the household confirms complete accounts, income and calendar, reviews imports and resolves catch-up terms. This is an estimate based on listed obligations, not a guarantee. Add groceries, fuel, utilities, debt minimums and advance app withdrawals to the calendar. Unlisted spending reduces actual cash.',
  },
  {
    id: 'intake',
    title: 'Gather the first financial documents',
    path: 'internal:intake',
    source: 'Steadier intake guide',
    text: 'Start with the latest mortgage or housing notice and forbearance agreement, available bank balances, the next take-home pay date and amount, and bills due before payday. Then collect three months of checking, savings and credit card statements, latest loan and consolidation statements, cash advance app balances and withdrawal schedules. Collect documents for both partners. Ask for one missing fact at a time; never shame or blame.',
  },
];
