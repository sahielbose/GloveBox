export * from "./segments";
export * from "./labor-rates";
export * from "./labor-times";
export * from "./parts-ranges";
export * from "./maintenance-intervals";
export * from "./dtc-codes";

/**
 * Provenance label shown wherever curated estimates appear. These are honest
 * estimates from curated public-range data — not a live parts/labor catalog.
 */
export const PRICING_PROVENANCE = [
  "labor-time catalog",
  "regional labor rates",
  "parts price ranges",
] as const;

export const ESTIMATE_DISCLAIMER =
  "Estimate from curated labor-time, regional-rate, and parts-range data — not a live catalog. Confirm with a professional; prices vary by shop and exact vehicle.";

export const MAINTENANCE_DISCLAIMER =
  "Estimate — confirm against your owner's manual. Intervals vary by model, engine, and driving conditions.";
