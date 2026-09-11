import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { put, get } from '@vercel/blob';
const driver = () => process.env.STORAGE_DRIVER || 'local';
function localPath(key: string) {
  if (!/^[a-zA-Z0-9_/-]+$/.test(key) || key.includes('..'))
    throw new Error('Invalid file reference.');
  const root = resolve('.data', 'uploads');
  const target = resolve(root, key);
  if (!target.startsWith(root + requireSeparator())) throw new Error('Invalid file reference.');
  return target;
}
function requireSeparator() {
  return process.platform === 'win32' ? '\\' : '/';
}
function s3() {
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  });
}
export async function storeFile(key: string, bytes: Uint8Array, mime: string) {
  if (driver() === 's3') {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: mime,
      }),
    );
    return key;
  }
  if (driver() === 'vercel-blob') {
    const b = await put(key, Buffer.from(bytes), {
      access: 'private',
      contentType: mime,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return b.pathname;
  }
  if (process.env.VERCEL)
    throw new Error('Connect private file storage before uploading on Vercel.');
  const p = localPath(key);
  await mkdir(resolve(p, '..'), { recursive: true });
  await writeFile(p, bytes, { flag: 'wx' });
  return key;
}
export async function loadFile(key: string) {
  if (driver() === 's3') {
    const r = await s3().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    if (!r.Body) throw new Error('File could not be read.');
    return Buffer.from(await r.Body.transformToByteArray());
  }
  if (driver() === 'vercel-blob') {
    const r = await get(key, { access: 'private' });
    if (!r || r.statusCode !== 200) throw new Error('File could not be read.');
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  }
  return readFile(localPath(key));
}
