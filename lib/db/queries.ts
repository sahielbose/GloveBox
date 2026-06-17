import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./client";
import {
  vehicles,
  serviceRecords,
  quoteChecks,
  symptomReports,
  recallMatches,
  documents,
  reminders,
  users,
} from "./schema";
import type { Vehicle } from "@/lib/services/types";
import { findRecalls } from "@/lib/services/findRecalls";
import { replaceChunks } from "@/lib/rag";

/** DB vehicle row → the canonical Vehicle the verbs use. */
export function toVehicle(v: typeof vehicles.$inferSelect): Vehicle & { id: string } {
  return {
    id: v.id,
    vin: v.vin,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    engine: v.engine,
    mileage: v.mileage,
  };
}

/* ── Vehicles ──────────────────────────────────────────────────────────────── */

export async function getUserVehicles(userId: string) {
  return db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.isPrimary), desc(vehicles.createdAt));
}

export async function getVehicleForUser(userId: string, vehicleId: string) {
  const [v] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.userId, userId)))
    .limit(1);
  return v ?? null;
}

export async function getPrimaryVehicle(userId: string) {
  const list = await getUserVehicles(userId);
  return list[0] ?? null;
}

export async function createVehicle(
  userId: string,
  data: Omit<typeof vehicles.$inferInsert, "userId" | "id">,
) {
  const existing = await getUserVehicles(userId);
  const [v] = await db
    .insert(vehicles)
    .values({ ...data, userId, isPrimary: existing.length === 0 })
    .returning();
  return v;
}

export async function updateVehicle(
  userId: string,
  vehicleId: string,
  data: Partial<typeof vehicles.$inferInsert>,
) {
  const owned = await getVehicleForUser(userId, vehicleId);
  if (!owned) return null;
  const [v] = await db
    .update(vehicles)
    .set(data)
    .where(eq(vehicles.id, vehicleId))
    .returning();
  return v;
}

export async function deleteVehicle(userId: string, vehicleId: string) {
  const owned = await getVehicleForUser(userId, vehicleId);
  if (!owned) return false;
  await db.delete(vehicles).where(eq(vehicles.id, vehicleId));
  return true;
}

/* ── Service records ───────────────────────────────────────────────────────── */

export async function addServiceRecord(
  vehicleId: string,
  data: Omit<typeof serviceRecords.$inferInsert, "vehicleId" | "id">,
) {
  const [r] = await db.insert(serviceRecords).values({ ...data, vehicleId }).returning();
  return r;
}

export async function listServiceRecords(vehicleId: string) {
  return db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.vehicleId, vehicleId))
    .orderBy(desc(serviceRecords.date));
}

export async function deleteServiceRecord(vehicleId: string, id: string) {
  await db.delete(serviceRecords).where(and(eq(serviceRecords.id, id), eq(serviceRecords.vehicleId, vehicleId)));
}

/* ── Quote checks ──────────────────────────────────────────────────────────── */

export async function saveQuoteCheck(
  vehicleId: string,
  data: Omit<typeof quoteChecks.$inferInsert, "vehicleId" | "id">,
) {
  const [q] = await db.insert(quoteChecks).values({ ...data, vehicleId }).returning();
  return q;
}

export async function listQuoteChecks(vehicleId: string) {
  return db.select().from(quoteChecks).where(eq(quoteChecks.vehicleId, vehicleId)).orderBy(desc(quoteChecks.createdAt));
}

/* ── Symptom reports ───────────────────────────────────────────────────────── */

export async function saveSymptomReport(
  vehicleId: string,
  data: Omit<typeof symptomReports.$inferInsert, "vehicleId" | "id">,
) {
  const [s] = await db.insert(symptomReports).values({ ...data, vehicleId }).returning();
  return s;
}

export async function listSymptomReports(vehicleId: string) {
  return db.select().from(symptomReports).where(eq(symptomReports.vehicleId, vehicleId)).orderBy(desc(symptomReports.createdAt));
}

/* ── Recalls ───────────────────────────────────────────────────────────────── */

export async function getRecallMatches(vehicleId: string) {
  return db.select().from(recallMatches).where(eq(recallMatches.vehicleId, vehicleId)).orderBy(desc(recallMatches.foundAt));
}

/**
 * Fetch official recalls and upsert (dedupe by source+campaignId). Returns the
 * NEW matches (for confirm-gated notification). Also re-caches recall text into
 * the RAG store for the assistant.
 */
export async function syncRecalls(vehicleId: string, vehicle: Vehicle) {
  const matches = await findRecalls(vehicle);
  const existing = await getRecallMatches(vehicleId);
  const seen = new Set(existing.map((e) => `${e.source}:${e.campaignId}`));

  const fresh = matches.filter((m) => !seen.has(`${m.source}:${m.campaignId}`));
  if (fresh.length > 0) {
    await db.insert(recallMatches).values(
      fresh.map((m) => ({
        vehicleId,
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
        notified: false,
      })),
    );
  }

  // Re-cache all recall text for RAG grounding.
  try {
    await replaceChunks(
      vehicleId,
      "recall",
      matches.map((m) => ({
        kind: "recall" as const,
        content: `Recall ${m.campaignId} (${m.source}) — ${m.component}. ${m.summary} Consequence: ${m.consequence ?? ""} Remedy: ${m.remedy}`,
        sourceLabel: `${m.source} recall ${m.campaignId}`,
        sourceUrl: m.provenanceUrl,
      })),
    );
  } catch {
    // RAG caching is best-effort
  }

  return { all: matches, fresh };
}

export async function markRecallNotified(id: string) {
  await db.update(recallMatches).set({ notified: true }).where(eq(recallMatches.id, id));
}

/** Mark all not-yet-notified recalls for a vehicle as notified (after a digest send). */
export async function markVehicleRecallsNotified(vehicleId: string) {
  await db
    .update(recallMatches)
    .set({ notified: true })
    .where(and(eq(recallMatches.vehicleId, vehicleId), eq(recallMatches.notified, false)));
}

/* ── Documents ─────────────────────────────────────────────────────────────── */

export async function addDocument(
  vehicleId: string,
  data: Omit<typeof documents.$inferInsert, "vehicleId" | "id">,
) {
  const [d] = await db.insert(documents).values({ ...data, vehicleId }).returning();
  return d;
}

export async function listDocuments(vehicleId: string) {
  return db.select().from(documents).where(eq(documents.vehicleId, vehicleId)).orderBy(desc(documents.createdAt));
}

/* ── Reminders ─────────────────────────────────────────────────────────────── */

export async function createReminder(data: typeof reminders.$inferInsert) {
  const [r] = await db.insert(reminders).values(data).returning();
  return r;
}

export async function listReminders(userId: string) {
  return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt));
}

export async function updateReminderStatus(id: string, status: string) {
  await db.update(reminders).set({ status }).where(eq(reminders.id, id));
}

/* ── User settings ─────────────────────────────────────────────────────────── */

export async function getUser(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return u ?? null;
}

export async function updateUserSettings(
  userId: string,
  data: Partial<Pick<typeof users.$inferInsert, "reminderChannel" | "digestFrequency" | "phone" | "name">>,
) {
  await db.update(users).set(data).where(eq(users.id, userId));
}

/** Hard-delete the user row — cascades accounts, sessions, reminders, and vehicles. */
export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
