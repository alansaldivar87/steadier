import { Account, Debt, HouseholdData, Obligation, Transaction, addDays } from './domain';
export function accountBalance(account: Account, transactions: Transaction[], date: string) {
  return transactions
    .filter((t) => t.date >= account.openingDate && t.date <= date)
    .reduce((sum, t) => {
      if (t.accountId === account.id)
        sum += (['income', 'borrowing', 'refund'].includes(t.type) ? 1 : -1) * t.amountCents;
      if (t.type === 'transfer' && t.toAccountId === account.id) sum += t.amountCents;
      return sum;
    }, account.balanceCents);
}
export function occurrences(o: Obligation, from: string, to: string): string[] {
  const result: string[] = [];
  const start = new Date(o.date + 'T12:00:00Z');
  for (let i = 0; i < 12000; i++) {
    let date: string;
    if (o.frequency === 'monthly') {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1, 12));
      const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
      d.setUTCDate(Math.min(start.getUTCDate(), last));
      date = d.toISOString().slice(0, 10);
    } else
      date = addDays(
        o.date,
        i * (o.frequency === 'weekly' ? 7 : o.frequency === 'biweekly' ? 14 : 0),
      );
    if (date > to) break;
    if (date >= from && !o.paidDates.includes(date)) result.push(date);
    if (o.frequency === 'once') break;
  }
  return result;
}
export function forecast(data: HouseholdData, from: string, days = 30) {
  const cashAccounts = data.accounts.filter((a) => a.kind !== 'credit' && a.openingDate <= from);
  const cashIds = new Set(cashAccounts.map((a) => a.id));
  const cashCents = cashAccounts.reduce(
    (sum, a) => sum + accountBalance(a, data.transactions, from),
    0,
  );
  const to = addDays(from, days);
  const events = data.obligations
    .flatMap((o) =>
      occurrences(o, from, to).map((date) => ({
        id: o.id,
        date,
        name: o.name,
        kind: o.kind,
        amountCents: o.amountCents * (o.kind === 'income' ? 1 : -1),
        accountId: o.accountId,
      })),
    )
    .filter((e) => !e.accountId || cashIds.has(e.accountId));
  // Past-due unpaid obligations remain immediately due, until explicitly settled.
  for (const o of data.obligations.filter(
    (o) => o.kind !== 'income' && (!o.accountId || cashIds.has(o.accountId)),
  )) {
    const overdue = occurrences(o, o.date, addDays(from, -1));
    if (overdue.length)
      events.push({
        id: o.id,
        date: from,
        name: o.name + ' (overdue)',
        kind: o.kind,
        amountCents: -o.amountCents * overdue.length,
        accountId: o.accountId,
      });
  }
  // Future confirmed ledger entries are scheduled cash effects, not today's cash.
  for (const t of data.transactions.filter((t) => t.date > from && t.date <= to)) {
    let amount = 0;
    if (cashIds.has(t.accountId))
      amount += (['income', 'borrowing', 'refund'].includes(t.type) ? 1 : -1) * t.amountCents;
    if (t.type === 'transfer' && t.toAccountId && cashIds.has(t.toAccountId))
      amount += t.amountCents;
    if (amount)
      events.push({
        id: t.id,
        date: t.date,
        name: t.description,
        kind: t.type === 'income' ? 'income' : 'bill',
        amountCents: amount,
        accountId: t.accountId,
      });
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || a.amountCents - b.amountCents);
  let running = cashCents,
    minimum = cashCents;
  const points = [];
  for (let i = 0; i <= days; i++) {
    const date = addDays(from, i);
    for (const e of events.filter((e) => e.date === date)) {
      running += e.amountCents;
      minimum = Math.min(minimum, running);
    }
    points.push({ date, balanceCents: running });
  }
  const pending = data.drafts.filter((d) => d.status === 'pending').length;
  const missing: string[] = [];
  if (!cashAccounts.length || !data.settings.accountsComplete)
    missing.push('Confirm all cash accounts and their opening balances.');
  if (!data.settings.billsComplete)
    missing.push(
      'Add all bills, debt minimums, advance withdrawals, and everyday essentials to the calendar.',
    );
  if (!data.settings.incomeComplete) missing.push('Confirm take-home income and pay dates.');
  if (pending) missing.push(`Review ${pending} imported item${pending === 1 ? '' : 's'}.`);
  if (
    data.documents.some(
      (d) => d.status === 'uploaded' || d.status === 'processing' || d.status === 'error',
    )
  )
    missing.push('Finish processing uploaded documents.');
  if (data.accounts.some((a) => a.openingDate > from))
    missing.push('An account has a future opening date.');
  if (
    data.reconciliations?.some((r) => {
      const a = data.accounts.find((a) => a.id === r.accountId);
      return (
        a &&
        r.date <= from &&
        accountBalance(a, data.transactions, r.date) !== r.statementBalanceCents
      );
    })
  )
    missing.push('Resolve the difference between a statement balance and the ledger.');
  const urgent = data.debts.some(
    (d) => d.pastDueCents > 0 || ['late', 'collections', 'forbearance'].includes(d.status),
  );
  if (urgent)
    missing.push(
      'Confirm the catch-up amounts and due dates on overdue or forbearance accounts before estimating extra spending.',
    );
  return {
    cashCents,
    minimumCents: minimum,
    projectedCents: running,
    spendableCents: missing.length ? null : Math.max(0, minimum - data.settings.bufferCents),
    shortfallCents: Math.max(0, -minimum),
    events,
    points,
    missing,
    totalDebtCents: data.debts.reduce((s, d) => s + d.balanceCents, 0),
  };
}
export function payoff(debts: Debt[], extraCents: number, strategy: 'avalanche' | 'snowball') {
  if (
    debts.some(
      (d) =>
        d.aprBps === null ||
        d.kind === 'cash_advance' ||
        d.status !== 'current' ||
        d.pastDueCents > 0,
    )
  )
    return {
      available: false as const,
      reason:
        'Add interest rates and resolve overdue terms first. Cash advances need their actual fee and repayment schedule.',
    };
  const working = debts
    .filter((d) => d.balanceCents > 0)
    .map((d) => ({ ...d, balance: d.balanceCents }));
  const budget = working.reduce((s, d) => s + d.minimumCents, 0) + extraCents;
  let interestCents = 0;
  if (!working.length)
    return { available: false as const, reason: 'Add a debt to compare repayment plans.' };
  for (let month = 1; month <= 600; month++) {
    let remaining = budget;
    for (const d of working) {
      const interest = Math.round((d.balance * d.aprBps!) / 120000);
      interestCents += interest;
      d.balance += interest;
      const pay = Math.min(d.balance, d.minimumCents);
      d.balance -= pay;
      remaining -= pay;
    }
    working.sort((a, b) =>
      strategy === 'avalanche' ? b.aprBps! - a.aprBps! : a.balance - b.balance,
    );
    for (const d of working) {
      const pay = Math.min(d.balance, remaining);
      d.balance -= pay;
      remaining -= pay;
    }
    if (working.every((d) => d.balance === 0))
      return { available: true as const, months: month, interestCents, budgetCents: budget };
  }
  return {
    available: false as const,
    reason: 'This payment does not clear the debts within 50 years. Review the payment amounts.',
  };
}
