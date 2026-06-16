import { z } from "zod";
import { extract, isLLMAvailable } from "@/lib/llm/client";
import { findJob } from "@/data";
import type { Vehicle } from "./types";

export const ServiceEntrySchema = z.object({
  type: z.string(),
  jobKey: z.string().nullable(),
  description: z.string(),
  date: z.string().nullable(), // ISO date or null
  mileage: z.number().int().nullable(),
  parts: z.array(z.object({ name: z.string(), partNumber: z.string().optional() })),
  laborHours: z.number().nullable(),
  costCents: z.number().int().nullable(),
  llmUsed: z.boolean(),
});
export type ServiceEntry = z.infer<typeof ServiceEntrySchema>;

const ExtractSchema = z.object({
  type: z.string(),
  description: z.string(),
  date: z.string().nullable(),
  mileage: z.number().int().nullable(),
  parts: z.array(z.object({ name: z.string(), partNumber: z.string().optional() })),
  laborHours: z.number().nullable(),
  costDollars: z.number().nullable(),
});

/**
 * structureServiceEntry — turn a spoken/typed description ("changed the oil and
 * rotated the tires at 48k, $90") into a structured service record. LLM extraction
 * when available; a deterministic keyword/regex parse otherwise.
 */
export async function structureServiceEntry(
  text: string,
  vehicle: Vehicle,
): Promise<ServiceEntry> {
  if (isLLMAvailable()) {
    try {
      const out = await extract({
        schema: ExtractSchema,
        schemaName: "service_entry",
        system:
          "Extract a structured car service record from the owner's note. type is a short label " +
          "(e.g. 'Oil change', 'Brake job', 'Tire rotation'). Pull mileage, date (ISO if mentioned, " +
          "else null), parts, labor hours, and total cost in dollars. Do not invent values not present.",
        prompt: `Vehicle: ${[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")}\nNote: ${text.slice(0, 3000)}`,
        maxTokens: 600,
      });
      return ServiceEntrySchema.parse({
        type: out.type,
        jobKey: findJob(out.type)?.key ?? findJob(out.description)?.key ?? null,
        description: out.description,
        date: out.date,
        mileage: out.mileage,
        parts: out.parts,
        laborHours: out.laborHours,
        costCents: out.costDollars != null ? Math.round(out.costDollars * 100) : null,
        llmUsed: true,
      });
    } catch {
      // fall through
    }
  }
  return deterministicParse(text);
}

function deterministicParse(text: string): ServiceEntry {
  const mileage = extractMileage(text);
  const cost = matchNum(text, /\$\s*([\d,]+(?:\.\d{2})?)/);
  const job = findJob(text);
  return ServiceEntrySchema.parse({
    type: job?.label ?? firstWords(text, 4),
    jobKey: job?.key ?? null,
    description: text.trim().slice(0, 500),
    date: null,
    mileage: mileage ?? null,
    parts: [],
    laborHours: null,
    costCents: cost != null ? Math.round(cost * 100) : null,
    llmUsed: false,
  });
}

function matchNum(text: string, re: RegExp): number | null {
  const m = text.match(re);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, "").replace(/k$/i, "000"));
  return Number.isNaN(n) ? null : n;
}

/** Mileage: "48,000 miles", "48000 mi", "at 72000", and the "k" shorthand "48k". */
function extractMileage(text: string): number | null {
  const m =
    text.match(/(\d[\d,]*)\s*(k)?\s*(?:mi\b|miles\b|odometer|mileage)/i) ||
    text.match(/\bat\s+(\d[\d,]*)\s*(k)?\b/i) ||
    text.match(/\b(\d[\d,]*)\s*(k)\b/i);
  if (!m) return null;
  const base = Number(m[1].replace(/,/g, ""));
  if (Number.isNaN(base)) return null;
  return m[2] ? base * 1000 : base; // "k" → thousands
}

function firstWords(text: string, n: number): string {
  return text.trim().split(/\s+/).slice(0, n).join(" ") || "Service";
}
