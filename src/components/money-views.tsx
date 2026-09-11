'use client';
import { useI18n, LanguageSwitcher } from './i18n';
import { useState } from 'react';
import {
  Plus,
  Search,
  Wallet,
  Target,
  CalendarDays,
  Check,
  MessageCircle,
  Upload,
} from 'lucide-react';
import { ViewProps, api } from './client-utils';
import { Empty, RowTools, CashChart } from './shared';
import { accountBalance, payoff, occurrences } from '@/lib/finance';
import { dollarsToCents, Obligation, HouseholdData } from '@/lib/domain';
import Dialog from './dialog';
import MoneyExtras from './money-extras';
import LedgerView from './ledger-view';
import type { MoneyTab } from './today-view';

export function MoneyView(
  props: ViewProps & { tab: MoneyTab; setTab: (tab: MoneyTab) => void; quick: () => void },
) {
  const { tr, money, dateLabel, locale } = useI18n();
  const { s, start } = props;
  const { data, today } = s;

  return (
    <>
      <div className="money-tabs" aria-label={tr('Money sections')}>
        {(
          [
            ['ledger', 'Ledger'],
            ['accounts', 'Accounts'],
            ['debts', 'Debts'],
            ['targets', 'Budgets & goals'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={
              props.tab === id || (props.tab === 'unsorted' && id === 'ledger') ? 'active' : ''
            }
            aria-pressed={props.tab === id || (props.tab === 'unsorted' && id === 'ledger')}
            onClick={() => props.setTab(id)}
          >
            {tr(label)}
          </button>
        ))}
      </div>
      <section className="panel" hidden={props.tab !== 'accounts'}>
        <div className="section-title">
          <h2>{tr('Our accounts')}</h2>
          <button className="secondary small-button" onClick={() => start('account')}>
            <Plus size={16} />
            {tr(' Add account')}
          </button>
        </div>
        {data.accounts.length ? (
          <div className="account-grid">
            {data.accounts.map((a) => (
              <article className="account-card" key={a.id}>
                <span className="pill">{tr(a.kind)}</span>
                <h3>{a.name}</h3>
                <strong>{money(accountBalance(a, data.transactions, today))}</strong>
                <small>
                  {tr('Starting ')}
                  {dateLabel(a.openingDate)} · {money(a.balanceCents)}
                </small>
                <RowTools {...props} kind="account" item={a} />
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title={tr('Start with just one account.')}
            text={tr('Use its opening statement balance if you’ll import past transactions.')}
          />
        )}
      </section>
      {['ledger', 'unsorted'].includes(props.tab) && (
        <LedgerView key={props.tab} {...props} unsorted={props.tab === 'unsorted'} />
      )}
      <section className="panel" hidden={props.tab !== 'debts'}>
        <div className="section-title">
          <h2>{tr('Everything we owe')}</h2>
          <button className="secondary small-button" onClick={() => start('debt')}>
            <Plus size={16} />
            {tr(' Add debt')}
          </button>
        </div>
        {data.debts.map((d) => (
          <div className="list-row debt-row" key={d.id}>
            <span className={'list-icon ' + (d.kind === 'mortgage' ? 'warm' : '')}>
              <Target size={19} />
            </span>
            <div className="grow">
              <strong>{d.name}</strong>
              <p>
                {tr(d.kind)} ·{' '}
                {d.aprBps === null ? tr('Interest rate unknown') : `${d.aprBps / 100}% APR`} ·{' '}
                {money(d.minimumCents)}
                {tr(' minimum')}
              </p>
              <small>
                {tr('Balance as of ')}
                {dateLabel(d.balanceDate)}
                {d.dueDate ? tr(' · Due ') + dateLabel(d.dueDate) : ''}
                {d.autopay ? tr(' · Automatic withdrawal') : ''}
              </small>
              {d.pastDueCents > 0 && (
                <p className="danger">
                  {money(d.pastDueCents)}
                  {tr(' past due')}
                </p>
              )}
            </div>
            <div className="right">
              <b>{money(d.balanceCents)}</b>
              <span className={'pill ' + (d.status !== 'current' ? 'warm' : '')}>
                {tr(d.status)}
              </span>
            </div>
            <RowTools {...props} kind="debt" item={d} />
          </div>
        ))}
        {!data.debts.length && (
          <Empty
            title={tr('You don’t have to add them all today.')}
            text={tr('Start with your mortgage, then add one card or loan at a time.')}
          />
        )}
        <p className="help">
          {tr(
            'Debt balances are statement snapshots. Update them when a new statement arrives; a payment may include interest and fees.',
          )}
        </p>
      </section>
      {props.tab === 'targets' && <MoneyExtras {...props} />}
    </>
  );
}
export function PlanView(props: ViewProps & { upload: () => void; coach: () => void }) {
  const { tr, money, dateLabel, locale } = useI18n();
  const { s, start, refresh, notify } = props;
  const { data, forecast: f } = s;
  const [extra, setExtra] = useState('0'),
    [settling, setSettling] = useState<{ o: Obligation; date: string } | null>(null),
    [error, setError] = useState('');
  return (
    <>
      {error && <div className="error">{tr(error)}</div>}
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Housing and next steps')}</h2>
          <button className="secondary small-button" onClick={() => start('task')}>
            <Plus size={16} />
            {tr(' Add step')}
          </button>
        </div>
        <div className="notice">
          {tr(
            'For an overdue U.S. mortgage, contact your servicer’s assistance team promptly. If you have a sale date or legal papers, seek a HUD-approved counselor and local legal help now.',
          )}{' '}
          <a
            href={
              locale === 'es'
                ? 'https://www.consumerfinance.gov/es/vivienda/inseguridad-habitacional/asistencia-hipotecas-y-viviendas/'
                : 'https://www.consumerfinance.gov/ask-cfpb/if-i-cant-pay-my-mortgage-loan-what-are-my-options-en-268/'
            }
            target="_blank"
            rel="noreferrer"
          >
            {tr('CFPB guidance ↗')}
          </a>
        </div>
        {data.tasks.map((t) => (
          <div className={'list-row ' + (t.done ? 'completed' : '')} key={t.id}>
            <button
              className={'task-check ' + (t.done ? 'checked' : '')}
              aria-label={t.done ? tr('Mark incomplete') : tr('Mark complete')}
              onClick={async () => {
                try {
                  await api('/api/records', {
                    kind: 'task',
                    id: t.id,
                    revision: t.revision,
                    data: { ...t, done: !t.done },
                  });
                  await refresh();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              {t.done && <Check size={16} />}
            </button>
            <div className="grow">
              <strong>{t.title}</strong>
              <p>
                {t.dueDate ? tr('Due ') + dateLabel(t.dueDate) : tr('No date set')}
                {t.urgent ? tr(' · Urgent') : ''}
              </p>
              {t.note && <small>{t.note}</small>}
            </div>
            <RowTools {...props} kind="task" item={t} />
          </div>
        ))}
        {!data.tasks.length && (
          <div className="starter-steps">
            <button
              className="text-button"
              onClick={() =>
                start('task', {
                  title: tr('Call the mortgage servicer’s assistance team'),
                  urgent: true,
                  note: tr(
                    'Ask for the exact overdue amount, available repayment options, required documents, and application deadline. Ask for all proposed terms in writing.',
                  ),
                })
              }
            >
              {tr('1. Add our servicer call ')}
              <Plus size={16} />
            </button>
            <button className="text-button" onClick={props.upload}>
              {tr('2. Upload the latest housing notice ')}
              <Upload size={16} />
            </button>
            <button className="text-button" onClick={props.coach}>
              {tr('3. Prepare the call together ')}
              <MessageCircle size={16} />
            </button>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('The next 30 days')}</h2>
          <span className={'pill ' + (f.shortfallCents ? 'warm' : '')}>
            {f.shortfallCents
              ? tr('{amount} shortfall', { amount: money(f.shortfallCents) })
              : tr('Based on our listed payments')}
          </span>
        </div>
        {data.accounts.length ? (
          <CashChart points={f.points} />
        ) : (
          <Empty
            title={tr('First, add a cash account.')}
            text={tr('Then we can show how upcoming paydays and bills affect your balance.')}
          />
        )}
        {f.missing.length > 0 && (
          <details className="missing">
            <summary>
              {tr('What’s missing from our picture? (')}
              {f.missing.length})
            </summary>
            <ul>
              {f.missing.map((m) => (
                <li key={m}>{tr(m)}</li>
              ))}
            </ul>
          </details>
        )}
        <p className="help">
          {tr(
            'An estimate, not a guarantee. Include groceries, fuel, debt minimums, and automatic withdrawals. Outflows are counted before income on the same date.',
          )}
        </p>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Bills, paydays & automatic withdrawals')}</h2>
          <button className="secondary small-button" onClick={() => start('obligation')}>
            <Plus size={16} />
            {tr(' Add to calendar')}
          </button>
        </div>
        {data.obligations.map((o) => {
          const next = occurrences(o, o.date, f.points.at(-1)!.date)[0];
          return (
            <div className="list-row" key={o.id}>
              <span className="list-icon">
                <CalendarDays size={18} />
              </span>
              <div className="grow">
                <strong>{o.name}</strong>
                <p>
                  {next ? tr('Due ') + dateLabel(next) : tr('No unpaid occurrence in this window')}{' '}
                  · {tr(o.frequency)}
                </p>
                <small>
                  {tr(o.kind)} ·{' '}
                  {o.accountId
                    ? data.accounts.find((a) => a.id === o.accountId)?.name
                    : tr('No account chosen')}
                </small>
              </div>
              <b>{money(o.amountCents)}</b>
              {next && (
                <button
                  className="secondary small-button"
                  onClick={() => setSettling({ o, date: next })}
                >
                  {o.kind === 'income' ? tr('Received') : tr('Paid')}
                </button>
              )}
              <RowTools {...props} kind="obligation" item={o} />
              {o.paidDates.length > 0 && (
                <details className="paid-history">
                  <summary>
                    {tr('Payment history (')}
                    {o.paidDates.length})
                  </summary>
                  {o.paidDates.map((date) => (
                    <div key={date}>
                      {date}
                      <button
                        className="text-button"
                        onClick={async () => {
                          try {
                            const result = await api<{ message: string }>(
                              '/api/settle',
                              { id: o.id, revision: o.revision, date },
                              'DELETE',
                            );
                            await refresh();
                            notify(result.message);
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        {tr('Reopen')}
                      </button>
                    </div>
                  ))}
                </details>
              )}
            </div>
          );
        })}
        {!data.obligations.length && (
          <Empty
            title={tr('What happens before the next payday?')}
            text={tr(
              'Add income, housing, utilities, food, and debt withdrawals. Estimates for variable bills are okay; update them when you know.',
            )}
          />
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Compare ways to pay down debt')}</h2>
          <span className="pill">{tr('PLANNING ESTIMATE')}</span>
        </div>
        <p>
          {tr(
            'After essentials and agreed payments are covered, compare the effect of an extra monthly amount.',
          )}
        </p>
        <label className="field extra-payment">
          <span>{tr('Extra per month ($)')}</span>
          <input inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </label>
        <div className="two-columns">
          {(['avalanche', 'snowball'] as const).map((strategy) => {
            let cents = 0,
              valid = true;
            try {
              cents = dollarsToCents(extra);
              valid = cents >= 0;
            } catch {
              valid = false;
            }
            const p = payoff(data.debts, Math.max(0, cents), strategy);
            return (
              <div className="comparison" key={strategy}>
                <h3>
                  {strategy === 'avalanche'
                    ? tr('Highest interest first')
                    : tr('Smallest balance first')}
                </h3>
                {!valid ? (
                  <p>{tr('Enter a positive dollar amount or zero.')}</p>
                ) : p.available ? (
                  <>
                    <strong>
                      {p.months}
                      {tr(' months')}
                    </strong>
                    <p>
                      {money(p.interestCents)}
                      {tr(' estimated interest')}
                    </p>
                    <small>
                      {money(p.budgetCents)}
                      {tr(' total monthly debt payment')}
                    </small>
                  </>
                ) : (
                  <p>{tr(p.reason)}</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="help">
          {tr(
            'Assumes fixed rates, monthly interest, constant total payments, no new borrowing or fees. This comparison does not establish affordability.',
          )}
        </p>
      </section>
      {settling && (
        <Dialog
          title={
            settling.o.kind === 'income' ? tr('Record this payday') : tr('Record this payment')
          }
          onClose={() => setSettling(null)}
        >
          <SettlementForm
            item={settling}
            data={data}
            onSave={async (values) => {
              await api('/api/settle', {
                id: settling.o.id,
                revision: settling.o.revision,
                date: settling.date,
                ...values,
              });
              await refresh();
              setSettling(null);
              notify(tr('Calendar and account updated together.'));
            }}
          />
        </Dialog>
      )}
    </>
  );
}
function SettlementForm({
  item,
  data,
  onSave,
}: {
  item: { o: Obligation; date: string };
  data: HouseholdData;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const { tr, money, dateLabel, locale } = useI18n();
  const [accountId, setAccount] = useState(item.o.accountId || data.accounts[0]?.id || ''),
    [paymentDate, setPaymentDate] = useState(new Date().toLocaleDateString('en-CA')),
    [type, setType] = useState(
      item.o.kind === 'income'
        ? 'income'
        : ['debt', 'advance', 'housing'].includes(item.o.kind)
          ? 'debt_payment'
          : 'expense',
    ),
    [toAccountId, setTo] = useState(''),
    [existing, setExisting] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const matches = data.transactions.filter(
    (t) =>
      t.accountId === accountId &&
      t.amountCents === item.o.amountCents &&
      (item.o.kind === 'income'
        ? t.type === 'income'
        : ['expense', 'transfer', 'debt_payment'].includes(t.type)),
  );
  return (
    <form
      className="record-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            accountId,
            paymentDate,
            type,
            toAccountId: toAccountId || null,
            existingTransactionId: existing || null,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : tr('Check this payment.'));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        {item.o.name} · {money(item.o.amountCents)} · {item.date}
      </p>
      <label className="field">
        <span>{tr('Account used')}</span>
        <select
          required
          value={accountId}
          onChange={(e) => {
            setAccount(e.target.value);
            setExisting('');
          }}
        >
          <option value="">{tr('Choose account')}</option>
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{tr('Already recorded in our transactions?')}</span>
        <select value={existing} onChange={(e) => setExisting(e.target.value)}>
          <option value="">{tr('No, create the transaction now')}</option>
          {matches.map((t) => (
            <option key={t.id} value={t.id}>
              {dateLabel(t.date)} · {t.description}
            </option>
          ))}
        </select>
        <small>
          {tr('Choose an existing entry if you already imported or entered this payment.')}
        </small>
      </label>
      {!existing && (
        <label className="field">
          <span>{tr('Actual payment / receipt date')}</span>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </label>
      )}
      {!existing && item.o.kind !== 'income' && (
        <>
          <label className="field">
            <span>{tr('Payment type')}</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">{tr('Everyday bill payment')}</option>
              <option value="debt_payment">{tr('Loan / mortgage / advance repayment')}</option>
              <option value="transfer">{tr('Transfer to a tracked credit card')}</option>
            </select>
          </label>
          {type === 'transfer' && (
            <label className="field">
              <span>{tr('Credit card receiving the payment')}</span>
              <select required value={toAccountId} onChange={(e) => setTo(e.target.value)}>
                <option value="">{tr('Choose destination')}</option>
                {data.accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </>
      )}
      {error && <div className="error">{tr(error)}</div>}
      <button disabled={busy}>
        {busy
          ? tr('Saving…')
          : existing
            ? tr('Link payment and update calendar')
            : tr('Record and update calendar')}
      </button>
    </form>
  );
}
