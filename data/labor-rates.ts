/**
 * Regional shop labor-rate ranges (USD per hour, in cents).
 *
 * ⚠️ ESTIMATES. Blended independent-shop + dealer rates, US-first, gathered from
 * public ranges and rounded generously. Real rates vary by shop, dealer vs.
 * independent, and city. Used only to produce a fair RANGE, never an exact price.
 */
export type RegionRate = {
  region: string;
  label: string;
  states: string[];
  lowCents: number;
  highCents: number;
};

export const NATIONAL: RegionRate = {
  region: "national",
  label: "U.S. national average",
  states: [],
  lowCents: 9500,
  highCents: 14500,
};

export const REGION_RATES: RegionRate[] = [
  {
    region: "west_coast",
    label: "West Coast (CA, WA, OR)",
    states: ["CA", "WA", "OR"],
    lowCents: 12000,
    highCents: 18500,
  },
  {
    region: "northeast",
    label: "Northeast (NY, NJ, MA, CT…)",
    states: ["NY", "NJ", "MA", "CT", "RI", "NH", "VT", "ME", "PA"],
    lowCents: 11000,
    highCents: 17500,
  },
  {
    region: "mid_atlantic",
    label: "Mid-Atlantic (MD, VA, DC, DE)",
    states: ["MD", "VA", "DC", "DE", "WV"],
    lowCents: 10500,
    highCents: 16000,
  },
  {
    region: "mountain",
    label: "Mountain West (CO, UT, AZ, NV…)",
    states: ["CO", "UT", "AZ", "NV", "NM", "ID", "MT", "WY"],
    lowCents: 10000,
    highCents: 15000,
  },
  {
    region: "midwest",
    label: "Midwest (IL, OH, MI, MN…)",
    states: ["IL", "OH", "MI", "MN", "WI", "IN", "IA", "MO", "KS", "NE", "ND", "SD"],
    lowCents: 8800,
    highCents: 13500,
  },
  {
    region: "south",
    label: "South (TX, FL, GA, NC…)",
    states: ["TX", "FL", "GA", "NC", "SC", "TN", "AL", "MS", "LA", "AR", "OK", "KY"],
    lowCents: 8500,
    highCents: 13000,
  },
  {
    region: "pacific_nw",
    label: "Alaska & Hawaii",
    states: ["AK", "HI"],
    lowCents: 12500,
    highCents: 19000,
  },
];

const STATE_TO_REGION: Record<string, RegionRate> = (() => {
  const map: Record<string, RegionRate> = {};
  for (const r of REGION_RATES) for (const s of r.states) map[s] = r;
  return map;
})();

/** Resolve a region rate from a 2-letter state code or region key; falls back to national. */
export function resolveRate(regionOrState?: string | null): RegionRate {
  if (!regionOrState) return NATIONAL;
  const key = regionOrState.trim().toUpperCase();
  if (STATE_TO_REGION[key]) return STATE_TO_REGION[key];
  const byRegion = REGION_RATES.find(
    (r) => r.region === regionOrState.trim().toLowerCase(),
  );
  return byRegion ?? NATIONAL;
}

export const ALL_RATES = [NATIONAL, ...REGION_RATES];
