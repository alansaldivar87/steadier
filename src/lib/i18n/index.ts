import { es } from './es';
export type Locale = 'en' | 'es';
export function resolveLocale(preference?: string | null, acceptLanguage?: string | null): Locale {
  if (preference === 'en' || preference === 'es') return preference;
  const choices = (acceptLanguage || '')
    .split(',')
    .map((part) => {
      const [tag, ...options] = part.trim().split(';');
      const q = options.find((o) => o.trim().startsWith('q='));
      return { tag: tag.toLowerCase().split('-')[0], quality: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((p) => p.quality > 0)
    .sort((a, b) => b.quality - a.quality);
  return (choices.find((p) => p.tag === 'es' || p.tag === 'en')?.tag as Locale) || 'es';
}
export function translator(locale: Locale) {
  return (source: string, values: Record<string, string | number> = {}) => {
    const key = source.trim();
    const translated = locale === 'es' && es[key];
    let text = translated ? source.replace(key, translated) : source;
    if (locale === 'es')
      text = text.replace(/^Review (\d+) imported items?\.$/, (_, count: string) =>
        Number(count) === 1
          ? 'Revisa 1 elemento importado.'
          : `Revisa ${count} elementos importados.`,
      );
    if (locale === 'es')
      text = text
        .replace(
          /^Row (\d+): use YYYY-MM-DD or U.S. MM\/DD\/YYYY dates\.$/,
          'Fila $1: usa fechas AAAA-MM-DD o MM/DD/AAAA de EE. UU.',
        )
        .replace(
          /^Row (\d+): a Description column is required\.$/,
          'Fila $1: se requiere una columna Description.',
        )
        .replace(
          /^Row (\d+): both Debit and Credit contain money\.$/,
          'Fila $1: tanto Debit como Credit contienen dinero.',
        )
        .replace(
          /^Row (\d+): zero-amount rows cannot be imported\.$/,
          'Fila $1: no se pueden importar montos de cero.',
        )
        .replace(
          /^CSV row (\d+)\..*$/,
          'Fila $1 del CSV. Confirma la dirección y el tipo: las transferencias, reembolsos, pagos de tarjeta y adelantos deben clasificarse correctamente. Las fechas con barras usan mes/día/año de EE. UU.',
        );
    return text.replace(/\{(\w+)\}/g, (match, name) =>
      values[name] === undefined ? match : String(values[name]),
    );
  };
}
export function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value / 100);
}
export function formatDate(value: string, locale: Locale) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value + 'T12:00:00Z'));
}
export function requestLocale(request: Request): Locale {
  const cookie = request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)steadier-locale=(en|es)(?:;|$)/)?.[1];
  return resolveLocale(
    request.headers.get('x-steadier-locale') || cookie,
    request.headers.get('accept-language'),
  );
}
