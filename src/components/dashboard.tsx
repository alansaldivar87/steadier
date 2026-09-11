'use client';
import { useI18n, LanguageSwitcher } from './i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import Navigation, { sectionTitles as titles, type Section } from './navigation';
import TodayView, { type MoneyTab } from './today-view';
import QuickEntry from './quick-entry';
import {
  MessageCircle,
  Plus,
  Settings,
  Check,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { Draft } from '@/lib/domain';
import RecordForm, { defaults } from './record-form';
import Dialog from './dialog';
import { api, optimizePhoto, type Snapshot, type EditableKind, type Entity } from './client-utils';
import { MoneyView, PlanView } from './money-views';
import { DocumentsView, CoachView, SettingsView } from './other-views';

type Editing = {
  requestId?: string;
  kind: EditableKind;
  data: Record<string, unknown>;
  id?: string;
  revision?: number;
  draft?: Draft;
};
export default function Dashboard() {
  const { tr } = useI18n();
  const [s, setS] = useState<Snapshot | null>(null),
    [section, setSection] = useState<Section>('today'),
    [chatOpen, setChatOpen] = useState(false),
    [moneyTab, setMoneyTab] = useState<MoneyTab>('ledger'),
    [quickType, setQuickType] = useState<'expense' | 'income' | null>(null),
    [chatPrompt, setChatPrompt] = useState<{ id: string; text: string } | null>(null),
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
    fileInput = useRef<HTMLInputElement>(null),
    chatLauncher = useRef<HTMLButtonElement>(null);
  function closeChat() {
    setChatOpen(false);
    chatLauncher.current?.focus({ preventScroll: true });
  }
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
  const { data } = s;
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
  function navigate(next: Section, tab?: MoneyTab) {
    setSection(next);
    if (tab) setMoneyTab(tab);
    if (next === 'coach') setChatOpen(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function quick(type: 'expense' | 'income') {
    if (!data.accounts.length) {
      start('account');
      return;
    }
    setQuickType(type);
  }
  function ask(text?: string) {
    if (text) setChatPrompt({ id: crypto.randomUUID(), text });
    setChatOpen(true);
  }
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
      <Navigation section={section} navigate={navigate} s={s} />
      <main>
        <header className="workspace-topbar">
          <a className="mobile-wordmark" href="/" aria-label="Steadier">
            <b>s</b>steadier
          </a>
          <div className="topbar-location">
            <span>
              {data.settings.name === 'Our household' ? tr('Our household') : data.settings.name}
            </span>
            <strong>{tr(titles[section])}</strong>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <button
              className="icon-button refresh-button"
              aria-label={tr('Refresh household')}
              onClick={() => action(refresh, tr('Up to date.'))}
            >
              <RefreshCw size={18} />
            </button>
            <button
              className={
                'icon-button settings-shortcut ' + (section === 'settings' ? 'active' : '')
              }
              aria-label={tr('Household settings')}
              onClick={() => navigate('settings')}
            >
              <Settings size={20} />
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
        {section !== 'today' && (
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {section === 'coach'
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
        )}
        {section === 'today' && (
          <TodayView
            {...viewProps}
            navigate={navigate}
            quick={quick}
            capture={() => fileInput.current?.click()}
            uploading={uploading}
            ask={ask}
          />
        )}
        {section === 'money' && (
          <MoneyView
            {...viewProps}
            tab={moneyTab}
            setTab={setMoneyTab}
            quick={() => quick('expense')}
          />
        )}
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
        <div
          id="household-chat"
          className={section === 'coach' ? 'coach-host' : 'coach-host coach-dock'}
          hidden={section !== 'coach' && !chatOpen}
          role={section === 'coach' ? undefined : 'dialog'}
          aria-label={tr('Your money coach')}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && section !== 'coach') {
              e.preventDefault();
              closeChat();
            }
          }}
        >
          <CoachView
            {...viewProps}
            suggestion={chatPrompt}
            visible={section === 'coach' || chatOpen}
            compact={section !== 'coach'}
            onClose={closeChat}
            onExpand={() => {
              setSection('coach');
              setChatOpen(false);
            }}
            showSettings={() => {
              setSection('settings');
              closeChat();
            }}
            showReview={() => {
              setSection('documents');
              closeChat();
            }}
          />
        </div>
        {section === 'settings' && <SettingsView {...viewProps} />}
        <footer>
          {tr('Progress, not perfection. Every dollar you add makes the picture clearer.')}
        </footer>
      </main>
      {section !== 'coach' && (
        <button
          ref={chatLauncher}
          type="button"
          className="chat-launcher"
          aria-label={tr(chatOpen ? 'Minimize chat' : 'Open money chat')}
          aria-expanded={chatOpen}
          aria-controls="household-chat"
          aria-haspopup="dialog"
          title={tr(chatOpen ? 'Minimize chat' : 'Open money chat')}
          onClick={() => (chatOpen ? closeChat() : setChatOpen(true))}
        >
          {chatOpen ? (
            <X size={25} aria-hidden="true" />
          ) : (
            <MessageCircle size={27} aria-hidden="true" />
          )}
          <span>{tr('Chat')}</span>
        </button>
      )}
      {quickType && (
        <Dialog
          title={tr(quickType === 'expense' ? 'I spent money' : 'I got paid')}
          onClose={() => setQuickType(null)}
        >
          <QuickEntry
            s={s}
            type={quickType}
            calendar={() => {
              setQuickType(null);
              navigate('plan');
            }}
            onSaved={async () => {
              await refresh();
              setQuickType(null);
              setToast(tr('Entry saved. Your balances are updated.'));
            }}
            advanced={(preset) => {
              setQuickType(null);
              start('transaction', preset);
            }}
          />
        </Dialog>
      )}
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
