"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { addServiceRecord, deleteServiceRecord, toVehicle } from "@/lib/db/queries";
import { structureServiceEntry } from "@/lib/services/structureServiceEntry";
import { transcribeAudio } from "@/lib/integrations/stt";
import { saveFile } from "@/lib/integrations/storage";

export type AddEntryResult =
  | {
      ok: true;
      saved: {
        type: string;
        description: string;
        mileage: number | null;
        costCents: number | null;
        source: "manual" | "voice";
        receiptUrl: string | null;
        llmUsed: boolean;
      };
    }
  | { ok: false; error: string };

/**
 * Add a service-log entry from text OR voice, with an optional receipt file.
 * - If an audio blob is present, transcribe it (Whisper); if STT is unavailable,
 *   tell the user to type instead.
 * - Structure the (transcribed or typed) text into a record, then save it.
 * Saving is the explicit action — the client only POSTs here on the user's click.
 */
export async function addLogEntryAction(form: FormData): Promise<AddEntryResult> {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false, error: "No active vehicle." };

  const audio = form.get("audio");
  const hasAudio = audio instanceof File && audio.size > 0;
  let text = (form.get("text") as string | null)?.trim() ?? "";

  if (hasAudio) {
    const bytes = await audio.arrayBuffer();
    const result = await transcribeAudio(bytes, audio.name || "audio.webm");
    if (!result.available) {
      return {
        ok: false,
        error: "Voice transcription isn't configured on this server — please type what you did instead.",
      };
    }
    text = [text, result.text].filter(Boolean).join(" ").trim();
  }

  if (!text) {
    return { ok: false, error: "Tell us what you did — type a note or record a voice memo." };
  }

  const vehicle = toVehicle(active);
  const entry = await structureServiceEntry(text, vehicle);

  // Optional receipt → stored file → receiptUrl (served by the authed /api/files route).
  let receiptUrl: string | null = null;
  const receipt = form.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const bytes = await receipt.arrayBuffer();
    const stored = await saveFile(active.id, receipt.name || "receipt", bytes);
    receiptUrl = stored.url;
  }

  const source: "manual" | "voice" = hasAudio ? "voice" : "manual";

  await addServiceRecord(active.id, {
    date: entry.date ? new Date(entry.date) : new Date(),
    mileage: entry.mileage ?? active.mileage,
    type: entry.type,
    jobKey: entry.jobKey,
    description: entry.description,
    parts: entry.parts,
    laborHours: entry.laborHours,
    costCents: entry.costCents,
    source,
    receiptUrl,
  });

  revalidatePath("/app/log");
  return {
    ok: true,
    saved: {
      type: entry.type,
      description: entry.description,
      mileage: entry.mileage ?? active.mileage,
      costCents: entry.costCents,
      source,
      receiptUrl,
      llmUsed: entry.llmUsed,
    },
  };
}

/**
 * Delete a service record (ownership re-checked via active vehicle).
 * Used as a direct `<form action>` — reads the record id from FormData.
 */
export async function deleteLogEntryAction(form: FormData) {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return;

  const id = form.get("id");
  if (typeof id !== "string" || !id) return;

  await deleteServiceRecord(active.id, id);
  revalidatePath("/app/log");
}
