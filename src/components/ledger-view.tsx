'use client';
import { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  SlidersHorizontal,
} from 'lucide-react';
import type { Transaction } from '@/lib/domain';
import { ledgerTotals } from '@/lib/money-guide';
import { useI18n } from './i18n';
import { RowTools } from './shared';
import type { ViewProps } from './client-utils';

export default function LedgerView(props: ViewProps & { quick: () => void; unsorted?: boolean }) {
  const { tr, money, dateLabel } = useI18n();
  const { data, today } = props.s;
  const [query, setQuery] = useState(''),
    [account, setAccount] = useState(''),
    [type, setType] = useState(props.unsorted ? 'unsorted' : ''),
    [from, setFrom] = useState(props.unsorted ? '' : today.slice(0, 7) + '-01'),
    [to, setTo] = useState(today),
    [limit, setLimit] = useState(50);
  const rows = data.transactions
    .filter(
      (t) =>
        (!from || t.date >= from) &&
        (!to || t.date <= to) &&
        (!account || t.accountId === account || t.toAccountId === account) &&
        (!type ||
          (type === 'unsorted'
            ? ['expense', 'refund'].includes(t.type) &&
              ['unsorted', 'sin clasificar', ''].includes(t.category.trim().toLowerCase())
            : t.type === type)) &&
        `${t.description} ${t.category} ${t.note} ${data.accounts.find((a) => a.id === t.accountId)?.name || ''} ${data.accounts.find((a) => a.id === t.toAccountId)?.name || ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const totals = ledgerTotals(rows);
  const groups = Map.groupBy(rows.slice(0, limit), (t) => t.date);
  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setLimit(50);
  };
  const labels: [string, string][] = [
    ['', 'All activity'],
    ['expense', 'Money spent'],
    ['income', 'Money earned'],
    ['transfer', 'Transfers / card payments'],
    ['borrowing', 'Borrowed money'],
    ['refund', 'Refunds'],
    ['debt_payment', 'Loan repayments'],
    ['unsorted', 'Unsorted spending'],
  ];
  const sign = (t: Transaction) =>
    ['income', 'refund', 'borrowing'].includes(t.type) ? '+' : t.type === 'transfer' ? '' : '−';
  return (
    <section className="surface ledger-surface">
      <div className="surface-title">
        <div>
          <h2>{tr('Your ledger')}</h2>
          <p>{tr('Every confirmed entry, easy to find.')}</p>
        </div>
        <button onClick={props.quick}>
          <Plus size={18} />
          {tr('Quick entry')}
        </button>
      </div>
      <div className="ledger-toolbar">
        <label className="search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setFilter(setQuery, e.target.value)}
            aria-label={tr('Find transactions')}
            placeholder={tr('Search a store, note, or category')}
          />
        </label>
        <select
          value={type}
          onChange={(e) => setFilter(setType, e.target.value)}
          aria-label={tr('Activity type')}
        >
          {labels.map(([v, l]) => (
            <option value={v} key={v}>
              {tr(l)}
            </option>
          ))}
        </select>
      </div>
      <details className="ledger-filters">
        <summary>
          <SlidersHorizontal size={16} />
          {tr('Accounts and dates')}
          <span>
            {from ? dateLabel(from) : tr('Any date')} — {to ? dateLabel(to) : tr('Any date')}
          </span>
        </summary>
        <div>
          <label className="field">
            <span>{tr('Account')}</span>
            <select value={account} onChange={(e) => setFilter(setAccount, e.target.value)}>
              <option value="">{tr('All accounts')}</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{tr('From')}</span>
            <input type="date" value={from} onChange={(e) => setFilter(setFrom, e.target.value)} />
          </label>
          <label className="field">
            <span>{tr('Through')}</span>
            <input type="date" value={to} onChange={(e) => setFilter(setTo, e.target.value)} />
          </label>
          <button
            className="secondary"
            onClick={() => {
              setFrom('');
              setTo('');
              setAccount('');
              setType('');
              setQuery('');
              setLimit(50);
            }}
          >
            {tr('Show all entries')}
          </button>
        </div>
      </details>
      <div className="ledger-totals">
        <div>
          <span>{tr('Earned')}</span>
          <strong>{money(totals.earnedCents)}</strong>
        </div>
        <div>
          <span>{tr('Spent, after refunds')}</span>
          <strong>{money(totals.spentCents)}</strong>
        </div>
        <div>
          <span>{tr('Borrowed')}</span>
          <strong>{money(totals.borrowedCents)}</strong>
        </div>
        <div>
          <span>{tr('Loan repayments')}</span>
          <strong>{money(totals.repaidCents)}</strong>
        </div>
      </div>
      <p className="ledger-count">
        {tr('{count} matching entries', { count: rows.length })} ·{' '}
        {tr('Totals follow your filters. Transfers are excluded from spending.')}
      </p>
      {from && to && from > to ? (
        <div className="notice">{tr('The start date must come before the end date.')}</div>
      ) : rows.length ? (
        [...groups.entries()].map(([date, items]) => (
          <div className="ledger-day" key={date}>
            <h3>
              {dateLabel(date)}
              {date > today && <span className="pill">{tr('Future entry')}</span>}
            </h3>
            {items.map((t) => (
              <article className="ledger-row" key={t.id}>
                <span className={'ledger-symbol ' + t.type}>
                  {t.type === 'transfer' ? (
                    <ArrowLeftRight size={18} />
                  ) : sign(t) === '+' ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </span>
                <div className="grow">
                  <strong>{t.description}</strong>
                  <p>
                    {data.accounts.find((a) => a.id === t.accountId)?.name}
                    {t.toAccountId
                      ? ' → ' + data.accounts.find((a) => a.id === t.toAccountId)?.name
                      : ''}{' '}
                    · {tr(t.category)}
                  </p>
                  <small>{tr(t.type)}</small>
                </div>
                <b className={t.type === 'income' || t.type === 'refund' ? 'positive' : ''}>
                  {sign(t)}
                  {money(t.amountCents)}
                </b>
                <RowTools {...props} kind="transaction" item={t} />
              </article>
            ))}
          </div>
        ))
      ) : (
        <div className="quiet-empty">
          <Search size={28} />
          <h3>
            {tr(
              data.transactions.length
                ? 'No entries match these filters.'
                : 'Your first entry starts the story.',
            )}
          </h3>
          <p>
            {tr(
              data.transactions.length
                ? 'Try a different date, account, or search.'
                : 'Add a purchase, record income, or review an uploaded statement.',
            )}
          </p>
          <button className="secondary" onClick={() => props.start('transaction')}>
            {tr('Add entry')}
          </button>
        </div>
      )}
      {rows.length > limit && (
        <button className="secondary ledger-more" onClick={() => setLimit(limit + 50)}>
          {tr('Show more entries')}
        </button>
      )}
    </section>
  );
}
