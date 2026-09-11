import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  db,
  getDb,
  saveEntity,
  writeRecord,
  list,
  getRecord,
  household,
  removeRecord,
} from '../src/lib/db';
import { reviewDraft } from '../src/lib/review';
import { settlePayment, reopenPayment } from '../src/lib/settlement';
import { uploadDocument, processDocument } from '../src/lib/documents';
import { Obligation, Draft } from '../src/lib/domain';
process.env.DATABASE_URL = `file:.data/test-ledger-${randomUUID()}.db`;
process.env.HOUSEHOLD_ID = 'test-household';
process.env.STORAGE_DRIVER = 'local';
after(() => getDb().close());
const account = () =>
  saveEntity(
    'account',
    { name: 'Test checking', kind: 'checking', balanceCents: 100000, openingDate: '2026-09-01' },
    'test',
  );
const transaction = (accountId: string) => ({
  date: '2026-09-10',
  description: 'Groceries',
  amountCents: 4250,
  type: 'expense',
  accountId,
  toAccountId: null,
  category: 'Food',
  sourceId: null,
  note: '',
});
test('revisions reject stale writes and ledger references are validated', async () => {
  const a = await account();
  await saveEntity(
    'account',
    { name: 'Updated', kind: 'checking', balanceCents: 100000, openingDate: '2026-09-01' },
    'wife',
    { id: a.id, revision: 1 },
  );
  await assert.rejects(
    saveEntity(
      'account',
      { name: 'Stale', kind: 'checking', balanceCents: 1, openingDate: '2026-09-01' },
      'test',
      { id: a.id, revision: 1 },
    ),
    /changed/,
  );
  await assert.rejects(
    saveEntity('transaction', transaction('missing'), 'test'),
    /existing account/,
  );
  await assert.rejects(
    saveEntity('transaction', { ...transaction(a.id), date: '2026-08-31' }, 'test'),
    /predates/,
  );
});
test('draft confirmation is atomic, repeat-safe, with source identity enforced', async () => {
  const a = await account();
  const value = { ...transaction(a.id), sourceId: 'receipt-a' };
  const draft = await writeRecord(
    'draft',
    {
      kind: 'transaction',
      documentId: null,
      data: value,
      reason: 'Receipt',
      status: 'pending',
      acceptedId: null,
    },
    'test',
  );
  await reviewDraft(draft.id, 1, 'accept', value, 'test');
  await assert.rejects(reviewDraft(draft.id, 1, 'accept', value, 'test'), /changed|reviewed/);
  const d = await getRecord<Draft>(draft.id);
  assert.equal(d?.status, 'accepted');
  const all = await list<{ sourceId: string }>('transaction');
  assert.equal(all.filter((t) => t.sourceId === 'receipt-a').length, 1);
});
test('possible duplicate requires deliberate confirmation', async () => {
  const a = await account();
  await saveEntity('transaction', transaction(a.id), 'test');
  const value = { ...transaction(a.id), sourceId: 'receipt-b' };
  const d = await writeRecord(
    'draft',
    {
      kind: 'transaction',
      documentId: null,
      data: value,
      reason: 'Receipt',
      status: 'pending',
      acceptedId: null,
    },
    'test',
  );
  await assert.rejects(reviewDraft(d.id, 1, 'accept', value, 'test'), /Possible duplicate/);
  assert.equal((await getRecord<Draft>(d.id))?.status, 'pending');
  await reviewDraft(d.id, 1, 'accept', value, 'test', true);
});
test('new statement can update an existing debt rather than duplicate its balance', async () => {
  const value = {
    name: 'Mortgage',
    kind: 'mortgage',
    balanceCents: 10000000,
    aprBps: 650,
    minimumCents: 200000,
    dueDate: '2026-10-01',
    pastDueCents: 0,
    status: 'current',
    autopay: false,
    note: '',
    balanceDate: '2026-09-01',
  };
  const debt = await saveEntity('debt', value, 'test');
  const updated = { ...value, balanceCents: 9990000, balanceDate: '2026-09-10' };
  const d = await writeRecord(
    'draft',
    {
      kind: 'debt',
      documentId: null,
      data: updated,
      reason: 'New statement',
      status: 'pending',
      acceptedId: null,
    },
    'test',
  );
  await reviewDraft(d.id, 1, 'accept', updated, 'test', false, { id: debt.id, revision: 1 });
  assert.equal((await list('debt')).length, 1);
  assert.equal((await getRecord<{ balanceCents: number }>(debt.id))?.balanceCents, 9990000);
});
test('settling and reopening preserves calendar/ledger consistency', async () => {
  const a = await account();
  const o = await saveEntity(
    'obligation',
    {
      name: 'Utility',
      kind: 'bill',
      amountCents: 4250,
      date: '2026-09-10',
      frequency: 'monthly',
      accountId: a.id,
    },
    'test',
  );
  const input = {
    id: o.id,
    revision: 1,
    date: '2026-09-10',
    paymentDate: '2026-09-11',
    accountId: a.id,
    type: 'expense' as const,
    toAccountId: null,
    existingTransactionId: null,
  };
  const r = await settlePayment(input, 'test');
  const current = await getRecord<Obligation>(o.id);
  assert.equal(current?.paidRefs['2026-09-10'], r.transactionId);
  await assert.rejects(settlePayment(input, 'wife'), /changed/);
  await assert.rejects(removeRecord(r.transactionId, 1, 'test'), /Reopen/);
  await reopenPayment(o.id, current!.revision, '2026-09-10', 'test');
  await removeRecord(r.transactionId, 1, 'test');
  assert.deepEqual((await getRecord<Obligation>(o.id))?.paidDates, []);
});
test('linking an imported payment does not create a second transaction', async () => {
  const a = await account();
  const t = await saveEntity('transaction', transaction(a.id), 'test');
  const o = await saveEntity(
    'obligation',
    {
      name: 'Food',
      kind: 'bill',
      amountCents: 4250,
      date: '2026-09-10',
      frequency: 'once',
      accountId: a.id,
    },
    'test',
  );
  const before = (await list('transaction')).length;
  await settlePayment(
    {
      id: o.id,
      revision: 1,
      date: '2026-09-10',
      paymentDate: '2026-09-10',
      accountId: a.id,
      type: 'expense',
      toAccountId: null,
      existingTransactionId: t.id,
    },
    'test',
  );
  assert.equal((await list('transaction')).length, before);
});
test('CSV ingestion stages rows, duplicate upload and retry do not duplicate drafts', async () => {
  const a = await account();
  const bytes = Buffer.from(
    'Date,Description,Amount\n2026-09-10,Test store,-12.34\n2026-09-11,Pay,500.00',
  );
  const first = await uploadDocument(bytes, 'test.csv', 'test', a.id);
  const second = await uploadDocument(bytes, 'renamed.csv', 'wife', a.id);
  assert.equal(first.id, second.id);
  assert.equal(second.duplicate, true);
  await processDocument(first.id, 'test');
  await processDocument(first.id, 'test');
  const drafts = (await list<Draft>('draft')).filter((d) => d.documentId === first.id);
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].status, 'pending');
  assert.equal((await household()).documents.find((d) => d.id === first.id)?.status, 'review');
});
test('household scoping is enforced by the repository', async () => {
  const original = process.env.HOUSEHOLD_ID;
  process.env.HOUSEHOLD_ID = 'other-test-household';
  assert.equal((await household()).accounts.length, 0);
  process.env.HOUSEHOLD_ID = original;
  assert.ok((await household()).accounts.length > 0);
});
