import { z } from "zod";
import {
  ESTIMATE_DISCLAIMER,
  PRICING_PROVENANCE,
  findFee,
  findJob,
  partsRange,
  resolveRate,
  segmentForMake,
  SEGMENT_MULTIPLIER,
} from "@/data";
import { complete, isLLMAvailable, extract } from "@/lib/llm/client";
import { type Vehicle, vehicleLabel } from "./types";
import type { Verdict } from "@/lib/status";

/* ── I/O schemas (zod-validated) ───────────────────────────────────────────── */

export const LineItemSchema = z.object({
  description: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  laborHours: z.number().nonnegative().optional(),
  part: z.string().optional(),
  category: z.string().optional(),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const QuoteFlagSchema = z.object({
  lineItem: z.string(),
  reason: z.string(),
  severity: z.enum(["soon", "alert"]),
  fairLowCents: z.number().int().optional(),
  fairHighCents: z.number().int().optional(),
});
export type QuoteFlag = z.infer<typeof QuoteFlagSchema>;

export const QuoteCheckResultSchema = z.object({
  verdict: z.enum(["fair", "high", "overpriced"]),
  quotedTotalCents: z.number().int(),
  pricedTotalCents: z.number().int(), // sum of items we could price — comparable to the fair range
  fairLowCents: z.number().int(),
  fairHighCents: z.number().int(),
  flags: z.array(QuoteFlagSchema),
  lineItems: z.array(
    LineItemSchema.extend({
      matchedJob: z.string().nullable(),
      itemFairLowCents: z.number().int().nullable(),
      itemFairHighCents: z.number().int().nullable(),
      priced: z.boolean(),
    }),
  ),
  provenance: z.array(z.string()),
  summary: z.string(),
  disclaimer: z.string(),
  llmUsed: z.boolean(),
});
export type QuoteCheckResult = z.infer<typeof QuoteCheckResultSchema>;

const round = (n: number) => Math.round(n);

/**
 * Quote Check ★ — the signature verb. The verdict, fair range, and flags are
 * computed DETERMINISTICALLY from the curated labor-time × regional-rate × parts
 * model in /data. The LLM is used ONLY to phrase the plain-English summary — it
 * never sees or sets a price. Fully usable (and eval-able) offline.
 */
export async function checkQuote(input: {
  vehicle: Vehicle;
  lineItems: LineItem[];
  region?: string | null;
  shopName?: string | null;
}): Promise<QuoteCheckResult> {
  const { vehicle } = input;
  const lineItems = input.lineItems.map((l) => LineItemSchema.parse(l));
  const segment = segmentForMake(vehicle.make);
  const mult = SEGMENT_MULTIPLIER[segment];
  const rate = resolveRate(input.region);

  const flags: QuoteFlag[] = [];
  let fairLow = 0;
  let fairHigh = 0;
  let quotedTotal = 0;
  let pricedTotal = 0; // only items we could price — the verdict compares against this

  const annotated = lineItems.map((item) => {
    quotedTotal += item.priceCents;
    const job = findJob(item.description);

    if (job) {
      const hours = item.laborHours ?? job.laborHours;
      const laborLow = hours * rate.lowCents * mult.labor;
      const laborHigh = hours * rate.highCents * mult.labor;
      const pr = partsRange(job.partsKey);
      const partsLow = pr ? pr.lowCents * mult.parts : 0;
      const partsHigh = pr ? pr.highCents * mult.parts : 0;
      const itemLow = round(laborLow + partsLow);
      const itemHigh = round(laborHigh + partsHigh);
      fairLow += itemLow;
      fairHigh += itemHigh;
      pricedTotal += item.priceCents;

      // Overcharge flag: meaningfully above the fair high.
      if (item.priceCents > itemHigh * 1.6) {
        flags.push({
          lineItem: item.description,
          reason: `Quoted ${dollars(item.priceCents)} — well above the typical ${dollars(itemLow)}–${dollars(itemHigh)} for this job on a ${vehicle.make}. Worth challenging or getting a second quote.`,
          severity: "alert",
          fairLowCents: itemLow,
          fairHighCents: itemHigh,
        });
      } else if (item.priceCents > itemHigh * 1.15) {
        flags.push({
          lineItem: item.description,
          reason: `Quoted ${dollars(item.priceCents)}, a bit above the typical ${dollars(itemLow)}–${dollars(itemHigh)}. Ask what's driving the difference (parts brand, dealer rate).`,
          severity: "soon",
          fairLowCents: itemLow,
          fairHighCents: itemHigh,
        });
      }
      // Domain heuristic flag (e.g. rotors replaced when they could be resurfaced).
      if (job.heuristic) {
        flags.push({
          lineItem: item.description,
          reason: job.heuristic,
          severity: "soon",
        });
      }
      return {
        ...item,
        matchedJob: job.label,
        itemFairLowCents: itemLow,
        itemFairHighCents: itemHigh,
        priced: true,
      };
    }

    const fee = findFee(item.description);
    if (fee) {
      fairLow += fee.typicalLowCents;
      fairHigh += fee.typicalHighCents;
      pricedTotal += item.priceCents;
      if (item.priceCents > fee.typicalHighCents * 1.5) {
        flags.push({
          lineItem: item.description,
          reason: `${fee.label} of ${dollars(item.priceCents)} is high — these are typically ${dollars(fee.typicalLowCents)}–${dollars(fee.typicalHighCents)}, and a diagnostic fee is often waived if you do the repair there.`,
          severity: "soon",
          fairLowCents: fee.typicalLowCents,
          fairHighCents: fee.typicalHighCents,
        });
      }
      return { ...item, matchedJob: fee.label, itemFairLowCents: fee.typicalLowCents, itemFairHighCents: fee.typicalHighCents, priced: true };
    }

    // Unknown line item: we can't price it, so it is EXCLUDED from the fair range
    // and the verdict (not silently treated as fair) — and surfaced as a flag so a
    // padded extra can't hide.
    flags.push({
      lineItem: item.description,
      reason: `We couldn't match "${item.description}" (${dollars(item.priceCents)}) to a standard job, so it isn't in the fair-range read — ask the shop exactly what it covers.`,
      severity: "soon",
    });
    return { ...item, matchedJob: null, itemFairLowCents: null, itemFairHighCents: null, priced: false };
  });

  // Verdict + summary compare only the items we could actually price, so the
  // verdict, the prose, and the card marker all reference the same figure.
  const verdict = decideVerdict(pricedTotal, fairLow, fairHigh);
  const provenance = [...PRICING_PROVENANCE, `${segment} segment`, rate.label];
  const unpricedCents = quotedTotal - pricedTotal;
  const summary = await buildSummary(
    vehicle,
    verdict,
    pricedTotal,
    fairLow,
    fairHigh,
    flags,
    input.shopName,
    unpricedCents,
  );

  return QuoteCheckResultSchema.parse({
    verdict,
    quotedTotalCents: quotedTotal,
    pricedTotalCents: pricedTotal,
    fairLowCents: fairLow,
    fairHighCents: fairHigh,
    flags,
    lineItems: annotated,
    provenance,
    summary,
    disclaimer: ESTIMATE_DISCLAIMER,
    llmUsed: isLLMAvailable(),
  });
}

function decideVerdict(total: number, low: number, high: number): Verdict {
  if (total <= high * 1.1) return "fair";
  if (total <= high * 1.45) return "high";
  return "overpriced";
}

async function buildSummary(
  vehicle: Vehicle,
  verdict: Verdict,
  total: number, // the PRICED total — comparable to the fair range
  low: number,
  high: number,
  flags: QuoteFlag[],
  shopName?: string | null,
  unpricedCents = 0,
): Promise<string> {
  const pricedNote =
    unpricedCents > 0
      ? ` for the items we could price (plus ${dollars(unpricedCents)} in line items we couldn't match — see flags)`
      : "";
  const deterministic =
    verdict === "fair"
      ? `At ${dollars(total)}${pricedNote}, this quote${shopName ? ` from ${shopName}` : ""} is in line with the typical ${dollars(low)}–${dollars(high)} for your ${vehicleLabel(vehicle)}. ${flags.length ? "A couple of line items are still worth a quick question (below)." : "Nothing stands out as padded."}`
      : verdict === "high"
        ? `At ${dollars(total)}${pricedNote}, this is on the high side of the typical ${dollars(low)}–${dollars(high)} for your ${vehicleLabel(vehicle)}. It's not outrageous, but the flagged items are worth questioning before you say yes.`
        : `At ${dollars(total)}${pricedNote}, this runs well above the typical ${dollars(low)}–${dollars(high)} for your ${vehicleLabel(vehicle)}. Get a second quote and challenge the flagged line items.`;

  if (!isLLMAvailable()) return deterministic;
  try {
    const prose = await complete({
      system:
        "You write a 2-3 sentence, plain-English summary of a car repair quote review for the owner. " +
        "You are given the verdict and the computed dollar figures. NEVER change, invent, or add any price — only use the numbers provided. " +
        "Be calm and specific, not alarmist. End by reminding them this is an estimate, not a guarantee.",
      prompt: `Vehicle: ${vehicleLabel(vehicle)}\nVerdict: ${verdict}\nPriceable items total: ${dollars(total)}\nTypical range: ${dollars(low)}–${dollars(high)}\n${unpricedCents > 0 ? `Items we couldn't price: ${dollars(unpricedCents)}\n` : ""}Flags: ${flags.map((f) => f.lineItem).join("; ") || "none"}\n\nWrite the summary.`,
      maxTokens: 220,
      offline: deterministic,
    });
    return prose || deterministic;
  } catch {
    return deterministic;
  }
}

function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/* ── Estimate parsing: free text → structured line items ────────────────────── */

const ParsedEstimateSchema = z.object({
  shopName: z.string().nullable(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      priceCents: z.number().int().nonnegative(),
      laborHours: z.number().nonnegative().nullable().optional(),
    }),
  ),
});

/**
 * Parse a pasted estimate into structured line items. Uses the LLM for messy
 * real-world text when available; otherwise a deterministic regex that pulls
 * "<description> .... $<amount>" lines.
 */
export async function parseEstimateText(
  text: string,
): Promise<{ shopName: string | null; lineItems: LineItem[] }> {
  if (isLLMAvailable()) {
    try {
      const parsed = await extract({
        schema: ParsedEstimateSchema,
        schemaName: "estimate",
        description: "Structured repair estimate extracted from pasted text.",
        system:
          "Extract repair-estimate line items from the pasted text. Convert each dollar amount to integer cents. " +
          "Do NOT invent items or prices — only extract what's present. If a shop name is present, capture it.",
        prompt: text.slice(0, 6000),
      });
      return {
        shopName: parsed.shopName,
        lineItems: parsed.lineItems.map((l) => ({
          description: l.description,
          priceCents: l.priceCents,
          laborHours: l.laborHours ?? undefined,
        })),
      };
    } catch {
      // fall through to regex
    }
  }
  return regexParse(text);
}

function regexParse(text: string): { shopName: string | null; lineItems: LineItem[] } {
  const lines = text.split(/\r?\n/);
  const items: LineItem[] = [];
  for (const line of lines) {
    const m = line.match(/^(.*?)[\s.\-:]*\$?\s*([\d,]+(?:\.\d{2})?)\s*$/);
    if (m && m[1].trim().length > 1) {
      const desc = m[1].replace(/\.{2,}/g, "").trim();
      const amount = Number(m[2].replace(/,/g, ""));
      if (!Number.isNaN(amount) && amount > 0 && !/total|subtotal|tax|grand/i.test(desc)) {
        items.push({ description: desc, priceCents: Math.round(amount * 100) });
      }
    }
  }
  return { shopName: null, lineItems: items };
}
