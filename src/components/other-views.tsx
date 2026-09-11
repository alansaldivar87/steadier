'use client';
import { useI18n, LanguageSwitcher } from './i18n';
import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Camera,
  FileText,
  ChevronRight,
  CheckCircle2,
  Search,
  BookOpen,
  MessageCircle,
  ArrowUpRight,
  Send,
  Plus,
  Settings,
  Download,
  Maximize2,
  Minus,
} from 'lucide-react';
import { Draft, dollarsToCents } from '@/lib/domain';
import { ViewProps, api, Source } from './client-utils';
import { Empty, RowTools } from './shared';
import AiSettings from './ai-settings';
export function DocumentsView(
  props: ViewProps & {
    review: (d: Draft) => void;
    uploading: boolean;
    processing: string | null;
    uploadAccount: string;
    setUploadAccount: (id: string) => void;
    photo: () => void;
    file: () => void;
    processDoc: (id: string) => Promise<void>;
  },
) {
  const { tr, money, dateLabel, locale } = useI18n();
  const { s, review } = props;
  const { data, connections } = s;
  const pending = data.drafts.filter((d) => d.status === 'pending');
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<Source[]>([]),
    [error, setError] = useState('');
  return (
    <>
      <section className="upload-panel">
        <div>
          <span className="icon-circle">
            <Upload />
          </span>
          <h2>{tr('No spreadsheet homework.')}</h2>
          <p>
            {tr(
              'Take a clear photo or upload a statement. We’ll pull out the details for you to check.',
            )}
          </p>
          <label className="field">
            <span>{tr('Account for this statement (optional)')}</span>
            <select
              value={props.uploadAccount}
              onChange={(e) => props.setUploadAccount(e.target.value)}
            >
              <option value="">{tr('Choose during review')}</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <small>{tr('JPEG, PNG, WebP, PDF, CSV or text · up to 4 MB each')}</small>
        </div>
        <div className="upload-actions">
          <button disabled={props.uploading} onClick={props.photo}>
            <Camera size={18} />
            {tr(' Take a photo')}
          </button>
          <button className="secondary" disabled={props.uploading} onClick={props.file}>
            <Upload size={18} />
            {props.uploading ? tr('Uploading…') : tr('Choose a file')}
          </button>
        </div>
      </section>
      {!connections.documentAi && (
        <div className="notice">
          {tr(
            'AI reading is waiting for a provider connection. CSV import and manual entry already work. Your uploaded documents remain saved.',
          )}
        </div>
      )}
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Ready for a quick check')}</h2>
          <span className="pill">
            {pending.length}
            {tr(' to review')}
          </span>
        </div>
        {pending.length ? (
          pending.map((d) => (
            <div className="list-row draft-row" key={d.id}>
              <span className="list-icon">
                <FileText size={19} />
              </span>
              <div className="grow">
                <strong>
                  {String(d.data.description || d.data.name || d.data.title || tr('New entry'))}
                </strong>
                <p>
                  {tr(d.kind)}
                  {typeof d.data.amountCents === 'number' ? ' · ' + money(d.data.amountCents) : ''}
                </p>
                <small>{tr(d.reason)}</small>
              </div>
              <button className="secondary small-button" onClick={() => review(d)}>
                {tr('Review ')}
                <ChevronRight size={15} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty compact">
            <CheckCircle2 />
            <h3>{tr('All caught up.')}</h3>
            <p>{tr('New receipts and statements will appear here for review.')}</p>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Our document shelf')}</h2>
          <span className="pill">
            {data.documents.length}
            {tr(' files')}
          </span>
        </div>
        {data.documents.map((d) => (
          <div className="list-row document-row" key={d.id}>
            <span className="list-icon">
              <FileText size={20} />
            </span>
            <div className="grow">
              <a
                className="file-link"
                href={`/api/documents/${d.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {d.name} ↗
              </a>
              <p>
                {d.createdAt.slice(0, 10)} · {Math.ceil(d.size / 1024)} KB ·{' '}
                {d.status === 'done'
                  ? tr('Reviewed')
                  : d.status === 'review'
                    ? tr('Ready to review')
                    : d.status === 'processing'
                      ? tr('Reading')
                      : d.status === 'error'
                        ? tr('Needs another try')
                        : tr('Saved')}
              </p>
              {d.error && <small className="danger">{tr(d.error)}</small>}
            </div>
            {['uploaded', 'error', 'processing'].includes(d.status) && (
              <button
                className="secondary small-button"
                disabled={!!props.processing}
                onClick={() => props.processDoc(d.id)}
              >
                {props.processing === d.id ? tr('Reading…') : tr('Read document')}
              </button>
            )}
          </div>
        ))}
        {!data.documents.length && (
          <Empty
            title={tr('Start with the most urgent document.')}
            text={tr('The latest housing notice or bank statement is a good first step.')}
          />
        )}
        <form
          className="search"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              setResults(await api('/api/search', { query }));
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <Search size={18} />
          <input
            aria-label={tr('Search our documents')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Find terms, fees, or a lender in our documents')}
          />
          <button className="small-button">{tr('Search')}</button>
        </form>
        {error && <div className="error">{tr(error)}</div>}
        {results.map((r) => (
          <div className="search-hit" key={r.id}>
            <strong>{r.title}</strong>
            <small>{r.source}</small>
            <p>{r.excerpt}</p>
            {r.path.startsWith('/api/') && (
              <a className="inline-link" href={r.path} target="_blank" rel="noreferrer">
                {tr('Open source ↗')}
              </a>
            )}
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Bring things in, a little at a time')}</h2>
          <BookOpen size={20} />
        </div>
        <div className="intake-grid">
          {[
            [
              '01',
              tr('Start with what’s urgent'),
              tr('Mortgage notice, forbearance agreement, collection or repayment deadlines.'),
            ],
            [
              '02',
              tr('Find the cash'),
              tr('Bank balances, your take-home pay, your wife’s take-home pay, and pay dates.'),
            ],
            [
              '03',
              tr('See the whole picture'),
              tr(
                'Three months of bank/card statements, loan balances, and every cash advance app.',
              ),
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{tr(t)}</h3>
              <p>{tr(d)}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
type Message = {
  id: string;
  role: string;
  text: string;
  sources?: Source[];
  checks?: string[];
  locale?: 'en' | 'es';
};
export function CoachView({
  s,
  refresh,
  start,
  showReview,
  visible,
  compact,
  onClose,
  onExpand,
  showSettings,
}: ViewProps & {
  showReview: () => void;
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onExpand: () => void;
  showSettings: () => void;
}) {
  const { tr, money, dateLabel, locale } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]),
    [chat, setChat] = useState(''),
    [thinking, setThinking] = useState(false),
    [error, setError] = useState('');
  const messageList = useRef<HTMLDivElement>(null);
  const minimizeButton = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    api<Message[]>('/api/chat')
      .then(setMessages)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (visible && messageList.current)
      messageList.current.scrollTop =
        messages.length || thinking ? messageList.current.scrollHeight : 0;
  }, [messages, thinking, visible, compact]);
  useEffect(() => {
    if (visible)
      (compact ? minimizeButton.current : composer.current)?.focus({ preventScroll: true });
  }, [visible, compact]);
  async function send(text: string) {
    if (!text.trim() || thinking) return;
    setThinking(true);
    setChat('');
    setError('');
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', text }]);
    try {
      await api('/api/chat', { message: text });
      setMessages(await api<Message[]>('/api/chat'));
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      setChat(text);
    } finally {
      setThinking(false);
    }
  }
  const { data, connections } = s;
  const pending = data.drafts.filter((d) => d.status === 'pending').length;
  return (
    <div className="coach-layout">
      <section className="chat-panel">
        <div className="chat-top">
          <span className="coach-avatar">s</span>
          <div className="grow">
            <strong>{tr('Your money coach')}</strong>
            <p>
              {connections.ai
                ? tr('Uses our confirmed records and source documents')
                : tr('AI connection pending · manual tracking is ready')}
            </p>
          </div>
          {compact && (
            <div className="chat-window-actions">
              <button
                type="button"
                className="icon-button"
                onClick={onExpand}
                aria-label={tr('Expand chat')}
                title={tr('Expand chat')}
              >
                <Maximize2 size={18} aria-hidden="true" />
              </button>
              <button
                ref={minimizeButton}
                type="button"
                className="icon-button"
                onClick={onClose}
                aria-label={tr('Minimize chat')}
                title={tr('Minimize chat')}
              >
                <Minus size={21} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <div className="chat-messages" ref={messageList}>
          {error && (
            <div className="error" role="alert">
              {tr(error)}
            </div>
          )}
          {!connections.ai && (
            <div className="chat-connect">
              <p>{tr('Connect an AI model to start chatting.')}</p>
              <button type="button" className="secondary small-button" onClick={showSettings}>
                <Settings size={16} aria-hidden="true" />
                {tr('Connect assistant')}
              </button>
            </div>
          )}
          {!messages.length && (
            <div className="coach-welcome">
              <span className="icon-circle">
                <MessageCircle size={26} />
              </span>
              <h2>{tr('Let’s start where you are.')}</h2>
              <p>{tr('No judgment. Tell me what’s on your mind, or choose one small step.')}</p>
              <div className="suggestions">
                {[
                  tr('What needs attention before our next payday?'),
                  tr('Help me get our mortgage situation organized.'),
                  tr('I spent $42.50 on groceries. Help me record it.'),
                  tr('What information are we still missing?'),
                ].map((text) => (
                  <button className="secondary" key={text} onClick={() => send(text)}>
                    {text}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <article className={'message ' + m.role} key={m.id}>
              <small>{m.role === 'user' ? tr('You') : 'Steadier'}</small>
              <div lang={m.locale}>{m.text}</div>
              {!!m.checks?.length && (
                <details>
                  <summary>{tr('Checks completed')}</summary>
                  <ul>
                    {m.checks.map((check) => (
                      <li key={check}>{tr(check)}</li>
                    ))}
                  </ul>
                </details>
              )}
              {m.sources?.length ? (
                <details>
                  <summary>
                    {tr('Sources consulted (')}
                    {m.sources.length})
                  </summary>
                  {m.sources.map((source) => (
                    <p key={source.id}>
                      {source.path.startsWith('http') || source.path.startsWith('/api/') ? (
                        <a href={source.path} target="_blank" rel="noreferrer">
                          {source.title} ↗
                        </a>
                      ) : (
                        source.title
                      )}
                      <small>{source.source}</small>
                    </p>
                  ))}
                </details>
              ) : null}
            </article>
          ))}
          {thinking && (
            <div className="message assistant">
              <small>Steadier</small>
              <p>{tr('Looking through our records…')}</p>
            </div>
          )}
        </div>
        {compact && pending > 0 && (
          <button type="button" className="text-button chat-review" onClick={showReview}>
            {tr('Review suggestions')} ({pending})<ChevronRight size={16} />
          </button>
        )}
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(chat);
          }}
        >
          <textarea
            ref={composer}
            aria-label={tr('Message the money coach')}
            rows={2}
            maxLength={4000}
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder={tr('Ask anything about our money…')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(chat);
              }
            }}
          />
          <button type="submit" disabled={thinking || !chat.trim()} aria-label={tr('Send message')}>
            <Send size={19} />
          </button>
        </form>
        <p className="chat-footnote">
          {tr('Suggestions become review drafts. You decide what gets saved.')}
        </p>
      </section>
      <aside className="coach-side" hidden={compact}>
        <div className="panel">
          <h3>{tr('My conversation')}</h3>
          <p>
            {tr(
              'Your conversations are separate; confirmed household records and suggestions are shared.',
            )}
          </p>
          <p>
            {tr(
              'The assistant uses saved records, document search, and calculated tools. It can prepare entries for you to review.',
            )}
          </p>
        </div>
        <div className="panel">
          <h3>{tr('Our shared context')}</h3>
          <p>
            {data.accounts.length}
            {tr(' accounts · ')}
            {data.debts.length}
            {tr(' debts')}
            <br />
            {data.documents.length}
            {tr(' documents · ')}
            {data.memories.length}
            {tr(' remembered preferences')}
          </p>
          <button className="text-button" onClick={() => start('memory')}>
            {tr('Add something to remember ')}
            <Plus size={15} />
          </button>
        </div>
        {pending > 0 && (
          <div className="panel">
            <h3>
              {pending}
              {tr(' suggestions to check')}
            </h3>
            <p>{tr('The coach has proposed entries for your review.')}</p>
            <button onClick={showReview}>{tr('Review suggestions')}</button>
          </div>
        )}
        <div className="panel">
          <h3>{tr('One useful rule')}</h3>
          <p>
            {tr(
              'If something is unclear, we ask. Missing numbers stay unknown until you confirm them.',
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
export function SettingsView(props: ViewProps) {
  const { tr, money, dateLabel, locale } = useI18n();
  const { s, refresh, notify } = props;
  const [v, setV] = useState({
      ...s.data.settings,
      buffer: String(s.data.settings.bufferCents / 100),
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const { data, connections } = s;
  return (
    <>
      <AiSettings onSaved={refresh} />
      <AiSettings documentMode onSaved={refresh} />
      <section className="panel">
        <LanguageSwitcher />
        <p className="help">
          {tr('Each of you can choose a language. Your household records stay shared.')}
        </p>
        <h2>{tr('Let’s confirm our starting point.')}</h2>
        <p className="help">
          {tr(
            'Check each item only when the list is complete. Until then, the app won’t suggest money available for extra spending.',
          )}
        </p>
        <form
          className="record-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const current = data.settings as typeof data.settings & { revision?: number };
              await api('/api/records', {
                kind: 'settings',
                id: 'settings',
                revision: current.revision,
                data: { ...v, bufferCents: dollarsToCents(v.buffer) },
              });
              await refresh();
              notify(tr('Household updated.'));
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="two-columns">
            <label className="field">
              <span>{tr('Household name')}</span>
              <input
                required
                value={v.name}
                onChange={(e) => setV({ ...v, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>{tr('Cash buffer to protect ($)')}</span>
              <input
                inputMode="decimal"
                required
                value={v.buffer}
                onChange={(e) => setV({ ...v, buffer: e.target.value })}
              />
              <small>{tr('Money you want to keep untouched.')}</small>
            </label>
            <label className="field">
              <span>{tr('Country')}</span>
              <input value={v.country} onChange={(e) => setV({ ...v, country: e.target.value })} />
            </label>
            <label className="field">
              <span>{tr('State / province')}</span>
              <input value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })} />
            </label>
            <label className="field">
              <span>{tr('Time zone')}</span>
              <select value={v.timeZone} onChange={(e) => setV({ ...v, timeZone: e.target.value })}>
                {[
                  'America/Los_Angeles',
                  'America/Denver',
                  'America/Phoenix',
                  'America/Chicago',
                  'America/New_York',
                  'Pacific/Honolulu',
                  'America/Anchorage',
                  'UTC',
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {(
            [
              ['accountsComplete', tr('All our cash accounts and opening balances are here.')],
              [
                'incomeComplete',
                tr('All expected take-home pay and pay dates are on the calendar.'),
              ],
              [
                'billsComplete',
                tr(
                  'All bills, debt payments, cash advance withdrawals, and everyday essentials are on the calendar.',
                ),
              ],
            ] as const
          ).map(([key, text]) => (
            <label className="check-field" key={key}>
              <input
                type="checkbox"
                checked={v[key]}
                onChange={(e) => setV({ ...v, [key]: e.target.checked })}
              />
              <span>{tr(text)}</span>
            </label>
          ))}
          {error && <div className="error">{tr(error)}</div>}
          <button disabled={busy}>{busy ? tr('Saving…') : tr('Save household setup')}</button>
        </form>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('What our coach remembers')}</h2>
          <button className="secondary small-button" onClick={() => props.start('memory')}>
            <Plus size={16} />
            {tr(' Add preference')}
          </button>
        </div>
        {data.memories.map((m) => (
          <div className="list-row" key={m.id}>
            <div className="grow">
              <strong>{m.title}</strong>
              <p>{m.text}</p>
            </div>
            <RowTools {...props} kind="memory" item={m} />
          </div>
        ))}
        {!data.memories.length && (
          <p>
            {tr(
              'Start with your goals, the categories you use, or what matters to your household.',
            )}
          </p>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>{tr('Connections & portability')}</h2>
          <Settings size={19} />
        </div>
        <div className="connection-grid">
          <div>
            <span>{tr('Google accounts')}</span>
            <b>{s.member.local ? tr('Connection pending') : tr('Connected')}</b>
          </div>
          <div>
            <span>{tr('AI coach')}</span>
            <b>{connections.ai ? connections.model : tr('Connection pending')}</b>
          </div>
          <div>
            <span>{tr('File storage')}</span>
            <b>{tr(connections.storage)}</b>
          </div>
          <div>
            <span>{tr('AI calls today')}</span>
            <b>
              {connections.usage.calls} / {connections.dailyCallLimit}
            </b>
          </div>
        </div>
        <p className="help">
          {tr(
            'The daily call cap is a usage brake, not an exact dollar limit. Set a spending cap with your AI provider too.',
          )}
        </p>
        <a className="button-link" href="/api/export">
          <Download size={17} />
          {tr(' Export our records')}
        </a>
        <p className="help">
          {tr(
            'JSON export includes the ledger, debts, preferences, extracted document text, drafts, and history. Original photos and PDFs can be downloaded from the document shelf.',
          )}
        </p>
      </section>
    </>
  );
}
