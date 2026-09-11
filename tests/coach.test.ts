import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { coach, conversation } from '../src/lib/ai/coach';
import { getDb, household, list, query, saveEntity, writeRecord } from '../src/lib/db';
import { retrieve } from '../src/lib/ai/retrieval';
import { today } from '../src/lib/domain';
process.env.DATABASE_URL = `file:.data/test-coach-${randomUUID()}.db`;
process.env.HOUSEHOLD_ID = 'coach-test';
process.env.AI_PROVIDER = 'compatible';
process.env.AI_API_KEY = 'synthetic-test-key';
process.env.AI_MODEL = 'test-model';
process.env.AI_DAILY_CALL_LIMIT = '20';
after(() => getDb().close());
test('Spanish coach uses SDK tools, stages valid entries atomically, scopes chat by member and retrieves English evidence', async () => {
  const date = today();
  const actor = 'one@example.test';
  const account = await saveEntity(
    'account',
    { name: 'Joint checking', kind: 'checking', balanceCents: 50000, openingDate: date },
    actor,
  );
  await writeRecord(
    'memory',
    {
      title: 'Mortgage reminder',
      text: 'Mortgage forbearance agreement. Overdue payment deadline is September 30. Verify the latest notice.',
    },
    actor,
  );
  const found = await retrieve('¿Cuál es el plazo de la hipoteca atrasada?');
  assert.ok(found.some((s) => s.title === 'Mortgage reminder'));
  let requests = 0;
  let failure = false;
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const input = JSON.parse(raw);
    requests++;
    assert.ok(input.messages[0].content.includes('plain Latin American Spanish'));
    assert.ok(
      input.tools?.some(
        (t: { function: { name: string } }) => t.function.name === 'prepare_entries',
      ),
    );
    let content: string | null = null;
    let calls: unknown[] | undefined;
    if (requests === 1)
      calls = [
        {
          id: 'read-spending',
          type: 'function',
          function: {
            name: 'spending_summary',
            arguments: JSON.stringify({ from: date, to: date }),
          },
        },
      ];
    else if (requests === 2) {
      const output = input.messages.findLast((m: { role: string }) => m.role === 'tool');
      assert.match(output.content, /everydaySpendingNetCents/);
      calls = [
        {
          id: 'stage-entries',
          type: 'function',
          function: {
            name: 'prepare_entries',
            arguments: JSON.stringify({
              entries: [
                {
                  kind: 'transaction',
                  data: {
                    description: 'Supermercado',
                    amountCents: 4250,
                    date,
                    type: 'expense',
                    accountId: account.id,
                    toAccountId: null,
                    category: 'Groceries',
                    note: '',
                  },
                  reason: 'Gasto indicado por ti; revisar antes de guardar.',
                },
                {
                  kind: 'task',
                  data: {
                    title: 'Revisar el aviso de la hipoteca',
                    urgent: true,
                    done: false,
                    dueDate: null,
                    note: '',
                  },
                  reason: 'Organizar la vivienda primero.',
                },
              ],
            }),
          },
        },
      ];
    } else if (failure) {
      res.writeHead(500);
      res.end('{}');
      return;
    } else
      content =
        'Preparé dos borradores para revisar. Tu saldo confirmado todavía es $500.00. Abre Documentos para confirmarlos.';
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        id: 'mock-' + requests,
        created: 1,
        model: 'test-model',
        choices: [
          {
            index: 0,
            finish_reason: calls ? 'tool_calls' : 'stop',
            message: { role: 'assistant', content, tool_calls: calls },
          },
        ],
        usage: { prompt_tokens: 30, completion_tokens: 20 },
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No mock');
  process.env.AI_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  try {
    const result = await coach(
      'Gasté 42.50 en supermercado de la cuenta conjunta. Prepara el registro y un paso para revisar la hipoteca.',
      actor,
      'es',
    );
    assert.equal(requests, 3);
    assert.equal(result.draftIds.length, 2);
    assert.match(result.answer, /borradores/);
    assert.ok(result.checks.includes('Reviewing spending'));
    const data = await household();
    assert.equal(data.transactions.length, 0);
    assert.equal(data.accounts[0].balanceCents, 50000);
    assert.equal(data.drafts.length, 2);
    assert.equal((await conversation(actor)).length, 2);
    assert.equal((await conversation('wife@example.test')).length, 0);
    const usage = await query('SELECT COUNT(*) AS n FROM ai_usage');
    assert.equal(usage.rows[0].n, 3);
    failure = true;
    await assert.rejects(coach('Otra pregunta', actor, 'es'));
    assert.equal((await list('message')).length, 2);
    assert.equal((await household()).drafts.length, 2);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
