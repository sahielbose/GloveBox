"use server";

import { decodeVehicle } from "@/lib/services/decodeVehicle";
import { findRecalls, type RecallMatch } from "@/lib/services/findRecalls";
import type { Vehicle } from "@/lib/services/types";

export type RecallLookupResult =
  | { ok: false; error: string }
  | {
      ok: true;
      vehicleLabel: string;
      vin: string | null;
      matches: RecallMatch[];
    };

function vehicleLabelOf(v: { year?: number | null; make?: string | null; model?: string | null }) {
  return [v.year, v.make, v.model].filter(Boolean).join(" ");
}

/**
 * Public recall lookup — no auth, nothing saved. Accepts a VIN (decode → recalls)
 * or a year/make/model entry (recalls directly). Official feeds only; never
 * fabricates a recall. Errors degrade to a friendly message rather than throwing.
 */
export async function lookupRecalls(
  _prev: RecallLookupResult | null,
  formData: FormData,
): Promise<RecallLookupResult> {
  const mode = String(formData.get("mode") ?? "ymm");

  try {
    let vehicle: Vehicle;
    let vin: string | null = null;

    if (mode === "vin") {
      const rawVin = String(formData.get("vin") ?? "").trim();
      if (rawVin.length < 11) {
        return { ok: false, error: "Enter a full 17-character VIN (or switch to year / make / model)." };
      }

      const decoded = await decodeVehicle({ kind: "vin", vin: rawVin });
      vin = decoded.vin;

      if (!decoded.make || !decoded.model) {
        const detail = decoded.errors[0] ?? "We couldn't decode that VIN.";
        return {
          ok: false,
          error: `${detail} Double-check the VIN, or look up by year, make, and model instead.`,
        };
      }

      vehicle = {
        vin: decoded.vin,
        year: decoded.year,
        make: decoded.make,
        model: decoded.model,
        trim: decoded.trim,
        engine: decoded.engine,
      };
    } else {
      const yearRaw = String(formData.get("year") ?? "").trim();
      const make = String(formData.get("make") ?? "").trim();
      const model = String(formData.get("model") ?? "").trim();
      const year = Number(yearRaw);

      if (!make || !model || !yearRaw) {
        return { ok: false, error: "Enter a year, make, and model to look up recalls." };
      }
      if (!Number.isInteger(year) || year < 1981 || year > new Date().getFullYear() + 1) {
        return { ok: false, error: "Enter a valid model year (1981 or later)." };
      }

      vehicle = { year, make, model };
    }

    const matches = await findRecalls(vehicle);

    return {
      ok: true,
      vehicleLabel: vehicleLabelOf(vehicle),
      vin,
      matches,
    };
  } catch {
    return {
      ok: false,
      error:
        "We couldn't reach the recall service just now. The official feed may be busy — please try again in a moment.",
    };
  }
}
