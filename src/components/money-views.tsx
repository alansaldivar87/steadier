'use client';
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
import { money, dollarsToCents, Obligation, HouseholdData } from '@/lib/domain';
import Dialog from './dialog';
import MoneyExtras from './money-extras';
const label = (s: string) => s.replace(/_/g, ' ');
export function MoneyView(props: ViewProps) {
  const { s, start } = props;
  const { data, today } = s;
  const [query, setQuery] = useState('');
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <h2>Our accounts</h2>
          <button className="secondary small-button" onClick={() => start('account')}>
            <Plus size={16} /> Add account
          </button>
        </div>
        {data.accounts.length ? (
          <div className="account-grid">
            {data.accounts.map((a) => (
              <article className="account-card" key={a.id}>
                <span className="pill">{label(a.kind)}</span>
                <h3>{a.name}</h3>
                <strong>{money(accountBalance(a, data.transactions, today))}</strong>
                <small>
                  Starting {a.openingDate} · {money(a.balanceCents)}
                </small>
                <RowTools {...props} kind="account" item={a} />
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Start with just one account."
            text="Use its opening statement balance if you’ll import past transactions."
          />
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Money in and out</h2>
          <button className="secondary small-button" onClick={() => start('transaction')}>
            <Plus size={16} /> Add entry
          </button>
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Find transactions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a purchase, account, or category"
          />
        </label>
        {data.transactions
          .filter((t) =>
            `${t.description} ${t.category} ${data.accounts.find((a) => a.id === t.accountId)?.name}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((t) => (
            <div className="list-row" key={t.id}>
              <span className="list-icon">
                <Wallet size={17} />
              </span>
              <div className="grow">
                <strong>{t.description}</strong>
                <p>
                  {t.date} · {data.accounts.find((a) => a.id === t.accountId)?.name} · {t.category}
                </p>
                <small>
                  {label(t.type)}
                  {t.type === 'transfer'
                    ? ' → ' + data.accounts.find((a) => a.id === t.toAccountId)?.name
                    : ''}
                </small>
              </div>
              <b>{money(t.amountCents)}</b>
              <RowTools {...props} kind="transaction" item={t} />
            </div>
          ))}
        {!data.transactions.length && (
          <Empty
            title="A receipt, a quick entry, a little more clarity."
            text="Your reviewed purchases and income will appear here."
          />
        )}
        <p className="help">
          Borrowed money is tracked separately from earnings. A transfer to pay a credit card does
          not count as a second purchase.
        </p>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Everything we owe</h2>
          <button className="secondary small-button" onClick={() => start('debt')}>
            <Plus size={16} /> Add debt
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
                {label(d.kind)} ·{' '}
                {d.aprBps === null ? 'Interest rate unknown' : `${d.aprBps / 100}% APR`} ·{' '}
                {money(d.minimumCents)} minimum
              </p>
              <small>
                Balance as of {d.balanceDate}
                {d.dueDate ? ' · Due ' + d.dueDate : ''}
                {d.autopay ? ' · Automatic withdrawal' : ''}
              </small>
              {d.pastDueCents > 0 && <p className="danger">{money(d.pastDueCents)} past due</p>}
            </div>
            <div className="right">
              <b>{money(d.balanceCents)}</b>
              <span className={'pill ' + (d.status !== 'current' ? 'warm' : '')}>
                {label(d.status)}
              </span>
            </div>
            <RowTools {...props} kind="debt" item={d} />
          </div>
        ))}
        {!data.debts.length && (
          <Empty
            title="You don’t have to add them all today."
            text="Start with your mortgage, then add one card or loan at a time."
          />
        )}
        <p className="help">
          Debt balances are statement snapshots. Update them when a new statement arrives; a payment
          may include interest and fees.
        </p>
      </section>
      <MoneyExtras {...props} />
    </>
  );
}
export function PlanView(props: ViewProps & { upload: () => void; coach: () => void }) {
  const { s, start, refresh, notify } = props;
  const { data, forecast: f } = s;
  const [extra, setExtra] = useState('0'),
    [settling, setSettling] = useState<{ o: Obligation; date: string } | null>(null),
    [error, setError] = useState('');
  return (
    <>
      {error && <div className="error">{error}</div>}
      <section className="panel">
        <div className="section-title">
          <h2>Housing and next steps</h2>
          <button className="secondary small-button" onClick={() => start('task')}>
            <Plus size={16} /> Add step
          </button>
        </div>
        <div className="notice">
          For an overdue U.S. mortgage, contact your servicer’s assistance team promptly. If you
          have a sale date or legal papers, seek a HUD-approved counselor and local legal help now.{' '}
          <a
            href="https://www.consumerfinance.gov/ask-cfpb/if-i-cant-pay-my-mortgage-loan-what-are-my-options-en-268/"
            target="_blank"
            rel="noreferrer"
          >
            CFPB guidance ↗
          </a>
        </div>
        {data.tasks.map((t) => (
          <div className={'list-row ' + (t.done ? 'completed' : '')} key={t.id}>
            <button
              className={'task-check ' + (t.done ? 'checked' : '')}
              aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
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
                {t.dueDate ? 'Due ' + t.dueDate : 'No date set'}
                {t.urgent ? ' · Urgent' : ''}
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
                  title: 'Call the mortgage servicer’s assistance team',
                  urgent: true,
                  note: 'Ask for the exact overdue amount, available repayment options, required documents, and application deadline. Ask for all proposed terms in writing.',
                })
              }
            >
              1. Add our servicer call <Plus size={16} />
            </button>
            <button className="text-button" onClick={props.upload}>
              2. Upload the latest housing notice <Upload size={16} />
            </button>
            <button className="text-button" onClick={props.coach}>
              3. Prepare the call together <MessageCircle size={16} />
            </button>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>The next 30 days</h2>
          <span className={'pill ' + (f.shortfallCents ? 'warm' : '')}>
            {f.shortfallCents
              ? `${money(f.shortfallCents)} shortfall`
              : 'Based on our listed payments'}
          </span>
        </div>
        {data.accounts.length ? (
          <CashChart points={f.points} />
        ) : (
          <Empty
            title="First, add a cash account."
            text="Then we can show how upcoming paydays and bills affect your balance."
          />
        )}
        {f.missing.length > 0 && (
          <details className="missing">
            <summary>What’s missing from our picture? ({f.missing.length})</summary>
            <ul>
              {f.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>
        )}
        <p className="help">
          An estimate, not a guarantee. Include groceries, fuel, debt minimums, and automatic
          withdrawals. Outflows are counted before income on the same date.
        </p>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Bills, paydays & automatic withdrawals</h2>
          <button className="secondary small-button" onClick={() => start('obligation')}>
            <Plus size={16} /> Add to calendar
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
                  {next ? 'Due ' + next : 'No unpaid occurrence in this window'} ·{' '}
                  {label(o.frequency)}
                </p>
                <small>
                  {label(o.kind)} ·{' '}
                  {o.accountId
                    ? data.accounts.find((a) => a.id === o.accountId)?.name
                    : 'No account chosen'}
                </small>
              </div>
              <b>{money(o.amountCents)}</b>
              {next && (
                <button
                  className="secondary small-button"
                  onClick={() => setSettling({ o, date: next })}
                >
                  {o.kind === 'income' ? 'Received' : 'Paid'}
                </button>
              )}
              <RowTools {...props} kind="obligation" item={o} />
              {o.paidDates.length > 0 && (
                <details className="paid-history">
                  <summary>Payment history ({o.paidDates.length})</summary>
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
                        Reopen
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
            title="What happens before the next payday?"
            text="Add income, housing, utilities, food, and debt withdrawals. Estimates for variable bills are okay; update them when you know."
          />
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Compare ways to pay down debt</h2>
          <span className="pill">PLANNING ESTIMATE</span>
        </div>
        <p>
          After essentials and agreed payments are covered, compare the effect of an extra monthly
          amount.
        </p>
        <label className="field extra-payment">
          <span>Extra per month ($)</span>
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
                  {strategy === 'avalanche' ? 'Highest interest first' : 'Smallest balance first'}
                </h3>
                {!valid ? (
                  <p>Enter a positive dollar amount or zero.</p>
                ) : p.available ? (
                  <>
                    <strong>{p.months} months</strong>
                    <p>{money(p.interestCents)} estimated interest</p>
                    <small>{money(p.budgetCents)} total monthly debt payment</small>
                  </>
                ) : (
                  <p>{p.reason}</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="help">
          Assumes fixed rates, monthly interest, constant total payments, no new borrowing or fees.
          This comparison does not establish affordability.
        </p>
      </section>
      {settling && (
        <Dialog
          title={settling.o.kind === 'income' ? 'Record this payday' : 'Record this payment'}
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
              notify('Calendar and account updated together.');
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
          setError(e instanceof Error ? e.message : 'Check this payment.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        {item.o.name} · {money(item.o.amountCents)} · {item.date}
      </p>
      <label className="field">
        <span>Account used</span>
        <select
          required
          value={accountId}
          onChange={(e) => {
            setAccount(e.target.value);
            setExisting('');
          }}
        >
          <option value="">Choose account</option>
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Already recorded in our transactions?</span>
        <select value={existing} onChange={(e) => setExisting(e.target.value)}>
          <option value="">No, create the transaction now</option>
          {matches.map((t) => (
            <option key={t.id} value={t.id}>
              {t.date} · {t.description}
            </option>
          ))}
        </select>
        <small>Choose an existing entry if you already imported or entered this payment.</small>
      </label>
      {!existing && item.o.kind !== 'income' && (
        <>
          <label className="field">
            <span>Payment type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Everyday bill payment</option>
              <option value="debt_payment">Loan / mortgage / advance repayment</option>
              <option value="transfer">Transfer to a tracked credit card</option>
            </select>
          </label>
          {type === 'transfer' && (
            <label className="field">
              <span>Credit card receiving the payment</span>
              <select required value={toAccountId} onChange={(e) => setTo(e.target.value)}>
                <option value="">Choose destination</option>
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
      {error && <div className="error">{error}</div>}
      <button disabled={busy}>
        {busy
          ? 'Saving…'
          : existing
            ? 'Link payment and update calendar'
            : 'Record and update calendar'}
      </button>
    </form>
  );
}
