'use client';
import { useI18n, LanguageSwitcher } from './i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  ArrowUpRight,
  ArrowRight,
  Camera,
  Home,
  MessageCircle,
  Plus,
  Wallet,
  Target,
  Settings,
  Check,
  FileText,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { Draft } from '@/lib/domain';
import RecordForm, { defaults } from './record-form';
import Dialog from './dialog';
import { api, optimizePhoto, type Snapshot, type EditableKind, type Entity } from './client-utils';
import { Empty } from './shared';
import { MoneyView, PlanView } from './money-views';
import { DocumentsView, CoachView, SettingsView } from './other-views';
type Section = 'today' | 'money' | 'plan' | 'documents' | 'coach' | 'settings';
type Editing = {
  requestId?: string;
  kind: EditableKind;
  data: Record<string, unknown>;
  id?: string;
  revision?: number;
  draft?: Draft;
};
const titles: Record<Section, string> = {
  today: 'Today',
  money: 'Our money',
  plan: 'Our plan',
  documents: 'Documents',
  coach: 'Money coach',
  settings: 'Household',
};
const icons = {
  today: Home,
  money: Wallet,
  plan: Target,
  documents: FileText,
  coach: MessageCircle,
  settings: Settings,
};
export default function Dashboard() {
  const { tr, money, dateLabel, locale } = useI18n();
  const [s, setS] = useState<Snapshot | null>(null),
    [section, setSection] = useState<Section>('today'),
    [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [editing, setEditing] = useState<Editing | null>(null),
    [showAdd, setShowAdd] = useState(false),
    [uploading, setUploading] = useState(false),
    [processing, setProcessing] = useState<string | null>(null),
    [uploadAccount, setUploadAccount] = useState(''),
    [updateTarget, setUpdateTarget] = useState(''),
    [allowDuplicate, setAllowDuplicate] = useState(false),
    [pendingDelete, setPendingDelete] = useState<Entity | null>(null);
  const photoInput = useRef<HTMLInputElement>(null),
    fileInput = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async () => {
    const state = await api<Snapshot>('/api/household');
    setS(state);
    return state;
  }, []);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    const timer = setInterval(() => refresh().catch(() => {}), 20000);
    const onFocus = () => refresh().catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => void | Promise<unknown>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'household_summary',
            description: 'Read the current household cash-flow estimate and missing information.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: async () => {
              const state = await refresh();
              return { today: state.today, forecast: state.forecast };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional registration ends when its lifecycle is aborted. */
      });
      void Promise.resolve(
        context.registerTool(
          {
            name: 'start_expense_entry',
            description:
              'Open an expense form for the household to fill in and save. Does not create a financial record.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: false },
            execute: async () => {
              const state = await refresh();
              setEditing({
                requestId: crypto.randomUUID(),
                kind: 'transaction',
                data: defaults('transaction', state.today, state.data.accounts[0]?.id),
              });
              return { status: 'form_opened' };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional registration ends when its lifecycle is aborted. */
      });
    } catch {
      /* Experimental API is optional. */
    }
    return () => lifecycle.abort();
  }, [refresh]);
  function start(kind: EditableKind, preset?: Record<string, unknown>) {
    if (!s) return;
    setAllowDuplicate(false);
    setShowAdd(false);
    setEditing({
      requestId: crypto.randomUUID(),
      kind,
      data: { ...defaults(kind, s.today, s.data.accounts[0]?.id), ...preset },
    });
  }
  async function action(fn: () => Promise<unknown>, success?: string) {
    setError('');
    try {
      await fn();
      await refresh();
      if (success) setToast(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('Please try again.'));
    }
  }
  async function processDoc(id: string) {
    setProcessing(id);
    await action(() => api(`/api/documents/${id}`, {}), tr('Document is ready for review.'));
    setProcessing(null);
  }
  async function upload(file: File) {
    setUploading(true);
    setError('');
    try {
      const optimized = await optimizePhoto(file);
      const form = new FormData();
      form.append('file', optimized);
      form.append('accountId', uploadAccount);
      const r = await fetch('/api/documents', { method: 'POST', body: form });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setSection('documents');
      await refresh();
      setToast(
        result.duplicate
          ? tr('This document is already here.')
          : tr('Document saved. Reading it now…'),
      );
      if (!result.duplicate) await processDoc(result.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('Could not upload.'));
    } finally {
      setUploading(false);
    }
  }
  if (!s)
    return (
      <div className="loading">
        <a className="brand">
          s<span>steadier</span>
          <i>●</i>
        </a>
        <p>{error || tr('Gathering our household…')}</p>
        {error && (
          <button onClick={() => refresh().catch((e) => setError(e.message))}>
            {tr('Try again')}
          </button>
        )}
      </div>
    );
  const { data, forecast: f, connections } = s;
  const pending = data.drafts.filter((d) => d.status === 'pending');
  const urgentHousing =
    data.debts.some(
      (d) =>
        d.kind === 'mortgage' && (d.pastDueCents > 0 || ['late', 'forbearance'].includes(d.status)),
    ) || data.tasks.some((t) => t.urgent && !t.done);
  const setupCount = [
    data.settings.accountsComplete,
    data.settings.incomeComplete,
    data.settings.billsComplete,
  ].filter(Boolean).length;
  const edit = (kind: EditableKind, item: Entity) => {
    setAllowDuplicate(false);
    setEditing({
      kind,
      data: item as unknown as Record<string, unknown>,
      id: item.id,
      revision: item.revision,
    });
  };
  const viewProps = { s, start, edit, remove: setPendingDelete, refresh, notify: setToast };
  const review = (d: Draft) => {
    setUpdateTarget('');
    setAllowDuplicate(false);
    setEditing({ kind: d.kind as EditableKind, data: d.data, draft: d });
  };
  const heading = {
    today: data.accounts.length
      ? tr('Let’s take the next step.')
      : tr('A clearer picture starts here.'),
    money: tr('Every dollar has a place.'),
    plan: tr('A plan we can actually follow.'),
    documents: tr('Bring it all together.'),
    coach: tr('Talk it through.'),
    settings: tr('Our household, our way.'),
  }[section];
  const subheading = {
    today: tr('Bring your money into one place. We’ll work through it together.'),
    money: tr('Accounts, spending, and debt. Nothing to remember in your head.'),
    plan: tr('See what is coming. Protect the essentials. Make room for progress.'),
    documents: tr('A photo or a statement is enough to get started.'),
    coach: tr('Ask a question, describe a purchase, or work through one difficult bill.'),
    settings: tr('Keep your shared information and preferences up to date.'),
  }[section];
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          s<span>steadier</span>
          <i>●</i>
        </a>
        <div className="household">
          {(data.settings.name === 'Our household'
            ? tr('Our household')
            : data.settings.name
          ).toUpperCase()}
          <br />
          <strong>{tr('A little clearer, together.')}</strong>
        </div>
        <nav>
          {(Object.keys(titles) as Section[]).map((key) => {
            const Icon = icons[key];
            return (
              <button
                key={key}
                className={section === key ? 'active' : ''}
                onClick={() => {
                  setSection(key);
                  setError('');
                }}
              >
                <Icon size={19} />
                {tr(titles[key])}
                {key === 'documents' && pending.length > 0 && (
                  <b className="nav-count">{pending.length}</b>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          {tr('ONE STEP AT A TIME')}
          <p>{tr('You don’t have to figure it all out today.')}</p>
          <div className="member">
            <span>{s.member.name.charAt(0)}</span>
            <div>
              {s.member.local ? tr('Local workspace') : s.member.name}
              <small>
                {s.member.local ? tr('Google connection pending') : tr('Household member')}
              </small>
            </div>
          </div>
          {!s.member.local && (
            <button className="text-button" onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut size={14} />
              {tr(' Sign out')}
            </button>
          )}
        </div>
      </aside>
      <main>
        <header>
          <span>
            {data.settings.name === 'Our household' ? tr('Our household') : data.settings.name} /{' '}
            {tr(titles[section])}
          </span>
          <div className="header-right">
            <LanguageSwitcher />
            <span className="pill">
              {s.member.local ? tr('Local workspace') : tr('Shared household')}
            </span>
            <button
              className="icon-button"
              aria-label={tr('Refresh household')}
              onClick={() => action(refresh, tr('Up to date.'))}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>
        {error && (
          <div className="error page-error" role="alert">
            <AlertCircle size={18} />
            <span>{tr(error)}</span>
            <button className="text-button" onClick={() => setError('')}>
              {tr('Dismiss')}
            </button>
          </div>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check size={17} />
            {tr(toast)}
          </div>
        )}
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*,.pdf,.csv,.txt,.md"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {section === 'today'
                ? tr('LET’S MAKE ROOM TO BREATHE')
                : section === 'coach'
                  ? tr('A LITTLE HELP, WITHOUT THE JUDGMENT')
                  : tr('ONE HOUSEHOLD. ONE CLEARER PICTURE.')}
            </div>
            <h1>{tr(heading)}</h1>
            <p>{tr(subheading)}</p>
          </div>
          <button onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            {tr(' Add something')}
          </button>
        </div>
        {section === 'today' && (
          <>
            <section className="hero-grid">
              <div className="focus-card">
                <div className="eyebrow">{tr('YOUR NEXT SMALL STEP')}</div>
                <h2>
                  {urgentHousing ? (
                    <>
                      {tr('Give your home')}
                      <br />
                      {tr('the first bit of attention.')}
                    </>
                  ) : !data.accounts.length ? (
                    <>
                      {tr('Start with the account')}
                      <br />
                      {tr('that pays your bills.')}
                    </>
                  ) : setupCount < 3 ? (
                    <>
                      {tr('Let’s fill in')}
                      <br />
                      {tr('the next piece.')}
                    </>
                  ) : (
                    <>
                      {tr('Your money plan,')}
                      <br />
                      {tr('one day at a time.')}
                    </>
                  )}
                </h2>
                <p>
                  {urgentHousing
                    ? tr(
                        'Keep your latest notice, servicer contact, and agreement deadline together.',
                      )
                    : !data.accounts.length
                      ? tr(
                          'Add its opening balance, then your next payday. That gives us a starting point.',
                        )
                      : (f.missing[0] ? tr(f.missing[0]) : '') ||
                        tr('Your next 30 days are mapped out from the records you’ve confirmed.')}
                </p>
                <button
                  onClick={() =>
                    urgentHousing
                      ? setSection('plan')
                      : !data.accounts.length
                        ? start('account')
                        : setSection(setupCount < 3 ? 'settings' : 'plan')
                  }
                >
                  {urgentHousing
                    ? tr('Open our housing steps')
                    : !data.accounts.length
                      ? tr('Add our first account')
                      : setupCount < 3
                        ? tr('Continue our setup')
                        : tr('Look at our plan')}
                  <ArrowUpRight size={18} />
                </button>
                <div className="steps">
                  <b>01</b>
                  <span>{tr('Find our footing')}</span>
                  <i />
                  <span>{tr('Make a plan')}</span>
                  <i />
                  <span>{tr('Build breathing room')}</span>
                </div>
              </div>
              <div className="capture-card">
                <span className="icon-circle">
                  <Camera />
                </span>
                <h2>
                  {tr('Spent something?')}
                  <br />
                  {tr('Just capture it.')}
                </h2>
                <p>{tr('A photo, a statement, or a quick message. Start wherever is easiest.')}</p>
                <button
                  className="secondary"
                  disabled={uploading}
                  onClick={() => photoInput.current?.click()}
                >
                  <Camera size={18} />
                  {uploading ? tr('Saving photo…') : tr('Take a photo')}
                </button>
                <button
                  className="text-button"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  {tr('Upload a statement ')}
                  <ArrowUpRight size={16} />
                </button>
                <button className="text-button" onClick={() => start('transaction')}>
                  {tr('Or type it in ')}
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>
            <section className="metrics">
              <article>
                <span>{tr('Cash we can use')}</span>
                <strong>{data.accounts.length ? money(f.cashCents) : tr('Let’s find out')}</strong>
                <small>
                  {data.accounts.length
                    ? tr('From confirmed cash accounts')
                    : tr('Add checking and savings balances')}
                </small>
              </article>
              <article>
                <span>{tr('Available to plan · next 30 days')}</span>
                <strong>
                  {f.spendableCents === null
                    ? tr('Still gathering the picture')
                    : money(f.spendableCents)}
                </strong>
                <small>
                  {f.shortfallCents
                    ? tr('{amount} projected shortfall', { amount: money(f.shortfallCents) })
                    : f.spendableCents === null
                      ? tr('Confirm the missing pieces first')
                      : tr('After listed payments and our buffer')}
                </small>
              </article>
              <article>
                <span>{tr('Our total debt')}</span>
                <strong>{data.debts.length ? money(f.totalDebtCents) : tr('One at a time')}</strong>
                <small>
                  {data.debts.length
                    ? tr('Latest recorded debt balances')
                    : tr('Start with the most urgent account')}
                </small>
              </article>
            </section>
            <div className="two-columns">
              <section className="panel">
                <div className="section-title">
                  <h2>{tr('Coming up next')}</h2>
                  <button className="text-button" onClick={() => setSection('plan')}>
                    {tr('Our calendar ')}
                    <ArrowRight size={16} />
                  </button>
                </div>
                {f.events.length ? (
                  f.events.slice(0, 5).map((e, i) => (
                    <div className="list-row" key={e.id + i}>
                      <span className="date-tile">{dateLabel(e.date)}</span>
                      <div className="grow">
                        <strong>{e.name}</strong>
                        <p>
                          {e.amountCents > 0 ? tr('Money coming in') : tr('Set this money aside')}
                        </p>
                      </div>
                      <b className={e.amountCents > 0 ? 'positive' : ''}>{money(e.amountCents)}</b>
                    </div>
                  ))
                ) : (
                  <Empty
                    title={tr('No surprises, once we add them.')}
                    text={tr('Add your next payday and the bills due before it.')}
                    action={() => start('obligation')}
                    label={tr('Add a bill or payday')}
                  />
                )}
              </section>
              <section className="panel housing-panel">
                <span className="pill warm">{tr('HOUSING FIRST')}</span>
                <h2>{tr('First, protect the essentials.')}</h2>
                <p>
                  {tr(
                    'If a housing payment is overdue, contact your servicer now. Keep their deadlines and next steps here.',
                  )}
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setSection('plan');
                    start('task', {
                      title: tr('Contact mortgage servicer about repayment options'),
                      urgent: true,
                    });
                  }}
                >
                  {tr('Add a housing step ')}
                  <ArrowRight size={16} />
                </button>
                <a
                  className="inline-link"
                  href="https://www.consumerfinance.gov/find-a-housing-counselor/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {tr('Find a U.S. housing counselor ')}
                  <ArrowUpRight size={16} />
                </a>
              </section>
            </div>
            {pending.length > 0 && (
              <section className="panel">
                <div className="section-title">
                  <h2>
                    {pending.length}
                    {tr(' new items to check')}
                  </h2>
                  <button onClick={() => setSection('documents')}>
                    {tr('Review imports ')}
                    <ChevronRight size={17} />
                  </button>
                </div>
                <p>{tr('Help the coach turn receipts and statements into reliable records.')}</p>
              </section>
            )}
          </>
        )}
        {section === 'money' && <MoneyView {...viewProps} />}
        {section === 'plan' && (
          <PlanView
            {...viewProps}
            upload={() => fileInput.current?.click()}
            coach={() => setSection('coach')}
          />
        )}
        {section === 'documents' && (
          <DocumentsView
            {...viewProps}
            review={review}
            uploading={uploading}
            processing={processing}
            uploadAccount={uploadAccount}
            setUploadAccount={setUploadAccount}
            photo={() => photoInput.current?.click()}
            file={() => fileInput.current?.click()}
            processDoc={processDoc}
          />
        )}
        {section === 'coach' && (
          <CoachView {...viewProps} showReview={() => setSection('documents')} />
        )}
        {section === 'settings' && <SettingsView {...viewProps} />}
        <footer>
          {tr('Progress, not perfection. Every dollar you add makes the picture clearer.')}
        </footer>
      </main>
      {showAdd && (
        <Dialog title={tr('What would you like to add?')} onClose={() => setShowAdd(false)}>
          <div className="add-grid">
            {(
              [
                [
                  'transaction',
                  tr('Money spent or received'),
                  tr('A quick entry for everyday money.'),
                ],
                ['account', tr('An account'), tr('Checking, savings, cash, or a credit card.')],
                ['obligation', tr('A bill or payday'), tr('What’s coming in or going out.')],
                ['debt', tr('A debt'), tr('Mortgage, card, loan, or cash advance.')],
                ['task', tr('A next step'), tr('A call, a deadline, or something to follow up.')],
                ['memory', tr('Something to remember'), tr('A preference or household goal.')],
              ] as const
            ).map(([k, t, p]) => (
              <button className="add-option" key={k} onClick={() => start(k)}>
                <strong>{tr(t)}</strong>
                <span>{tr(p)}</span>
                <ChevronRight size={19} />
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {editing && (
        <Dialog
          title={
            editing.draft
              ? tr('Check this before saving')
              : editing.id
                ? tr('Update this entry')
                : tr('Add ') + tr(editing.kind)
          }
          onClose={() => setEditing(null)}
        >
          {editing.draft && (
            <div className="notice">
              {tr(editing.draft.reason)}
              {editing.draft.documentId && (
                <a
                  className="inline-link"
                  href={`/api/documents/${editing.draft.documentId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tr('Open original document ↗')}
                </a>
              )}
            </div>
          )}
          <RecordForm
            key={editing.draft?.id || editing.id || editing.kind}
            kind={editing.kind}
            initial={editing.data}
            accounts={data.accounts}
            submitLabel={editing.draft ? tr('Confirm and save') : tr('Save entry')}
            extra={
              editing.draft && (
                <>
                  {['debt', 'account', 'memory'].includes(editing.kind) && (
                    <label className="field">
                      <span>{tr('Does this update something already here?')}</span>
                      <select
                        value={updateTarget}
                        onChange={(e) => setUpdateTarget(e.target.value)}
                      >
                        <option value="">{tr('Create a new record')}</option>
                        {(editing.kind === 'debt'
                          ? data.debts
                          : editing.kind === 'account'
                            ? data.accounts
                            : data.memories
                        ).map((item) => (
                          <option key={item.id} value={item.id}>
                            {'name' in item ? item.name : item.title}
                          </option>
                        ))}
                      </select>
                      <small>
                        {tr(
                          'Choose the existing debt for a newer statement so the balance is updated instead of counted twice.',
                        )}
                      </small>
                    </label>
                  )}
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={allowDuplicate}
                      onChange={(e) => setAllowDuplicate(e.target.checked)}
                    />
                    <span>
                      {tr(
                        'This is a separate entry even if the date and amount match an existing entry.',
                      )}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() =>
                      action(async () => {
                        await api('/api/review', {
                          id: editing.draft!.id,
                          revision: editing.draft!.revision,
                          action: 'dismiss',
                          data: editing.data,
                        });
                        setEditing(null);
                      }, tr('Draft dismissed.'))
                    }
                  >
                    {tr('Dismiss this draft / already recorded')}
                  </button>
                </>
              )
            }
            onSave={async (values) => {
              if (editing.draft)
                await api('/api/review', {
                  id: editing.draft.id,
                  revision: editing.draft.revision,
                  action: 'accept',
                  data: values,
                  allowDuplicate,
                  target: updateTarget
                    ? {
                        id: updateTarget,
                        revision: [...data.debts, ...data.accounts, ...data.memories].find(
                          (item) => item.id === updateTarget,
                        )?.revision,
                      }
                    : undefined,
                });
              else
                await api('/api/records', {
                  kind: editing.kind,
                  id: editing.id,
                  revision: editing.revision,
                  data: values,
                  requestId: editing.requestId,
                });
              await refresh();
              setEditing(null);
              setToast(tr('Saved to our household.'));
            }}
          />
        </Dialog>
      )}
      {pendingDelete && (
        <Dialog title={tr('Remove this entry?')} onClose={() => setPendingDelete(null)}>
          <p className="dialog-copy">
            {tr('Remove “')}
            {pendingDelete.name || pendingDelete.title || pendingDelete.description}
            {tr('” from the active records? The change remains in the audit history.')}
          </p>
          <div className="dialog-actions">
            <button className="secondary" onClick={() => setPendingDelete(null)}>
              {tr('Keep it')}
            </button>
            <button
              className="danger-button"
              onClick={() =>
                action(async () => {
                  await api(
                    '/api/records',
                    { id: pendingDelete.id, revision: pendingDelete.revision },
                    'DELETE',
                  );
                  setPendingDelete(null);
                }, tr('Entry removed.'))
              }
            >
              {tr('Remove entry')}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
