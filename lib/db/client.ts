import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Cached singleton Postgres + Drizzle client. Cached on globalThis so Next.js
 * dev hot-reload doesn't open a new pool on every change.
 */
const globalForDb = globalThis as unknown as {
  __gb_sql?: ReturnType<typeof postgres>;
  __gb_db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at a " +
        "Postgres instance with pgvector (the docker-compose service provides one).",
    );
  }
  return url;
}

export const sql =
  globalForDb.__gb_sql ??
  postgres(getConnectionString(), {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    prepare: false,
  });

export const db =
  globalForDb.__gb_db ?? drizzle(sql, { schema, casing: "camelCase" });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__gb_sql = sql;
  globalForDb.__gb_db = db;
}

export { schema };
