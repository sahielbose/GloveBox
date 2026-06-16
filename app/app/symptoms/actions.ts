"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle, saveSymptomReport, addServiceRecord } from "@/lib/db/queries";
import { decodeSymptom, type SymptomResult } from "@/lib/services/decodeSymptom";
import { generateRepairStory, type RepairStory } from "@/lib/services/generateRepairStory";

/* ── Decode a symptom / DTC ────────────────────────────────────────────────── */

export type SymptomState =
  | { ok: true; result: SymptomResult; input: string }
  | { ok: false; error: string }
  | null;

export async function runDecodeSymptom(
  _prev: SymptomState,
  formData: FormData,
): Promise<SymptomState> {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) {
    return { ok: false, error: "Add a car first so we can decode this for your exact vehicle." };
  }

  const text = String(formData.get("text") ?? "").trim();
  const dtc = String(formData.get("dtc") ?? "").trim();

  if (!text && !dtc) {
    return {
      ok: false,
      error: "Describe what you're noticing, or enter a trouble code (e.g. P0301).",
    };
  }

  const result = await decodeSymptom({
    text: text || undefined,
    dtc: dtc || undefined,
    vehicle: toVehicle(active),
  });

  await saveSymptomReport(active.id, {
    input: text || undefined,
    dtcCode: result.dtcCode ?? undefined,
    causes: result.causes,
    urgency: result.urgency,
    estLowCents: result.costLowCents ?? undefined,
    estHighCents: result.costHighCents ?? undefined,
    summary: result.summary,
  });

  revalidatePath("/app/symptoms");

  return { ok: true, result, input: text };
}

/* ── Repair story (Complaint / Cause / Correction) ─────────────────────────── */

export type RepairStoryState =
  | { ok: true; story: RepairStory; symptom: string; diagnosis: string; saved: boolean }
  | { ok: false; error: string }
  | null;

/**
 * Generate a Complaint/Cause/Correction story from a symptom + the top likely
 * cause. If `confirmSave` is set, also write it to the service log as an explicit,
 * user-confirmed action (type "Repair story"). Drafting is free; saving is gated.
 */
export async function runRepairStory(
  _prev: RepairStoryState,
  formData: FormData,
): Promise<RepairStoryState> {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) {
    return { ok: false, error: "Add a car first to save a repair story to its log." };
  }

  const symptom = String(formData.get("symptom") ?? "").trim();
  const diagnosis = String(formData.get("diagnosis") ?? "").trim();
  const confirmSave = String(formData.get("confirmSave") ?? "") === "1";

  if (!symptom && !diagnosis) {
    return { ok: false, error: "Need a symptom and a likely cause to build a repair story." };
  }

  const story = await generateRepairStory({
    symptom,
    diagnosis,
    vehicle: toVehicle(active),
  });

  let saved = false;
  if (confirmSave) {
    await addServiceRecord(active.id, {
      date: new Date(),
      mileage: active.mileage ?? undefined,
      type: "Repair story",
      description: `Complaint: ${story.complaint}\nCause: ${story.cause}\nCorrection: ${story.correction}`,
      source: "manual",
    });
    saved = true;
    revalidatePath("/app/symptoms");
  }

  return { ok: true, story, symptom, diagnosis, saved };
}
