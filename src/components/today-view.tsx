'use client';
import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Camera,
  MessageCircle,
  ShieldCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Wallet,
  Compass,
  CircleHelp,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { dollarsToCents } from '@/lib/domain';
import { moneyGuide, purchaseCheck } from '@/lib/money-guide';
import type { ViewProps } from './client-utils';
import type { Section } from './navigation';
import { useI18n } from './i18n';
import Dialog from './dialog';

export type MoneyTab = 'accounts' | 'ledger' | 'debts' | 'targets' | 'unsorted';
export default function TodayView(
  props: ViewProps & {
    navigate: (section: Section, tab?: MoneyTab) => void;
    quick: (type: 'expense' | 'income') => void;
    capture: () => void;
    uploading: boolean;
    ask: (text?: string) => void;
  },
) {
  const { s, navigate, start, quick, capture, ask } = props;
  const { tr, money, dateLabel, locale } = useI18n();
  const { data, forecast: f, today } = s;
  const g = moneyGuide(data, today);
  const [amount, setAmount] = useState(''),
    [roadmap, setRoadmap] = useState<number | null>(null);
  const steps = [
    {
      title: 'Get a clear picture',
      text: 'Start with one cash account. Add paydays, bills, debt payments, and everyday essentials. Confirm each list when it is complete.',
      button: 'Continue setup',
      action: () => navigate('settings'),
    },
    {
      title: 'Protect the essentials',
      text: 'Keep housing, food, utilities, and getting to work visible. If a payment is late, collect its deadline and ask the provider about options.',
      button: 'See bills and next steps',
      action: () => navigate('plan'),
    },
    {
      title: 'Create breathing room',
      text: 'Choose a small cash buffer that fits your situation. A savings goal tracks your progress; it does not move money or reserve cash by itself.',
      button: 'Set a savings goal',
      action: () => start('goal', { name: tr('Emergency cushion') }),
    },
    {
      title: 'Pay down debt with a plan',
      text: 'Once urgent terms are clear, compare interest-first and smallest-balance-first plans. An extra payment should still leave enough for essentials and your buffer.',
      button: 'Compare debt plans',
      action: () => navigate('plan'),
    },
    {
      title: 'Build your next chapter',
      text: 'Keep your emergency plan current, then set longer-term goals. Ask the coach to help you understand retirement benefits and investment basics before choosing a product.',
      button: 'Plan my next chapter',
      action: () =>
        ask(
          tr(
            'Help me plan longer-term savings goals. First check what information you need about my situation.',
          ),
        ),
    },
  ];
  const next: Record<string, { title: string; body: string; button: string; action: () => void }> =
    {
      housing: {
        title: 'Give your housing deadline attention first.',
        body: 'An overdue housing payment or mortgage needs a clear next step. Gather the notice, amount, and contact details.',
        button: 'Open housing steps',
        action: () => navigate('plan'),
      },
      shortfall: {
        title: 'A tight spot is coming. Let’s plan for it.',
        body: 'Listed bills and income show a possible cash shortfall. Review the dates and essentials before adding spending.',
        button: 'Review the cash forecast',
        action: () => navigate('plan'),
      },
      account: {
        title: 'Start with the account that pays your bills.',
        body: 'One starting balance gives us a place to begin. You can bring in the rest a little at a time.',
        button: 'Add my first account',
        action: () => start('account'),
      },
      income: {
        title: 'When does money come in next?',
        body: 'Add take-home pay and its date. If income changes, use your best current estimate and update it.',
        button: 'Add a payday',
        action: () => start('obligation', { kind: 'income' }),
      },
      bills: {
        title: 'Let’s put the essentials on the calendar.',
        body: 'Include housing, utilities, food, transport, debt minimums, and automatic withdrawals.',
        button: 'Add a bill',
        action: () => start('obligation'),
      },
      review: {
        title: 'Turn your documents into reliable records.',
        body: 'Check suggested amounts and accounts before they become part of your ledger.',
        button: 'Review documents',
        action: () => navigate('documents'),
      },
      balances: {
        title: 'A balance needs a closer look.',
        body: 'A statement and your ledger disagree. Review the difference before relying on the forecast.',
        button: 'Check balances',
        action: () => navigate('money', 'targets'),
      },
      confirm: {
        title: 'Is your starting picture complete?',
        body: 'Confirm your account list after adding all the balances you want the plan to include.',
        button: 'Confirm my setup',
        action: () => navigate('settings'),
      },
      checkin: {
        title: 'Your next step: a quick money check-in.',
        body: 'Review recent spending, upcoming bills, and anything waiting for your approval.',
        button: 'Review my ledger',
        action: () => navigate('money', 'ledger'),
      },
    };
  const primary = next[g.nextStep];
  if (g.nextStep === 'income' && g.nextPayday) {
    primary.title = 'Is every payday on your list?';
    primary.body =
      'Review the income dates and amounts you have added. Confirm the list in Household only when it includes everything.';
    primary.button = 'Review and confirm';
    primary.action = () => navigate('settings');
  }
  if (g.nextStep === 'bills' && data.obligations.some((o) => o.kind !== 'income')) {
    primary.title = 'Have you included every essential payment?';
    primary.body =
      'Check bills, food, transport, debt minimums, and automatic withdrawals. Confirm the list in Household when it is complete.';
    primary.button = 'Review and confirm';
    primary.action = () => navigate('settings');
  }
  let result: ReturnType<typeof purchaseCheck> | null = null;
  let invalid = false;
  if (amount.trim()) {
    try {
      result = purchaseCheck(data, today, dollarsToCents(amount));
    } catch {
      invalid = true;
    }
  }
  const progress = Object.values(g.setup).filter(Boolean).length;
  const checkItems = [
    {
      title: 'Review new documents',
      count: g.pending + g.unread,
      text: 'Imports and files waiting for attention.',
      action: () => navigate('documents'),
    },
    {
      title: 'Give spending a category',
      count: g.unsorted,
      text: 'Unsorted purchases and refunds.',
      action: () => navigate('money', 'unsorted'),
    },
    {
      title: 'Check upcoming payments',
      count: g.beforePayday.length,
      text: 'Listed outflows through the next payday, or seven days.',
      action: () => navigate('plan'),
    },
    {
      title: 'Compare balances',
      count: g.mismatches,
      text: 'Differences found in saved statement checks.',
      action: () => navigate('money', 'targets'),
    },
  ];
  return (
    <div className="today-workspace">
      <div className="today-title">
        <div>
          <div className="overline">{dateLabel(today)}</div>
          <h1>{tr('Your money. One step at a time.')}</h1>
          <p>{tr('What matters today, and what to do next.')}</p>
        </div>
        <button className="secondary roadmap-launch" onClick={() => setRoadmap(0)}>
          <Compass size={18} />
          {tr('My roadmap')}
        </button>
      </div>
      <div className="daily-actions" aria-label={tr('Quick actions')}>
        <button onClick={() => quick('expense')}>
          <span className="action-symbol spend">
            <ArrowUpRight />
          </span>
          <span>{tr('I spent money')}</span>
        </button>
        <button onClick={() => quick('income')}>
          <span className="action-symbol earn">
            <ArrowDownLeft />
          </span>
          <span>{tr('I got paid')}</span>
        </button>
        <button onClick={capture} disabled={props.uploading}>
          <span className="action-symbol scan">
            <Camera />
          </span>
          <span>{tr(props.uploading ? 'Uploading…' : 'Scan or upload')}</span>
        </button>
        <button onClick={() => ask()}>
          <span className="action-symbol talk">
            <MessageCircle />
          </span>
          <span>{tr('Ask my coach')}</span>
        </button>
      </div>
      <div className="today-overview">
        <section
          className={
            'next-move ' + (['housing', 'shortfall'].includes(g.nextStep) ? 'attention' : '')
          }
        >
          <div className="overline">
            <span className="step-token">01</span>
            {tr('YOUR NEXT MOVE')}
          </div>
          <h2>{tr(primary.title)}</h2>
          <p>{tr(primary.body)}</p>
          <button onClick={primary.action}>
            {tr(primary.button)}
            <ArrowRight size={18} />
          </button>
          <div className="setup-meter">
            <span>
              {tr('Starting picture')} <b>{progress}/3</b>
            </span>
            <progress value={progress} max={3} aria-label={tr('Starting picture')} />
            <button className="text-button" onClick={() => navigate('settings')}>
              {tr('See what is missing')}
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
        <section className="money-at-glance" aria-label={tr('Money at a glance')}>
          <article>
            <span>
              <Wallet size={16} />
              {tr('Cash recorded today')}
            </span>
            <strong>{g.cashAccountCount ? money(f.cashCents) : '—'}</strong>
            <small>
              {tr(
                g.cashAccountCount
                  ? 'Checking, savings, and cash. Credit is separate.'
                  : 'Add a cash account to begin.',
              )}
            </small>
          </article>
          <article>
            <span>
              <CalendarDays size={16} />
              {tr(g.nextPayday ? 'Outflows through payday' : 'Outflows in the next 7 days')}
            </span>
            <strong>
              {data.obligations.length || data.transactions.length
                ? money(g.billsBeforePaydayCents)
                : '—'}
            </strong>
            <small>
              {g.nextPayday
                ? tr('Next listed payday: {date}', { date: dateLabel(g.nextPayday.date) })
                : tr('No payday listed in the next 30 days.')}
            </small>
          </article>
          <article className="breathing-room">
            <span>
              <ShieldCheck size={16} />
              {tr('Room after bills and buffer')}
            </span>
            <strong>
              {f.spendableCents === null ? tr('Let’s finish the picture') : money(f.spendableCents)}
            </strong>
            <small>
              {tr(
                f.spendableCents === null
                  ? 'Missing facts stay unknown. No guessed spending limit.'
                  : 'Lowest estimated room over 30 days; not a guarantee.',
              )}
            </small>
          </article>
        </section>
      </div>
      <div className="today-tools">
        <section className="surface purchase-check">
          <div className="surface-title">
            <div>
              <span className="overline">{tr('BEFORE YOU BUY')}</span>
              <h2>{tr('Does this fit my plan?')}</h2>
            </div>
            <SlidersHorizontal size={20} />
          </div>
          <p>{tr('Try an extra purchase today that is not already in your ledger or calendar.')}</p>
          <label className="purchase-input">
            <span>{tr('Purchase amount')} (USD)</span>
            <div>
              <b>$</b>
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label={tr('Purchase amount')}
              />
            </div>
          </label>
          <div className={'purchase-result ' + (result?.status || '')} role="status">
            {invalid ? (
              <p>{tr('Enter a positive dollar amount.')}</p>
            ) : result ? (
              <>
                <strong>
                  {tr(
                    result.status === 'unknown'
                      ? 'A few facts are still missing.'
                      : result.status === 'fits'
                        ? 'It fits the current estimate.'
                        : 'This would use money your plan needs.',
                  )}
                </strong>
                <p>
                  {result.status === 'unknown'
                    ? tr('Complete the missing information before using a spending estimate.')
                    : tr('Room after this purchase and your buffer: {amount}', {
                        amount: money(result.remainingCents!),
                      })}
                </p>
                {result.status === 'unknown' && (
                  <details>
                    <summary>{tr('What to check')}</summary>
                    <ul>
                      {result.missing.map((m) => (
                        <li key={m}>{tr(m)}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <small>
                  {tr('One-time cash estimate for 30 days. Nothing is saved or spent.')}
                </small>
              </>
            ) : (
              <>
                <CircleHelp size={19} />
                <p>{tr('Enter an amount to see how it affects your breathing room.')}</p>
              </>
            )}
          </div>
        </section>
        <section className="surface">
          <div className="surface-title">
            <div>
              <span className="overline">{tr('A SMALL WEEKLY HABIT')}</span>
              <h2>{tr('Your money check-in')}</h2>
            </div>
            <Check size={20} />
          </div>
          <p>{tr('A few minutes to catch missing entries and avoid surprises.')}</p>
          <div className="checkin-list">
            {checkItems.map((item) => (
              <button key={item.title} onClick={item.action}>
                <span>
                  <strong>{tr(item.title)}</strong>
                  <small>{tr(item.text)}</small>
                </span>
                <b>{item.count}</b>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          {g.staleDebts > 0 && (
            <button className="text-button" onClick={() => navigate('money', 'debts')}>
              {tr('Update older debt balances')} ({g.staleDebts})<ArrowRight size={15} />
            </button>
          )}
        </section>
      </div>
      <div className="today-tools">
        <section className="surface">
          <div className="surface-title">
            <h2>{tr('Coming up next')}</h2>
            <button className="text-button" onClick={() => navigate('plan')}>
              {tr('Full plan')}
              <ArrowRight size={16} />
            </button>
          </div>
          {f.events.length ? (
            <div className="upcoming-list">
              {f.events.slice(0, 5).map((e, i) => (
                <button key={e.id + e.date + i} onClick={() => navigate('plan')}>
                  <span className={'event-sign ' + (e.amountCents > 0 ? 'in' : '')}>
                    {e.amountCents > 0 ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                  </span>
                  <span>
                    <strong>{e.name}</strong>
                    <small>{dateLabel(e.date)}</small>
                  </span>
                  <b>
                    {e.amountCents > 0 ? '+' : '−'}
                    {money(Math.abs(e.amountCents))}
                  </b>
                </button>
              ))}
            </div>
          ) : (
            <div className="quiet-empty">
              <CalendarDays size={27} />
              <p>{tr('Add your next payday and the bills due before it.')}</p>
              <button className="secondary" onClick={() => start('obligation')}>
                {tr('Add to calendar')}
              </button>
            </div>
          )}
        </section>
        <section className="surface month-glance">
          <div className="surface-title">
            <h2>{tr('This month, so far')}</h2>
            <button className="text-button" onClick={() => navigate('money', 'ledger')}>
              {tr('Open ledger')}
              <ArrowRight size={16} />
            </button>
          </div>
          <dl>
            <div>
              <dt>{tr('Money earned')}</dt>
              <dd>{money(g.month.earnedCents)}</dd>
            </div>
            <div>
              <dt>{tr('Everyday spending, after refunds')}</dt>
              <dd>{money(g.month.spentCents)}</dd>
            </div>
            <div>
              <dt>{tr('Borrowed money')}</dt>
              <dd>{money(g.month.borrowedCents)}</dd>
            </div>
            <div>
              <dt>{tr('Loan repayments')}</dt>
              <dd>{money(g.month.repaidCents)}</dd>
            </div>
          </dl>
          <p className="fine-print">
            {tr(
              'Confirmed entries only. Transfers and card payments are separate, so purchases are counted once.',
            )}
          </p>
          <button className="secondary" onClick={() => navigate('money', 'targets')}>
            {tr('Set spending targets')}
          </button>
        </section>
      </div>
      <section className="support-strip">
        <ShieldCheck size={23} />
        <div>
          <strong>{tr('Worried about housing or an overdue bill?')}</strong>
          <p>
            {tr(
              'Keep the notice, deadline, and next call together. You can start before everything else is organized.',
            )}
          </p>
        </div>
        <button className="secondary" onClick={() => navigate('plan')}>
          {tr('Get organized')}
          <ArrowRight size={16} />
        </button>
      </section>
      {(!s.connections.ai || !s.connections.documentAi || s.member.local) && (
        <section className="connection-strip">
          <Sparkles size={20} />
          <div>
            <strong>{tr('Finish connecting your workspace')}</strong>
            <p>
              {[
                !s.connections.ai && tr('AI chat'),
                !s.connections.documentAi && tr('Receipt reader'),
                s.member.local && tr('Google sign-in and shared hosting'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button className="text-button" onClick={() => navigate('settings')}>
            {tr('Set up')}
            <ArrowRight size={16} />
          </button>
        </section>
      )}
      {roadmap !== null && (
        <Dialog title={tr('Your roadmap, at your pace')} onClose={() => setRoadmap(null)}>
          <p>
            {tr(
              'These are tools to return to, not a score or a race. You can work on more than one at a time.',
            )}
          </p>
          <div className="roadmap-steps">
            {steps.map((step, i) => (
              <button
                key={step.title}
                className={roadmap === i ? 'active' : ''}
                onClick={() => setRoadmap(i)}
                aria-pressed={roadmap === i}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                {tr(step.title)}
              </button>
            ))}
          </div>
          <div className="roadmap-detail">
            <h3>{tr(steps[roadmap].title)}</h3>
            <p>{tr(steps[roadmap].text)}</p>
            <button
              onClick={() => {
                const action = steps[roadmap].action;
                setRoadmap(null);
                action();
              }}
            >
              {tr(steps[roadmap].button)}
              <ArrowRight size={16} />
            </button>
          </div>
          <a
            className="guide-source"
            href={
              roadmap === 2
                ? 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/'
                : 'https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/'
            }
            target="_blank"
            rel="noreferrer"
          >
            {tr('Learn more: CFPB money guides')} ↗
          </a>
        </Dialog>
      )}
    </div>
  );
}
