import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, sql } from "./client";
import { users, vehicles, serviceRecords, recallMatches } from "./schema";
import { findRecalls } from "@/lib/services/findRecalls";
import { ingestMaintenanceSchedule } from "@/lib/rag";

/**
 * Seed an explorable demo account. Idempotent — safe to run on every boot.
 * Sign in as demo@glovebox.local (the magic link prints to the server console
 * when no RESEND_API_KEY is set) to land in a populated app.
 */
const DEMO_EMAIL = "demo@glovebox.local";

async function main() {
  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log(`✓ demo user already seeded (${DEMO_EMAIL}) — skipping`);
    await sql.end();
    return;
  }

  const [user] = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: "Demo Owner", emailVerified: new Date() })
    .returning();

  const [vehicle] = await db
    .insert(vehicles)
    .values({
      userId: user.id,
      vin: "1HGCR2F3XFA027534",
      year: 2015,
      make: "Honda",
      model: "Accord",
      trim: "LX",
      engine: "2.4L 4-cyl",
      mileage: 82000,
      nickname: "The Accord",
      isPrimary: true,
      specs: { bodyClass: "Sedan/Saloon", fuelType: "Gasoline" },
    })
    .returning();

  await db.insert(serviceRecords).values([
    { vehicleId: vehicle.id, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120), mileage: 78000, type: "Oil change", description: "Full synthetic + filter", costCents: 7800, source: "manual" },
    { vehicleId: vehicle.id, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400), mileage: 71000, type: "Front brake pads", description: "Front pads replaced", costCents: 24000, source: "manual" },
    { vehicleId: vehicle.id, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), mileage: 81500, type: "Tire rotation", description: "Rotated + balanced", costCents: 4000, source: "manual" },
  ]);

  // Pull real recalls for the demo car (best-effort).
  try {
    const matches = await findRecalls({
      id: vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year, vin: vehicle.vin,
    });
    if (matches.length > 0) {
      await db.insert(recallMatches).values(
        matches.map((m) => ({
          vehicleId: vehicle.id,
          source: m.source,
          campaignId: m.campaignId,
          component: m.component,
          summary: m.summary,
          severity: m.severity,
          remedy: m.remedy,
          consequence: m.consequence,
          status: m.status,
          provenanceUrl: m.provenanceUrl,
          reportDate: m.reportDate,
          notified: true,
        })),
      );
    }
    console.log(`✓ synced ${matches.length} recalls for the demo Accord`);
  } catch {
    console.log("· recall sync skipped (offline)");
  }

  // Ingest the curated maintenance schedule into the demo car's RAG context.
  try {
    await ingestMaintenanceSchedule(vehicle.id);
    console.log("✓ ingested curated maintenance schedule into RAG");
  } catch (e) {
    console.log("· RAG ingest skipped:", (e as Error).message);
  }

  console.log(`\n✓ Seed complete. Sign in as ${DEMO_EMAIL} to explore.\n`);
  await sql.end();
}

main().catch(async (err) => {
  console.error("seed failed:", err);
  try { await sql.end(); } catch {}
  process.exit(1);
});
