import { z } from "zod";
import { extract, isLLMAvailable } from "@/lib/llm/client";
import { type Vehicle, vehicleLabel } from "./types";

export const RepairStorySchema = z.object({
  complaint: z.string(),
  cause: z.string(),
  correction: z.string(),
  llmUsed: z.boolean(),
});
export type RepairStory = z.infer<typeof RepairStorySchema>;

const CCC = z.object({
  complaint: z.string(),
  cause: z.string(),
  correction: z.string(),
});

/**
 * generateRepairStory — the owner's mirror of a dealer "Repair Order Story":
 * a plain-English Complaint / Cause / Correction record from a symptom + the
 * shop's diagnosis. Deterministic template when offline.
 */
export async function generateRepairStory(input: {
  symptom: string;
  diagnosis: string;
  vehicle: Vehicle;
}): Promise<RepairStory> {
  if (isLLMAvailable()) {
    try {
      const out = await extract({
        schema: CCC,
        schemaName: "repair_story",
        system:
          "Write a plain-English Complaint / Cause / Correction record for a car owner's log. " +
          "Complaint = what the owner noticed; Cause = what was found wrong; Correction = what was (or should be) done. " +
          "One or two clear sentences each, no jargon, no invented specifics.",
        prompt: `Vehicle: ${vehicleLabel(input.vehicle)}\nSymptom: ${input.symptom}\nDiagnosis: ${input.diagnosis}`,
        maxTokens: 400,
      });
      return RepairStorySchema.parse({ ...out, llmUsed: true });
    } catch {
      // fall through
    }
  }
  return RepairStorySchema.parse({
    complaint: input.symptom.trim() || "—",
    cause: input.diagnosis.trim() || "—",
    correction: "Recommended repair per the diagnosis above. Confirm scope and parts with your shop.",
    llmUsed: false,
  });
}
