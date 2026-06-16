import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { chunks } from "@/lib/db/schema";
import { embed, embedOne } from "./embed";

export { EMBED_DIM, embeddingMode } from "./embed";

export type ChunkKind = "document" | "recall" | "safety" | "maintenance";

export type IngestItem = {
  content: string;
  kind: ChunkKind;
  sourceLabel: string;
  sourceUrl?: string;
  documentId?: string;
};

export type RetrievedChunk = {
  id: string;
  content: string;
  kind: string;
  sourceLabel: string;
  sourceUrl: string | null;
  similarity: number;
};

/** Split long text into overlapping word-window chunks for embedding. */
export function chunkText(text: string, windowWords = 180, overlap = 30): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= windowWords) return words.length ? [words.join(" ")] : [];
  const out: string[] = [];
  for (let i = 0; i < words.length; i += windowWords - overlap) {
    out.push(words.slice(i, i + windowWords).join(" "));
    if (i + windowWords >= words.length) break;
  }
  return out;
}

/** Embed + insert chunks for a vehicle. */
export async function ingestChunks(
  vehicleId: string,
  items: IngestItem[],
): Promise<number> {
  if (items.length === 0) return 0;
  const vectors = await embed(items.map((i) => i.content));
  await db.insert(chunks).values(
    items.map((it, i) => ({
      vehicleId,
      documentId: it.documentId ?? null,
      kind: it.kind,
      content: it.content,
      sourceLabel: it.sourceLabel,
      sourceUrl: it.sourceUrl ?? null,
      embedding: vectors[i],
    })),
  );
  return items.length;
}

/** Replace all chunks of a given kind for a vehicle (used when re-caching recalls). */
export async function replaceChunks(
  vehicleId: string,
  kind: ChunkKind,
  items: IngestItem[],
): Promise<void> {
  await db.delete(chunks).where(and(eq(chunks.vehicleId, vehicleId), eq(chunks.kind, kind)));
  await ingestChunks(vehicleId, items);
}

/** Cosine-similarity retrieval scoped to one vehicle. */
export async function retrieve(
  vehicleId: string,
  query: string,
  k = 6,
  minSimilarity = 0.12,
): Promise<RetrievedChunk[]> {
  const q = await embedOne(query);
  const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, q)})`;
  const rows = await db
    .select({
      id: chunks.id,
      content: chunks.content,
      kind: chunks.kind,
      sourceLabel: chunks.sourceLabel,
      sourceUrl: chunks.sourceUrl,
      similarity,
    })
    .from(chunks)
    .where(and(eq(chunks.vehicleId, vehicleId), gt(similarity, minSimilarity)))
    .orderBy(desc(similarity))
    .limit(k);
  return rows;
}
