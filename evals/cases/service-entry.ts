import type { Vehicle } from "@/lib/services/types";

export type ServiceEntryCase = {
  name: string;
  vehicle: Vehicle;
  text: string;
  expect: { mileage?: number; costCents?: number; jobKey?: string };
};

const V: Vehicle = { make: "Toyota", model: "Camry", year: 2018, mileage: 60000 };

// Scored against the DETERMINISTIC offline parser (no LLM needed).
export const SERVICE_ENTRY_CASES: ServiceEntryCase[] = [
  {
    name: "Oil change with mileage + cost",
    vehicle: V,
    text: "Changed the oil and filter at 48,000 miles, paid $89",
    expect: { mileage: 48000, costCents: 8900, jobKey: "oil_change_synthetic" },
  },
  {
    name: "Brake job with cost",
    vehicle: V,
    text: "Front brake pads replaced, $260 total",
    expect: { costCents: 26000, jobKey: "front_brake_pads" },
  },
  {
    name: "Battery with mileage",
    vehicle: V,
    text: "New battery installed at 72000 miles",
    expect: { mileage: 72000, jobKey: "battery_replace" },
  },
];
