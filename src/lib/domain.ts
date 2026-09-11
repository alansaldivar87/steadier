import { z } from 'zod';
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    'Use a valid date.',
  );
const cents = z.number().int().safe().min(0).max(100_000_000_000);
const label = z.string().trim().min(1).max(160);
export const accountSchema = z.object({
  name: label,
  kind: z.enum(['checking', 'savings', 'cash', 'credit']),
  balanceCents: z.number().int().safe().min(-100_000_000_000).max(100_000_000_000),
  openingDate: dateSchema,
});
export const transactionSchema = z
  .object({
    date: dateSchema,
    description: label,
    amountCents: cents.positive(),
    type: z.enum(['expense', 'income', 'transfer', 'borrowing', 'refund', 'debt_payment']),
    accountId: z.string().min(1).max(100),
    toAccountId: z.string().max(100).nullable().default(null),
    category: label.default('Unsorted'),
    sourceId: z.string().max(150).nullable().default(null),
    note: z.string().max(1000).default(''),
  })
  .refine(
    (v) => v.type !== 'transfer' || (!!v.toAccountId && v.toAccountId !== v.accountId),
    'A transfer needs two different accounts.',
  );
export const debtSchema = z.object({
  name: label,
  kind: z.enum(['mortgage', 'credit_card', 'loan', 'consolidation', 'cash_advance', 'other']),
  balanceCents: cents,
  aprBps: z.number().int().min(0).max(100000).nullable(),
  minimumCents: cents,
  dueDate: dateSchema.nullable(),
  pastDueCents: cents.default(0),
  status: z.enum(['current', 'late', 'forbearance', 'agreement', 'collections']).default('current'),
  autopay: z.boolean().default(false),
  note: z.string().max(4000).default(''),
  balanceDate: dateSchema,
});
export const obligationSchema = z.object({
  name: label,
  kind: z.enum(['income', 'housing', 'bill', 'debt', 'advance']),
  amountCents: cents.positive(),
  date: dateSchema,
  frequency: z.enum(['once', 'weekly', 'biweekly', 'monthly']),
  accountId: z.string().max(100).nullable().default(null),
  paidDates: z.array(dateSchema).max(500).default([]),
  paidRefs: z.record(z.string(), z.string()).default({}),
  note: z.string().max(1000).default(''),
});
export const budgetSchema = z.object({
  category: label,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  limitCents: cents,
});
export const goalSchema = z.object({
  name: label,
  targetCents: cents.positive(),
  savedCents: cents,
  dueDate: dateSchema.nullable().default(null),
  note: z.string().max(1000).default(''),
});
export const reconciliationSchema = z.object({
  accountId: z.string().min(1).max(100),
  date: dateSchema,
  statementBalanceCents: z.number().int().safe().min(-100_000_000_000).max(100_000_000_000),
});
export const taskSchema = z.object({
  title: label,
  dueDate: dateSchema.nullable(),
  done: z.boolean().default(false),
  urgent: z.boolean().default(false),
  note: z.string().max(4000).default(''),
});
export const memorySchema = z.object({ title: label, text: z.string().trim().min(1).max(4000) });
export const settingsSchema = z.object({
  name: label.default('Our household'),
  currency: z.literal('USD').default('USD'),
  timeZone: z
    .string()
    .refine((v) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: v });
        return true;
      } catch {
        return false;
      }
    })
    .default('America/Los_Angeles'),
  bufferCents: cents.default(0),
  accountsComplete: z.boolean().default(false),
  billsComplete: z.boolean().default(false),
  incomeComplete: z.boolean().default(false),
  country: z.string().max(60).default(''),
  state: z.string().max(60).default(''),
});
export const schemas = {
  account: accountSchema,
  transaction: transactionSchema,
  debt: debtSchema,
  obligation: obligationSchema,
  task: taskSchema,
  memory: memorySchema,
  settings: settingsSchema,
  budget: budgetSchema,
  goal: goalSchema,
  reconciliation: reconciliationSchema,
};
export type RecordKind = keyof typeof schemas;
export type Account = z.infer<typeof accountSchema> & Meta;
export type Transaction = z.infer<typeof transactionSchema> & Meta;
export type Debt = z.infer<typeof debtSchema> & Meta;
export type Obligation = z.infer<typeof obligationSchema> & Meta;
export type Task = z.infer<typeof taskSchema> & Meta;
export type Memory = z.infer<typeof memorySchema> & Meta;
export type Settings = z.infer<typeof settingsSchema>;
export type Meta = {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  actor: string;
};
export type DocumentRecord = Meta & {
  name: string;
  mime: string;
  size: number;
  hash: string;
  storageKey: string;
  status: 'uploaded' | 'processing' | 'review' | 'done' | 'error';
  text: string;
  error: string | null;
  leaseUntil: number;
  attempts: number;
  defaultAccountId: string | null;
};
export type Draft = Meta & {
  documentId: string | null;
  kind: RecordKind;
  data: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'accepted' | 'dismissed';
  acceptedId: string | null;
};
export type HouseholdData = {
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  obligations: Obligation[];
  tasks: Task[];
  memories: Memory[];
  settings: Settings;
  documents: DocumentRecord[];
  drafts: Draft[];
  budgets: (z.infer<typeof budgetSchema> & Meta)[];
  goals: (z.infer<typeof goalSchema> & Meta)[];
  reconciliations: (z.infer<typeof reconciliationSchema> & Meta)[];
};
export const defaultSettings: Settings = {
  name: 'Our household',
  currency: 'USD',
  timeZone: 'America/Los_Angeles',
  bufferCents: 0,
  accountsComplete: false,
  billsComplete: false,
  incomeComplete: false,
  country: '',
  state: '',
};
export function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value / 100);
}
export function dollarsToCents(value: string): number {
  const clean = value.trim().replace(/[$,]/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean))
    throw new Error('Enter a dollar amount with up to two decimal places.');
  const negative = clean.startsWith('-');
  const [whole, fraction = ''] = clean.replace('-', '').split('.');
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(n)) throw new Error('Amount is too large.');
  return negative ? -n : n;
}
export function today(timeZone = 'America/Los_Angeles') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export function addDays(date: string, days: number) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
