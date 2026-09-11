import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSettings,
  type HouseholdData,
  type Obligation,
  type Transaction,
} from '../src/lib/domain';
import { moneyGuide, purchaseCheck, ledgerTotals } from '../src/lib/money-guide';
const meta = { id: 'cash', revision: 1, actor: 'test', createdAt: '', updatedAt: '' };
const data = (overrides: Partial<HouseholdData> = {}): HouseholdData => ({
  accounts: [
    {
      ...meta,
      name: 'Checking',
      kind: 'checking',
      balanceCents: 100000,
      openingDate: '2026-09-01',
    },
  ],
  transactions: [],
  obligations: [],
  debts: [],
  tasks: [],
  documents: [],
  drafts: [],
  memories: [],
  budgets: [],
  goals: [],
  reconciliations: [],
  settings: {
    ...defaultSettings,
    bufferCents: 20000,
    accountsComplete: true,
    incomeComplete: true,
    billsComplete: true,
  },
  ...overrides,
});
const bill = (values: Partial<Obligation> = {}): Obligation => ({
  ...meta,
  id: 'bill',
  name: 'Bill',
  kind: 'bill',
  amountCents: 30000,
  date: '2026-09-12',
  frequency: 'once',
  accountId: 'cash',
  paidDates: [],
  paidRefs: {},
  note: '',
  ...values,
});
const tx = (type: Transaction['type'], amountCents: number): Transaction => ({
  ...meta,
  id: crypto.randomUUID(),
  accountId: 'cash',
  type,
  amountCents,
  date: '2026-09-10',
  description: type,
  category: 'Unsorted',
  note: '',
  sourceId: null,
  toAccountId: type === 'transfer' ? 'card' : null,
});

test('purchase check protects the lowest balance and buffer before a later payday', () => {
  const household = data({
    obligations: [
      bill({ date: '2026-09-10', amountCents: 90000 }),
      bill({ id: 'pay', kind: 'income', amountCents: 200000, date: '2026-09-10' }),
    ],
  });
  const result = purchaseCheck(household, '2026-09-10', 10000);
  assert.equal(result.status, 'pause');
  assert.equal(result.remainingCents, -20000);
  assert.equal(household.transactions.length, 0);
});
test('purchase check accepts exact remaining room but withholds it with missing facts', () => {
  assert.equal(purchaseCheck(data({ obligations: [bill()] }), '2026-09-10', 50000).status, 'fits');
  assert.equal(purchaseCheck(data({ obligations: [bill()] }), '2026-09-10', 50001).status, 'pause');
  const incomplete = data({ settings: { ...defaultSettings } });
  assert.equal(purchaseCheck(incomplete, '2026-09-10', 1).status, 'unknown');
  assert.equal(purchaseCheck(incomplete, '2026-09-10', 1).remainingCents, null);
  for (const amount of [0, -1, 0.5, Infinity])
    assert.throws(() => purchaseCheck(data(), '2026-09-10', amount));
  assert.throws(() => purchaseCheck(data(), '2026-02-30', 10));
});
test('housing catch-up is surfaced ahead of onboarding without fabricating a payment', () => {
  const household = data({
    accounts: [],
    obligations: [bill({ accountId: null, kind: 'housing', date: '2026-09-01' })],
  });
  const guide = moneyGuide(household, '2026-09-10');
  assert.equal(guide.nextStep, 'housing');
  assert.equal(guide.urgentHousing, true);
  assert.equal(household.tasks.length, 0);
  assert.equal(moneyGuide(data({ accounts: [] }), '2026-09-10').nextStep, 'account');
});
test('payday view includes same-day outflows and excludes paid occurrences', () => {
  const guide = moneyGuide(
    data({
      obligations: [
        bill({ date: '2026-09-12' }),
        bill({ id: 'later', date: '2026-09-13' }),
        bill({ id: 'settled', date: '2026-09-11', paidDates: ['2026-09-11'] }),
        bill({ id: 'payday', kind: 'income', date: '2026-09-12', amountCents: 100000 }),
      ],
    }),
    '2026-09-10',
  );
  assert.equal(guide.nextPayday?.date, '2026-09-12');
  assert.equal(guide.billsBeforePaydayCents, 30000);
  assert.equal(guide.beforePayday.length, 1);
});
test('ledger totals keep borrowing, refunds and transfers separate', () => {
  const rows = [
    tx('income', 100000),
    tx('expense', 10000),
    tx('refund', 2000),
    tx('borrowing', 30000),
    tx('transfer', 40000),
    tx('debt_payment', 5000),
  ];
  assert.deepEqual(ledgerTotals(rows), {
    earnedCents: 100000,
    spentCents: 8000,
    borrowedCents: 30000,
    transferredCents: 40000,
    repaidCents: 5000,
  });
  const guide = moneyGuide(
    data({ transactions: [...rows, { ...tx('income', 999999), date: '2026-09-30' }] }),
    '2026-09-10',
  );
  assert.equal(guide.month.earnedCents, 100000);
  assert.equal(guide.unsorted, 2);
});
