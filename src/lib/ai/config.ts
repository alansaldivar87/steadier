import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db, getRecord, householdId, query, writeRecord } from '../db';
export const providerNames = ['openrouter', 'groq', 'xai', 'google', 'compatible'] as const;
export type ProviderName = (typeof providerNames)[number];
export const endpoints: Record<ProviderName, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  xai: 'https://api.x.ai/v1',
  compatible: 'https://api.openai.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
};
const keyNames: Record<ProviderName, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  groq: 'GROQ_API_KEY',
  xai: 'XAI_API_KEY',
  compatible: 'AI_API_KEY',
  google: 'GEMINI_API_KEY',
};
export const aiSettingsSchema = z.object({
  provider: z.enum(providerNames),
  model: z.string().trim().min(1).max(180),
  documentModel: z.string().trim().max(180).default(''),
  dailyCallLimit: z.number().int().min(1).max(1000).default(40),
});
export type AiSettings = z.infer<typeof aiSettingsSchema>;
function environmentSettings(): AiSettings {
  const base = process.env.AI_BASE_URL || '';
  const provider: ProviderName = providerNames.includes(process.env.AI_PROVIDER as ProviderName)
    ? (process.env.AI_PROVIDER as ProviderName)
    : base.includes('openrouter.ai') || process.env.OPENROUTER_API_KEY
      ? 'openrouter'
      : base.includes('groq.com') || process.env.GROQ_API_KEY
        ? 'groq'
        : base.includes('api.x.ai') || process.env.XAI_API_KEY
          ? 'xai'
          : 'compatible';
  return {
    provider,
    model: process.env.AI_MODEL || '',
    documentModel: process.env.AI_DOCUMENT_MODEL || '',
    dailyCallLimit: Number(process.env.AI_DAILY_CALL_LIMIT || 40),
  };
}
function encryptionKey() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
    throw new Error('Set a session secret before saving an AI key.');
  return createHash('sha256').update(process.env.AUTH_SECRET).digest();
}
function encrypt(value: string, provider: ProviderName) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from(householdId() + ':' + provider));
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}
function decrypt(value: string, provider: ProviderName) {
  try {
    const [iv, tag, data] = value.split('.').map((s) => Buffer.from(s, 'base64'));
    const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    cipher.setAAD(Buffer.from(householdId() + ':' + provider));
    cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
  } catch {
    throw new Error('Reconnect this provider after changing the session secret.');
  }
}
export async function providerKey(provider: ProviderName) {
  const rows = await query(
    'SELECT encrypted_key FROM ai_credentials WHERE household=? AND provider=?',
    [householdId(), provider],
  );
  if (rows.rows.length) return decrypt(String(rows.rows[0].encrypted_key), provider);
  return (
    process.env[keyNames[provider]] ||
    (provider === 'google' ? process.env.GOOGLE_GENERATIVE_AI_API_KEY : '') ||
    (environmentSettings().provider === provider ? process.env.AI_API_KEY : '') ||
    ''
  );
}
export async function aiConfig() {
  const saved = await getRecord<AiSettings>('ai-settings');
  const settings = saved ? aiSettingsSchema.parse(saved) : environmentSettings();
  const apiKey = await providerKey(settings.provider).catch(() => '');
  return {
    ...settings,
    revision: saved?.revision || 0,
    apiKey,
    baseURL:
      settings.provider === 'compatible'
        ? process.env.AI_BASE_URL || endpoints.compatible
        : endpoints[settings.provider],
    configured: !!(apiKey && settings.model),
  };
}
export async function publicAiConfig() {
  const config = await aiConfig();
  const document = await documentAiConfig();
  const providers = await Promise.all(
    providerNames.map(async (provider) => ({
      id: provider,
      hasKey: !!(await providerKey(provider).catch(() => '')),
    })),
  );
  return {
    provider: config.provider,
    model: config.model,
    documentModel: config.documentModel,
    dailyCallLimit: config.dailyCallLimit,
    revision: config.revision,
    configured: config.configured,
    document: {
      provider: document.provider,
      model: document.model,
      revision: document.revision,
      configured: document.configured,
      separate: document.separate,
    },
    providers,
  };
}
export type ModelOption = {
  id: string;
  name: string;
  inputs: string[];
  tools: boolean | null;
  context: number | null;
  inputPerMillion: number | null;
  outputPerMillion: number | null;
};
export async function listModels(
  provider: ProviderName,
  candidateKey?: string,
): Promise<ModelOption[]> {
  const key = candidateKey || (await providerKey(provider));
  if (!key && provider !== 'openrouter')
    throw new Error('Add an API key to load this provider’s models.');
  const base =
    provider === 'compatible'
      ? process.env.AI_BASE_URL || endpoints.compatible
      : endpoints[provider];
  const response = await fetch(base.replace(/\/$/, '') + '/models', {
    headers: key
      ? provider === 'google'
        ? { 'x-goog-api-key': key }
        : { Authorization: `Bearer ${key}` }
      : {},
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Could not load models. Check the provider key and try again.');
  const data = await response.json();
  if (provider === 'google') {
    const modelSchema = z.object({
      name: z.string(),
      displayName: z.string().optional(),
      supportedGenerationMethods: z.array(z.string()).optional(),
      inputTokenLimit: z.number().optional(),
    });
    return z
      .array(modelSchema)
      .parse(data.models)
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          /gemini/.test(m.name) &&
          !/image|tts|robotics|embedding/.test(m.name),
      )
      .map((m) => ({
        id: m.name.replace(/^models\//, ''),
        name: m.displayName || m.name,
        inputs: ['text', 'image', 'file'],
        tools: null,
        context: m.inputTokenLimit || null,
        inputPerMillion: null,
        outputPerMillion: null,
      }));
  }
  const modelSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    active: z.boolean().optional(),
    architecture: z
      .object({
        input_modalities: z.array(z.string()).optional(),
        output_modalities: z.array(z.string()).optional(),
      })
      .optional(),
    supported_parameters: z.array(z.string()).optional(),
    context_length: z.number().optional(),
    context_window: z.number().optional(),
    pricing: z
      .object({ prompt: z.string().optional(), completion: z.string().optional() })
      .optional(),
  });
  return z
    .array(modelSchema)
    .parse(data.data)
    .filter(
      (m) =>
        m.active !== false &&
        (!m.architecture?.output_modalities || m.architecture.output_modalities.includes('text')),
    )
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      inputs: m.architecture?.input_modalities || [],
      tools: m.supported_parameters ? m.supported_parameters.includes('tools') : null,
      context: m.context_length || m.context_window || null,
      inputPerMillion: m.pricing?.prompt ? Number(m.pricing.prompt) * 1e6 : null,
      outputPerMillion: m.pricing?.completion ? Number(m.pricing.completion) * 1e6 : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
export async function saveAiConfig(
  input: AiSettings & { apiKey?: string; revision: number },
  actor: string,
) {
  const settings = aiSettingsSchema.parse(input);
  const apiKey = input.apiKey || (await providerKey(settings.provider));
  if (!apiKey) throw new Error('Add an API key before connecting this provider.');
  if (settings.provider === 'openrouter') {
    const response = await fetch(endpoints.openrouter + '/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    if (!response.ok)
      throw new Error('Could not load models. Check the provider key and try again.');
  }
  const models = await listModels(settings.provider, input.apiKey);
  if (
    !models.some((m) => m.id === settings.model && m.tools !== false) ||
    (settings.documentModel && !models.some((m) => m.id === settings.documentModel))
  )
    throw new Error('Choose models available from this provider. The coach needs tool calling.');
  const tx = await (await db()).transaction('write');
  try {
    if (input.apiKey)
      await tx.execute({
        sql: 'INSERT INTO ai_credentials(household,provider,encrypted_key) VALUES(?,?,?) ON CONFLICT(household,provider) DO UPDATE SET encrypted_key=excluded.encrypted_key',
        args: [householdId(), settings.provider, encrypt(input.apiKey, settings.provider)],
      });
    await writeRecord('ai-settings', settings, actor, {
      id: 'ai-settings',
      revision: input.revision,
      exec: tx,
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  return publicAiConfig();
}
export const documentAiSchema = z.object({
  provider: z.enum(providerNames),
  model: z.string().trim().min(1).max(180),
});
export async function documentAiConfig() {
  const parent = await aiConfig();
  const saved = await getRecord<z.infer<typeof documentAiSchema>>('document-ai-settings');
  const provider =
    saved?.provider ||
    (providerNames.includes(process.env.DOCUMENT_AI_PROVIDER as ProviderName)
      ? (process.env.DOCUMENT_AI_PROVIDER as ProviderName)
      : parent.provider);
  const model =
    saved?.model ||
    process.env.DOCUMENT_AI_MODEL ||
    (provider === parent.provider ? parent.documentModel || parent.model : '');
  const apiKey = await providerKey(provider).catch(() => '');
  return {
    provider,
    model,
    apiKey,
    baseURL:
      provider === 'compatible'
        ? process.env.AI_BASE_URL || endpoints.compatible
        : endpoints[provider],
    configured: !!(apiKey && model),
    revision: saved?.revision || 0,
    dailyCallLimit: parent.dailyCallLimit,
    separate: !!saved || !!process.env.DOCUMENT_AI_PROVIDER,
  };
}
export async function saveDocumentAiConfig(
  input: z.infer<typeof documentAiSchema> & { apiKey?: string; revision: number },
  actor: string,
) {
  const settings = documentAiSchema.parse(input);
  const key = input.apiKey || (await providerKey(settings.provider));
  if (!key) throw new Error('Add an API key before connecting this provider.');
  if (settings.provider === 'openrouter') {
    const response = await fetch(endpoints.openrouter + '/key', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    if (!response.ok)
      throw new Error('Could not load models. Check the provider key and try again.');
  }
  const models = await listModels(settings.provider, key);
  if (!models.some((m) => m.id === settings.model))
    throw new Error('Choose a model available from this provider.');
  const tx = await (await db()).transaction('write');
  try {
    if (input.apiKey)
      await tx.execute({
        sql: 'INSERT INTO ai_credentials(household,provider,encrypted_key) VALUES(?,?,?) ON CONFLICT(household,provider) DO UPDATE SET encrypted_key=excluded.encrypted_key',
        args: [householdId(), settings.provider, encrypt(input.apiKey, settings.provider)],
      });
    await writeRecord('document-ai-settings', settings, actor, {
      id: 'document-ai-settings',
      revision: input.revision,
      exec: tx,
    });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
  return publicAiConfig();
}
