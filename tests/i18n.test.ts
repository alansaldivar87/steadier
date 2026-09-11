import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale, requestLocale, translator, formatDate, formatMoney } from '../src/lib/i18n';
import { expandQuery } from '../src/lib/ai/query-expansion';
test('language preference overrides browser negotiation independently, with Spanish fallback', () => {
  assert.equal(resolveLocale('es', 'en-US,en;q=0.9'), 'es');
  assert.equal(resolveLocale('en', 'es-MX'), 'en');
  assert.equal(resolveLocale(null, 'fr,en;q=0.2,es-MX;q=0.8'), 'es');
  assert.equal(resolveLocale(null, 'fr'), 'es');
  assert.equal(resolveLocale(null, 'es;q=0,en;q=1'), 'en');
  assert.equal(
    requestLocale(
      new Request('http://localhost', {
        headers: { cookie: 'steadier-locale=es', 'accept-language': 'en-US' },
      }),
    ),
    'es',
  );
});
test('Spanish labels, plural notices and formatted dollars preserve user data and cents', () => {
  const tr = translator('es');
  assert.equal(tr('Our money'), 'Nuestro dinero');
  assert.equal(tr('Edit {name}', { name: 'Alan’s Visa' }), 'Editar Alan’s Visa');
  assert.equal(tr('Review 1 imported item.'), 'Revisa 1 elemento importado.');
  assert.equal(tr('My bank’s original name'), 'My bank’s original name');
  assert.match(formatMoney(4250, 'es'), /42\.50/);
  assert.match(formatDate('2026-09-11', 'es'), /11/);
  assert.match(expandQuery('hipoteca atrasada préstamo interés'), /mortgage/);
});
