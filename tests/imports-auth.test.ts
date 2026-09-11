import test from 'node:test';
import assert from 'node:assert/strict';
import { csvDrafts } from '../src/lib/imports';
import { allowedEmail, localAccess } from '../src/lib/auth-policy';
import { bm25Search, buildIndex } from '../src/lib/ai/bm25';
test('CSV preserves cents, quoted descriptions, dates and source rows', () => {
  const drafts = csvDrafts(
    'Date,Description,Amount\n09/10/2026,"Store, West",-42.50\n2026-09-11,Pay,500.00',
    'a',
    'doc',
  );
  assert.equal(drafts[0].data.amountCents, 4250);
  assert.equal(drafts[0].data.description, 'Store, West');
  assert.equal(drafts[0].data.date, '2026-09-10');
  assert.equal(drafts[1].data.type, 'income');
  assert.equal(drafts[0].data.sourceId, 'doc:row:2');
});
test('CSV rejects impossible dates and conflicting directions', () => {
  assert.throws(() => csvDrafts('Date,Description,Amount\n2026-02-30,Store,-10', 'a', 'doc'));
  assert.throws(() =>
    csvDrafts('Date,Description,Debit,Credit\n2026-09-10,Store,10,20', 'a', 'doc'),
  );
});
test('Google allowlist is exact, case-insensitive, and never open by default', () => {
  assert.equal(allowedEmail('ALAN@gmail.com', 'alan@gmail.com,wife@gmail.com'), true);
  assert.equal(
    allowedEmail('alan@gmail.com.attacker.test', 'alan@gmail.com,wife@gmail.com'),
    false,
  );
  assert.equal(allowedEmail('alan@gmail.com', ''), false);
  assert.equal(allowedEmail('a@gmail.com', 'a@gmail.com,b@gmail.com,c@gmail.com'), false);
});
test('local access cannot be enabled in production or through a forwarded host', () => {
  assert.equal(
    localAccess('localhost:3000', {
      NODE_ENV: 'development',
      LOCAL_ACCESS: 'true',
    } as NodeJS.ProcessEnv),
    true,
  );
  assert.equal(
    localAccess('localhost:3000', {
      NODE_ENV: 'production',
      LOCAL_ACCESS: 'true',
    } as NodeJS.ProcessEnv),
    false,
  );
  assert.equal(
    localAccess('public.example', {
      NODE_ENV: 'development',
      LOCAL_ACCESS: 'true',
    } as NodeJS.ProcessEnv),
    false,
  );
  assert.equal(
    localAccess('localhost:3000', {
      NODE_ENV: 'development',
      LOCAL_ACCESS: 'true',
      VERCEL: '1',
    } as NodeJS.ProcessEnv),
    false,
  );
});
test('CGC retrieval retains source provenance and bilingual token matching', () => {
  const hits = bm25Search(
    buildIndex([
      {
        id: '1',
        title: 'Facturación',
        path: '/source',
        source: 'statement',
        text: 'Préstamo hipotecario y facturación.',
      },
      {
        id: '2',
        title: 'Food',
        path: '/other',
        source: 'receipt',
        text: 'Groceries and vegetables',
      },
    ]),
    'facturacion',
  );
  assert.equal(hits[0].id, '1');
  assert.equal(hits[0].path, '/source');
  assert.equal(hits.length, 1);
});
