import { z } from "zod";
import { getRecallsByYMM } from "@/lib/integrations/nhtsa";
import { searchCpscRecalls } from "@/lib/integrations/cpsc";
import type { Vehicle } from "./types";

export const RecallMatchSchema = z.object({
  source: z.enum(["NHTSA", "CPSC"]),
  campaignId: z.string(),
  component: z.string(),
  summary: z.string(),
  consequence: z.string().optional(),
  remedy: z.string(),
  severity: z.enum(["ok", "soon", "alert"]),
  status: z.enum(["open", "remedy_available", "closed"]),
  provenanceUrl: z.string().url(),
  reportDate: z.string().optional(),
  parkIt: z.boolean().optional(),
  parkOutside: z.boolean().optional(),
});
export type RecallMatch = z.infer<typeof RecallMatchSchema>;

/**
 * findRecalls — official feeds ONLY. Vehicle recalls come from NHTSA by
 * year/make/model with the campaign ID + source link preserved. We never
 * fabricate a recall and never mark one resolved (status stays "open" /
 * "remedy_available" — NHTSA's per-VIN completion isn't in this feed).
 */
export async function findRecalls(
  vehicle: Vehicle,
  opts: { includeCpscTires?: boolean } = {},
): Promise<RecallMatch[]> {
  if (!vehicle.year || !vehicle.make || !vehicle.model) return [];

  const nhtsa = await getRecallsByYMM(vehicle.make, vehicle.model, vehicle.year);
  const matches: RecallMatch[] = nhtsa.map((r) => ({
    source: "NHTSA" as const,
    campaignId: r.campaignId,
    component: r.component,
    summary: r.summary,
    consequence: r.consequence,
    remedy: r.remedy,
    severity: r.severity,
    // remedy text present and not a "pending"/"to be determined" note → remedy available
    status: r.remedy && !/pending|to be determined|will notify owners when/i.test(r.remedy)
      ? ("remedy_available" as const)
      : ("open" as const),
    provenanceUrl: r.provenanceUrl,
    reportDate: r.reportDate,
    parkIt: r.parkIt,
    parkOutside: r.parkOutside,
  }));

  // Optional supplementary CPSC tire recalls (accessories, not the vehicle itself).
  if (opts.includeCpscTires) {
    const cpsc = await searchCpscRecalls("tire");
    for (const c of cpsc.slice(0, 5)) {
      matches.push({
        source: "CPSC",
        campaignId: c.campaignId,
        component: c.component,
        summary: c.summary,
        remedy: c.remedy,
        severity: c.severity,
        status: "open",
        provenanceUrl: c.provenanceUrl,
        reportDate: c.reportDate,
      });
    }
  }

  return matches.map((m) => RecallMatchSchema.parse(m));
}
