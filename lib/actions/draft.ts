"use server";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle } from "@/lib/db/queries";
import { draftShopMessage } from "@/lib/services/sideEffects";

/**
 * Draft a message to a shop. Returns the draft ONLY — it never sends. The owner
 * reviews and sends it themselves (confirm gate §9b).
 */
export async function draftShopMessageAction(
  kind: "quote" | "symptom" | "recall" | "general",
  detail: string,
): Promise<{ ok: boolean; draft?: string; error?: string }> {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false, error: "No active vehicle." };
  const draft = await draftShopMessage(toVehicle(active), { kind, detail: detail.slice(0, 1000) });
  return { ok: true, draft };
}
