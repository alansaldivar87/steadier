# What each number means

All amounts are integer USD cents. Input accepts at most two decimal places and never silently rounds a third decimal. Dates are real ISO dates; household timezone controls Today.

| Record                       | Effect                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cash account opening balance | Money present at the start of its opening date                                                                      |
| Credit card opening balance  | Signed net position; money owed is negative                                                                         |
| Expense                      | Decreases the paying account; counts as everyday spending                                                           |
| Income                       | Increases the receiving account; counts as earned/received income                                                   |
| Borrowing                    | Increases cash; does not count as earnings; add/update the matching debt separately                                 |
| Refund                       | Increases the account; reduces spending in its category                                                             |
| Transfer                     | Decreases source and increases destination; no new income or everyday spending                                      |
| Debt payment                 | Decreases the paying account; tracked outside everyday purchases; principal/interest are not automatically inferred |
| Debt snapshot                | Latest reviewed balance and terms as of a stated date; total debt is the sum of these snapshots                     |

The account balance includes confirmed transactions from its opening date through the requested date. Earlier imports are rejected until the opening baseline is corrected. Future-dated transactions affect the forecast only. Reconciliation compares a statement's END-of-day signed balance with the ledger; the app does not invent a balancing entry.

## Calendar and forecast

Bills and income recur once, weekly, biweekly, or monthly. Month-end dates clamp to the last day and return to the original anchor in the following month (January 31 -> February 28 -> March 31). Unpaid past bills remain immediately due. Unreceived past income is not assumed available.

Calendar items represent projected flows until linked to an actual payment. Marking paid creates/links a transaction and updates that occurrence atomically. Future actual payments remain projected. Already imported payments should be linked, not entered again. Reopening a payment keeps the transaction intact so a mistaken calendar link can be corrected without deleting money history.

The 30-day forecast aggregates confirmed non-credit accounts, unpaid scheduled cash flows, and future ledger transactions. It uses a conservative within-day order (outflows before inflows). The minimum across each flow is used for shortfall/available-to-plan calculations; the chart displays daily closing balances. This avoids claiming a same-day paycheck can always cover an earlier withdrawal.

Available to plan is `max(0, lowest projected cash - protected buffer)`, only when accounts, income and listed obligations are confirmed complete, imports are reviewed, catch-up terms are resolved, and statement comparisons match. This is **not a promise of affordability**. Unlisted spending or unexpected payments reduce actual cash. Add variable essentials to the calendar as reasonable estimates. The household must keep those estimates and completion flags current.

## Spending limits and goals

Monthly category targets are compared to expenses minus refunds, using category names case-insensitively. A target is not a separate cash reservation. Do not assume unspent category allowance means spendable cash. Add expected essentials to the calendar. Savings goals track amounts the household reports as set aside; they do not move funds or reserve cash automatically. Use the protected buffer for cash that should remain untouched in the forecast.

## Debt comparisons

The simulator assumes fixed APR, monthly interest rounding, a constant total monthly payment and no new borrowing/fees. Highest-interest and smallest-balance approaches are estimates. It refuses unknown rates, non-current terms and cash-advance fee structures. It cannot decide a sustainable mortgage agreement before the household confirms income, essentials and the actual proposed terms.

## Known limits

- Cashflow is household-wide; it does not guarantee that the right account has cash on a particular day. Check individual accounts before withdrawals and move funds deliberately if needed.
- No automatic bank connection. Completeness comes from statement imports and reconciliation.
- Duplicate suggestions use exact account/date/amount candidates. Different posting dates need manual receipt matching.
- Debt balances, fees, interest and principal allocations need reviewed statements; loan payments do not silently reduce a debt snapshot.
- Partial payments require adjusting the expected calendar amounts or recording separate entries; a settled occurrence represents the full listed amount.
- Mixed-currency, payroll tax accounting, investment trading, and legal deadline calculation are outside this version.
