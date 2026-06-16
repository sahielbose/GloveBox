"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle, addDocument } from "@/lib/db/queries";
import { digitizeInspection, type InspectionResult } from "@/lib/services/digitizeInspection";
import { ingestChunks } from "@/lib/rag";

export type InspectionState =
  | { ok: true; result: InspectionResult }
  | { ok: false; error: string }
  | { ok: null };

export async function runDigitize(
  _prev: InspectionState,
  formData: FormData,
): Promise<InspectionState> {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) return { ok: false, error: "Add a car first." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { ok: false, error: "Paste your shop's inspection sheet first." };

  const result = await digitizeInspection({ text, vehicle: toVehicle(active) });

  // Save the owner's own inspection to their records + RAG (not an outbound side-effect).
  try {
    const doc = await addDocument(active.id, {
      kind: "inspection",
      fileName: `Inspection — ${new Date().toISOString().slice(0, 10)}`,
      extractedText: text,
    });
    await ingestChunks(active.id, [
      {
        kind: "document",
        content: `Shop inspection result: ${result.summary} Items: ${result.items
          .map((i) => `${i.item} = ${i.status}${i.measurement ? ` (${i.measurement})` : ""}`)
          .join("; ")}`,
        sourceLabel: doc.fileName ?? "Shop inspection",
        documentId: doc.id,
      },
    ]);
  } catch {
    // persistence/RAG is best-effort; the digitized result still returns
  }

  revalidatePath("/app/inspection");
  return { ok: true, result };
}
