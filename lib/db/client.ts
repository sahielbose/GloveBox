import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres + Drizzle client. Constructed eagerly so the Auth.js Drizzle adapter
 * can detect the dialect, but postgres.js does NOT open a connection until the
 * first query. During `next build` (page-data collection evaluates route
 * modules) DATABASE_URL may be absent — we use a placeholder that is never
 * queried, so the build succeeds. At runtime a missing DATABASE_URL throws a
 * clear error. Cached on globalThis so dev hot-reload reuses one pool.
 */
function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  // Build phase only — this string is never connected to (no queries run).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://build:build@127.0.0.1:5432/build";
  }
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and point it at a " +
      "Postgres instance with pgvector (the docker-compose service provides one).",
  );
}

const g = globalThis as unknown as {
  __gb_sql?: ReturnType<typeof postgres>;
  __gb_db?: ReturnType<typeof drizzle<typeof schema>>;
};

export const sql =
  g.__gb_sql ??
  postgres(connectionString(), {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    prepare: false,
  });

export const db = g.__gb_db ?? drizzle(sql, { schema, casing: "camelCase" });

if (process.env.NODE_ENV !== "production") {
  g.__gb_sql = sql;
  g.__gb_db = db;
}

export { schema };
