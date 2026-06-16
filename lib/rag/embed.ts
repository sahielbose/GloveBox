import OpenAI from "openai";

/**
 * Embedder behind a stable 1536-dim interface. Uses OpenAI text-embedding-3-small
 * when OPENAI_API_KEY is set; otherwise a deterministic local hashing embedder so
 * RAG still works offline (lexical-ish retrieval) and self-hosters aren't blocked.
 * The local path is clearly a fallback — swap in transformers.js for better local
 * semantics if desired.
 */
export const EMBED_DIM = 1536;

export function embeddingMode(): "openai" | "local" {
  return process.env.OPENAI_API_KEY ? "openai" : "local";
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.embeddings.create({
      model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: texts,
    });
    return res.data.map((d) => d.embedding as number[]);
  }
  return texts.map(localEmbed);
}

export async function embedOne(text: string): Promise<number[]> {
  return (await embed([text]))[0];
}

/** Deterministic hashing bag-of-words embedding, L2-normalized to 1536 dims. */
function localEmbed(text: string): number[] {
  const vec = new Array<number>(EMBED_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
  for (const tok of tokens) {
    const h = hash(tok);
    const idx = h % EMBED_DIM;
    const sign = (hash(tok + "#") & 1) === 0 ? 1 : -1;
    vec[idx] += sign;
  }
  let norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
  if (norm === 0) norm = 1;
  return vec.map((x) => x / norm);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
