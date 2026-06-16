"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { addServiceRecord } from "@/lib/db/queries";
import { MAINTENANCE_INTERVALS } from "@/data";

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
