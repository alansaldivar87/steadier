import { cookies, headers } from 'next/headers';
import { resolveLocale } from './index';
export async function serverLocale() {
  const [jar, h] = await Promise.all([cookies(), headers()]);
  return resolveLocale(jar.get('steadier-locale')?.value, h.get('accept-language'));
}
