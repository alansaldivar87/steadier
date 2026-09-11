import { db, getRecord, list, saveEntity, writeRecord } from './db';
import { Draft, DocumentRecord, Transaction } from './domain';
export async function reviewDraft(
  id: string,
  revision: number,
  action: 'accept' | 'dismiss',
  data: unknown,
  actor: string,
  allowDuplicate = false,
  target?: { id: string; revision: number },
) {
  const c = await (await db()).transaction('write');
  try {
    const draft = await getRecord<Draft>(id, c);
    if (!draft || draft.recordKind !== 'draft' || draft.revision !== revision)
      throw new Error('This draft changed. Refresh and try again.');
    if (draft.status !== 'pending') throw new Error('This item was already reviewed.');
    let acceptedId: string | null = null;
    if (action === 'accept') {
      const candidate = data as Partial<Transaction>;
      if (draft.data.sourceId && draft.data.sourceId !== candidate.sourceId)
        throw new Error('Keep the original source reference.');
      const original = draft;
      if (original.kind === 'transaction' && !allowDuplicate) {
        const txs = await list<Transaction>('transaction', c);
        const duplicates = txs.filter(
          (t) =>
            t.accountId === candidate.accountId &&
            t.date === candidate.date &&
            t.amountCents === candidate.amountCents,
        );
        if (duplicates.length)
          throw new Error(
            'Possible duplicate: this account already has a transaction for the same date and amount. Dismiss this draft if it is the same purchase, or explicitly save as a separate purchase.',
          );
      }
      if (target && !['debt', 'account', 'memory'].includes(original.kind))
        throw new Error('Only a debt, account, or preference draft can update an existing record.');
      if (target) {
        const existing = await getRecord(target.id, c);
        if (!existing || existing.recordKind !== original.kind)
          throw new Error('Choose an existing record of the same type.');
      }
      const result = await saveEntity(original.kind, data, actor, {
        exec: c,
        uniqueKey: 'accepted-draft:' + id,
        id: target?.id,
        revision: target?.revision,
      });
      acceptedId = result.id;
    }
    const original = draft;
    await writeRecord(
      'draft',
      { ...original, status: action === 'accept' ? 'accepted' : 'dismissed', acceptedId },
      actor,
      { id, revision, exec: c },
    );
    if (original.documentId) {
      const remaining = (await list<Draft>('draft', c)).some(
        (d) => d.documentId === original.documentId && d.status === 'pending',
      );
      if (!remaining) {
        const doc = await getRecord<DocumentRecord>(original.documentId, c);
        if (doc)
          await writeRecord('document', { ...doc, status: 'done' }, actor, {
            id: doc.id,
            revision: doc.revision,
            exec: c,
          });
      }
    }
    await c.commit();
    return { acceptedId };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.close();
  }
}
