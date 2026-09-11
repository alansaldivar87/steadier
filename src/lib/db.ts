import {
  createClient,
  type Client,
  type Transaction as DbTransaction,
  type InValue,
} from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { defaultSettings, schemas, type HouseholdData, type RecordKind, type Meta } from './domain';
export const householdId = () => process.env.HOUSEHOLD_ID || 'our-household';
let client: Client | undefined;
let initialized: Promise<void> | undefined;
export function getDb() {
  if (!client) {
    const url = process.env.DATABASE_URL || 'file:.data/steadier.db';
    if (process.env.VERCEL && url.startsWith('file:'))
      throw new Error('A remote database is required on Vercel.');
    if (url.startsWith('file:')) mkdirSync('.data', { recursive: true });
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  return client;
}
export async function db() {
  const c = getDb();
  if (!initialized)
    initialized = c
      .batch(
        [
          `CREATE TABLE IF NOT EXISTS records (household TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, actor TEXT NOT NULL, PRIMARY KEY(household,id))`,
          `CREATE INDEX IF NOT EXISTS idx_records_household_kind ON records(household,kind)`,
          `CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, household TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, record_id TEXT NOT NULL, before_data TEXT, after_data TEXT, created_at TEXT NOT NULL)`,
          `CREATE INDEX IF NOT EXISTS idx_audit_household_created ON audit(household,created_at)`,
          `CREATE TABLE IF NOT EXISTS ai_usage (id TEXT PRIMARY KEY, household TEXT NOT NULL, day TEXT NOT NULL, purpose TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL, input_tokens INTEGER, output_tokens INTEGER, duration_ms INTEGER, created_at TEXT NOT NULL)`,
          `CREATE INDEX IF NOT EXISTS idx_ai_usage_household_day ON ai_usage(household,day)`,
          `CREATE TABLE IF NOT EXISTS unique_keys (household TEXT NOT NULL, key TEXT NOT NULL, record_id TEXT NOT NULL, PRIMARY KEY(household,key))`,
          `CREATE TABLE IF NOT EXISTS ai_credentials (household TEXT NOT NULL, provider TEXT NOT NULL, encrypted_key TEXT NOT NULL, PRIMARY KEY(household,provider))`,
        ],
        'write',
      )
      .then(() => {})
      .catch((e) => {
        initialized = undefined;
        throw e;
      });
  await initialized;
  return c;
}
type Executor = Client | DbTransaction;
export async function list<T>(kind: string, exec?: Executor): Promise<T[]> {
  const c = exec || (await db());
  const result = await c.execute({
    sql: 'SELECT * FROM records WHERE household=? AND kind=? ORDER BY created_at DESC',
    args: [householdId(), kind],
  });
  return result.rows.map(parseRow) as T[];
}
function parseRow(row: Record<string, unknown>) {
  return {
    ...JSON.parse(String(row.data)),
    id: String(row.id),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    actor: String(row.actor),
  };
}
export async function getRecord<T>(
  id: string,
  exec?: Executor,
): Promise<(T & Meta & { recordKind: string }) | null> {
  const c = exec || (await db());
  const r = await c.execute({
    sql: 'SELECT * FROM records WHERE household=? AND id=?',
    args: [householdId(), id],
  });
  return r.rows.length ? { ...parseRow(r.rows[0]), recordKind: String(r.rows[0].kind) } : null;
}
export async function writeRecord(
  kind: string,
  data: unknown,
  actor: string,
  options: { id?: string; revision?: number; uniqueKey?: string; exec?: DbTransaction } = {},
) {
  const c = options.exec || (await (await db()).transaction('write'));
  try {
    const id = options.id || randomUUID();
    const existing = await getRecord<Record<string, unknown>>(id, c);
    if (existing && (existing.recordKind !== kind || options.revision !== existing.revision))
      throw new Error('This item changed. Refresh and try again.');
    if (!existing && options.revision !== undefined && options.revision !== 0)
      throw new Error('Item no longer exists.');
    if (options.uniqueKey)
      await c.execute({
        sql: 'INSERT INTO unique_keys(household,key,record_id) VALUES(?,?,?)',
        args: [householdId(), options.uniqueKey, id],
      });
    const clean = { ...(data as Record<string, unknown>) };
    for (const key of ['id', 'revision', 'createdAt', 'updatedAt', 'actor', 'recordKind'])
      delete clean[key];
    const now = new Date().toISOString();
    const json = JSON.stringify(clean);
    const revision = (existing?.revision || 0) + 1;
    await c.execute({
      sql: 'INSERT INTO records(household,kind,id,data,revision,created_at,updated_at,actor) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(household,id) DO UPDATE SET data=excluded.data,revision=excluded.revision,updated_at=excluded.updated_at,actor=excluded.actor',
      args: [householdId(), kind, id, json, revision, existing?.createdAt || now, now, actor],
    });
    await c.execute({
      sql: 'INSERT INTO audit(id,household,actor,action,record_id,before_data,after_data,created_at) VALUES(?,?,?,?,?,?,?,?)',
      args: [
        randomUUID(),
        householdId(),
        actor,
        existing ? 'update' : 'create',
        id,
        existing ? JSON.stringify(existing) : null,
        json,
        now,
      ],
    });
    if (!options.exec) await c.commit();
    return { id, revision };
  } catch (e) {
    if (!options.exec) await c.rollback();
    throw e;
  } finally {
    if (!options.exec) c.close();
  }
}
export async function saveEntity(
  kind: RecordKind,
  input: unknown,
  actor: string,
  options: { id?: string; revision?: number; uniqueKey?: string; exec?: DbTransaction } = {},
) {
  const data = schemas[kind].parse(input);
  const exec = options.exec || (await (await db()).transaction('write'));
  try {
    if (kind === 'transaction') {
      const t = schemas.transaction.parse(data);
      const a = await getRecord<{ openingDate: string }>(t.accountId, exec);
      if (!a || a.recordKind !== 'account') throw new Error('Choose an existing account.');
      if (t.date < a.openingDate)
        throw new Error(
          'This transaction predates the account opening balance. Adjust the opening date and balance first.',
        );
      if (t.type === 'transfer') {
        const dest = await getRecord<{ openingDate: string }>(t.toAccountId!, exec);
        if (!dest || dest.recordKind !== 'account' || t.date < dest.openingDate)
          throw new Error('Choose a valid destination account with an earlier opening date.');
      }
      if (t.sourceId && !options.id) options.uniqueKey = 'source:' + t.sourceId;
      if (options.id) {
        const obligations = await list<{ paidRefs?: Record<string, string> }>('obligation', exec);
        if (obligations.some((o) => Object.values(o.paidRefs || {}).includes(options.id!)))
          throw new Error(
            'This transaction is linked to a paid calendar item. Reopen that calendar payment before changing the transaction.',
          );
      }
    }
    if (kind === 'obligation') {
      const o = schemas.obligation.parse(data);
      if (o.accountId) {
        const a = await getRecord(o.accountId, exec);
        if (!a || a.recordKind !== 'account') throw new Error('Choose an existing account.');
      }
      const old = options.id
        ? await getRecord<{ paidDates: string[]; paidRefs: Record<string, string> }>(
            options.id,
            exec,
          )
        : null;
      if (
        JSON.stringify(o.paidDates) !== JSON.stringify(old?.paidDates || []) ||
        JSON.stringify(o.paidRefs) !== JSON.stringify(old?.paidRefs || {})
      )
        throw new Error('Record or reopen payments from the calendar.');
    }
    if (kind === 'reconciliation') {
      const r = schemas.reconciliation.parse(data);
      const a = await getRecord<{ openingDate: string }>(r.accountId, exec);
      if (!a || a.recordKind !== 'account' || r.date < a.openingDate)
        throw new Error('Choose an account and a statement date on or after its opening date.');
    }
    if (kind === 'budget') {
      const b = schemas.budget.parse(data);
      const existing = await list<{ id: string; category: string; month: string }>('budget', exec);
      if (
        existing.some(
          (e) =>
            e.id !== options.id &&
            e.month === b.month &&
            e.category.trim().toLowerCase() === b.category.trim().toLowerCase(),
        )
      )
        throw new Error(
          'This category already has a budget for that month. Edit the existing limit.',
        );
    }
    if (kind === 'account' && options.id) {
      const a = schemas.account.parse(data);
      const txs = await list<{ accountId: string; toAccountId: string | null; date: string }>(
        'transaction',
        exec,
      );
      if (
        txs.some(
          (t) =>
            (t.accountId === options.id || t.toAccountId === options.id) && t.date < a.openingDate,
        )
      )
        throw new Error('The opening date cannot exclude existing transactions.');
    }
    const result = await writeRecord(kind, data, actor, { ...options, exec });
    if (!options.exec) await exec.commit();
    return result;
  } catch (e) {
    if (!options.exec) await exec.rollback();
    throw e;
  } finally {
    if (!options.exec) exec.close();
  }
}
export async function removeRecord(id: string, revision: number, actor: string) {
  const c = await (await db()).transaction('write');
  try {
    const old = await getRecord(id, c);
    if (!old || old.revision !== revision)
      throw new Error('This item changed. Refresh and try again.');
    if (old.recordKind === 'account') {
      const related = await c.execute({
        sql: "SELECT id FROM records WHERE household=? AND kind IN ('transaction','obligation') AND (json_extract(data,'$.accountId')=? OR json_extract(data,'$.toAccountId')=?) LIMIT 1",
        args: [householdId(), id, id],
      });
      if (related.rows.length)
        throw new Error(
          'This account has transactions or calendar items. Remove or reassign those first.',
        );
    }
    if (!Object.keys(schemas).includes(old.recordKind) || old.recordKind === 'settings')
      throw new Error('This item cannot be deleted here.');
    if (old.recordKind === 'transaction') {
      const obligations = await list<{ paidRefs?: Record<string, string> }>('obligation', c);
      if (obligations.some((o) => Object.values(o.paidRefs || {}).includes(id)))
        throw new Error('Reopen the linked calendar payment before removing its transaction.');
    }
    await c.execute({
      sql: 'DELETE FROM records WHERE household=? AND id=?',
      args: [householdId(), id],
    });
    await c.execute({
      sql: 'INSERT INTO audit VALUES(?,?,?,?,?,?,?,?)',
      args: [
        randomUUID(),
        householdId(),
        actor,
        'delete',
        id,
        JSON.stringify(old),
        null,
        new Date().toISOString(),
      ],
    });
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.close();
  }
}
export async function household(): Promise<HouseholdData> {
  const c = await db();
  const rows = await c.execute({
    sql: 'SELECT * FROM records WHERE household=? ORDER BY created_at DESC',
    args: [householdId()],
  });
  const by = (kind: string) => rows.rows.filter((r) => r.kind === kind).map(parseRow);
  return {
    accounts: by('account'),
    transactions: by('transaction'),
    debts: by('debt'),
    obligations: by('obligation'),
    tasks: by('task'),
    memories: by('memory'),
    documents: by('document'),
    drafts: by('draft'),
    budgets: by('budget'),
    goals: by('goal'),
    reconciliations: by('reconciliation'),
    settings: { ...defaultSettings, ...by('settings')[0] },
  } as HouseholdData;
}
export async function query(sql: string, args: InValue[] = []) {
  return (await db()).execute({ sql, args });
}
