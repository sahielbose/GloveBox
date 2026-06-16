import {
  LABOR_JOBS,
  partsRange,
  resolveRate,
  segmentForMake,
  SEGMENT_MULTIPLIER,
} from "@/data";
import type { Vehicle } from "./types";

export type JobCostEstimate = {
  jobKey: string;
  label: string;
  laborHours: number;
  lowCents: number;
  highCents: number;
  partsLabel: string | null;
};

/**
 * Fair-cost estimate for a known job (the owner-facing "recommendation with
 * opcode + labor + parts"). Same deterministic model as Quote Check: book labor
 * hours × regional rate × segment, plus the parts range × segment. Returns null
 * for jobs not in the curated catalog. Region defaults to the national band.
 */
export function estimateJobCost(
  vehicle: Pick<Vehicle, "make">,
  jobKey: string | null | undefined,
  region?: string | null,
): JobCostEstimate | null {
  if (!jobKey) return null;
  const job = LABOR_JOBS.find((j) => j.key === jobKey);
  if (!job) return null;

  const mult = SEGMENT_MULTIPLIER[segmentForMake(vehicle.make)];
  const rate = resolveRate(region ?? null);
  const pr = partsRange(job.partsKey);
  const partsLow = pr ? pr.lowCents * mult.parts : 0;
  const partsHigh = pr ? pr.highCents * mult.parts : 0;

  return {
    jobKey: job.key,
    label: job.label,
    laborHours: job.laborHours,
    lowCents: Math.round(job.laborHours * rate.lowCents * mult.labor + partsLow),
    highCents: Math.round(job.laborHours * rate.highCents * mult.labor + partsHigh),
    partsLabel: pr?.label ?? null,
  };
}
