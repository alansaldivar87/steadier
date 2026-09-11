import test from 'node:test';
import assert from 'node:assert/strict';
import { accountBalance, forecast, occurrences, payoff } from '../src/lib/finance';
import {
  Account,
  Transaction,
  Obligation,
  Debt,
  HouseholdData,
  defaultSettings,
  dollarsToCents,
  dateSchema,
} from '../src/lib/domain';
const meta = { id: 'a', revision: 1, createdAt: '', updatedAt: '', actor: 'test' };
const account: Account = {
  ...meta,
  name: 'Checking',
  kind: 'checking',
  openingDate: '2026-09-01',
  balanceCents: 100000,
};
const tx = (overrides: Partial<Transaction>): Transaction => ({
  ...meta,
  id: crypto.randomUUID(),
  date: '2026-09-10',
  description: 'Purchase',
  amountCents: 10000,
  type: 'expense',
  accountId: 'a',
  toAccountId: null,
  category: 'Food',
  sourceId: null,
  note: '',
  ...overrides,
});
const obligation = (overrides: Partial<Obligation>): Obligation => ({
  ...meta,
  id: crypto.randomUUID(),
  name: 'Bill',
  kind: 'bill',
  amountCents: 10000,
  date: '2026-09-12',
  frequency: 'once',
  accountId: 'a',
  paidDates: [],
  paidRefs: {},
  note: '',
  ...overrides,
});
const data = (overrides: Partial<HouseholdData> = {}): HouseholdData => ({
  accounts: [account],
  transactions: [],
  debts: [],
  obligations: [],
  tasks: [],
  memories: [],
  documents: [],
  drafts: [],
  budgets: [],
  goals: [],
  reconciliations: [],
  settings: {
    ...defaultSettings,
    accountsComplete: true,
    billsComplete: true,
    incomeComplete: true,
  },
  ...overrides,
});
test('money parsing is exact and rejects rounding surprises', () => {
  assert.equal(dollarsToCents('1,234.56'), 123456);
  assert.equal(dollarsToCents('-42.50'), -4250);
  assert.throws(() => dollarsToCents('1.999'));
  assert.throws(() => dollarsToCents('NaN'));
  assert.equal(dateSchema.safeParse('2026-02-30').success, false);
});
test('cash advance is an inflow; card purchase does not reduce checking', () => {
  const transactions = [
    tx({ type: 'borrowing', amountCents: 50000 }),
    tx({ accountId: 'card', amountCents: 20000 }),
  ];
  assert.equal(accountBalance(account, transactions, '2026-09-10'), 150000);
  assert.equal(forecast(data({ transactions }), '2026-09-10').cashCents, 150000);
});
test('a card payment transfers value without double-counting cash', () => {
  const card: Account = {
    ...account,
    id: 'card',
    name: 'Visa',
    kind: 'credit',
    balanceCents: -50000,
  };
  const transactions = [tx({ type: 'transfer', toAccountId: 'card', amountCents: 20000 })];
  assert.equal(accountBalance(account, transactions, '2026-09-10'), 80000);
  assert.equal(accountBalance(card, transactions, '2026-09-10'), -30000);
  assert.equal(
    forecast(data({ accounts: [account, card], transactions }), '2026-09-10').cashCents,
    80000,
  );
});
test('future transactions affect the forecast, not current cash', () => {
  const f = forecast(
    data({ transactions: [tx({ date: '2026-09-15', amountCents: 50000 })] }),
    '2026-09-10',
  );
  assert.equal(f.cashCents, 100000);
  assert.equal(f.projectedCents, 50000);
});
test('month-end recurrence returns to original anchor after February', () => {
  assert.deepEqual(
    occurrences(
      obligation({ date: '2026-01-31', frequency: 'monthly' }),
      '2026-01-01',
      '2026-04-30',
    ),
    ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'],
  );
});
test('unpaid overdue bills stay due, paid occurrences are removed', () => {
  const o = obligation({ date: '2026-09-01', frequency: 'weekly', paidDates: ['2026-09-01'] });
  const f = forecast(data({ obligations: [o] }), '2026-09-10', 10);
  assert.equal(f.projectedCents, 80000);
  assert.match(f.events[0].name, /overdue/);
});
test('same-day outflows are conservatively counted before pay', () => {
  const f = forecast(
    data({
      accounts: [{ ...account, balanceCents: 10000 }],
      obligations: [
        obligation({ amountCents: 30000, date: '2026-09-10' }),
        obligation({ kind: 'income', amountCents: 50000, date: '2026-09-10' }),
      ],
    }),
    '2026-09-10',
  );
  assert.equal(f.shortfallCents, 20000);
  assert.equal(f.projectedCents, 30000);
  assert.equal(f.spendableCents, 0);
});
test('missing data suppresses spendable cash, buffer is respected', () => {
  assert.equal(forecast(data({ settings: defaultSettings }), '2026-09-10').spendableCents, null);
  const complete = data();
  complete.settings.bufferCents = 40000;
  assert.equal(forecast(complete, '2026-09-10').spendableCents, 60000);
});
test('statement mismatch suppresses spending estimate until corrected', () => {
  const d = data({
    reconciliations: [
      { ...meta, accountId: 'a', date: '2026-09-10', statementBalanceCents: 90000 },
    ],
  });
  assert.equal(forecast(d, '2026-09-10').spendableCents, null);
  d.transactions = [tx({})];
  assert.equal(forecast(d, '2026-09-10').spendableCents, 90000);
});
test('payoff handles zero APR and refuses unknown rates', () => {
  const d: Debt = {
    ...meta,
    name: 'Loan',
    kind: 'loan',
    balanceCents: 100000,
    aprBps: 0,
    minimumCents: 10000,
    dueDate: null,
    pastDueCents: 0,
    status: 'current',
    autopay: false,
    note: '',
    balanceDate: '2026-09-10',
  };
  const p = payoff([d], 0, 'avalanche');
  assert.equal(p.available, true);
  if (p.available) {
    assert.equal(p.months, 10);
    assert.equal(p.interestCents, 0);
  }
  assert.equal(payoff([{ ...d, aprBps: null }], 0, 'snowball').available, false);
});
