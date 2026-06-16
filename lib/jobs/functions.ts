import { and, eq, lte } from "drizzle-orm";
import { inngest } from "./client";
import { db } from "@/lib/db/client";
import { vehicles, users, reminders } from "@/lib/db/schema";
import { syncRecalls, markRecallNotified, toVehicle } from "@/lib/db/queries";
import { computeHealth } from "@/lib/services/computeHealth";
import { listServiceRecords } from "@/lib/db/queries";
import { sendEmail } from "@/lib/integrations/email";
import { formatMiles } from "@/lib/utils";

/**
 * recall.poll — daily. For every vehicle, fetch official recalls and create new
 * RecallMatch rows. New matches notify the owner via their CONFIRMED channel
 * (settings.reminderChannel) — channel = "none" means no send (respects §9b).
 */
export const recallPoll = inngest.createFunction(
  { id: "recall-poll", name: "Daily recall poll", triggers: [{ cron: "0 13 * * *" }] },
  async ({ step }) => {
    const rows = await db
      .select({ v: vehicles, channel: users.reminderChannel, email: users.email })
      .from(vehicles)
      .innerJoin(users, eq(vehicles.userId, users.id));

    let notified = 0;
    for (const row of rows) {
      try {
        const { fresh } = await step.run(`sync-${row.v.id}`, () =>
          syncRecalls(row.v.id, toVehicle(row.v)),
        );
        if (fresh.length === 0 || row.channel === "none") continue;

        const label = [row.v.year, row.v.make, row.v.model].filter(Boolean).join(" ");
        const body = fresh
          .map((m) => `• [${m.severity.toUpperCase()}] ${m.component} (${m.source} ${m.campaignId})\n  ${m.summary}\n  Remedy: ${m.remedy}\n  ${m.provenanceUrl}`)
          .join("\n\n");
        await sendEmail({
          to: row.email,
          subject: `New recall${fresh.length > 1 ? "s" : ""} for your ${label}`,
          html: `<p>We found ${fresh.length} new recall(s) for your <strong>${label}</strong>.</p><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(body)}</pre><p>Open GloveBox to prep a dealer visit. Recall repairs are free.</p>`,
        });
        notified++;
      } catch {
        // best-effort per vehicle
      }
    }
    return { vehicles: rows.length, notified };
  },
);

/**
 * maintenance.digest — weekly. Opt-in via settings.digestFrequency. Computes
 * what's due and emails a digest. digestFrequency = "off" skips.
 */
export const maintenanceDigest = inngest.createFunction(
  { id: "maintenance-digest", name: "Maintenance digest", triggers: [{ cron: "0 14 * * 1" }] }, // Mondays
  async () => {
    const rows = await db
      .select({ v: vehicles, freq: users.digestFrequency, email: users.email })
      .from(vehicles)
      .innerJoin(users, eq(vehicles.userId, users.id));

    let sent = 0;
    for (const row of rows) {
      if (row.freq === "off") continue;
      try {
        const records = await listServiceRecords(row.v.id);
        const health = computeHealth(
          toVehicle(row.v),
          row.v.mileage,
          records.map((r) => ({ type: r.type, jobKey: r.jobKey, mileage: r.mileage, date: r.date })),
        );
        const due = health.items.filter((i) => i.status !== "ok");
        if (due.length === 0) continue;

        const label = [row.v.year, row.v.make, row.v.model].filter(Boolean).join(" ");
        const body = due
          .map((i) => `• [${i.status.toUpperCase()}] ${i.service} — ${i.reason}`)
          .join("\n");
        await sendEmail({
          to: row.email,
          subject: `What's due on your ${label}`,
          html: `<p>Maintenance check for your <strong>${label}</strong> (${formatMiles(row.v.mileage)}):</p><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(body)}</pre><p style="color:#888">Estimates — confirm against your owner's manual.</p>`,
        });
        sent++;
      } catch {
        // best-effort
      }
    }
    return { sent };
  },
);

/**
 * reminder.fire — every 15 min. Sends reminders the user already CONFIRMED
 * (status "scheduled") whose time has arrived. Drafts are never sent.
 */
export const reminderFire = inngest.createFunction(
  { id: "reminder-fire", name: "Fire due reminders", triggers: [{ cron: "*/15 * * * *" }] },
  async () => {
    const due = await db
      .select({ r: reminders, email: users.email })
      .from(reminders)
      .innerJoin(users, eq(reminders.userId, users.id))
      .where(and(eq(reminders.status, "scheduled"), lte(reminders.scheduleAt, new Date())));

    let fired = 0;
    for (const row of due) {
      try {
        await sendEmail({
          to: row.email,
          subject: row.r.title,
          html: `<p>${escapeHtml(row.r.body ?? row.r.title)}</p><p style="color:#888">A reminder you set in GloveBox.</p>`,
        });
        await db.update(reminders).set({ status: "sent" }).where(eq(reminders.id, row.r.id));
        fired++;
      } catch {
        // best-effort
      }
    }
    return { fired };
  },
);

export const functions = [recallPoll, maintenanceDigest, reminderFire];

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
