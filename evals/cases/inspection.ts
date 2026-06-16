import type { Vehicle } from "@/lib/services/types";

export type InspectionCase = {
  name: string;
  vehicle: Vehicle;
  text: string;
  expect: { match: string; status: "ok" | "soon" | "alert"; safety: boolean }[];
};

const V: Vehicle = { make: "Honda", model: "Accord", year: 2015, mileage: 82000 };

// Scored against the DETERMINISTIC parser. Safety under-classification (a brake/
// tire/steering item rated lower than expected) is a HARD failure.
export const INSPECTION_CASES: InspectionCase[] = [
  {
    name: "Typical shop MPI sheet",
    vehicle: V,
    text: `Front brake pads .... 3mm YELLOW
Rear brake pads ..... 8mm GREEN
Front rotors ........ RED replace
Tires tread ......... 5/32 YELLOW
Battery ............. 11.8V RED
Engine oil .......... GREEN
Cabin air filter .... dirty YELLOW
Wiper blades ........ GREEN`,
    expect: [
      { match: "front brake pads", status: "soon", safety: true },
      { match: "rear brake pads", status: "ok", safety: true },
      { match: "front rotors", status: "alert", safety: true },
      { match: "tires", status: "soon", safety: true },
      { match: "battery", status: "alert", safety: false },
      { match: "engine oil", status: "ok", safety: false },
      { match: "cabin air filter", status: "soon", safety: false },
    ],
  },
  {
    name: "Brakes failed — must alert",
    vehicle: V,
    text: `Brakes: metal on metal FAIL
Tires: good tread GREEN`,
    expect: [
      { match: "brakes", status: "alert", safety: true },
      { match: "tires", status: "ok", safety: true },
    ],
  },
];
