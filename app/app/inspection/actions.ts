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

  const pasted = String(formData.get("text") ?? "").trim();
  let sourceText = pasted;

  // Optional upload: photo of the sheet or a PDF (OCR'd via vision / pdf text).
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const { extractTextFromUpload } = await import("@/lib/integrations/ocr");
    const ocr = await extractTextFromUpload(await file.arrayBuffer(), file.type, file.name);
    if (ocr.text) sourceText = [pasted, ocr.text].filter(Boolean).join("\n");
    else if (!pasted) return { ok: false, error: ocr.note ?? "Couldn't read that file. Paste the text instead." };
  }

  if (!sourceText) return { ok: false, error: "Paste your shop's inspection sheet, or upload a photo/PDF of it." };

  const result = await digitizeInspection({ text: sourceText, vehicle: toVehicle(active) });

  // Save the owner's own inspection to their records + RAG (not an outbound side-effect).
  try {
    const doc = await addDocument(active.id, {
      kind: "inspection",
      fileName: `Inspection — ${new Date().toISOString().slice(0, 10)}`,
      extractedText: sourceText,
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
