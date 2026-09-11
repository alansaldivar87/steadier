import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { structured } from '../src/lib/ai/provider';
import { z } from 'zod';
import { getDb, query, householdId } from '../src/lib/db';
process.env.DATABASE_URL = `file:.data/test-ai-${randomUUID()}.db`;
process.env.HOUSEHOLD_ID = 'ai-test';
after(() => getDb().close());
test('AI adapter validates output, records usage and enforces durable daily cap', async () => {
  let requests = 0;
  const server = createServer(async (req, res) => {
    requests++;
    let body = '';
    for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    assert.ok(input.messages[0].content.includes('untrusted'));
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: JSON.stringify({ answer: 'Use the confirmed ledger.' }) },
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No mock server');
  process.env.AI_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  process.env.AI_API_KEY = 'test-only';
  process.env.AI_MODEL = 'mock';
  process.env.AI_DAILY_CALL_LIMIT = '1';
  try {
    const result = await structured('test', 'Be clear.', 'test', z.object({ answer: z.string() }));
    assert.equal(result.answer, 'Use the confirmed ledger.');
    await assert.rejects(
      structured('test', 'test', 'test', z.object({ answer: z.string() })),
      /limit/,
    );
    assert.equal(requests, 1);
    const usage = await query('SELECT * FROM ai_usage WHERE household=?', [householdId()]);
    assert.equal(usage.rows[0].status, 'success');
    assert.equal(usage.rows[0].input_tokens, 20);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
