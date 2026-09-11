import { resolveLocale } from '@/lib/i18n';
import { HouseholdData, RecordKind } from '@/lib/domain';
import { forecast } from '@/lib/finance';
export type Snapshot = {
  data: HouseholdData;
  forecast: ReturnType<typeof forecast>;
  today: string;
  member: { name: string; email: string; local: boolean };
  connections: {
    ai: boolean;
    model: string | null;
    documentAi: boolean;
    documentModel: string | null;
    storage: string;
    database: string;
    usage: { calls: number; inputTokens: number | null; outputTokens: number | null };
    dailyCallLimit: number;
  };
};
export type EditableKind = Exclude<RecordKind, 'settings'>;
export type Entity = {
  id: string;
  revision: number;
  name?: string;
  title?: string;
  description?: string;
};
export type ViewProps = {
  s: Snapshot;
  start: (kind: EditableKind, preset?: Record<string, unknown>) => void;
  edit: (kind: EditableKind, item: Entity) => void;
  remove: (item: Entity) => void;
  refresh: () => Promise<Snapshot>;
  notify: (message: string) => void;
};
export type Source = { id: string; title: string; path: string; source: string; excerpt: string };
export async function api<T = unknown>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const locale = resolveLocale(
    typeof document !== 'undefined' ? document.documentElement.lang : null,
  );
  const headers = { 'Content-Type': 'application/json', 'x-steadier-locale': locale };
  const r = await fetch(
    path,
    body === undefined
      ? { cache: 'no-store', headers }
      : { method, headers, body: JSON.stringify(body) },
  );
  const result = await r.json();
  if (!r.ok) throw new Error(result.error || 'Could not finish. Please try again.');
  return result;
}
export async function optimizePhoto(file: File) {
  if (!file.type.startsWith('image/')) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  try {
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    );
    return blob
      ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
      : file;
  } finally {
    bitmap.close();
  }
}
