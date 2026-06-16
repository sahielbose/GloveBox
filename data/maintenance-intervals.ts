/**
 * Curated common maintenance intervals (US-first).
 *
 * ⚠️ ESTIMATES — confirm with your owner's manual. There is no clean free API for
 * OEM-exact schedules; these are typical intervals for modern vehicles. The app
 * labels every maintenance item "estimate — confirm against your owner's manual".
 */
export type MaintenanceInterval = {
  service: string;
  category: "engine" | "brakes" | "fluids" | "tires" | "filters" | "electrical" | "inspection";
  intervalMiles?: number;
  intervalMonths?: number;
  /** Maps to the labor-times.ts job key when "mark done" should suggest a record. */
  jobKey?: string;
  note: string;
  safetyCritical?: boolean;
};

export const MAINTENANCE_INTERVALS: MaintenanceInterval[] = [
  {
    service: "Engine oil & filter (synthetic)",
    category: "engine",
    intervalMiles: 7500,
    intervalMonths: 6,
    jobKey: "oil_change_synthetic",
    note: "Many modern engines call for full synthetic at 7,500–10,000 mi. Severe use (short trips, towing) shortens this.",
  },
  {
    service: "Tire rotation",
    category: "tires",
    intervalMiles: 6000,
    intervalMonths: 6,
    jobKey: "tire_rotation",
    note: "Rotating evens out tread wear and extends tire life.",
  },
  {
    service: "Tire tread & pressure check",
    category: "tires",
    intervalMiles: 6000,
    intervalMonths: 3,
    note: "Replace tires below 2/32\". Worn tires are a safety item.",
    safetyCritical: true,
  },
  {
    service: "Cabin air filter",
    category: "filters",
    intervalMiles: 15000,
    intervalMonths: 12,
    jobKey: "cabin_air_filter",
    note: "Affects HVAC airflow and cabin air quality.",
  },
  {
    service: "Engine air filter",
    category: "filters",
    intervalMiles: 30000,
    intervalMonths: 36,
    jobKey: "engine_air_filter",
    note: "Dirty filters can reduce performance and efficiency.",
  },
  {
    service: "Brake inspection (pads/rotors)",
    category: "brakes",
    intervalMiles: 15000,
    intervalMonths: 12,
    note: "Have pad thickness measured. Replace pads before metal-on-metal.",
    safetyCritical: true,
  },
  {
    service: "Brake fluid flush",
    category: "fluids",
    intervalMiles: 30000,
    intervalMonths: 36,
    jobKey: "brake_fluid_flush",
    note: "Brake fluid absorbs moisture over time, lowering its boiling point.",
    safetyCritical: true,
  },
  {
    service: "Engine coolant flush",
    category: "fluids",
    intervalMiles: 60000,
    intervalMonths: 60,
    jobKey: "coolant_flush",
    note: "Interval varies widely by coolant type — some long-life coolants go 100k+.",
  },
  {
    service: "Transmission fluid service",
    category: "fluids",
    intervalMiles: 60000,
    intervalMonths: 72,
    jobKey: "transmission_fluid",
    note: "Some 'lifetime' fluids exist, but periodic service is cheap insurance. Confirm type.",
  },
  {
    service: "Spark plugs",
    category: "engine",
    intervalMiles: 60000,
    jobKey: "spark_plugs",
    note: "Iridium/platinum plugs can last 60k–100k mi. Check your manual's number.",
  },
  {
    service: "Serpentine / drive belt",
    category: "engine",
    intervalMiles: 90000,
    jobKey: "serpentine_belt",
    note: "Inspect for cracks/glazing; replace before failure strands you.",
  },
  {
    service: "Timing belt (if equipped)",
    category: "engine",
    intervalMiles: 90000,
    jobKey: "timing_belt",
    note: "ONLY if your engine uses a timing belt (many use chains). On interference engines, a failed belt destroys the engine — do not skip.",
    safetyCritical: true,
  },
  {
    service: "Battery check / replace",
    category: "electrical",
    intervalMonths: 48,
    jobKey: "battery_replace",
    note: "Most batteries last 3–5 years; have it load-tested annually after year 3.",
  },
  {
    service: "Wiper blades",
    category: "inspection",
    intervalMonths: 12,
    jobKey: "wiper_blades",
    note: "Streaking or chatter means it's time. A visibility item.",
  },
  {
    service: "Wheel alignment check",
    category: "tires",
    intervalMiles: 30000,
    intervalMonths: 24,
    jobKey: "wheel_alignment",
    note: "Uneven tire wear or pulling means get it checked sooner.",
  },
];
