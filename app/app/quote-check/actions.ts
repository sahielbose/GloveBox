"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle, saveQuoteCheck } from "@/lib/db/queries";
import {
  checkQuote,
  parseEstimateText,
  type LineItem,
  type QuoteCheckResult,
} from "@/lib/services/checkQuote";

/* ── State shapes for useActionState ───────────────────────────────────────── */

export type QuoteCheckState =
  | { ok: true; result: QuoteCheckResult; shopName: string | null; region: string | null }
  | { ok: false; error: string }
  | null;

/** A manually-entered line item arrives as a triple of parallel form fields. */
function readManualLineItems(formData: FormData): LineItem[] {
  const descriptions = formData.getAll("itemDescription").map((v) => String(v));
  const prices = formData.getAll("itemPrice").map((v) => String(v));
  const hours = formData.getAll("itemHours").map((v) => String(v));

  const items: LineItem[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]?.trim();
    const priceRaw = (prices[i] ?? "").replace(/[$,\s]/g, "");
    const price = Number(priceRaw);
    if (!description || !priceRaw || Number.isNaN(price) || price <= 0) continue;
    const laborHours = Number((hours[i] ?? "").trim());
    items.push({
      description,
      priceCents: Math.round(price * 100),
      laborHours: Number.isFinite(laborHours) && laborHours > 0 ? laborHours : undefined,
    });
  }
  return items;
}

/**
 * Quote Check ★ — parse the pasted estimate (and/or manual line items), run the
 * deterministic curated pricing check, persist to history, and return the
 * verdict for inline rendering. Read-only against external services; the only
 * mutation is the saved history row, so no extra confirm gate is required.
 */
export async function runQuoteCheck(
  _prev: QuoteCheckState,
  formData: FormData,
): Promise<QuoteCheckState> {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);
  if (!active) {
    return { ok: false, error: "Add a car first to check a quote against it." };
  }

  const pasted = String(formData.get("estimateText") ?? "").trim();
  const shopNameInput = String(formData.get("shopName") ?? "").trim();
  const regionInput = String(formData.get("region") ?? "").trim();
  const region = regionInput.length ? regionInput : null;

  // Optional upload: photo/PDF of the estimate, OCR'd and folded into the text.
  let text = pasted;
  const file = formData.get("estimateFile");
  if (file instanceof File && file.size > 0) {
    const { extractTextFromUpload } = await import("@/lib/integrations/ocr");
    const ocr = await extractTextFromUpload(await file.arrayBuffer(), file.type, file.name);
    if (ocr.text) text = [pasted, ocr.text].filter(Boolean).join("\n");
  }

  // Parse the pasted/uploaded estimate (if any) and fold in any manual line items.
  const parsed = text
    ? await parseEstimateText(text)
    : { shopName: null, lineItems: [] as LineItem[] };
  const manual = readManualLineItems(formData);
  const lineItems = [...parsed.lineItems, ...manual];

  if (lineItems.length === 0) {
    return {
      ok: false,
      error:
        "Paste an estimate or add at least one line item (a description and a price) to check.",
    };
  }

  const shopName = shopNameInput.length ? shopNameInput : parsed.shopName;

  const result = await checkQuote({
    vehicle: toVehicle(active),
    lineItems,
    region,
    shopName,
  });

  await saveQuoteCheck(active.id, {
    shopName: shopName ?? undefined,
    region: region ?? undefined,
    lineItems: result.lineItems.map((l) => ({
      description: l.description,
      priceCents: l.priceCents,
      laborHours: l.laborHours,
      part: l.part,
      category: l.category,
    })),
    totalCents: result.quotedTotalCents,
    verdict: result.verdict,
    fairLowCents: result.fairLowCents,
    fairHighCents: result.fairHighCents,
    flags: result.flags,
    summary: result.summary,
  });

  revalidatePath("/app/quote-check");

  return { ok: true, result, shopName: shopName ?? null, region };
}
