/**
 * Standard labor-time catalog (book hours) for common repair jobs, with keyword
 * matchers so a free-text quote line can be mapped to a canonical job.
 *
 * ⚠️ ESTIMATES. Labor hours approximate published flat-rate guides for typical
 * vehicles. Real book time varies by make/model/engine. Combined with regional
 * rates (labor-rates.ts) and parts ranges (parts-ranges.ts) only to produce a
 * fair RANGE — never an exact price, and never a price invented by the LLM.
 */
export type JobCategory =
  | "brakes"
  | "engine"
  | "suspension"
  | "electrical"
  | "maintenance"
  | "cooling"
  | "drivetrain"
  | "hvac"
  | "tires"
  | "fee";

export type LaborJob = {
  key: string;
  label: string;
  laborHours: number; // book hours (estimate)
  category: JobCategory;
  keywords: string[]; // lowercased substrings for matching
  partsKey?: string; // → parts-ranges.ts (omit for labor-only)
  /** Optional domain heuristic note surfaced as a flag hint. */
  heuristic?: string;
};

export const LABOR_JOBS: LaborJob[] = [
  // ── Brakes ──────────────────────────────────────────────────────────────
  {
    key: "front_brake_pads",
    label: "Front brake pads (replace)",
    laborHours: 1.2,
    category: "brakes",
    keywords: ["front brake pad", "front pads", "front brake job"],
    partsKey: "brake_pads_set",
  },
  {
    key: "rear_brake_pads",
    label: "Rear brake pads (replace)",
    laborHours: 1.3,
    category: "brakes",
    keywords: ["rear brake pad", "rear pads"],
    partsKey: "brake_pads_set",
  },
  {
    key: "front_pads_rotors",
    label: "Front pads + rotors",
    laborHours: 1.8,
    category: "brakes",
    keywords: ["front pads and rotors", "front brake pads and rotors", "front brakes and rotors"],
    partsKey: "pads_rotors_axle",
  },
  {
    key: "rear_pads_rotors",
    label: "Rear pads + rotors",
    laborHours: 1.9,
    category: "brakes",
    keywords: ["rear pads and rotors", "rear brakes and rotors"],
    partsKey: "pads_rotors_axle",
  },
  {
    key: "rotor_replace_front",
    label: "Front rotors (replace)",
    laborHours: 1.4,
    category: "brakes",
    keywords: ["front rotor", "rotor replacement", "replace rotors", "rotors"],
    partsKey: "rotors_pair",
    heuristic:
      "Rotors are often resurfaced or reused rather than replaced if they're within spec — ask whether replacement is necessary at the current pad thickness.",
  },
  {
    key: "brake_fluid_flush",
    label: "Brake fluid flush",
    laborHours: 0.8,
    category: "brakes",
    keywords: ["brake fluid flush", "brake fluid", "bleed brakes"],
    partsKey: "brake_fluid",
  },
  {
    key: "brake_caliper",
    label: "Brake caliper (replace, each)",
    laborHours: 1.3,
    category: "brakes",
    keywords: ["caliper"],
    partsKey: "caliper",
  },
  // ── Maintenance ─────────────────────────────────────────────────────────
  {
    key: "oil_change_synthetic",
    label: "Synthetic oil & filter change",
    laborHours: 0.5,
    category: "maintenance",
    keywords: ["synthetic oil", "full synthetic", "oil change synthetic", "oil and filter"],
    partsKey: "oil_synthetic",
  },
  {
    key: "oil_change_conventional",
    label: "Conventional oil & filter change",
    laborHours: 0.4,
    category: "maintenance",
    keywords: ["oil change", "conventional oil", "lube oil filter", "lof"],
    partsKey: "oil_conventional",
  },
  {
    key: "engine_air_filter",
    label: "Engine air filter",
    laborHours: 0.3,
    category: "maintenance",
    keywords: ["engine air filter", "air filter"],
    partsKey: "engine_air_filter",
  },
  {
    key: "cabin_air_filter",
    label: "Cabin air filter",
    laborHours: 0.4,
    category: "maintenance",
    keywords: ["cabin air filter", "cabin filter", "pollen filter"],
    partsKey: "cabin_air_filter",
  },
  {
    key: "wiper_blades",
    label: "Wiper blades (pair)",
    laborHours: 0.2,
    category: "maintenance",
    keywords: ["wiper blade", "wipers"],
    partsKey: "wiper_blades",
  },
  // ── Engine / ignition ─────────────────────────────────────────────────────
  {
    key: "spark_plugs",
    label: "Spark plugs (replace)",
    laborHours: 1.3,
    category: "engine",
    keywords: ["spark plug", "spark plugs", "tune up"],
    partsKey: "spark_plugs",
  },
  {
    key: "ignition_coil",
    label: "Ignition coil (replace, each)",
    laborHours: 0.7,
    category: "engine",
    keywords: ["ignition coil", "coil pack"],
    partsKey: "ignition_coil",
  },
  {
    key: "serpentine_belt",
    label: "Serpentine belt",
    laborHours: 0.9,
    category: "engine",
    keywords: ["serpentine belt", "drive belt", "accessory belt"],
    partsKey: "serpentine_belt",
  },
  {
    key: "timing_belt",
    label: "Timing belt (replace)",
    laborHours: 4.0,
    category: "engine",
    keywords: ["timing belt"],
    partsKey: "timing_belt",
  },
  {
    key: "valve_cover_gasket",
    label: "Valve cover gasket",
    laborHours: 2.0,
    category: "engine",
    keywords: ["valve cover gasket", "valve cover"],
    partsKey: "valve_cover_gasket",
  },
  {
    key: "o2_sensor",
    label: "Oxygen (O2) sensor",
    laborHours: 0.8,
    category: "engine",
    keywords: ["o2 sensor", "oxygen sensor"],
    partsKey: "o2_sensor",
  },
  {
    key: "maf_sensor",
    label: "Mass air flow sensor",
    laborHours: 0.5,
    category: "engine",
    keywords: ["mass air flow", "maf sensor"],
    partsKey: "maf_sensor",
  },
  {
    key: "fuel_pump",
    label: "Fuel pump (replace)",
    laborHours: 2.5,
    category: "engine",
    keywords: ["fuel pump"],
    partsKey: "fuel_pump",
  },
  {
    key: "catalytic_converter",
    label: "Catalytic converter",
    laborHours: 1.8,
    category: "engine",
    keywords: ["catalytic converter", "cat converter"],
    partsKey: "catalytic_converter",
  },
  // ── Electrical ────────────────────────────────────────────────────────────
  {
    key: "battery_replace",
    label: "Battery (replace)",
    laborHours: 0.5,
    category: "electrical",
    keywords: ["battery replacement", "replace battery", "new battery", "battery"],
    partsKey: "battery",
  },
  {
    key: "alternator_replace",
    label: "Alternator (replace)",
    laborHours: 2.0,
    category: "electrical",
    keywords: ["alternator"],
    partsKey: "alternator",
  },
  {
    key: "starter_replace",
    label: "Starter (replace)",
    laborHours: 1.8,
    category: "electrical",
    keywords: ["starter motor", "starter"],
    partsKey: "starter",
  },
  // ── Cooling ───────────────────────────────────────────────────────────────
  {
    key: "coolant_flush",
    label: "Coolant flush",
    laborHours: 1.0,
    category: "cooling",
    keywords: ["coolant flush", "antifreeze", "cooling system flush", "coolant"],
    partsKey: "coolant",
  },
  {
    key: "radiator_replace",
    label: "Radiator (replace)",
    laborHours: 2.5,
    category: "cooling",
    keywords: ["radiator"],
    partsKey: "radiator",
  },
  {
    key: "water_pump",
    label: "Water pump (replace)",
    laborHours: 3.0,
    category: "cooling",
    keywords: ["water pump"],
    partsKey: "water_pump",
  },
  {
    key: "thermostat",
    label: "Thermostat (replace)",
    laborHours: 1.2,
    category: "cooling",
    keywords: ["thermostat"],
    partsKey: "thermostat",
  },
  // ── Suspension / steering ─────────────────────────────────────────────────
  {
    key: "struts_front_pair",
    label: "Front struts (pair)",
    laborHours: 2.6,
    category: "suspension",
    keywords: ["front strut", "struts", "strut assembly"],
    partsKey: "struts_pair",
  },
  {
    key: "control_arm",
    label: "Control arm (replace, each)",
    laborHours: 1.8,
    category: "suspension",
    keywords: ["control arm"],
    partsKey: "control_arm",
  },
  {
    key: "wheel_bearing",
    label: "Wheel bearing / hub (each)",
    laborHours: 1.5,
    category: "suspension",
    keywords: ["wheel bearing", "hub bearing", "hub assembly"],
    partsKey: "wheel_bearing",
  },
  {
    key: "wheel_alignment",
    label: "Wheel alignment",
    laborHours: 1.0,
    category: "suspension",
    keywords: ["alignment", "wheel alignment", "4 wheel alignment"],
  },
  // ── Drivetrain ────────────────────────────────────────────────────────────
  {
    key: "transmission_fluid",
    label: "Transmission fluid service",
    laborHours: 1.4,
    category: "drivetrain",
    keywords: ["transmission fluid", "trans fluid", "transmission service", "atf"],
    partsKey: "transmission_fluid",
  },
  // ── Tires ─────────────────────────────────────────────────────────────────
  {
    key: "tire_rotation",
    label: "Tire rotation",
    laborHours: 0.5,
    category: "tires",
    keywords: ["tire rotation", "rotate tires"],
  },
  {
    key: "tire_mount_balance",
    label: "Tire mount & balance (each)",
    laborHours: 0.4,
    category: "tires",
    keywords: ["mount and balance", "mount balance", "tire install"],
  },
  // ── HVAC ──────────────────────────────────────────────────────────────────
  {
    key: "ac_recharge",
    label: "A/C recharge / evac & recharge",
    laborHours: 1.0,
    category: "hvac",
    keywords: ["ac recharge", "a/c recharge", "air conditioning recharge", "evac and recharge"],
    partsKey: "ac_refrigerant",
  },
];

/** Fee-style line items that aren't labor-time × rate. */
export const FEE_PATTERNS: { key: string; label: string; keywords: string[]; typicalLowCents: number; typicalHighCents: number }[] = [
  {
    key: "diagnostic_fee",
    label: "Diagnostic fee",
    keywords: ["diagnostic", "diagnosis", "check engine diag", "scan"],
    typicalLowCents: 7500,
    typicalHighCents: 18000,
  },
  {
    key: "shop_supplies",
    label: "Shop supplies / misc",
    keywords: ["shop supplies", "shop supply", "misc supplies", "hazmat", "disposal"],
    typicalLowCents: 500,
    typicalHighCents: 4500,
  },
];

export function findJob(text: string): LaborJob | null {
  const t = text.toLowerCase();
  // Prefer the most specific (longest keyword) match.
  let best: { job: LaborJob; len: number } | null = null;
  for (const job of LABOR_JOBS) {
    for (const kw of job.keywords) {
      if (t.includes(kw) && (!best || kw.length > best.len)) {
        best = { job, len: kw.length };
      }
    }
  }
  return best?.job ?? null;
}

export function findFee(text: string) {
  const t = text.toLowerCase();
  return FEE_PATTERNS.find((f) => f.keywords.some((k) => t.includes(k))) ?? null;
}
