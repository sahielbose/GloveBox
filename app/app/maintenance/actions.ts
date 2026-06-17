"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { addServiceRecord, getUser, createReminder } from "@/lib/db/queries";
import { MAINTENANCE_INTERVALS } from "@/data";

/**
 * Set a reminder for a due maintenance item. Confirm-gated: only called from an
 * explicit in-UI confirm. Creates a "scheduled" reminder (already confirmed) that
 * reminder.fire sends via the user's chosen channel. Never auto-sends.
 */
export async function setMaintenanceReminderAction(service: string, dueDateIso: string | null) {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false as const, error: "No active vehicle." };

  const u = await getUser(user.id);
  const channel = u?.reminderChannel ?? "email";
  if (channel === "none") {
    return { ok: false as const, error: "Reminders are off — turn on a channel in Settings first." };
  }

  const due = dueDateIso ? new Date(dueDateIso) : null;
  const scheduleAt =
    due && due.getTime() > Date.now() ? due : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const label = [active.year, active.make, active.model].filter(Boolean).join(" ");

  await createReminder({
    userId: user.id,
    vehicleId: active.id,
    kind: "maintenance",
    channel,
    title: `${service} is due on your ${label}`,
    body: `Heads up from GloveBox: ${service} is due. Open the app to mark it done or sanity-check a quote.`,
    scheduleAt,
    status: "scheduled",
  });

  revalidatePath("/app/maintenance");
  return { ok: true as const, scheduledFor: scheduleAt.toISOString(), channel };
}

/**
 * Mark a maintenance item done → writes a service record at the car's current
 * mileage, then revalidates the timeline so the item recomputes as fresh.
 * Re-checks auth + active vehicle server-side; never trusts the client for ownership.
 */
export async function markServiceDoneAction(service: string) {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false as const, error: "No active vehicle." };

  // Carry the interval's jobKey so future computeHealth runs match this record
  // precisely (not just by service-name keyword).
  const jobKey = MAINTENANCE_INTERVALS.find((iv) => iv.service === service)?.jobKey ?? null;

  await addServiceRecord(active.id, {
    date: new Date(),
    mileage: active.mileage,
    type: service,
    jobKey,
    source: "maintenance",
    description: "Marked done from maintenance",
  });

  revalidatePath("/app/maintenance");
  return { ok: true as const };
}
