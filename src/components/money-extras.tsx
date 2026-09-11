'use client';
import { useI18n, LanguageSwitcher } from './i18n';
import { Plus } from 'lucide-react';
import { ViewProps } from './client-utils';
import { RowTools, Empty } from './shared';
import { accountBalance } from '@/lib/finance';
export default function MoneyExtras(props: ViewProps) {
  const { tr, money, dateLabel, locale } = useI18n();
  const { data, today } = props.s;
  const month = today.slice(0, 7);
  const thisMonth = data.transactions.filter((t) => t.date.startsWith(month) && t.date <= today);
  const earned = thisMonth
    .filter((t) => t.type === 'income')
    .reduce((n, t) => n + t.amountCents, 0);
  const borrowed = thisMonth
    .filter((t) => t.type === 'borrowing')
    .reduce((n, t) => n + t.amountCents, 0);
  const spent = thisMonth
    .filter((t) => t.type === 'expense' || t.type === 'refund')
    .reduce((n, t) => n + (t.type === 'refund' ? -1 : 1) * t.amountCents, 0);
  const budgets = data.budgets.filter((b) => b.month === month);
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <h2>
            {tr('Our monthly spending plan · ')}
            {month}
          </h2>
          <button className="secondary small-button" onClick={() => props.start('budget')}>
            <Plus size={16} />
            {tr(' Set a category limit')}
          </button>
        </div>
        <div className="month-summary">
          <span>
            {tr('Earned ')}
            <b>{money(earned)}</b>
          </span>
          <span>
            {tr('Everyday spending, less refunds ')}
            <b>{money(spent)}</b>
          </span>
          <span>
            {tr('Borrowed ')}
            <b>{money(borrowed)}</b>
          </span>
        </div>
        {budgets.map((b) => {
          const used = thisMonth
            .filter(
              (t) =>
                t.category.trim().toLowerCase() === b.category.trim().toLowerCase() &&
                ['expense', 'refund'].includes(t.type),
            )
            .reduce((n, t) => n + (t.type === 'refund' ? -1 : 1) * t.amountCents, 0);
          return (
            <div className="list-row" key={b.id}>
              <div className="grow">
                <strong>{b.category}</strong>
                <p>
                  {money(used)}
                  {tr(' of ')}
                  {money(b.limitCents)} · {money(Math.max(0, b.limitCents - used))}{' '}
                  {tr('remaining')}
                </p>
                <progress
                  aria-label={tr('{name} budget used', { name: b.category })}
                  value={Math.max(0, used)}
                  max={Math.max(1, b.limitCents)}
                />
                {used > b.limitCents && (
                  <small className="danger">
                    {money(used - b.limitCents)}
                    {tr(' over our planned limit')}
                  </small>
                )}
              </div>
              <RowTools {...props} kind="budget" item={{ ...b, name: b.category }} />
            </div>
          );
        })}
        {!budgets.length && (
          <Empty
            title={tr('Give everyday spending a simple limit.')}
            text={tr(
              'Start with groceries, fuel, and eating out. You can adjust the plan as you learn.',
            )}
          />
        )}
        <p className="help">
          {tr(
            'Category limits track spending; they do not automatically reserve cash. Put expected essentials on the calendar too. Transfers and loan repayments are shown separately from everyday spending.',
          )}
        </p>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Check our statement balances')}</h2>
          <button className="secondary small-button" onClick={() => props.start('reconciliation')}>
            <Plus size={16} />
            {tr(' Compare a statement')}
          </button>
        </div>
        {data.reconciliations.map((r) => {
          const a = data.accounts.find((a) => a.id === r.accountId);
          const expected = a ? accountBalance(a, data.transactions, r.date) : null;
          const delta = expected === null ? null : r.statementBalanceCents - expected;
          return (
            <div className="list-row" key={r.id}>
              <div className="grow">
                <strong>
                  {a?.name || tr('Account removed')} · {dateLabel(r.date)}
                </strong>
                <p>
                  {tr('Statement: ')}
                  {money(r.statementBalanceCents)}
                  {tr(' · Ledger:')} {expected === null ? tr('Unknown') : money(expected)}
                </p>
                <span className={'pill ' + (delta ? 'warm' : '')}>
                  {delta === null
                    ? tr('Account missing')
                    : delta === 0
                      ? tr('Matches to the cent')
                      : tr('{amount} difference to investigate', { amount: money(delta) })}
                </span>
              </div>
              <RowTools
                {...props}
                kind="reconciliation"
                item={{ ...r, name: a?.name || tr('Statement check') }}
              />
            </div>
          );
        })}
        {!data.reconciliations.length && (
          <p>
            {tr(
              'Compare the closing balance on a statement with the ledger. A difference may mean missing purchases, duplicate entries, or an incorrect opening balance. We keep the difference visible until it is resolved.',
            )}
          </p>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Our breathing-room goals')}</h2>
          <button className="secondary small-button" onClick={() => props.start('goal')}>
            <Plus size={16} />
            {tr(' Add a savings goal')}
          </button>
        </div>
        {data.goals.map((g) => (
          <div className="list-row" key={g.id}>
            <div className="grow">
              <strong>{g.name}</strong>
              <p>
                {money(g.savedCents)}
                {tr(' set aside toward ')}
                {money(g.targetCents)}
                {g.dueDate ? tr(' · By ') + dateLabel(g.dueDate) : ''}
              </p>
              <progress
                aria-label={tr('{name} savings progress', { name: g.name })}
                value={g.savedCents}
                max={g.targetCents}
              />
              {g.note && <small>{g.note}</small>}
            </div>
            <RowTools {...props} kind="goal" item={g} />
          </div>
        ))}
        {!data.goals.length && (
          <Empty
            title={tr('A little breathing room is a goal, too.')}
            text={tr(
              'Track a cash cushion or another savings goal once urgent obligations are covered.',
            )}
          />
        )}
        <p className="help">
          {tr(
            'Goal balances are amounts you report as set aside. They do not move money or automatically increase your protected cash buffer.',
          )}
        </p>
      </section>
    </>
  );
}
