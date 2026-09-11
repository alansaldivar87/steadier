import { z } from 'zod';
import { db, getRecord, saveEntity, writeRecord, list } from './db';
import { Obligation, Transaction, dateSchema } from './domain';
import { occurrences } from './finance';
export const settlementSchema = z.object({
  id: z.string(),
  revision: z.number().int(),
  date: dateSchema,
  paymentDate: dateSchema,
  accountId: z.string().min(1),
  type: z.enum(['income', 'expense', 'transfer', 'debt_payment']),
  toAccountId: z.string().nullable().default(null),
  existingTransactionId: z.string().nullable().default(null),
});
export async function settlePayment(input: z.infer<typeof settlementSchema>, actor: string) {
  const c = await (await db()).transaction('write');
  try {
    const o = await getRecord<Obligation>(input.id, c);
    if (!o || o.recordKind !== 'obligation' || o.revision !== input.revision)
      throw new Error('This calendar item changed. Refresh and try again.');
    if (!occurrences(o, input.date, input.date).length)
      throw new Error('This occurrence is already paid or is not on the schedule.');
    let transactionId: string;
    if (input.existingTransactionId) {
      const t = await getRecord<Transaction>(input.existingTransactionId, c);
      if (
        !t ||
        t.recordKind !== 'transaction' ||
        t.amountCents !== o.amountCents ||
        t.accountId !== input.accountId ||
        (o.kind === 'income'
          ? t.type !== 'income'
          : !['expense', 'debt_payment', 'transfer'].includes(t.type))
      )
        throw new Error(
          'Choose a recorded payment with the matching amount, account, and direction.',
        );
      const others = await list<Obligation>('obligation', c);
      if (others.some((other) => Object.values(other.paidRefs || {}).includes(t.id)))
        throw new Error('This transaction is already linked to a calendar payment.');
      transactionId = t.id;
    } else {
      if (o.kind !== 'income' && input.type === 'income')
        throw new Error('A bill payment must be money going out.');
      const result = await saveEntity(
        'transaction',
        {
          date: input.paymentDate,
          description: o.name,
          amountCents: o.amountCents,
          type: o.kind === 'income' ? 'income' : input.type,
          accountId: input.accountId,
          toAccountId: input.toAccountId,
          category:
            o.kind === 'income'
              ? 'Pay'
              : ['debt', 'advance', 'housing'].includes(o.kind)
                ? 'Debt payments'
                : 'Bills',
          sourceId: null,
          note: `Calendar ${o.id}, due ${input.date}`,
        },
        actor,
        { exec: c },
      );
      transactionId = result.id;
    }
    await writeRecord(
      'obligation',
      {
        ...o,
        paidDates: [...o.paidDates, input.date],
        paidRefs: { ...o.paidRefs, [input.date]: transactionId },
      },
      actor,
      { id: o.id, revision: o.revision, exec: c },
    );
    await c.commit();
    return { ok: true, transactionId };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.close();
  }
}
export async function reopenPayment(id: string, revision: number, date: string, actor: string) {
  const c = await (await db()).transaction('write');
  try {
    const o = await getRecord<Obligation>(id, c);
    if (!o || o.recordKind !== 'obligation' || o.revision !== revision)
      throw new Error('This calendar item changed. Refresh and try again.');
    const paidRefs = { ...o.paidRefs };
    delete paidRefs[date];
    await writeRecord(
      'obligation',
      { ...o, paidDates: o.paidDates.filter((d) => d !== date), paidRefs },
      actor,
      { id, revision, exec: c },
    );
    await c.commit();
    return {
      ok: true,
      message:
        'Calendar payment reopened. The transaction is still recorded; edit or remove it separately if needed.',
    };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.close();
  }
}
