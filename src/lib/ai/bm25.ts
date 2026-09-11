/**
 * Tiny, dependency-free BM25 ranker for CGC Bot's `docs` expert (RAG).
 *
 * This module is intentionally **pure** — no IO, no runtime deps, no Node
 * globals — so it is the single source of truth for tokenization + scoring and
 * is safe to import from the edge chat route and node-environment unit tests
 * alike. The build-time generator (`scripts/generate-docs-index.mjs`) emits a
 * raw `RagDoc[]` corpus; `buildIndex` is run **once at runtime** over that
 * corpus (cached in `retrieve.ts`) so the BM25 math lives here and nowhere else.
 *
 * BM25 params are the textbook defaults (k1 = 1.5, b = 0.75). Tokenization is
 * accent-folded + lowercased so a Spanish query without diacritics
 * ("facturacion") still matches indexed text ("facturación").
 */

/** A raw document, as produced by the corpus generator. */
export interface RagDoc {
  /** Stable id — the source-relative path (also used for citation + tie-break). */
  readonly id: string;
  /** Human title — first markdown heading, else the file name. */
  readonly title: string;
  /** Source-relative path, surfaced to the model for citation. */
  readonly path: string;
  /** Corpus label, e.g. `'admin'` | `'internal'`. */
  readonly source: string;
  /** Plain text (frontmatter stripped), capped by the generator. */
  readonly text: string;
}

/** One document after indexing — keeps `text` for match-centered excerpts. */
export interface IndexedDoc {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly source: string;
  /** Token count (BM25 length normalization). */
  readonly len: number;
  /** term → frequency within this document. */
  readonly tf: Readonly<Record<string, number>>;
  /** Retained source text for excerpt generation. */
  readonly text: string;
}

/** A built BM25 index — the in-memory shape `bm25Search` operates over. */
export interface Bm25Index {
  readonly docs: readonly IndexedDoc[];
  /** term → number of documents containing it. */
  readonly df: Readonly<Record<string, number>>;
  /** Average document length (tokens). */
  readonly avgdl: number;
  /** Document count. */
  readonly n: number;
}

/** A scored search result, ready to format into a grounding block. */
export interface SearchHit {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly source: string;
  readonly score: number;
  readonly excerpt: string;
}

const K1 = 1.5;
const B = 0.75;

/**
 * A deliberately small bilingual stopword set. BM25's idf already downweights
 * ubiquitous terms; this just trims index noise and improves excerpt anchoring.
 * Kept short on purpose — over-aggressive stopping hurts recall.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  // English
  'the',
  'and',
  'for',
  'you',
  'are',
  'with',
  'that',
  'this',
  'from',
  'have',
  'was',
  'not',
  'but',
  'can',
  'will',
  'all',
  'your',
  'has',
  'how',
  'what',
  'when',
  'who',
  'why',
  'its',
  'our',
  'out',
  'use',
  'used',
  'using',
  // Spanish
  'que',
  'los',
  'las',
  'una',
  'uno',
  'con',
  'por',
  'para',
  'del',
  'sus',
  'este',
  'esta',
  'esto',
  'como',
  'mas',
  'pero',
  'sin',
  'son',
  'fue',
  'han',
  'hay',
  'sobre',
  'entre',
  'cuando',
  'donde',
  'porque',
  'desde',
  'cada',
]);

/** Strip diacritics (NFD + remove combining marks). Used for token folding. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Lowercase, accent-fold, split on non-alphanumeric, drop 1-char tokens and
 * stopwords. Deterministic and pure — the same input always yields the same
 * tokens, which keeps the index reproducible across machines.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const folded = fold(text.toLowerCase());
  const out: string[] = [];
  for (const tok of folded.split(/[^a-z0-9]+/)) {
    if (tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    out.push(tok);
  }
  return out;
}

/** Build a BM25 index from a raw corpus. Pure; safe to run at startup. */
export function buildIndex(docs: readonly RagDoc[]): Bm25Index {
  const indexed: IndexedDoc[] = [];
  const df: Record<string, number> = {};
  let totalLen = 0;

  for (const d of docs) {
    // The title is part of the indexed text so a title-word match scores.
    const tokens = tokenize(`${d.title}\n${d.text}`);
    const tf: Record<string, number> = {};
    for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
    for (const t of Object.keys(tf)) df[t] = (df[t] ?? 0) + 1;
    totalLen += tokens.length;
    indexed.push({
      id: d.id,
      title: d.title,
      path: d.path,
      source: d.source,
      len: tokens.length,
      tf,
      text: d.text,
    });
  }

  const n = indexed.length;
  return { docs: indexed, df, avgdl: n > 0 ? totalLen / n : 0, n };
}

/**
 * Rank documents for `query`, returning the top `limit` hits (highest score
 * first; ties broken by stable id order). Returns `[]` for an empty query or
 * empty index. Each hit carries a match-centered excerpt.
 */
export function bm25Search(index: Bm25Index, query: string, limit = 5): SearchHit[] {
  if (index.n === 0) return [];
  const qTokens = Array.from(new Set(tokenize(query)));
  if (qTokens.length === 0) return [];

  const avgdl = index.avgdl || 1;
  const scored: Array<{ doc: IndexedDoc; score: number }> = [];

  for (const doc of index.docs) {
    let score = 0;
    for (const t of qTokens) {
      const tf = doc.tf[t];
      if (!tf) continue;
      const df = index.df[t] ?? 0;
      const idf = Math.log(1 + (index.n - df + 0.5) / (df + 0.5));
      const denom = tf + K1 * (1 - B + B * (doc.len / avgdl));
      score += idf * ((tf * (K1 + 1)) / denom);
    }
    if (score > 0) scored.push({ doc, score });
  }

  scored.sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id));

  return scored.slice(0, Math.max(0, limit)).map(({ doc, score }) => ({
    id: doc.id,
    title: doc.title,
    path: doc.path,
    source: doc.source,
    score,
    excerpt: makeExcerpt(doc.text, query),
  }));
}

/** Collapse runs of whitespace to single spaces. */
function collapse(s: string): string {
  return s.replace(/\s+/g, ' ');
}

/**
 * Build a short excerpt centered on the earliest query-term match. Positioning
 * runs on the lowercased (length-preserving) text so slice offsets stay valid;
 * when no term is found (e.g. an accent-only mismatch) it falls back to the
 * document lead. Cosmetic only — scoring is unaffected.
 */
function makeExcerpt(text: string, query: string, radius = 160): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2);

  let pos = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  }

  if (pos === -1) {
    return collapse(text.slice(0, radius * 2)).trim();
  }

  const start = Math.max(0, pos - radius);
  const end = Math.min(text.length, pos + radius);
  let snippet = collapse(text.slice(start, end)).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;
  return snippet;
}
