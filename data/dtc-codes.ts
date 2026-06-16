/**
 * OBD-II diagnostic trouble code (DTC) seed table + structural decoder.
 *
 * `urgency` is a conservative baseline; the symptom decoder applies an additional
 * safety floor so brakes/steering/overheating/airbags/tires never under-warn.
 * Codes not in the seed are decoded structurally (system + generic/mfr) and
 * default to a cautious "soon".
 */
export type DtcUrgency = "safe" | "soon" | "stop";

export type DtcEntry = {
  code: string;
  meaning: string;
  system: "powertrain" | "body" | "chassis" | "network";
  category: string;
  urgency: DtcUrgency;
  safetyCritical?: boolean;
  commonCauses: string[];
};

export const DTC_SEED: Record<string, DtcEntry> = {
  P0010: { code: "P0010", meaning: "Camshaft position actuator circuit (Bank 1)", system: "powertrain", category: "sensor", urgency: "soon", commonCauses: ["VVT solenoid", "low/dirty oil", "wiring"] },
  P0016: { code: "P0016", meaning: "Crankshaft/camshaft position correlation (Bank 1)", system: "powertrain", category: "timing", urgency: "soon", commonCauses: ["timing chain stretch", "VVT solenoid", "cam/crank sensor"] },
  P0101: { code: "P0101", meaning: "Mass air flow (MAF) circuit range/performance", system: "powertrain", category: "sensor", urgency: "soon", commonCauses: ["dirty MAF sensor", "intake leak", "dirty air filter"] },
  P0113: { code: "P0113", meaning: "Intake air temperature sensor high input", system: "powertrain", category: "sensor", urgency: "safe", commonCauses: ["IAT sensor", "wiring"] },
  P0117: { code: "P0117", meaning: "Engine coolant temperature sensor low input", system: "powertrain", category: "cooling", urgency: "soon", commonCauses: ["ECT sensor", "wiring", "low coolant"] },
  P0118: { code: "P0118", meaning: "Engine coolant temperature sensor high input", system: "powertrain", category: "cooling", urgency: "soon", commonCauses: ["ECT sensor", "wiring"] },
  P0128: { code: "P0128", meaning: "Coolant thermostat (below regulating temperature)", system: "powertrain", category: "cooling", urgency: "soon", commonCauses: ["stuck-open thermostat", "low coolant", "ECT sensor"] },
  P0171: { code: "P0171", meaning: "System too lean (Bank 1)", system: "powertrain", category: "fuel", urgency: "soon", commonCauses: ["vacuum/intake leak", "dirty MAF", "weak fuel pump", "PCV"] },
  P0172: { code: "P0172", meaning: "System too rich (Bank 1)", system: "powertrain", category: "fuel", urgency: "soon", commonCauses: ["leaking injector", "MAF", "fuel pressure"] },
  P0174: { code: "P0174", meaning: "System too lean (Bank 2)", system: "powertrain", category: "fuel", urgency: "soon", commonCauses: ["vacuum leak", "MAF", "fuel delivery"] },
  P0217: { code: "P0217", meaning: "Engine over-temperature condition", system: "powertrain", category: "overheating", urgency: "stop", safetyCritical: true, commonCauses: ["low coolant", "failed water pump", "stuck thermostat", "cooling fan"] },
  P0300: { code: "P0300", meaning: "Random/multiple-cylinder misfire", system: "powertrain", category: "misfire", urgency: "soon", commonCauses: ["spark plugs/coils", "vacuum leak", "fuel delivery", "low compression"] },
  P0301: { code: "P0301", meaning: "Cylinder 1 misfire", system: "powertrain", category: "misfire", urgency: "soon", commonCauses: ["coil/plug cyl 1", "injector", "compression"] },
  P0302: { code: "P0302", meaning: "Cylinder 2 misfire", system: "powertrain", category: "misfire", urgency: "soon", commonCauses: ["coil/plug cyl 2", "injector", "compression"] },
  P0303: { code: "P0303", meaning: "Cylinder 3 misfire", system: "powertrain", category: "misfire", urgency: "soon", commonCauses: ["coil/plug cyl 3", "injector", "compression"] },
  P0304: { code: "P0304", meaning: "Cylinder 4 misfire", system: "powertrain", category: "misfire", urgency: "soon", commonCauses: ["coil/plug cyl 4", "injector", "compression"] },
  P0325: { code: "P0325", meaning: "Knock sensor circuit (Bank 1)", system: "powertrain", category: "sensor", urgency: "soon", commonCauses: ["knock sensor", "wiring"] },
  P0335: { code: "P0335", meaning: "Crankshaft position sensor circuit", system: "powertrain", category: "sensor", urgency: "soon", commonCauses: ["crank position sensor", "wiring", "reluctor ring"] },
  P0340: { code: "P0340", meaning: "Camshaft position sensor circuit", system: "powertrain", category: "sensor", urgency: "soon", commonCauses: ["cam position sensor", "wiring"] },
  P0401: { code: "P0401", meaning: "Exhaust gas recirculation (EGR) flow insufficient", system: "powertrain", category: "emissions", urgency: "safe", commonCauses: ["clogged EGR passages", "EGR valve"] },
  P0420: { code: "P0420", meaning: "Catalyst system efficiency below threshold (Bank 1)", system: "powertrain", category: "emissions", urgency: "soon", commonCauses: ["aging catalytic converter", "O2 sensor", "exhaust leak"] },
  P0430: { code: "P0430", meaning: "Catalyst system efficiency below threshold (Bank 2)", system: "powertrain", category: "emissions", urgency: "soon", commonCauses: ["catalytic converter", "O2 sensor", "exhaust leak"] },
  P0440: { code: "P0440", meaning: "EVAP system malfunction", system: "powertrain", category: "emissions", urgency: "safe", commonCauses: ["loose/faulty gas cap", "EVAP hose", "purge valve"] },
  P0442: { code: "P0442", meaning: "EVAP system small leak detected", system: "powertrain", category: "emissions", urgency: "safe", commonCauses: ["loose gas cap", "small EVAP leak"] },
  P0455: { code: "P0455", meaning: "EVAP system large leak detected", system: "powertrain", category: "emissions", urgency: "safe", commonCauses: ["missing/loose gas cap", "cracked EVAP hose"] },
  P0456: { code: "P0456", meaning: "EVAP system very small leak", system: "powertrain", category: "emissions", urgency: "safe", commonCauses: ["gas cap seal", "tiny EVAP leak"] },
  P0500: { code: "P0500", meaning: "Vehicle speed sensor malfunction", system: "powertrain", category: "sensor", urgency: "soon", commonCauses: ["VSS", "wiring", "ABS module"] },
  P0506: { code: "P0506", meaning: "Idle control system RPM lower than expected", system: "powertrain", category: "idle", urgency: "safe", commonCauses: ["dirty throttle body", "vacuum leak", "IAC"] },
  P0521: { code: "P0521", meaning: "Engine oil pressure sensor/switch range/performance", system: "powertrain", category: "oil", urgency: "stop", safetyCritical: true, commonCauses: ["low oil level", "oil pressure sensor", "oil pump", "worn bearings"] },
  P0524: { code: "P0524", meaning: "Engine oil pressure too low", system: "powertrain", category: "oil", urgency: "stop", safetyCritical: true, commonCauses: ["low oil", "oil pump", "engine wear"] },
  P0562: { code: "P0562", meaning: "System voltage low", system: "powertrain", category: "charging", urgency: "soon", commonCauses: ["failing alternator", "battery", "corroded connections"] },
  P0563: { code: "P0563", meaning: "System voltage high", system: "powertrain", category: "charging", urgency: "soon", commonCauses: ["voltage regulator", "alternator"] },
  P0700: { code: "P0700", meaning: "Transmission control system malfunction", system: "powertrain", category: "transmission", urgency: "soon", commonCauses: ["TCM fault (read sub-codes)", "solenoids", "low/burnt fluid"] },
  P0740: { code: "P0740", meaning: "Torque converter clutch circuit malfunction", system: "powertrain", category: "transmission", urgency: "soon", commonCauses: ["TCC solenoid", "low fluid", "valve body"] },
  P0A0F: { code: "P0A0F", meaning: "Engine failed to start (hybrid/EV)", system: "powertrain", category: "hybrid", urgency: "soon", commonCauses: ["hybrid battery", "inverter", "high-voltage system"] },
  C0035: { code: "C0035", meaning: "Left front wheel speed sensor circuit (ABS)", system: "chassis", category: "brakes/abs", urgency: "soon", safetyCritical: true, commonCauses: ["wheel speed sensor", "tone ring", "wiring"] },
  C0040: { code: "C0040", meaning: "Right front wheel speed sensor circuit (ABS)", system: "chassis", category: "brakes/abs", urgency: "soon", safetyCritical: true, commonCauses: ["wheel speed sensor", "tone ring", "wiring"] },
  U0100: { code: "U0100", meaning: "Lost communication with ECM/PCM", system: "network", category: "network", urgency: "soon", commonCauses: ["module power/ground", "CAN bus wiring", "ECM"] },
  U0121: { code: "U0121", meaning: "Lost communication with ABS control module", system: "network", category: "brakes/abs", urgency: "soon", safetyCritical: true, commonCauses: ["ABS module power/ground", "CAN wiring"] },
  U0151: { code: "U0151", meaning: "Lost communication with restraints (airbag) control module", system: "network", category: "airbag", urgency: "soon", safetyCritical: true, commonCauses: ["SRS module", "wiring", "clockspring"] },
};

/** Categories that the symptom decoder treats as safety-critical (never under-warn). */
export const SAFETY_DTC_CATEGORIES = new Set([
  "overheating",
  "oil",
  "brakes/abs",
  "airbag",
  "steering",
]);

const SYSTEM_LETTER: Record<string, DtcEntry["system"]> = {
  P: "powertrain",
  B: "body",
  C: "chassis",
  U: "network",
};

/** Normalize and validate a raw DTC string (e.g. "p0301" → "P0301"). */
export function normalizeDtc(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  return /^[PBCU][0-3][0-9A-F]{2,3}$/.test(code) ? code : null;
}

/** Look up a seeded code, or decode structurally with a cautious default. */
export function decodeDtc(raw: string): DtcEntry | null {
  const code = normalizeDtc(raw);
  if (!code) return null;
  if (DTC_SEED[code]) return DTC_SEED[code];

  const system = SYSTEM_LETTER[code[0]] ?? "powertrain";
  const generic = code[1] === "0" || code[1] === "2";
  const safety = system === "chassis" || (system === "body" && code.startsWith("B0"));
  return {
    code,
    meaning: `${cap(system)} trouble code ${code} — ${generic ? "generic (SAE)" : "manufacturer-specific"} code. Have it read against your vehicle's service data for the exact definition.`,
    system,
    category: system === "chassis" ? "brakes/abs" : system === "network" ? "network" : "unknown",
    urgency: safety ? "soon" : "soon",
    safetyCritical: safety,
    commonCauses: [],
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
