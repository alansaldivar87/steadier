'use client';
import { useEffect, useState } from 'react';
import { api } from './client-utils';
import { useI18n } from './i18n';
import type { ModelOption, ProviderName, publicAiConfig } from '@/lib/ai/config';
type PublicConfig = Awaited<ReturnType<typeof publicAiConfig>>;
const names: Record<ProviderName, string> = {
  openrouter: 'OpenRouter',
  xai: 'Grok · xAI',
  groq: 'Groq',
  compatible: 'OpenAI compatible',
  google: 'Gemini · Google AI Studio',
};
export default function AiSettings({
  onSaved,
  documentMode = false,
}: {
  onSaved: () => Promise<unknown>;
  documentMode?: boolean;
}) {
  const { tr, locale } = useI18n();
  const [config, setConfig] = useState<PublicConfig | null>(null),
    [provider, setProvider] = useState<ProviderName>('xai'),
    [apiKey, setApiKey] = useState(''),
    [model, setModel] = useState(''),
    [documentModel, setDocumentModel] = useState(''),
    [limit, setLimit] = useState(40),
    [models, setModels] = useState<ModelOption[]>([]),
    [filter, setFilter] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    api<PublicConfig>('/api/ai-settings')
      .then((c) => {
        setConfig(c);
        setProvider(
          documentMode ? (c.document.separate ? c.document.provider : 'google') : c.provider,
        );
        setModel(documentMode ? (c.document.separate ? c.document.model : '') : c.model);
        setDocumentModel(c.documentModel);
        setLimit(c.dailyCallLimit);
      })
      .catch((e) => setError(e.message));
  }, [documentMode]);
  const selected = models.find((m) => m.id === model);
  const hasKey = config?.providers.find((p) => p.id === provider)?.hasKey;
  async function loadModels() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      setModels(
        await api<ModelOption[]>('/api/ai-settings', {
          action: 'models',
          provider,
          apiKey: apiKey.trim() || undefined,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel ai-settings">
      <h2>{tr(documentMode ? 'Receipt and document reader' : 'Choose your AI assistant')}</h2>
      <p className="help">
        {tr(
          documentMode
            ? 'Use Gemini from Google AI Studio for photos and scanned PDFs, independently of your chat assistant.'
            : 'Switch providers or models here any time. Both household members use this connection.',
        )}
      </p>
      <form
        className="record-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          setSaved(false);
          try {
            const c = await api<PublicConfig>('/api/ai-settings', {
              action: documentMode ? 'document' : undefined,
              provider,
              model,
              documentModel,
              dailyCallLimit: limit,
              apiKey: apiKey.trim() || undefined,
              revision: documentMode ? config?.document.revision || 0 : config?.revision || 0,
            });
            setConfig(c);
            setApiKey('');
            setSaved(true);
            await onSaved();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="two-columns">
          <label className="field">
            <span>{tr('AI provider')}</span>
            <select
              disabled={busy}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as ProviderName);
                setApiKey('');
                setModels([]);
                setModel('');
                setDocumentModel('');
                setSaved(false);
                setError('');
              }}
            >
              {Object.entries(names).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{tr(hasKey ? 'API key connected · leave blank to keep it' : 'API key')}</span>
            <input
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              maxLength={1000}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              placeholder={
                hasKey ? tr('Enter only to replace the key') : tr('Paste the provider key here')
              }
            />
            <small>
              {tr('Saved on the server. Never included in exports or sent back to the browser.')}
            </small>
          </label>
        </div>
        {provider === 'google' && (
          <a
            className="inline-link"
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
          >
            {tr('Get your Google AI Studio API key')} ↗
          </a>
        )}
        <button type="button" className="secondary" disabled={busy || !config} onClick={loadModels}>
          {tr(busy ? 'Working…' : 'Load available models')}
        </button>
        {models.length > 0 && (
          <label className="field">
            <span>{tr('Filter models')}</span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={tr('Search by model name, such as Grok')}
            />
          </label>
        )}
        <label className="field">
          <span>
            {tr(
              documentMode
                ? 'Model for photos and documents'
                : 'Model for conversations and actions',
            )}
          </span>
          <select
            required
            disabled={busy}
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setSaved(false);
            }}
          >
            <option value="">{tr('Choose a model')}</option>
            {model && !models.some((m) => m.id === model) && <option value={model}>{model}</option>}
            {models
              .filter(
                (m) =>
                  (documentMode
                    ? !m.inputs.length || m.inputs.includes('image') || m.inputs.includes('file')
                    : m.tools !== false) &&
                  (m.id === model ||
                    (m.name + ' ' + m.id).toLowerCase().includes(filter.toLowerCase())),
              )
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </label>
        {selected && (
          <p className="help">
            {selected.inputPerMillion !== null && selected.outputPerMillion !== null
              ? tr('Catalog price per million tokens: {input} input / {output} output.', {
                  input: new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 4,
                  }).format(selected.inputPerMillion),
                  output: new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 4,
                  }).format(selected.outputPerMillion),
                })
              : tr('Pricing is available from your provider.')}
          </p>
        )}
        {documentMode && (
          <p className="help">
            {tr(
              'Photos require an image-capable model. Scanned PDFs require native PDF support; otherwise upload page photos.',
            )}
          </p>
        )}
        {!documentMode && (
          <label className="field">
            <span>{tr('Daily AI call limit')}</span>
            <input
              required
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
            <small>
              {tr(
                'One conversation can use up to four calls. Set a dollar spending cap with your provider too.',
              )}
            </small>
          </label>
        )}
        {error && (
          <p className="error" role="alert">
            {tr(error)}
          </p>
        )}
        {saved && (
          <p className="notice" role="status">
            {tr(
              documentMode
                ? 'Document reader connected. Upload a receipt or statement to begin.'
                : 'AI connection saved. You can use the coach now.',
            )}
          </p>
        )}
        <button disabled={busy || !model || !config}>
          {tr(busy ? 'Working…' : 'Save AI connection')}
        </button>
      </form>
    </section>
  );
}
