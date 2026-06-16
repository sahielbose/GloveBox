"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth-helpers";
import { ACTIVE_VEHICLE_COOKIE } from "@/lib/app-context";
import {
  getUserVehicles,
  getVehicleForUser,
  updateVehicle,
  deleteVehicle,
  addDocument,
} from "@/lib/db/queries";
import { saveFile } from "@/lib/integrations/storage";
import { chunkText, ingestChunks } from "@/lib/rag";

export type FormResult = { ok: boolean; message?: string };

const REVALIDATE = ["/app/vehicle", "/app"] as const;
function revalidate() {
  for (const p of REVALIDATE) revalidatePath(p);
}

/* ── Mileage ──────────────────────────────────────────────────────────────── */

export async function updateMileageAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const mileage = Number(String(formData.get("mileage") ?? "").trim());

  if (!Number.isFinite(mileage) || mileage < 0) {
    return { ok: false, message: "Enter a valid mileage." };
  }
  const updated = await updateVehicle(user.id, vehicleId, { mileage });
  if (!updated) return { ok: false, message: "Couldn't find that car." };

  revalidate();
  return { ok: true, message: "Mileage updated." };
}

/* ── Nickname ─────────────────────────────────────────────────────────────── */

export async function setNicknameAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();

  const updated = await updateVehicle(user.id, vehicleId, { nickname: nickname || null });
  if (!updated) return { ok: false, message: "Couldn't find that car." };

  revalidate();
  return { ok: true, message: nickname ? "Nickname saved." : "Nickname cleared." };
}

/* ── Primary / switch active ──────────────────────────────────────────────── */

export async function setPrimaryAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");

  const owned = await getVehicleForUser(user.id, vehicleId);
  if (!owned) return { ok: false, message: "Couldn't find that car." };

  // One primary per user — clear the others, set this one.
  const all = await getUserVehicles(user.id);
  for (const v of all) {
    if (v.isPrimary && v.id !== vehicleId) {
      await updateVehicle(user.id, v.id, { isPrimary: false });
    }
  }
  await updateVehicle(user.id, vehicleId, { isPrimary: true });

  // Also make it the active selection for the session.
  const c = await cookies();
  c.set(ACTIVE_VEHICLE_COOKIE, vehicleId, { path: "/", httpOnly: false, sameSite: "lax" });

  revalidate();
  return { ok: true, message: "Set as your primary car." };
}

/** Switch the active vehicle in the session (without changing the primary). */
export async function switchActiveAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const owned = await getVehicleForUser(user.id, vehicleId);
  if (!owned) return;

  const c = await cookies();
  c.set(ACTIVE_VEHICLE_COOKIE, vehicleId, { path: "/", httpOnly: false, sameSite: "lax" });
  revalidate();
  redirect("/app/vehicle");
}

/* ── Delete (confirm-gated, destructive) ──────────────────────────────────── */

export async function deleteVehicleAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  // Two-step confirm: the UI must echo the word CONFIRM before we delete.
  const confirm = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirm !== "DELETE") {
    return { ok: false, message: 'Type DELETE to confirm removing this car.' };
  }

  const ok = await deleteVehicle(user.id, vehicleId);
  if (!ok) return { ok: false, message: "Couldn't find that car." };

  // Clear the active selection if it pointed at the deleted car; fall back to another.
  const remaining = await getUserVehicles(user.id);
  const c = await cookies();
  if (remaining.length > 0) {
    c.set(ACTIVE_VEHICLE_COOKIE, remaining[0].id, { path: "/", httpOnly: false, sameSite: "lax" });
  } else {
    c.delete(ACTIVE_VEHICLE_COOKIE);
  }

  revalidate();
  redirect(remaining.length > 0 ? "/app/vehicle" : "/app/onboarding");
}

/* ── Document upload (storage + record + best-effort RAG) ─────────────────── */

export async function uploadDocumentAction(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const user = await requireUser();
  const vehicleId = String(formData.get("vehicleId") ?? "");
  const kind = String(formData.get("kind") ?? "other");
  const pastedText = String(formData.get("text") ?? "").trim();
  const file = formData.get("file") as File | null;

  const owned = await getVehicleForUser(user.id, vehicleId);
  if (!owned) return { ok: false, message: "Couldn't find that car." };

  const hasFile = !!file && typeof file.name === "string" && file.size > 0;
  if (!hasFile && !pastedText) {
    return { ok: false, message: "Attach a file or paste some document text." };
  }

  // 1) Store the file (local in dev), if one was attached, and OCR/extract its
  //    text so uploaded manuals/insurance PDFs & photos reach RAG (spec §3/§11).
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let ocrText = "";
  if (hasFile) {
    const bytes = await file.arrayBuffer();
    const saved = await saveFile(vehicleId, file.name, bytes);
    fileUrl = saved.url;
    fileName = file.name;
    if (!pastedText) {
      try {
        const { extractTextFromUpload } = await import("@/lib/integrations/ocr");
        const ocr = await extractTextFromUpload(bytes, file.type, file.name);
        ocrText = ocr.text;
      } catch {
        // OCR is best-effort — the file is still saved.
      }
    }
  }

  const extractedText = pastedText || ocrText || null;

  // 2) Record the document.
  const doc = await addDocument(vehicleId, {
    kind,
    fileName,
    fileUrl,
    extractedText,
  });

  // 3) Best-effort RAG ingest when we have text to ground on.
  if (extractedText) {
    try {
      const sourceLabel = fileName ? `${prettyKind(kind)} · ${fileName}` : prettyKind(kind);
      const pieces = chunkText(extractedText).map((content) => ({
        content,
        kind: "document" as const,
        sourceLabel,
        sourceUrl: fileUrl ?? undefined,
        documentId: doc.id,
      }));
      if (pieces.length) await ingestChunks(vehicleId, pieces);
    } catch {
      // RAG ingestion is best-effort — the document is still saved.
    }
  }

  revalidate();
  return {
    ok: true,
    message: extractedText
      ? "Document saved and added to Ask GloveBox."
      : "Document saved.",
  };
}

function prettyKind(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
