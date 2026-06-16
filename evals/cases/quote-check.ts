import type { Vehicle } from "@/lib/services/types";

export type QuoteCase = {
  name: string;
  vehicle: Vehicle;
  region?: string;
  lineItems: { description: string; priceCents: number }[];
  /** Acceptable verdicts (boundary cases allow more than one). */
  expectVerdict: ("fair" | "high" | "overpriced")[];
  /** Substrings of line-item descriptions that MUST appear in the flags. */
  expectFlags: string[];
};

const d = (usd: number) => Math.round(usd * 100);

export const QUOTE_CASES: QuoteCase[] = [
  {
    name: "Fair synthetic oil change (Camry)",
    vehicle: { make: "Toyota", model: "Camry", year: 2018, mileage: 60000 },
    lineItems: [{ description: "Full synthetic oil change", priceCents: d(75) }],
    expectVerdict: ["fair"],
    expectFlags: [],
  },
  {
    name: "Overpriced oil change (Camry)",
    vehicle: { make: "Toyota", model: "Camry", year: 2018, mileage: 60000 },
    lineItems: [{ description: "Oil change", priceCents: d(350) }],
    expectVerdict: ["overpriced"],
    expectFlags: ["Oil change"],
  },
  {
    name: "Fair front brake pads (Civic)",
    vehicle: { make: "Honda", model: "Civic", year: 2016, mileage: 70000 },
    lineItems: [{ description: "Front brake pads replacement", priceCents: d(190) }],
    expectVerdict: ["fair"],
    expectFlags: [],
  },
  {
    name: "Overpriced front brakes (Civic)",
    vehicle: { make: "Honda", model: "Civic", year: 2016, mileage: 70000 },
    lineItems: [{ description: "Front brake pads", priceCents: d(720) }],
    expectVerdict: ["overpriced"],
    expectFlags: ["Front brake pads"],
  },
  {
    name: "Fair battery (Accord)",
    vehicle: { make: "Honda", model: "Accord", year: 2015, mileage: 90000 },
    lineItems: [{ description: "Battery replacement", priceCents: d(220) }],
    expectVerdict: ["fair"],
    expectFlags: [],
  },
  {
    name: "Overpriced alternator (F-150)",
    vehicle: { make: "Ford", model: "F-150", year: 2017, mileage: 110000 },
    lineItems: [{ description: "Alternator replacement", priceCents: d(1300) }],
    expectVerdict: ["overpriced"],
    expectFlags: ["Alternator"],
  },
  {
    name: "High quote w/ inflated diagnostic fee (Camry)",
    vehicle: { make: "Toyota", model: "Camry", year: 2019, mileage: 50000 },
    lineItems: [
      { description: "Oil change", priceCents: d(80) },
      { description: "Diagnostic fee", priceCents: d(320) },
    ],
    expectVerdict: ["high", "overpriced"],
    expectFlags: ["Diagnostic"],
  },
  {
    name: "Rotor-replacement heuristic flag (Camry, fair price)",
    vehicle: { make: "Toyota", model: "Camry", year: 2018, mileage: 55000 },
    lineItems: [{ description: "Front rotors replacement", priceCents: d(300) }],
    expectVerdict: ["fair", "high"],
    expectFlags: ["rotor"],
  },
  {
    name: "Fair luxury pads + rotors (BMW X5)",
    vehicle: { make: "BMW", model: "X5", year: 2018, mileage: 78400 },
    region: "CA",
    lineItems: [{ description: "Front brake pads and rotors", priceCents: d(950) }],
    expectVerdict: ["fair", "high"],
    expectFlags: [],
  },
  {
    name: "Unpriced extra is flagged, not diluted into a fair verdict (Camry)",
    vehicle: { make: "Toyota", model: "Camry", year: 2018, mileage: 60000 },
    lineItems: [
      { description: "Full synthetic oil change", priceCents: d(75) },
      { description: "Premium protection package", priceCents: d(800) },
    ],
    expectVerdict: ["fair"], // verdict reflects only the priceable $75, not the $875 total
    expectFlags: ["Premium protection"], // the unpriced extra must be surfaced
  },
  {
    name: "Egregiously overpriced multi-line (Camry)",
    vehicle: { make: "Toyota", model: "Camry", year: 2018, mileage: 60000 },
    lineItems: [
      { description: "Oil change", priceCents: d(300) },
      { description: "Front brake pads", priceCents: d(800) },
    ],
    expectVerdict: ["overpriced"],
    expectFlags: ["Oil change", "Front brake pads"],
  },
];
