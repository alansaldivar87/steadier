'use client';
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
} from 'lucide-react';
import { Draft, money, dollarsToCents } from '@/lib/domain';
import { ViewProps, api, Source } from './client-utils';
import { Empty, RowTools } from './shared';
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
          <h2>No spreadsheet homework.</h2>
          <p>
            Take a clear photo or upload a statement. We’ll pull out the details for you to check.
          </p>
          <label className="field">
            <span>Account for this statement (optional)</span>
            <select
              value={props.uploadAccount}
              onChange={(e) => props.setUploadAccount(e.target.value)}
            >
              <option value="">Choose during review</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <small>JPEG, PNG, WebP, PDF, CSV or text · up to 4 MB each</small>
        </div>
        <div className="upload-actions">
          <button disabled={props.uploading} onClick={props.photo}>
            <Camera size={18} /> Take a photo
          </button>
          <button className="secondary" disabled={props.uploading} onClick={props.file}>
            <Upload size={18} />
            {props.uploading ? 'Uploading…' : 'Choose a file'}
          </button>
        </div>
      </section>
      {!connections.ai && (
        <div className="notice">
          AI reading is waiting for a provider connection. CSV import and manual entry already work.
          Your uploaded documents remain saved.
        </div>
      )}
      <section className="panel">
        <div className="section-title">
          <h2>Ready for a quick check</h2>
          <span className="pill">{pending.length} to review</span>
        </div>
        {pending.length ? (
          pending.map((d) => (
            <div className="list-row draft-row" key={d.id}>
              <span className="list-icon">
                <FileText size={19} />
              </span>
              <div className="grow">
                <strong>
                  {String(d.data.description || d.data.name || d.data.title || 'New entry')}
                </strong>
                <p>
                  {d.kind}
                  {typeof d.data.amountCents === 'number' ? ' · ' + money(d.data.amountCents) : ''}
                </p>
                <small>{d.reason}</small>
              </div>
              <button className="secondary small-button" onClick={() => review(d)}>
                Review <ChevronRight size={15} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty compact">
            <CheckCircle2 />
            <h3>All caught up.</h3>
            <p>New receipts and statements will appear here for review.</p>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Our document shelf</h2>
          <span className="pill">{data.documents.length} files</span>
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
                  ? 'Reviewed'
                  : d.status === 'review'
                    ? 'Ready to review'
                    : d.status === 'processing'
                      ? 'Reading'
                      : d.status === 'error'
                        ? 'Needs another try'
                        : 'Saved'}
              </p>
              {d.error && <small className="danger">{d.error}</small>}
            </div>
            {['uploaded', 'error', 'processing'].includes(d.status) && (
              <button
                className="secondary small-button"
                disabled={!!props.processing}
                onClick={() => props.processDoc(d.id)}
              >
                {props.processing === d.id ? 'Reading…' : 'Read document'}
              </button>
            )}
          </div>
        ))}
        {!data.documents.length && (
          <Empty
            title="Start with the most urgent document."
            text="The latest housing notice or bank statement is a good first step."
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
            aria-label="Search our documents"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find terms, fees, or a lender in our documents"
          />
          <button className="small-button">Search</button>
        </form>
        {error && <div className="error">{error}</div>}
        {results.map((r) => (
          <div className="search-hit" key={r.id}>
            <strong>{r.title}</strong>
            <small>{r.source}</small>
            <p>{r.excerpt}</p>
            {r.path.startsWith('/api/') && (
              <a className="inline-link" href={r.path} target="_blank" rel="noreferrer">
                Open source ↗
              </a>
            )}
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Bring things in, a little at a time</h2>
          <BookOpen size={20} />
        </div>
        <div className="intake-grid">
          {[
            [
              '01',
              'Start with what’s urgent',
              'Mortgage notice, forbearance agreement, collection or repayment deadlines.',
            ],
            [
              '02',
              'Find the cash',
              'Bank balances, your take-home pay, your wife’s take-home pay, and pay dates.',
            ],
            [
              '03',
              'See the whole picture',
              'Three months of bank/card statements, loan balances, and every cash advance app.',
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
type Message = { id: string; role: string; text: string; sources?: Source[] };
export function CoachView({
  s,
  refresh,
  start,
  showReview,
}: ViewProps & { showReview: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]),
    [chat, setChat] = useState(''),
    [thinking, setThinking] = useState(false),
    [error, setError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api<Message[]>('/api/chat')
      .then(setMessages)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, thinking]);
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
          <div>
            <strong>Your money coach</strong>
            <p>
              {connections.ai
                ? 'Uses our confirmed records and source documents'
                : 'AI connection pending · manual tracking is ready'}
            </p>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="chat-messages">
          {!messages.length && (
            <div className="coach-welcome">
              <span className="icon-circle">
                <MessageCircle size={26} />
              </span>
              <h2>Let’s start where you are.</h2>
              <p>No judgment. Tell me what’s on your mind, or choose one small step.</p>
              <div className="suggestions">
                {[
                  'What needs attention before our next payday?',
                  'Help me get our mortgage situation organized.',
                  'I spent $42.50 on groceries. Help me record it.',
                  'What information are we still missing?',
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
              <small>{m.role === 'user' ? 'You' : 'Steadier'}</small>
              <div>{m.text}</div>
              {m.sources?.length ? (
                <details>
                  <summary>Sources used ({m.sources.length})</summary>
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
              <p>Looking through our records…</p>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(chat);
          }}
        >
          <textarea
            aria-label="Message the money coach"
            rows={2}
            maxLength={4000}
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="Ask anything about our money…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(chat);
              }
            }}
          />
          <button type="submit" disabled={thinking || !chat.trim()} aria-label="Send message">
            <Send size={19} />
          </button>
        </form>
        <p className="chat-footnote">
          Suggestions become review drafts. You decide what gets saved.
        </p>
      </section>
      <aside className="coach-side">
        <div className="panel">
          <h3>Our shared context</h3>
          <p>
            {data.accounts.length} accounts · {data.debts.length} debts
            <br />
            {data.documents.length} documents · {data.memories.length} remembered preferences
          </p>
          <button className="text-button" onClick={() => start('memory')}>
            Add something to remember <Plus size={15} />
          </button>
        </div>
        {pending > 0 && (
          <div className="panel">
            <h3>{pending} suggestions to check</h3>
            <p>The coach has proposed entries for your review.</p>
            <button onClick={showReview}>Review suggestions</button>
          </div>
        )}
        <div className="panel">
          <h3>One useful rule</h3>
          <p>
            If something is unclear, we ask. Missing numbers stay unknown until you confirm them.
          </p>
        </div>
      </aside>
    </div>
  );
}
export function SettingsView(props: ViewProps) {
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
      <section className="panel">
        <h2>Let’s confirm our starting point.</h2>
        <p className="help">
          Check each item only when the list is complete. Until then, the app won’t suggest money
          available for extra spending.
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
              notify('Household updated.');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="two-columns">
            <label className="field">
              <span>Household name</span>
              <input
                required
                value={v.name}
                onChange={(e) => setV({ ...v, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Cash buffer to protect ($)</span>
              <input
                inputMode="decimal"
                required
                value={v.buffer}
                onChange={(e) => setV({ ...v, buffer: e.target.value })}
              />
              <small>Money you want to keep untouched.</small>
            </label>
            <label className="field">
              <span>Country</span>
              <input value={v.country} onChange={(e) => setV({ ...v, country: e.target.value })} />
            </label>
            <label className="field">
              <span>State / province</span>
              <input value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })} />
            </label>
            <label className="field">
              <span>Time zone</span>
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
              ['accountsComplete', 'All our cash accounts and opening balances are here.'],
              ['incomeComplete', 'All expected take-home pay and pay dates are on the calendar.'],
              [
                'billsComplete',
                'All bills, debt payments, cash advance withdrawals, and everyday essentials are on the calendar.',
              ],
            ] as const
          ).map(([key, text]) => (
            <label className="check-field" key={key}>
              <input
                type="checkbox"
                checked={v[key]}
                onChange={(e) => setV({ ...v, [key]: e.target.checked })}
              />
              <span>{text}</span>
            </label>
          ))}
          {error && <div className="error">{error}</div>}
          <button disabled={busy}>{busy ? 'Saving…' : 'Save household setup'}</button>
        </form>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>What our coach remembers</h2>
          <button className="secondary small-button" onClick={() => props.start('memory')}>
            <Plus size={16} /> Add preference
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
          <p>Start with your goals, the categories you use, or what matters to your household.</p>
        )}
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Connections & portability</h2>
          <Settings size={19} />
        </div>
        <div className="connection-grid">
          <div>
            <span>Google accounts</span>
            <b>{s.member.local ? 'Connection pending' : 'Connected'}</b>
          </div>
          <div>
            <span>AI coach</span>
            <b>{connections.ai ? connections.model : 'Connection pending'}</b>
          </div>
          <div>
            <span>File storage</span>
            <b>{connections.storage}</b>
          </div>
          <div>
            <span>AI calls today</span>
            <b>
              {connections.usage.calls} / {connections.dailyCallLimit}
            </b>
          </div>
        </div>
        <p className="help">
          The daily call cap is a usage brake, not an exact dollar limit. Set a spending cap with
          your AI provider too.
        </p>
        <a className="button-link" href="/api/export">
          <Download size={17} /> Export our records
        </a>
        <p className="help">
          JSON export includes the ledger, debts, preferences, extracted document text, drafts, and
          history. Original photos and PDFs can be downloaded from the document shelf.
        </p>
      </section>
    </>
  );
}
