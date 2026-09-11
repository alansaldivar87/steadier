import { accountBalance, forecast, payoff } from '../finance';
import { HouseholdData } from '../domain';
export function spendingSummary(data: HouseholdData, from: string, to: string) {
  const rows = data.transactions.filter((t) => t.date >= from && t.date <= to);
  const sum = (types: string[]) =>
    rows
      .filter((t) => types.includes(t.type))
      .reduce((n, t) => n + (t.type === 'refund' ? -t.amountCents : t.amountCents), 0);
  const categories: Record<string, number> = {};
  for (const t of rows.filter((t) => ['expense', 'refund'].includes(t.type)))
    categories[t.category] =
      (categories[t.category] || 0) + (t.type === 'refund' ? -t.amountCents : t.amountCents);
  return {
    from,
    to,
    transactionCount: rows.length,
    incomeCents: sum(['income']),
    borrowedCents: sum(['borrowing']),
    everydaySpendingNetCents: sum(['expense', 'refund']),
    debtPaymentsCents: sum(['debt_payment']),
    transfersCents: sum(['transfer']),
    categories: Object.entries(categories)
      .map(([category, spentCents]) => ({ category, spentCents }))
      .sort((a, b) => b.spentCents - a.spentCents),
    note: 'Confirmed ledger only. Borrowing is not income. Card payments and transfers are separate from purchases. Missing transactions make totals incomplete.',
  };
}
export function balanceChecks(data: HouseholdData) {
  return data.reconciliations.map((r) => {
    const account = data.accounts.find((a) => a.id === r.accountId);
    const ledgerCents = account ? accountBalance(account, data.transactions, r.date) : null;
    return {
      id: r.id,
      accountId: r.accountId,
      accountName: account?.name,
      date: r.date,
      statementCents: r.statementBalanceCents,
      ledgerCents,
      differenceCents: ledgerCents === null ? null : r.statementBalanceCents - ledgerCents,
    };
  });
}
export function debtComparison(data: HouseholdData, date: string, extraCents: number) {
  const cash = forecast(data, date);
  return {
    extraCents,
    avalanche: payoff(data.debts, extraCents, 'avalanche'),
    snowball: payoff(data.debts, extraCents, 'snowball'),
    affordability: {
      spendableCents: cash.spendableCents,
      shortfallCents: cash.shortfallCents,
      missing: cash.missing,
    },
    note: 'Planning scenarios only. A 30-day cash estimate does not prove a recurring extra payment is affordable. Protect essentials and resolve urgent or past-due terms first.',
  };
}
