import { loadEnvConfig } from '@next/env';
async function main() {
  loadEnvConfig(process.cwd());
  const { aiConfig, documentAiConfig } = await import('../src/lib/ai/config');
  const ai = await aiConfig();
  const documentAi = await documentAiConfig();
  const p = process.env;
  let httpsOrigin = false;
  try {
    const url = new URL(p.AUTH_URL || '');
    httpsOrigin =
      url.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    // A missing or invalid origin must stay incomplete.
  }
  const checks = [
    ['Google OAuth client', !!p.AUTH_GOOGLE_ID && !!p.AUTH_GOOGLE_SECRET],
    ['Production HTTPS auth origin', httpsOrigin],
    ['Local access explicitly disabled', p.LOCAL_ACCESS === 'false'],
    ['Session secret', !!p.AUTH_SECRET && p.AUTH_SECRET.length >= 32],
    [
      'Two household emails',
      (p.ALLOWED_EMAILS || '').split(',').filter((e) => e.trim()).length === 2,
    ],
    ['AI provider', ai.configured],
    ['Document AI provider', documentAi.configured],
    ['Remote database', !!p.DATABASE_URL && !p.DATABASE_URL.startsWith('file:')],
    [
      'Remote file storage',
      p.STORAGE_DRIVER === 's3'
        ? !!p.S3_BUCKET && !!p.S3_ACCESS_KEY_ID && !!p.S3_SECRET_ACCESS_KEY
        : p.STORAGE_DRIVER === 'vercel-blob' && !!p.BLOB_READ_WRITE_TOKEN,
    ],
  ] as const;
  for (const [label, ok] of checks)
    process.stdout.write(`${ok ? 'CONFIGURED' : 'NEEDED'}  ${label}\n`);
  process.stdout.write(
    '\nConfiguration presence only; live sign-in, AI, storage and restore still need verification.\nNo secret values were printed. See docs/SETUP.md.\n',
  );
  if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
}
void main().catch(() => {
  process.stderr.write(
    'Configuration check could not complete. Check environment settings and database access. No secret values were printed.\n',
  );
  process.exitCode = 1;
});
