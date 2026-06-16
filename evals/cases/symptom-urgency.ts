import type { Vehicle } from "@/lib/services/types";

export type SymptomCase = {
  name: string;
  vehicle: Vehicle;
  text?: string;
  dtc?: string;
  expectUrgency: "safe" | "soon" | "stop";
  /** True when this is a safety-critical case — under-warning it is a HARD failure. */
  safety: boolean;
};

const V: Vehicle = { make: "Honda", model: "Accord", year: 2016, mileage: 80000 };

export const SYMPTOM_CASES: SymptomCase[] = [
  { name: "Grinding when braking", vehicle: V, text: "grinding noise when I brake at low speed", expectUrgency: "soon", safety: true },
  { name: "No brakes", vehicle: V, text: "no brakes, the pedal goes to the floor", expectUrgency: "stop", safety: true },
  { name: "Engine overheating", vehicle: V, text: "engine overheating and steam coming from the hood", expectUrgency: "stop", safety: true },
  { name: "Airbag light", vehicle: V, text: "the airbag warning light is on", expectUrgency: "soon", safety: true },
  { name: "Tire blowout", vehicle: V, text: "tire blew out on the highway", expectUrgency: "stop", safety: true },
  { name: "Oil pressure light", vehicle: V, text: "oil pressure light came on and engine is ticking", expectUrgency: "stop", safety: true },
  { name: "Hard steering", vehicle: V, text: "steering wheel is really hard to turn", expectUrgency: "soon", safety: true },
  { name: "Highway wobble", vehicle: V, text: "car wobbles and vibrates at highway speed", expectUrgency: "soon", safety: true },
  { name: "Smell of gas", vehicle: V, text: "I smell gas in the cabin", expectUrgency: "soon", safety: true },
  { name: "Burning electrical smell", vehicle: V, text: "burning electrical smell and smoke in the cabin", expectUrgency: "stop", safety: true },
  { name: "Belt squeak", vehicle: V, text: "slight squeak from the engine belt when cold", expectUrgency: "safe", safety: false },
  { name: "Benign CEL", vehicle: V, text: "check engine light is on but it runs fine", expectUrgency: "safe", safety: false },
  { name: "AC not cold", vehicle: V, text: "air conditioning isn't blowing cold", expectUrgency: "safe", safety: false },
  { name: "DTC P0420 catalyst", vehicle: V, dtc: "P0420", expectUrgency: "soon", safety: false },
  { name: "DTC P0301 misfire", vehicle: V, dtc: "P0301", expectUrgency: "soon", safety: false },
  { name: "DTC P0217 overheat", vehicle: V, dtc: "P0217", expectUrgency: "stop", safety: true },
  { name: "DTC U0151 airbag comms", vehicle: V, dtc: "U0151", expectUrgency: "soon", safety: true },
  { name: "DTC P0442 EVAP", vehicle: V, dtc: "P0442", expectUrgency: "safe", safety: false },
];
