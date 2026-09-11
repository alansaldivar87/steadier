import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { aiConfig, publicAiConfig, saveAiConfig, providerKey } from '../src/lib/ai/config';
import { getDb, household, query } from '../src/lib/db';
process.env.DATABASE_URL = `file:.data/test-config-${randomUUID()}.db`;
process.env.HOUSEHOLD_ID = 'config-test';
process.env.AUTH_SECRET = 'synthetic-session-secret-at-least-32-characters';
process.env.AI_PROVIDER = 'groq';
after(() => getDb().close());
test('model changes validate credentials, preserve keys privately and reject stale concurrent edits', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const token = new Headers(init?.headers).get('authorization');
    if (token === 'Bearer invalid-test-key') return Response.json({}, { status: 401 });
    return Response.json({
      data: [
        { id: 'test-model', active: true },
        { id: 'test-model-2', active: true },
      ],
    });
  };
  try {
    const key = 'synthetic-private-provider-key';
    const saved = await saveAiConfig(
      {
        provider: 'groq',
        model: 'test-model',
        documentModel: '',
        dailyCallLimit: 12,
        apiKey: key,
        revision: 0,
      },
      'one@example.test',
    );
    assert.equal(saved.model, 'test-model');
    assert.equal(saved.revision, 1);
    assert.equal(saved.configured, true);
    assert.equal(await providerKey('groq'), key);
    assert.equal(JSON.stringify(saved).includes(key), false);
    assert.equal(JSON.stringify(await publicAiConfig()).includes(key), false);
    assert.equal(JSON.stringify(await household()).includes(key), false);
    assert.equal(JSON.stringify((await query('SELECT * FROM audit')).rows).includes(key), false);
    const stored = String(
      (await query('SELECT encrypted_key FROM ai_credentials')).rows[0].encrypted_key,
    );
    assert.notEqual(stored, key);
    assert.equal(stored.includes(key), false);
    const changed = await saveAiConfig(
      {
        provider: 'groq',
        model: 'test-model-2',
        documentModel: 'test-model',
        dailyCallLimit: 8,
        revision: 1,
      },
      'two@example.test',
    );
    assert.equal(changed.revision, 2);
    assert.equal(await providerKey('groq'), key);
    await assert.rejects(
      saveAiConfig(
        {
          provider: 'groq',
          model: 'test-model',
          documentModel: '',
          dailyCallLimit: 8,
          apiKey: 'different-test-key',
          revision: 1,
        },
        'one@example.test',
      ),
      /changed/,
    );
    assert.equal(await providerKey('groq'), key);
    await assert.rejects(
      saveAiConfig(
        {
          provider: 'groq',
          model: 'test-model',
          documentModel: '',
          dailyCallLimit: 8,
          apiKey: 'invalid-test-key',
          revision: 2,
        },
        'one@example.test',
      ),
      /Could not load/,
    );
    process.env.HOUSEHOLD_ID = 'unrelated';
    assert.equal(await providerKey('groq'), '');
    process.env.HOUSEHOLD_ID = 'config-test';
    process.env.AUTH_SECRET = 'rotated-session-secret-also-at-least-32-characters';
    assert.equal((await aiConfig()).configured, false);
    assert.equal((await publicAiConfig()).providers.find((p) => p.id === 'groq')?.hasKey, false);
    const reconnected = await saveAiConfig(
      {
        provider: 'groq',
        model: 'test-model',
        documentModel: '',
        dailyCallLimit: 8,
        apiKey: key,
        revision: 2,
      },
      'one@example.test',
    );
    assert.equal(reconnected.configured, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
