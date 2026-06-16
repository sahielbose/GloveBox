import { z } from "zod";
import { MAINTENANCE_INTERVALS, MAINTENANCE_DISCLAIMER } from "@/data";
import type { Status } from "@/lib/status";
import type { Vehicle } from "./types";

export type ServiceHistoryItem = {
  type: string;
  jobKey?: string | null;
  mileage?: number | null;
  date?: Date | string | null;
};

export const MaintenanceItemSchema = z.object({
  service: z.string(),
  category: z.string(),
  status: z.enum(["ok", "soon", "alert"]),
  dueMileage: z.number().int().nullable(),
  dueDate: z.string().nullable(),
  intervalMiles: z.number().int().nullable(),
  intervalMonths: z.number().int().nullable(),
  jobKey: z.string().nullable(),
  safetyCritical: z.boolean(),
  note: z.string(),
  reason: z.string(),
});
export type MaintenanceItem = z.infer<typeof MaintenanceItemSchema>;

export const HealthResultSchema = z.object({
  overall: z.enum(["ok", "soon", "alert"]),
  counts: z.object({ ok: z.number(), soon: z.number(), alert: z.number() }),
  items: z.array(MaintenanceItemSchema),
  disclaimer: z.string(),
});
export type HealthResult = z.infer<typeof HealthResultSchema>;

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

/**
 * computeHealth — deterministic rules over curated intervals + the car's service
 * history. Each item is OK / soon / overdue by mileage AND time, whichever comes
 * first. Safety-critical overdue items escalate to alert. Estimates only.
 */
export function computeHealth(
  vehicle: Vehicle,
  mileage: number,
  history: ServiceHistoryItem[],
  now: Date = new Date(),
): HealthResult {
  const items: MaintenanceItem[] = MAINTENANCE_INTERVALS.map((iv) => {
    const last = lastServiceFor(iv.service, iv.jobKey, history);
    const lastMiles = last?.mileage ?? 0;
    const lastDate = last?.date ? new Date(last.date) : null;

    const dueMileage = iv.intervalMiles != null ? lastMiles + iv.intervalMiles : null;
    const dueDate =
      iv.intervalMonths != null
        ? new Date((lastDate ?? now).getTime() + iv.intervalMonths * MS_PER_MONTH)
        : null;

    const { status, reason } = evaluate(iv.intervalMiles, mileage, dueMileage, dueDate, now, !!iv.safetyCritical);

    return MaintenanceItemSchema.parse({
      service: iv.service,
      category: iv.category,
      status,
      dueMileage,
      dueDate: dueDate ? dueDate.toISOString() : null,
      intervalMiles: iv.intervalMiles ?? null,
      intervalMonths: iv.intervalMonths ?? null,
      jobKey: iv.jobKey ?? null,
      safetyCritical: !!iv.safetyCritical,
      note: iv.note,
      reason,
    });
  });

  const counts = { ok: 0, soon: 0, alert: 0 };
  for (const it of items) counts[it.status]++;
  const overall: Status = counts.alert > 0 ? "alert" : counts.soon > 0 ? "soon" : "ok";

  return HealthResultSchema.parse({
    overall,
    counts,
    items: items.sort((a, b) => rank(b.status) - rank(a.status)),
    disclaimer: MAINTENANCE_DISCLAIMER,
  });
}

function evaluate(
  intervalMiles: number | undefined,
  mileage: number,
  dueMileage: number | null,
  dueDate: Date | null,
  now: Date,
  safety: boolean,
): { status: Status; reason: string } {
  let status: Status = "ok";
  const reasons: string[] = [];

  if (dueMileage != null && intervalMiles != null) {
    const milesLeft = dueMileage - mileage;
    const soonWindow = Math.max(500, intervalMiles * 0.1);
    if (milesLeft <= 0) {
      status = "alert";
      reasons.push(`${Math.abs(milesLeft).toLocaleString()} mi overdue`);
    } else if (milesLeft <= soonWindow) {
      status = worse(status, "soon");
      reasons.push(`due in ~${milesLeft.toLocaleString()} mi`);
    } else {
      reasons.push(`~${milesLeft.toLocaleString()} mi to go`);
    }
  }

  if (dueDate) {
    const monthsLeft = (dueDate.getTime() - now.getTime()) / MS_PER_MONTH;
    if (monthsLeft <= 0) {
      status = worse(status, "alert");
      reasons.push(`${Math.abs(Math.round(monthsLeft))} mo overdue`);
    } else if (monthsLeft <= 1) {
      status = worse(status, "soon");
      reasons.push(`due within a month`);
    }
  }

  // Safety-critical items don't get downgraded, but an overdue one is always alert.
  if (safety && status !== "ok") status = status === "soon" ? "soon" : "alert";

  return { status, reason: reasons.join(" · ") || "on track" };
}

function lastServiceFor(
  service: string,
  jobKey: string | undefined,
  history: ServiceHistoryItem[],
): ServiceHistoryItem | null {
  const svcWords = service.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  const matches = history.filter((h) => {
    if (jobKey && h.jobKey && h.jobKey === jobKey) return true;
    const t = `${h.type ?? ""}`.toLowerCase();
    return svcWords.some((w) => t.includes(w));
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => (b.mileage ?? 0) - (a.mileage ?? 0))[0];
}

const RANKS: Record<Status, number> = { ok: 0, soon: 1, alert: 2 };
const rank = (s: Status) => RANKS[s];
const worse = (a: Status, b: Status): Status => (RANKS[a] >= RANKS[b] ? a : b);
