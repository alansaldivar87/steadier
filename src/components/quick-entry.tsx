'use client';
import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { dollarsToCents } from '@/lib/domain';
import { api, type Snapshot } from './client-utils';
import { useI18n } from './i18n';
export default function QuickEntry({
  s,
  type,
  onSaved,
  advanced,
  calendar,
}: {
  s: Snapshot;
  type: 'expense' | 'income';
  onSaved: () => Promise<void>;
  advanced: (data: Record<string, unknown>) => void;
  calendar: () => void;
}) {
  const { tr } = useI18n();
  const [amount, setAmount] = useState(''),
    [description, setDescription] = useState(''),
    [date, setDate] = useState(s.today),
    [accountId, setAccountId] = useState(
      s.data.accounts.find((a) => a.kind === 'checking')?.id || s.data.accounts[0]?.id || '',
    ),
    [category, setCategory] = useState(type === 'income' ? 'Income' : 'Unsorted'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const categories = [
    ...new Set([
      'Groceries',
      'Transport',
      'Eating out',
      'Home',
      'Health',
      'Unsorted',
      ...s.data.budgets.map((b) => b.category),
      ...s.data.transactions.map((t) => t.category),
    ]),
  ];
  const entry = () => ({
    description,
    date,
    type,
    accountId,
    category,
    amountCents: dollarsToCents(amount),
    toAccountId: null,
    note: '',
    sourceId: null,
  });
  return (
    <form
      className="quick-entry"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setError('');
        setBusy(true);
        try {
          const values = entry();
          if (values.amountCents <= 0) throw new Error('Enter a positive dollar amount.');
          await api('/api/records', { kind: 'transaction', data: values, requestId });
          await onSaved();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        {tr(
          type === 'expense'
            ? 'Just the basics. You can add details later.'
            : 'Money you earned. For a loan or cash advance, use the detailed form.',
        )}
      </p>
      {s.data.obligations.length > 0 && (
        <div className="quick-calendar">
          <p>
            {tr(
              'Already on your calendar? Record it as paid or received there so it is not counted twice.',
            )}
          </p>
          <button type="button" className="text-button" onClick={calendar}>
            {tr('Open calendar')}
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      <label className="field quick-amount">
        <span>{tr('Amount')} (USD)</span>
        <div>
          <b>$</b>
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            aria-label={tr('Amount')}
          />
        </div>
      </label>
      <label className="field">
        <span>{tr('What was it for?')}</span>
        <input
          required
          maxLength={160}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tr(
            type === 'expense'
              ? 'For example: groceries at the supermarket'
              : 'For example: my paycheck',
          )}
        />
      </label>
      <div className="quick-fields">
        <label className="field">
          <span>{tr('Account used')}</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {s.data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{tr('Date')}</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      {type === 'expense' && (
        <label className="field">
          <span>{tr('Category')}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {tr(c)}
              </option>
            ))}
          </select>
          <small>{tr('Not sure? Leave it Unsorted and decide during your check-in.')}</small>
        </label>
      )}
      {error && (
        <div className="error" role="alert">
          {tr(error)}
        </div>
      )}
      <button type="submit" disabled={busy}>
        <Check size={18} />
        {tr(busy ? 'Saving…' : 'Save entry')}
      </button>
      <button
        type="button"
        className="text-button"
        disabled={busy}
        onClick={() => {
          let cents = 0;
          try {
            cents = dollarsToCents(amount);
          } catch {}
          advanced({ description, date, type, accountId, category, amountCents: cents });
        }}
      >
        {tr('Transfer, borrowed money, or more details')}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
