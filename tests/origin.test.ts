import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin } from '../src/lib/access';
test('same-origin writes use the browser-facing host behind a Next internal origin', () => {
  const prior = process.env.AUTH_URL;
  delete process.env.AUTH_URL;
  try {
    assert.doesNotThrow(() =>
      sameOrigin(
        new Request('http://localhost:3000/api/records', {
          headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' },
        }),
      ),
    );
    assert.throws(() =>
      sameOrigin(
        new Request('http://localhost:3000/api/records', {
          headers: { host: '127.0.0.1:3000', origin: 'https://other.example' },
        }),
      ),
    );
    assert.throws(() => sameOrigin(new Request('http://localhost:3000/api/records')));
  } finally {
    if (prior) process.env.AUTH_URL = prior;
  }
});
test('production public origin overrides internal HTTP protocol and host', () => {
  const prior = process.env.AUTH_URL;
  process.env.AUTH_URL = 'https://household.example';
  try {
    assert.doesNotThrow(() =>
      sameOrigin(
        new Request('http://internal:3000/api/records', {
          headers: { host: 'household.example', origin: 'https://household.example' },
        }),
      ),
    );
    assert.throws(() =>
      sameOrigin(
        new Request('http://internal:3000/api/records', {
          headers: { host: 'attacker.example', origin: 'https://attacker.example' },
        }),
      ),
    );
  } finally {
    if (prior) process.env.AUTH_URL = prior;
    else delete process.env.AUTH_URL;
  }
});
