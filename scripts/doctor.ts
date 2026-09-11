import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const p = process.env;
const checks = [
  ['Google OAuth client', !!p.AUTH_GOOGLE_ID && !!p.AUTH_GOOGLE_SECRET],
  ['Session secret', !!p.AUTH_SECRET && p.AUTH_SECRET.length >= 32],
  [
    'Two household emails',
    (p.ALLOWED_EMAILS || '').split(',').filter((e) => e.trim()).length === 2,
  ],
  ['AI provider', !!p.AI_API_KEY && !!p.AI_MODEL],
  ['Remote database', !!p.DATABASE_URL && !p.DATABASE_URL.startsWith('file:')],
  [
    'Remote file storage',
    p.STORAGE_DRIVER === 's3'
      ? !!p.S3_BUCKET && !!p.S3_ACCESS_KEY_ID && !!p.S3_SECRET_ACCESS_KEY
      : p.STORAGE_DRIVER === 'vercel-blob' && !!p.BLOB_READ_WRITE_TOKEN,
  ],
] as const;
for (const [label, ok] of checks) process.stdout.write(`${ok ? 'READY' : 'NEEDED'}  ${label}\n`);
process.stdout.write('\nNo secret values were printed. See docs/SETUP.md.\n');
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
