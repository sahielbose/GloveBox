/**
 * Vehicle cost segment → parts/labor multipliers for the curated pricing model.
 *
 * ⚠️ ESTIMATES. These multipliers are coarse heuristics, not catalog data. Luxury
 * and exotic parts/labor genuinely cost more, but the exact factor varies wildly by
 * model and shop. Quote Check always presents a RANGE and labels it an estimate.
 */
export type Segment = "economy" | "mainstream" | "luxury" | "exotic";

export const SEGMENT_MULTIPLIER: Record<
  Segment,
  { parts: number; labor: number }
> = {
  economy: { parts: 0.9, labor: 0.97 },
  mainstream: { parts: 1.0, labor: 1.0 },
  luxury: { parts: 1.6, labor: 1.18 },
  exotic: { parts: 2.6, labor: 1.5 },
};

const LUXURY_MAKES = new Set(
  [
    "BMW",
    "Mercedes-Benz",
    "Mercedes",
    "Audi",
    "Lexus",
    "Acura",
    "Infiniti",
    "Cadillac",
    "Lincoln",
    "Volvo",
    "Genesis",
    "Jaguar",
    "Land Rover",
    "Porsche",
    "Tesla",
    "Alfa Romeo",
    "Polestar",
  ].map((m) => m.toUpperCase()),
);

const EXOTIC_MAKES = new Set(
  [
    "Ferrari",
    "Lamborghini",
    "Bentley",
    "Rolls-Royce",
    "Maserati",
    "Aston Martin",
    "McLaren",
    "Bugatti",
    "Lotus",
  ].map((m) => m.toUpperCase()),
);

const ECONOMY_MAKES = new Set(
  ["Mitsubishi", "Smart", "Fiat", "Suzuki", "Scion"].map((m) =>
    m.toUpperCase(),
  ),
);

export function segmentForMake(make: string | null | undefined): Segment {
  if (!make) return "mainstream";
  const m = make.trim().toUpperCase();
  if (EXOTIC_MAKES.has(m)) return "exotic";
  if (LUXURY_MAKES.has(m)) return "luxury";
  if (ECONOMY_MAKES.has(m)) return "economy";
  return "mainstream";
}
