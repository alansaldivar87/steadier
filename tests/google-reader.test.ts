import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { structured } from '../src/lib/ai/provider';
import { aiConfig, documentAiConfig, saveDocumentAiConfig, listModels } from '../src/lib/ai/config';
import { getDb, query } from '../src/lib/db';
process.env.DATABASE_URL = `file:.data/test-google-${randomUUID()}.db`;
process.env.HOUSEHOLD_ID = 'reader-test';
process.env.AUTH_SECRET = 'synthetic-test-session-secret-for-gemini';
process.env.AI_PROVIDER = 'groq';
delete process.env.AI_API_KEY;
delete process.env.GROQ_API_KEY;
after(() => getDb().close());
test('Google reader connects independently, sends native PDF and image inputs, validates JSON and meters usage', async () => {
  const originalFetch = globalThis.fetch;
  const bodies: Record<string, unknown>[] = [];
  const apiKey = 'synthetic-gemini-reader-key';
  globalThis.fetch = async (url, init) => {
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), apiKey);
    if (String(url).endsWith('/models'))
      return Response.json({
        models: [
          {
            name: 'models/gemini-test',
            displayName: 'Gemini test',
            supportedGenerationMethods: ['generateContent'],
            inputTokenLimit: 100000,
          },
          { name: 'models/embedding-test', supportedGenerationMethods: ['embedContent'] },
        ],
      });
    assert.ok(String(url).includes('gemini-test:generateContent'));
    bodies.push(JSON.parse(String(init?.body)));
    return Response.json({
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                text: JSON.stringify({
                  amountCents: 4250,
                  reason: 'Revisa el recibo antes de guardar.',
                }),
              },
            ],
          },
          finishReason: 'STOP',
          index: 0,
        },
      ],
      usageMetadata: { promptTokenCount: 25, candidatesTokenCount: 15, thoughtsTokenCount: 5 },
      modelVersion: 'gemini-test',
    });
  };
  try {
    assert.equal((await listModels('google', apiKey)).length, 1);
    const saved = await saveDocumentAiConfig(
      { provider: 'google', model: 'gemini-test', apiKey, revision: 0 },
      'wife@example.test',
    );
    assert.equal(saved.document.configured, true);
    assert.equal((await aiConfig()).configured, false);
    assert.equal((await documentAiConfig()).provider, 'google');
    const result = await structured(
      'document-extraction',
      'Extract a receipt in Spanish.',
      [
        {
          type: 'file',
          file: { filename: 'receipt.pdf', file_data: 'data:application/pdf;base64,JVBERi0xLjQ=' },
        },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } },
      ],
      z.object({ amountCents: z.number().int(), reason: z.string() }),
    );
    assert.equal(result.amountCents, 4250);
    assert.match(result.reason, /Revisa/);
    assert.match(JSON.stringify(bodies[0]), /application\/pdf/);
    assert.match(JSON.stringify(bodies[0]), /image\/png/);
    const usage = await query('SELECT * FROM ai_usage');
    assert.equal(usage.rows.length, 1);
    assert.equal(usage.rows[0].input_tokens, 25);
    assert.equal(usage.rows[0].output_tokens, 20);
    assert.equal(JSON.stringify(saved).includes(apiKey), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
