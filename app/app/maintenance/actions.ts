"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { addServiceRecord } from "@/lib/db/queries";

/**
 * Mark a maintenance item done → writes a service record at the car's current
 * mileage, then revalidates the timeline so the item recomputes as fresh.
 * Re-checks auth + active vehicle server-side; never trusts the client for ownership.
 */
export async function markServiceDoneAction(service: string) {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false as const, error: "No active vehicle." };

  await addServiceRecord(active.id, {
    date: new Date(),
    mileage: active.mileage,
    type: service,
    // jobKey: none — service_record has no jobKey column; the service label drives matching.
    source: "maintenance",
    description: "Marked done from maintenance",
  });

  revalidatePath("/app/maintenance");
  return { ok: true as const };
}
