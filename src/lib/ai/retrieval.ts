import { household } from '../db';
import { bm25Search, buildIndex, type RagDoc } from './bm25';
import { knowledge } from './knowledge';
import { expandQuery } from './query-expansion';
export async function retrieve(query: string) {
  const data = await household();
  const docs: RagDoc[] = [...knowledge];
  for (const d of data.documents) {
    if (!d.text) continue;
    for (let offset = 0; offset < d.text.length; offset += 1800) {
      docs.push({
        id: `${d.id}:${offset}`,
        title: d.name,
        path: `/api/documents/${d.id}`,
        source: `Household upload · ${d.createdAt.slice(0, 10)} · extracted, not verified`,
        text: d.text.slice(offset, offset + 2200),
      });
    }
  }
  for (const m of data.memories)
    docs.push({
      id: m.id,
      title: m.title,
      path: 'internal:household-memory',
      source: `Household preference · ${m.updatedAt}`,
      text: m.text,
    });
  return bm25Search(buildIndex(docs), expandQuery(query), 6);
}
