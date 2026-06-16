import { z } from "zod";
import { extract, isLLMAvailable } from "@/lib/llm/client";
import { MAINTENANCE_DISCLAIMER } from "@/data";
import type { Status } from "@/lib/status";
import { type Vehicle, vehicleLabel } from "./types";

/**
 * digitizeInspection — the owner's mirror of Revion's Multi-Point Inspection.
 * Paste/scan a shop's MPI sheet ("Front pads 3mm — YELLOW", "Battery FAIL") and
 * get a structured green/yellow/red Health Check with measurements and a
 * plain-English read of what each item means.
 *
 * Safety bias (like decodeSymptom): a red/fail item is always `alert`, and a
 * yellow/marginal item on a safety-critical system (brakes, tires, steering) is
 * never downgraded below `soon`. The LLM may add prose but cannot soften status.
 */
export const InspectionItemSchema = z.object({
  item: z.string(),
  area: z.string(),
  status: z.enum(["ok", "soon", "alert"]),
  measurement: z.string().nullable(),
  note: z.string(),
  safetyCritical: z.boolean(),
});
export type InspectionItem = z.infer<typeof InspectionItemSchema>;

export const InspectionResultSchema = z.object({
  items: z.array(InspectionItemSchema),
  overall: z.enum(["ok", "soon", "alert"]),
  counts: z.object({ ok: z.number(), soon: z.number(), alert: z.number() }),
  summary: z.string(),
  disclaimer: z.string(),
  llmUsed: z.boolean(),
});
export type InspectionResult = z.infer<typeof InspectionResultSchema>;

const RANK: Record<Status, number> = { ok: 0, soon: 1, alert: 2 };
const worse = (a: Status, b: Status): Status => (RANK[a] >= RANK[b] ? a : b);

const SAFETY_AREA =
  /brake|pad|rotor|caliper|tire|tyre|tread|steering|tie rod|ball joint|suspension|wheel bearing|airbag|seat ?belt/i;

const ExtractSchema = z.object({
  items: z.array(
    z.object({
      item: z.string(),
      area: z.string(),
      status: z.enum(["ok", "soon", "alert"]),
      measurement: z.string().nullable(),
      note: z.string(),
    }),
  ),
  summary: z.string(),
});

export async function digitizeInspection(input: {
  text: string;
  vehicle: Vehicle;
}): Promise<InspectionResult> {
  const { vehicle } = input;
  let items: InspectionItem[] = [];
  let summary = "";
  let llmUsed = false;

  if (isLLMAvailable() && input.text.trim()) {
    try {
      const out = await extract({
        schema: ExtractSchema,
        schemaName: "inspection",
        system:
          "Extract a multi-point inspection sheet into structured items. Map the shop's color/word to status: " +
          "green/pass/good/ok → ok; yellow/amber/marginal/monitor/soon/recommend → soon; red/fail/urgent/replace now → alert. " +
          "Capture any measurement (e.g. '3 mm', '5/32\"', '11.8 V'). Write a one-line plain-English note per item. " +
          "SAFETY: never downgrade a brake/tire/steering/suspension item — if it's red or marginal, it is at least soon, red is alert. Give an overall summary.",
        prompt: `Vehicle: ${vehicleLabel(vehicle)}\nInspection sheet:\n${input.text.slice(0, 5000)}`,
        maxTokens: 1200,
      });
      llmUsed = true;
      items = out.items.map((it) => applySafetyFloor(it));
      summary = out.summary;
    } catch {
      // fall through to deterministic
    }
  }

  if (!llmUsed) {
    items = deterministicParse(input.text);
    summary = deterministicSummary(vehicle, items);
  }

  const counts = { ok: 0, soon: 0, alert: 0 };
  for (const it of items) counts[it.status]++;
  const overall: Status = counts.alert > 0 ? "alert" : counts.soon > 0 ? "soon" : "ok";

  return InspectionResultSchema.parse({
    items: items.sort((a, b) => RANK[b.status] - RANK[a.status]),
    overall,
    counts,
    summary,
    disclaimer: MAINTENANCE_DISCLAIMER,
    llmUsed,
  });
}

function applySafetyFloor(it: {
  item: string;
  area: string;
  status: Status;
  measurement: string | null;
  note: string;
}): InspectionItem {
  const safety = SAFETY_AREA.test(`${it.item} ${it.area}`);
  // never downgrade a flagged safety item below soon
  const status = safety && it.status === "ok" && /worn|marginal|low|fail|red|replace/i.test(it.note)
    ? "soon"
    : it.status;
  return { ...it, status, safetyCritical: safety };
}

function deterministicParse(text: string): InspectionItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 1);
  const out: InspectionItem[] = [];
  for (const line of lines) {
    const status = statusFromLine(line);
    if (!status) continue;
    const measurement = (line.match(/(\d+(?:\.\d+)?\s?(?:mm|\/32"?|v\b|volts?|psi|%))/i) || [])[1] ?? null;
    const item = line
      .replace(/\b(green|pass|good|ok|yellow|amber|marginal|monitor|soon|recommend|red|fail|urgent|replace now)\b/gi, "")
      .replace(/[:\-–—]+\s*$/g, "")
      .replace(/\.{2,}/g, " ")
      .trim();
    const safety = SAFETY_AREA.test(line);
    out.push({
      item: item || line,
      area: areaFromText(line),
      status,
      measurement,
      note: noteFor(status, safety),
      safetyCritical: safety,
    });
  }
  return out;
}

function statusFromLine(line: string): Status | null {
  if (/\b(red|fail|failed|urgent|replace now|metal on metal)\b/i.test(line)) return "alert";
  if (/\b(yellow|amber|marginal|monitor|soon|recommend|worn|low)\b/i.test(line)) return "soon";
  if (/\b(green|pass|passed|good|ok|fine|healthy)\b/i.test(line)) return "ok";
  return null;
}

function areaFromText(line: string): string {
  const l = line.toLowerCase();
  if (/brake|pad|rotor|caliper/.test(l)) return "brakes";
  if (/tire|tyre|tread/.test(l)) return "tires";
  if (/steering|tie rod|ball joint|suspension|strut|shock/.test(l)) return "steering/suspension";
  if (/battery|alternator|starter/.test(l)) return "electrical";
  if (/oil|coolant|fluid|antifreeze/.test(l)) return "fluids";
  if (/filter|wiper|belt|light|bulb/.test(l)) return "general";
  return "general";
}

function noteFor(status: Status, safety: boolean): string {
  if (status === "alert") return safety ? "Flagged red on a safety system — address before driving much further." : "Flagged red — replace/repair now.";
  if (status === "soon") return safety ? "Marginal on a safety system — plan to address soon; we won't downplay it." : "Marginal — keep an eye on it and budget for it.";
  return "Within spec.";
}

function deterministicSummary(vehicle: Vehicle, items: InspectionItem[]): string {
  const reds = items.filter((i) => i.status === "alert").length;
  const yellows = items.filter((i) => i.status === "soon").length;
  const head = `Digitized ${items.length} item${items.length === 1 ? "" : "s"} from the inspection on your ${vehicleLabel(vehicle)}.`;
  const tail =
    reds > 0
      ? `${reds} need attention now${yellows ? `, ${yellows} to watch` : ""}.`
      : yellows > 0
        ? `${yellows} item${yellows === 1 ? "" : "s"} to watch; nothing red.`
        : "Everything checked is within spec.";
  return `${head} ${tail} This is your shop's read, organized — confirm specifics with them.`;
}
