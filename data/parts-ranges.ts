/**
 * Parts price ranges (USD cents) for a MAINSTREAM vehicle, before the segment
 * multiplier (segments.ts) is applied.
 *
 * ⚠️ ESTIMATES. Aftermarket/OEM ranges rounded from public retail prices. Actual
 * parts cost depends on brand, OEM vs. aftermarket, and the specific vehicle.
 * Always presented as a range, never an exact figure.
 */
export type PartsRange = {
  key: string;
  label: string;
  lowCents: number;
  highCents: number;
  unit: "set" | "each" | "axle" | "pair" | "job";
};

export const PARTS_RANGES: Record<string, PartsRange> = {
  brake_pads_set: { key: "brake_pads_set", label: "Brake pads (axle set)", lowCents: 3500, highCents: 12000, unit: "axle" },
  rotors_pair: { key: "rotors_pair", label: "Brake rotors (pair)", lowCents: 8000, highCents: 26000, unit: "pair" },
  pads_rotors_axle: { key: "pads_rotors_axle", label: "Pads + rotors (one axle)", lowCents: 12000, highCents: 38000, unit: "axle" },
  brake_fluid: { key: "brake_fluid", label: "Brake fluid", lowCents: 1500, highCents: 5000, unit: "job" },
  caliper: { key: "caliper", label: "Brake caliper", lowCents: 6000, highCents: 22000, unit: "each" },
  oil_synthetic: { key: "oil_synthetic", label: "Full-synthetic oil + filter", lowCents: 3500, highCents: 9000, unit: "job" },
  oil_conventional: { key: "oil_conventional", label: "Conventional oil + filter", lowCents: 2000, highCents: 5500, unit: "job" },
  engine_air_filter: { key: "engine_air_filter", label: "Engine air filter", lowCents: 1200, highCents: 4500, unit: "each" },
  cabin_air_filter: { key: "cabin_air_filter", label: "Cabin air filter", lowCents: 1200, highCents: 4500, unit: "each" },
  wiper_blades: { key: "wiper_blades", label: "Wiper blades (pair)", lowCents: 1800, highCents: 6000, unit: "pair" },
  spark_plugs: { key: "spark_plugs", label: "Spark plugs (set)", lowCents: 2500, highCents: 12000, unit: "set" },
  ignition_coil: { key: "ignition_coil", label: "Ignition coil", lowCents: 3000, highCents: 11000, unit: "each" },
  serpentine_belt: { key: "serpentine_belt", label: "Serpentine belt", lowCents: 2000, highCents: 7000, unit: "each" },
  timing_belt: { key: "timing_belt", label: "Timing belt kit", lowCents: 6000, highCents: 22000, unit: "job" },
  valve_cover_gasket: { key: "valve_cover_gasket", label: "Valve cover gasket", lowCents: 2000, highCents: 9000, unit: "job" },
  o2_sensor: { key: "o2_sensor", label: "Oxygen sensor", lowCents: 4000, highCents: 16000, unit: "each" },
  maf_sensor: { key: "maf_sensor", label: "Mass air flow sensor", lowCents: 6000, highCents: 22000, unit: "each" },
  fuel_pump: { key: "fuel_pump", label: "Fuel pump", lowCents: 12000, highCents: 38000, unit: "each" },
  catalytic_converter: { key: "catalytic_converter", label: "Catalytic converter", lowCents: 25000, highCents: 120000, unit: "each" },
  battery: { key: "battery", label: "Battery", lowCents: 12000, highCents: 32000, unit: "each" },
  alternator: { key: "alternator", label: "Alternator", lowCents: 18000, highCents: 55000, unit: "each" },
  starter: { key: "starter", label: "Starter motor", lowCents: 14000, highCents: 45000, unit: "each" },
  coolant: { key: "coolant", label: "Coolant", lowCents: 2500, highCents: 8000, unit: "job" },
  radiator: { key: "radiator", label: "Radiator", lowCents: 12000, highCents: 45000, unit: "each" },
  water_pump: { key: "water_pump", label: "Water pump", lowCents: 6000, highCents: 28000, unit: "each" },
  thermostat: { key: "thermostat", label: "Thermostat", lowCents: 2500, highCents: 9000, unit: "each" },
  struts_pair: { key: "struts_pair", label: "Strut assemblies (pair)", lowCents: 18000, highCents: 60000, unit: "pair" },
  control_arm: { key: "control_arm", label: "Control arm", lowCents: 8000, highCents: 32000, unit: "each" },
  wheel_bearing: { key: "wheel_bearing", label: "Wheel bearing / hub", lowCents: 6000, highCents: 26000, unit: "each" },
  transmission_fluid: { key: "transmission_fluid", label: "Transmission fluid + filter", lowCents: 5000, highCents: 18000, unit: "job" },
  ac_refrigerant: { key: "ac_refrigerant", label: "A/C refrigerant + dye", lowCents: 3000, highCents: 10000, unit: "job" },
};

export function partsRange(key: string | undefined): PartsRange | null {
  if (!key) return null;
  return PARTS_RANGES[key] ?? null;
}
