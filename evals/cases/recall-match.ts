import type { Vehicle } from "@/lib/services/types";

export type RecallCase = {
  name: string;
  vehicle: Vehicle;
  /** Campaign IDs that MUST be present (a false negative is a safety miss). */
  expectCampaigns: string[];
  expectAtLeast: number;
};

// Known open NHTSA campaigns (verified against the live feed). Live/best-effort.
export const RECALL_CASES: RecallCase[] = [
  {
    name: "2015 Honda Accord — fuel pump recall",
    vehicle: { make: "Honda", model: "Accord", year: 2015 },
    expectCampaigns: ["19V060000"],
    expectAtLeast: 1,
  },
  {
    name: "2014 Honda Accord — has recalls",
    vehicle: { make: "Honda", model: "Accord", year: 2014 },
    expectCampaigns: [],
    expectAtLeast: 1,
  },
];
