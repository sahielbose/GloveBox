"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { decodeVehicle, type DecodedVehicle } from "@/lib/services/decodeVehicle";
import { createVehicle, syncRecalls, toVehicle } from "@/lib/db/queries";

/* ──────────────────────────────────────────────────────────────────────────
 * Step 1 — decode. Takes a VIN or a year/make/model entry, returns the decoded
 * vehicle (or an ok:false result with errors). The form round-trips the decoded
 * JSON into step 2 so the confirm step has no server state to carry.
 * ────────────────────────────────────────────────────────────────────────── */

export type DecodeState =
  | { status: "idle" }
  | { status: "decoded"; decoded: DecodedVehicle }
  | { status: "error"; errors: string[] };

export async function decodeAction(
  _prev: DecodeState,
  formData: FormData,
): Promise<DecodeState> {
  await requireUser();

  const mode = String(formData.get("mode") ?? "vin");

  if (mode === "vin") {
    const vin = String(formData.get("vin") ?? "").trim();
    if (!vin) {
      return { status: "error", errors: ["Enter a VIN, or switch to year/make/model."] };
    }
    const yearRaw = String(formData.get("vinYear") ?? "").trim();
    const year = yearRaw ? Number(yearRaw) : undefined;
    const decoded = await decodeVehicle({
      kind: "vin",
      vin,
      year: Number.isFinite(year) ? year : undefined,
    });
    if (!decoded.ok) {
      return {
        status: "error",
        errors: decoded.errors.length
          ? decoded.errors
          : ["We couldn't decode that VIN. Enter year/make/model instead."],
      };
    }
    return { status: "decoded", decoded };
  }

  // year/make/model
  const year = Number(String(formData.get("year") ?? "").trim());
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const trim = String(formData.get("trim") ?? "").trim();

  const errors: string[] = [];
  if (!Number.isFinite(year) || year < 1900 || year > 2100) errors.push("Enter a valid year.");
  if (!make) errors.push("Enter a make.");
  if (!model) errors.push("Enter a model.");
  if (errors.length) return { status: "error", errors };

  const decoded = await decodeVehicle({
    kind: "ymm",
    year,
    make,
    model,
    trim: trim || undefined,
  });
  if (!decoded.ok) {
    return {
      status: "error",
      errors: decoded.errors.length ? decoded.errors : ["We couldn't decode those details."],
    };
  }
  return { status: "decoded", decoded };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Step 2 — save. Creates the vehicle, then best-effort syncs recalls (so the
 * dashboard can say "no open recalls found"), then redirects to the dashboard.
 * ────────────────────────────────────────────────────────────────────────── */

export type SaveState = { status: "idle" } | { status: "error"; errors: string[] };

export async function saveVehicleAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await requireUser();

  let decoded: DecodedVehicle;
  try {
    decoded = JSON.parse(String(formData.get("decoded") ?? "")) as DecodedVehicle;
  } catch {
    return { status: "error", errors: ["Something went wrong reading the decoded car. Try again."] };
  }

  if (!decoded.make || !decoded.model) {
    return { status: "error", errors: ["A make and model are required to save this car."] };
  }

  const mileage = Number(String(formData.get("mileage") ?? "").trim());
  const nickname = String(formData.get("nickname") ?? "").trim();

  const vehicle = await createVehicle(user.id, {
    vin: decoded.vin,
    year: decoded.year,
    make: decoded.make,
    model: decoded.model,
    trim: decoded.trim,
    engine: decoded.engine,
    mileage: Number.isFinite(mileage) && mileage >= 0 ? mileage : 0,
    nickname: nickname || null,
    specs: buildSpecs(decoded),
  });

  // Best-effort recall sync at onboarding — never block the save on it.
  try {
    await syncRecalls(vehicle.id, toVehicle(vehicle));
  } catch {
    // ignore — recalls can be re-synced from the recall radar later
  }

  redirect("/app");
}

/** Fold the decoded body class / fuel type / MPG into the stored specs blob. */
function buildSpecs(decoded: DecodedVehicle): Record<string, unknown> {
  return {
    ...decoded.specs,
    bodyClass: decoded.bodyClass ?? undefined,
    fuelType: decoded.fuelType ?? undefined,
    mpg: decoded.mpg ?? undefined,
  };
}
