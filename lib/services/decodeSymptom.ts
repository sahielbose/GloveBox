import { z } from "zod";
import { decodeDtc, normalizeDtc, SAFETY_DTC_CATEGORIES } from "@/data";
import { findJob, LABOR_JOBS, partsRange, resolveRate, segmentForMake, SEGMENT_MULTIPLIER } from "@/data";
import { extract, isLLMAvailable } from "@/lib/llm/client";
import { type Urgency } from "@/lib/status";
import { type Vehicle, vehicleLabel } from "./types";

export const SymptomCauseSchema = z.object({
  cause: z.string(),
  likelihood: z.enum(["high", "medium", "low"]),
  note: z.string().optional(),
});

export const SymptomResultSchema = z.object({
  urgency: z.enum(["safe", "soon", "stop"]),
  urgencyReason: z.string(),
  causes: z.array(SymptomCauseSchema),
  costLowCents: z.number().int().nullable(),
  costHighCents: z.number().int().nullable(),
  safetyCritical: z.boolean(),
  dtcCode: z.string().nullable(),
  summary: z.string(),
  llmUsed: z.boolean(),
});
export type SymptomResult = z.infer<typeof SymptomResultSchema>;

const URGENCY_RANK: Record<Urgency, number> = { safe: 0, soon: 1, stop: 2 };
const maxUrgency = (a: Urgency, b: Urgency): Urgency =>
  URGENCY_RANK[a] >= URGENCY_RANK[b] ? a : b;

/**
 * Safety signal table. Matching a row enforces a MINIMUM urgency (floor) — the
 * decoder may raise urgency above the floor but never below it. This is the
 * asymmetric safety bias: brakes, steering, overheating, airbags, and tires
 * never get under-warned.
 */
const SAFETY_SIGNALS: { re: RegExp; category: string; floor: Urgency }[] = [
  // Stop-driving phrases (checked as floors)
  { re: /\bno brakes?\b|brakes?\s*(gone|failed|not working)|pedal (goes|sinks|to the floor)|can.?t stop/i, category: "brakes", floor: "stop" },
  { re: /grinding|metal on metal|metal-on-metal/i, category: "brakes", floor: "soon" },
  { re: /\bbrake|squeal|squeak when (i )?brak|soft pedal|spongy pedal/i, category: "brakes", floor: "soon" },
  { re: /overheat|temp(erature)? (gauge|warning|light)|steam|coolant (leak|boiling|pouring)|smoke (from|coming).*(hood|engine)|smell.*coolant/i, category: "overheating", floor: "stop" },
  { re: /won.?t steer|can.?t steer|hard to steer|hard to turn|stiff steering|steering (is )?(lock|stiff|heavy)|wheel (shakes|wobbles|shaking) at (speed|highway)/i, category: "steering", floor: "soon" },
  { re: /airbag|srs (light|warning)|restraint|seat ?belt (light|won)/i, category: "airbags", floor: "soon" },
  { re: /blowout|tire (blew|burst)|bald tire|cord showing|tread (separat|coming)/i, category: "tires", floor: "stop" },
  { re: /\btire|flat|low tread|wobble|vibrat.*(highway|speed)/i, category: "tires", floor: "soon" },
  { re: /oil (light|pressure)|low oil pressure|ticking.*(no oil|low oil)/i, category: "oil", floor: "stop" },
  { re: /smell.*(gas|fuel|gasoline)|fuel (leak|smell|odor)|gasoline (smell|odor)|smell of (gas|fuel)/i, category: "fuel", floor: "soon" },
  { re: /burning smell|electrical (burning|smell)|smoke (from|in) (the )?(cabin|dash)/i, category: "fire", floor: "stop" },
];

const ExtractSchema = z.object({
  urgency: z.enum(["safe", "soon", "stop"]),
  causes: z.array(SymptomCauseSchema).min(1),
  jobKeyGuess: z.string().nullable().optional(),
  summary: z.string(),
});

export async function decodeSymptom(input: {
  text?: string;
  dtc?: string;
  vehicle: Vehicle;
}): Promise<SymptomResult> {
  const { vehicle } = input;
  const text = (input.text ?? "").trim();
  const dtcRaw = input.dtc?.trim();

  // 1) Deterministic safety floor from keywords / DTC category.
  let floor: Urgency = "safe";
  let safetyCritical = false;
  const detectedCats = new Set<string>();
  for (const s of SAFETY_SIGNALS) {
    if (text && s.re.test(text)) {
      floor = maxUrgency(floor, s.floor);
      detectedCats.add(s.category);
      if (
        SAFETY_DTC_CATEGORIES.has(s.category) ||
        ["brakes", "steering", "tires", "airbags", "overheating", "oil", "fuel", "fire"].includes(s.category)
      ) {
        safetyCritical = true;
      }
    }
  }

  // 2) DTC path.
  let dtcCode: string | null = null;
  const dtcCauses: z.infer<typeof SymptomCauseSchema>[] = [];
  if (dtcRaw && normalizeDtc(dtcRaw)) {
    const decoded = decodeDtc(dtcRaw);
    if (decoded) {
      dtcCode = decoded.code;
      floor = maxUrgency(floor, decoded.urgency);
      if (decoded.safetyCritical || SAFETY_DTC_CATEGORIES.has(decoded.category)) safetyCritical = true;
      dtcCauses.push({ cause: decoded.meaning, likelihood: "high" });
      for (const c of decoded.commonCauses) dtcCauses.push({ cause: c, likelihood: "medium" });
    }
  }

  // 3) LLM enrichment (causes + summary), urgency clamped to >= floor.
  let urgency: Urgency = floor;
  let causes = dtcCauses;
  let summary = "";
  let jobKeyGuess: string | null = null;
  let llmUsed = false;

  if (isLLMAvailable() && (text || dtcCode)) {
    try {
      const out = await extract({
        schema: ExtractSchema,
        schemaName: "symptom",
        system:
          "You help a car owner understand a symptom or trouble code. Give likely causes (most to least likely), an urgency (safe | soon | stop), and a calm 2-3 sentence summary. " +
          "SAFETY RULE: for anything involving brakes, steering, overheating, airbags, tires, or loss of oil pressure, err toward 'soon' or 'stop' — NEVER reassure about a potentially unsafe condition. " +
          "Optionally suggest a single jobKeyGuess from this list if one clearly applies: front_brake_pads, rear_brake_pads, front_pads_rotors, rotor_replace_front, oil_change_synthetic, alternator_replace, battery_replace, water_pump, radiator_replace, thermostat, spark_plugs, ignition_coil, o2_sensor, catalytic_converter, wheel_bearing, struts_front_pair, ac_recharge. Otherwise null.",
        prompt: `Vehicle: ${vehicleLabel(vehicle)}\n${text ? `Symptom: ${text}\n` : ""}${dtcCode ? `DTC: ${dtcCode}\n` : ""}`,
        maxTokens: 600,
      });
      llmUsed = true;
      urgency = maxUrgency(floor, out.urgency); // never below the safety floor
      causes = out.causes.length ? out.causes : dtcCauses;
      summary = out.summary;
      jobKeyGuess = out.jobKeyGuess ?? null;
    } catch {
      // fall through to deterministic
    }
  }

  if (!llmUsed) {
    causes = causes.length ? causes : deterministicCauses(text, detectedCats);
    summary = deterministicSummary(vehicle, urgency, detectedCats, dtcCode);
    jobKeyGuess = guessJobFromText(text);
  }

  // 4) Rough cost from the curated pricing model, if we can map to a job.
  const { costLow, costHigh } = estimateCost(vehicle, jobKeyGuess);

  return SymptomResultSchema.parse({
    urgency,
    urgencyReason: urgencyReason(urgency, safetyCritical, detectedCats),
    causes: causes.slice(0, 5),
    costLowCents: costLow,
    costHighCents: costHigh,
    safetyCritical,
    dtcCode,
    summary,
    llmUsed,
  });
}

function deterministicCauses(text: string, cats: Set<string>): z.infer<typeof SymptomCauseSchema>[] {
  if (cats.has("brakes")) return [{ cause: "Worn brake pads or rotors", likelihood: "high" }, { cause: "Stuck caliper or hardware", likelihood: "low" }];
  if (cats.has("overheating")) return [{ cause: "Low coolant or leak", likelihood: "high" }, { cause: "Failed thermostat or water pump", likelihood: "medium" }, { cause: "Cooling fan fault", likelihood: "low" }];
  if (cats.has("tires")) return [{ cause: "Tire wear, imbalance, or damage", likelihood: "high" }];
  if (cats.has("steering")) return [{ cause: "Power steering / suspension component", likelihood: "high" }];
  if (cats.has("airbags")) return [{ cause: "SRS / restraint system fault", likelihood: "high" }];
  return [{ cause: "Needs inspection to localize", likelihood: "medium", note: text ? undefined : "Add a description or a trouble code for a more specific read." }];
}

function deterministicSummary(vehicle: Vehicle, urgency: Urgency, cats: Set<string>, dtc: string | null): string {
  const head = dtc ? `Trouble code ${dtc} on your ${vehicleLabel(vehicle)}.` : `On your ${vehicleLabel(vehicle)}.`;
  const tail =
    urgency === "stop"
      ? "This points to a safety-critical system — don't keep driving it; get it inspected right away."
      : urgency === "soon"
        ? "Have it looked at soon. It may be drivable short-term, but don't let it sit."
        : "Likely not urgent, but worth checking at your next visit.";
  return `${head} ${tail} This is an informational estimate, not a diagnosis — confirm with a professional.`;
}

function urgencyReason(urgency: Urgency, safety: boolean, cats: Set<string>): string {
  if (urgency === "stop") return safety ? `Involves a safety-critical system (${[...cats].join(", ") || "safety"}). Stop driving and get it inspected.` : "Potentially serious — get it inspected before driving further.";
  if (urgency === "soon") return safety ? "Safety-related — schedule an inspection soon; we won't reassure you about an unsafe condition." : "Worth addressing soon to avoid bigger problems.";
  return "Low urgency based on what you described.";
}

function guessJobFromText(text: string): string | null {
  const job = findJob(text);
  return job?.key ?? null;
}

function estimateCost(vehicle: Vehicle, jobKey: string | null): { costLow: number | null; costHigh: number | null } {
  if (!jobKey) return { costLow: null, costHigh: null };
  const job = LABOR_JOBS.find((j) => j.key === jobKey);
  if (!job) return { costLow: null, costHigh: null };
  const seg = segmentForMake(vehicle.make);
  const mult = SEGMENT_MULTIPLIER[seg];
  const rate = resolveRate(null);
  const laborLow = job.laborHours * rate.lowCents * mult.labor;
  const laborHigh = job.laborHours * rate.highCents * mult.labor;
  const pr = partsRange(job.partsKey);
  const partsLow = pr ? pr.lowCents * mult.parts : 0;
  const partsHigh = pr ? pr.highCents * mult.parts : 0;
  return { costLow: Math.round(laborLow + partsLow), costHigh: Math.round(laborHigh + partsHigh) };
}
