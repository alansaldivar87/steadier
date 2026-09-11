import { addDays, dateSchema, type HouseholdData, type Transaction } from './domain';
import { forecast, accountBalance, occurrences } from './finance';

export function ledgerTotals(rows: Transaction[]) {
  const sum = (type: Transaction['type']) =>
    rows.filter((t) => t.type === type).reduce((n, t) => n + t.amountCents, 0);
  return {
    earnedCents: sum('income'),
    spentCents: sum('expense') - sum('refund'),
    borrowedCents: sum('borrowing'),
    repaidCents: sum('debt_payment'),
    transferredCents: sum('transfer'),
  };
}

export function moneyGuide(data: HouseholdData, date: string) {
  dateSchema.parse(date);
  const f = forecast(data, date);
  const nextPayday = f.events.find((e) => e.kind === 'income' && e.amountCents > 0) || null;
  const through = nextPayday?.date || addDays(date, 7);
  // Include same-day withdrawals: a payday deposit may arrive after a debit.
  const beforePayday = f.events.filter((e) => e.date <= through && e.amountCents < 0);
  const urgentHousing =
    data.debts.some(
      (d) =>
        d.kind === 'mortgage' &&
        (d.pastDueCents > 0 || ['late', 'forbearance', 'collections'].includes(d.status)),
    ) ||
    data.obligations.some(
      (o) => o.kind === 'housing' && occurrences(o, o.date, addDays(date, -1)).length > 0,
    );
  const pending = data.drafts.filter((d) => d.status === 'pending').length;
  const unread = data.documents.filter((d) =>
    ['uploaded', 'processing', 'error'].includes(d.status),
  ).length;
  const unsorted = data.transactions.filter(
    (t) =>
      t.date <= date &&
      ['expense', 'refund'].includes(t.type) &&
      ['unsorted', 'sin clasificar', ''].includes(t.category.trim().toLowerCase()),
  ).length;
  const mismatches = data.reconciliations.filter((r) => {
    const a = data.accounts.find((a) => a.id === r.accountId);
    return (
      a &&
      r.date <= date &&
      accountBalance(a, data.transactions, r.date) !== r.statementBalanceCents
    );
  }).length;
  const cashAccounts = data.accounts.filter((a) => a.kind !== 'credit' && a.openingDate <= date);
  const staleDebts = data.debts.filter(
    (d) => d.balanceCents > 0 && d.balanceDate < addDays(date, -45),
  ).length;
  const openTasks = data.tasks
    .filter((t) => !t.done)
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        (a.dueDate || '9999').localeCompare(b.dueDate || '9999'),
    );
  const nextStep = urgentHousing
    ? 'housing'
    : f.shortfallCents > 0 && cashAccounts.length
      ? 'shortfall'
      : !cashAccounts.length
        ? 'account'
        : !data.settings.incomeComplete
          ? 'income'
          : !data.settings.billsComplete
            ? 'bills'
            : pending || unread
              ? 'review'
              : mismatches
                ? 'balances'
                : !data.settings.accountsComplete
                  ? 'confirm'
                  : 'checkin';
  return {
    nextStep,
    urgentHousing,
    nextPayday,
    through,
    beforePayday,
    billsBeforePaydayCents: -beforePayday.reduce((n, e) => n + e.amountCents, 0),
    pending,
    unread,
    unsorted,
    mismatches,
    staleDebts,
    openTasks,
    cashAccountCount: cashAccounts.length,
    setup: {
      accounts: cashAccounts.length > 0 && data.settings.accountsComplete,
      income: data.settings.incomeComplete,
      bills: data.settings.billsComplete,
    },
    month: ledgerTotals(
      data.transactions.filter((t) => t.date >= date.slice(0, 7) + '-01' && t.date <= date),
    ),
  };
}

export function purchaseCheck(data: HouseholdData, date: string, amountCents: number) {
  dateSchema.parse(date);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 100_000_000_000)
    throw new Error('Enter a positive dollar amount.');
  const f = forecast(data, date);
  const remainingCents = f.minimumCents - data.settings.bufferCents - amountCents;
  return {
    status: f.missing.length
      ? ('unknown' as const)
      : remainingCents >= 0
        ? ('fits' as const)
        : ('pause' as const),
    amountCents,
    through: addDays(date, 30),
    bufferCents: data.settings.bufferCents,
    remainingCents: f.missing.length ? null : remainingCents,
    missing: f.missing,
    note: 'An additional one-time cash purchase today, not already recorded or budgeted in the calendar. Uses the lowest projected balance over 30 days after protecting the cash buffer. No guarantee and no recurring-payment or credit-card affordability claim. Nothing is saved or spent.',
  };
}
