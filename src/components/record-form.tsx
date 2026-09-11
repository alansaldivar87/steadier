'use client';
import { useState } from 'react';
import { Account, RecordKind, dollarsToCents } from '@/lib/domain';
type Field = {
  key: string;
  label: string;
  type?: 'money' | 'percent' | 'date' | 'select' | 'textarea' | 'checkbox';
  options?: [string, string][];
  optional?: boolean;
  help?: string;
};
const types: [string, string][] = [
  ['expense', 'Money spent'],
  ['income', 'Money earned'],
  ['transfer', 'Transfer / credit card payment'],
  ['borrowing', 'Borrowed money / cash advance'],
  ['refund', 'Refund'],
  ['debt_payment', 'Loan / cash advance repayment'],
];
const fields: Record<Exclude<RecordKind, 'settings'>, Field[]> = {
  account: [
    {
      key: 'name',
      label: 'What do you call this account?',
      help: 'For example: Joint checking or Alan’s Visa',
    },
    {
      key: 'kind',
      label: 'Account type',
      type: 'select',
      options: [
        ['checking', 'Checking'],
        ['savings', 'Savings'],
        ['cash', 'Cash / wallet'],
        ['credit', 'Credit card'],
      ],
    },
    {
      key: 'balanceCents',
      label: 'Balance at the START of this date',
      type: 'money',
      help: 'Use the balance before that day’s transactions. For a credit card, enter what you owe as a negative number.',
    },
    {
      key: 'openingDate',
      label: 'Starting date',
      type: 'date',
      help: 'If importing statements, use the first statement’s opening date and balance.',
    },
  ],
  transaction: [
    { key: 'description', label: 'What was it for?' },
    { key: 'amountCents', label: 'Amount', type: 'money' },
    { key: 'type', label: 'What happened?', type: 'select', options: types },
    { key: 'accountId', label: 'Account used', type: 'select' },
    { key: 'toAccountId', label: 'Moved to (transfers only)', type: 'select', optional: true },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'category', label: 'Category', help: 'For example: Groceries, Fuel, Home, Eating out' },
    { key: 'note', label: 'Anything else?', type: 'textarea', optional: true },
  ],
  debt: [
    { key: 'name', label: 'Who do we owe?' },
    {
      key: 'kind',
      label: 'Type of debt',
      type: 'select',
      options: [
        ['mortgage', 'Mortgage'],
        ['credit_card', 'Credit card'],
        ['loan', 'Personal / auto / student loan'],
        ['consolidation', 'Consolidation'],
        ['cash_advance', 'Cash advance app'],
        ['other', 'Other'],
      ],
    },
    { key: 'balanceCents', label: 'Total balance owed', type: 'money' },
    { key: 'balanceDate', label: 'Balance as of', type: 'date' },
    {
      key: 'aprBps',
      label: 'Interest rate (APR %)',
      type: 'percent',
      optional: true,
      help: 'Leave blank if unknown. Do not guess.',
    },
    { key: 'minimumCents', label: 'Regular minimum payment', type: 'money' },
    { key: 'dueDate', label: 'Next due date', type: 'date', optional: true },
    { key: 'pastDueCents', label: 'Past-due amount', type: 'money' },
    {
      key: 'status',
      label: 'Where things stand',
      type: 'select',
      options: [
        ['current', 'Up to date'],
        ['late', 'Behind on payments'],
        ['forbearance', 'In / leaving forbearance'],
        ['agreement', 'Repayment agreement'],
        ['collections', 'In collections'],
      ],
    },
    { key: 'autopay', label: 'Automatic withdrawals are turned on', type: 'checkbox' },
    {
      key: 'note',
      label: 'Terms, fees, lender contact, or agreement details',
      type: 'textarea',
      optional: true,
    },
  ],
  obligation: [
    { key: 'name', label: 'What is coming up?' },
    {
      key: 'kind',
      label: 'Type',
      type: 'select',
      options: [
        ['bill', 'Bill / everyday essentials'],
        ['housing', 'Housing'],
        ['income', 'Take-home pay'],
        ['debt', 'Debt minimum'],
        ['advance', 'Cash advance withdrawal'],
      ],
    },
    { key: 'amountCents', label: 'Amount', type: 'money' },
    { key: 'date', label: 'First due date / payday', type: 'date' },
    {
      key: 'frequency',
      label: 'How often?',
      type: 'select',
      options: [
        ['once', 'Just once'],
        ['weekly', 'Every week'],
        ['biweekly', 'Every two weeks'],
        ['monthly', 'Every month'],
      ],
    },
    { key: 'accountId', label: 'Paying / receiving account', type: 'select', optional: true },
    { key: 'note', label: 'Notes', type: 'textarea', optional: true },
  ],
  task: [
    { key: 'title', label: 'What needs to happen?' },
    { key: 'dueDate', label: 'Deadline', type: 'date', optional: true },
    { key: 'urgent', label: 'This needs urgent attention', type: 'checkbox' },
    { key: 'done', label: 'This step is complete', type: 'checkbox' },
    {
      key: 'note',
      label: 'Contact details, confirmation number, or next step',
      type: 'textarea',
      optional: true,
    },
  ],
  memory: [
    { key: 'title', label: 'What should the coach remember?' },
    {
      key: 'text',
      label: 'In your own words',
      type: 'textarea',
      help: 'Preferences, goals, category rules, or household context. You can change this later.',
    },
  ],
  budget: [
    {
      key: 'category',
      label: 'Spending category',
      help: 'Use the same category name as your transactions, such as Groceries.',
    },
    { key: 'month', label: 'Month (YYYY-MM)' },
    { key: 'limitCents', label: 'Our planned limit', type: 'money' },
  ],
  goal: [
    { key: 'name', label: 'What are we saving for?' },
    { key: 'targetCents', label: 'Our goal', type: 'money' },
    { key: 'savedCents', label: 'Already set aside', type: 'money' },
    { key: 'dueDate', label: 'Target date', type: 'date', optional: true },
    {
      key: 'note',
      label: 'Where this money is kept',
      type: 'textarea',
      optional: true,
      help: 'The goal tracks progress. It does not move money or change account balances.',
    },
  ],
  reconciliation: [
    { key: 'accountId', label: 'Account to check', type: 'select' },
    { key: 'date', label: 'Statement closing date', type: 'date' },
    {
      key: 'statementBalanceCents',
      label: 'Balance at the END of that date',
      type: 'money',
      help: 'Use a negative amount for money owed on a credit card. We compare this with the ledger; no money is added to force a match.',
    },
  ],
};
export function defaults(
  kind: Exclude<RecordKind, 'settings'>,
  date: string,
  accountId = '',
): Record<string, unknown> {
  switch (kind) {
    case 'account':
      return { name: '', kind: 'checking', balanceCents: 0, openingDate: date };
    case 'transaction':
      return {
        date,
        description: '',
        amountCents: '',
        type: 'expense',
        accountId,
        toAccountId: null,
        category: 'Unsorted',
        sourceId: null,
        note: '',
      };
    case 'debt':
      return {
        name: '',
        kind: 'loan',
        balanceCents: '',
        balanceDate: date,
        aprBps: null,
        minimumCents: '',
        dueDate: null,
        pastDueCents: 0,
        status: 'current',
        autopay: false,
        note: '',
      };
    case 'obligation':
      return {
        date,
        name: '',
        kind: 'bill',
        amountCents: '',
        frequency: 'monthly',
        accountId: accountId || null,
        paidDates: [],
        note: '',
      };
    case 'task':
      return { title: '', dueDate: null, done: false, urgent: false, note: '' };
    case 'budget':
      return { category: '', month: date.slice(0, 7), limitCents: '' };
    case 'goal':
      return { name: '', targetCents: '', savedCents: 0, dueDate: null, note: '' };
    case 'reconciliation':
      return { accountId, date, statementBalanceCents: '' };
    case 'memory':
      return { title: '', text: '' };
  }
}
export default function RecordForm({
  kind,
  initial,
  accounts,
  onSave,
  submitLabel = 'Save',
  extra,
}: {
  kind: Exclude<RecordKind, 'settings'>;
  initial: Record<string, unknown>;
  accounts: Account[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  extra?: React.ReactNode;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v = { ...initial };
    for (const f of fields[kind])
      if (f.type === 'money' || f.type === 'percent')
        v[f.key] = typeof v[f.key] === 'number' ? String(Number(v[f.key]) / 100) : '';
    return v;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="record-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
          const v = { ...values };
          for (const f of fields[kind]) {
            if (f.type === 'money') v[f.key] = dollarsToCents(String(v[f.key] ?? ''));
            if (f.type === 'percent')
              v[f.key] = v[f.key] === '' ? null : dollarsToCents(String(v[f.key]));
            if (f.optional && (v[f.key] === '' || v[f.key] === undefined))
              v[f.key] = ['date', 'select', 'percent'].includes(f.type || '') ? null : '';
          }
          if (kind === 'transaction' && v.type !== 'transfer') v.toAccountId = null;
          await onSave(v);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Please check the entry.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {fields[kind]
        .filter((f) => f.key !== 'toAccountId' || values.type === 'transfer')
        .map((f) => {
          const id = `field-${f.key}`;
          const opts =
            f.options ||
            (f.key === 'accountId' || f.key === 'toAccountId'
              ? accounts.map((a) => [a.id, a.name] as [string, string])
              : []);
          return (
            <label
              className={f.type === 'checkbox' ? 'check-field' : 'field'}
              key={f.key}
              htmlFor={id}
            >
              {f.type === 'checkbox' ? (
                <>
                  <input
                    id={id}
                    type="checkbox"
                    checked={!!values[f.key]}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.checked })}
                  />
                  <span>{f.label}</span>
                </>
              ) : (
                <>
                  <span>
                    {f.label}
                    {f.optional && <small> Optional</small>}
                  </span>
                  {f.type === 'select' ? (
                    <select
                      id={id}
                      value={String(values[f.key] ?? '')}
                      required={!f.optional}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    >
                      <option value="">Choose{f.optional ? ' / not sure yet' : ''}</option>
                      {opts.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      id={id}
                      rows={3}
                      value={String(values[f.key] ?? '')}
                      required={!f.optional}
                      maxLength={4000}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  ) : (
                    <div className="input-wrap">
                      {f.type === 'money' && <b>$</b>}
                      <input
                        id={id}
                        type={f.type === 'date' ? 'date' : 'text'}
                        inputMode={
                          f.type === 'money' || f.type === 'percent' ? 'decimal' : undefined
                        }
                        value={String(values[f.key] ?? '')}
                        required={!f.optional}
                        maxLength={f.type === 'date' ? 10 : 160}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      />
                      {f.type === 'percent' && <b>%</b>}
                    </div>
                  )}
                  {f.help && <small>{f.help}</small>}
                </>
              )}
            </label>
          );
        })}
      {kind === 'debt' && (
        <p className="notice">
          After saving, add its payment to the calendar so it appears in your cash-flow plan.
        </p>
      )}
      {extra}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
