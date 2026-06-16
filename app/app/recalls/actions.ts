"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { syncRecalls, createReminder, toVehicle } from "@/lib/db/queries";
import { draftBookingScript } from "@/lib/services/sideEffects";
import { vehicleLabel } from "@/lib/services/types";

/** Refresh recalls from official feeds (NHTSA/CPSC), then revalidate the radar. */
export async function refreshRecallsAction() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false as const, error: "No active vehicle." };

  const { fresh } = await syncRecalls(active.id, toVehicle(active));
  revalidatePath("/app/recalls");
  return { ok: true as const, freshCount: fresh.length };
}

/**
 * Prep a visit: DRAFT a call/booking script for a recall. No side effects — this
 * only prepares text the owner reads and uses to book the (free) dealer repair.
 */
export async function draftRecallScriptAction(input: {
  campaignId: string;
  component: string;
  remedy: string;
}) {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false as const, error: "No active vehicle." };

  const script = draftBookingScript(toVehicle(active), {
    campaignId: input.campaignId,
    component: input.component,
    remedy: input.remedy,
  });
  return { ok: true as const, script };
}

/**
 * CONFIRM-GATED: schedule a reminder to book the recall repair. Runs ONLY on an
 * explicit user click. Creates a `scheduled` reminder ~2 days out; we never book
 * or pay — the reminder just nudges the owner to call the dealer themselves.
 */
export async function scheduleRecallReminderAction(input: {
  campaignId: string;
  component: string;
  script: string;
}) {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false as const, error: "No active vehicle." };

  await createReminder({
    userId: user.id,
    vehicleId: active.id,
    kind: "recall",
    channel: "email",
    title: `Book recall repair — ${input.component} (${input.campaignId})`,
    body: input.script,
    scheduleAt: new Date(Date.now() + 2 * 86400000),
    status: "scheduled",
  });

  revalidatePath("/app/recalls");
  return {
    ok: true as const,
    scheduledFor: vehicleLabel(active),
  };
}
