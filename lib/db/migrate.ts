import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/**
 * Migration runner. Ensures the pgvector extension exists BEFORE applying
 * migrations (the chunk table declares a `vector(1536)` column), then applies
 * every generated migration in ./drizzle.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const sql = postgres(url, { max: 1 });
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✓ migrations applied");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("migration failed:", err);
  process.exit(1);
});
