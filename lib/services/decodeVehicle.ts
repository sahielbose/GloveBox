import { z } from "zod";
import { decodeVin, decodePartialVin } from "@/lib/integrations/nhtsa";
import { getMpg } from "@/lib/integrations/fueleconomy";

export const DecodedVehicleSchema = z.object({
  vin: z.string().nullable(),
  year: z.number().int().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  trim: z.string().nullable(),
  engine: z.string().nullable(),
  bodyClass: z.string().nullable(),
  fuelType: z.string().nullable(),
  mpg: z
    .object({
      cityMpg: z.number().optional(),
      highwayMpg: z.number().optional(),
      combinedMpg: z.number().optional(),
    })
    .nullable(),
  specs: z.record(z.string(), z.unknown()),
  errors: z.array(z.string()),
  ok: z.boolean(),
});
export type DecodedVehicle = z.infer<typeof DecodedVehicleSchema>;

export type DecodeInput =
  | { kind: "vin"; vin: string; year?: number }
  | { kind: "ymm"; year: number; make: string; model: string; trim?: string };

/**
 * decodeVehicle — canonical vehicle from a VIN (vPIC) or a year/make/model entry,
 * enriched with EPA MPG when available. Handles partial/old VINs gracefully:
 * returns whatever decoded plus an `errors` list rather than guessing.
 */
export async function decodeVehicle(input: DecodeInput): Promise<DecodedVehicle> {
  if (input.kind === "vin") {
    const clean = input.vin.trim().toUpperCase();
    const decoded =
      clean.length === 17
        ? await decodeVin(clean)
        : await decodePartialVin(clean, input.year);
    if (!decoded) {
      return DecodedVehicleSchema.parse({
        vin: clean, year: input.year ?? null, make: null, model: null, trim: null,
        engine: null, bodyClass: null, fuelType: null, mpg: null, specs: {},
        errors: ["Could not reach the VIN decoder. Try again, or enter year/make/model."],
        ok: false,
      });
    }
    const mpg = decoded.year && decoded.make && decoded.model
      ? await safeMpg(decoded.year, decoded.make, decoded.model)
      : null;
    return DecodedVehicleSchema.parse({
      vin: clean,
      year: decoded.year ?? input.year ?? null,
      make: decoded.make ?? null,
      model: decoded.model ?? null,
      trim: decoded.trim ?? null,
      engine: decoded.engine ?? null,
      bodyClass: decoded.bodyClass ?? null,
      fuelType: decoded.fuelType ?? null,
      mpg,
      specs: decoded.raw,
      errors: decoded.errors,
      ok: !!(decoded.make && decoded.model),
    });
  }

  // year/make/model entry
  const mpg = await safeMpg(input.year, input.make, input.model);
  return DecodedVehicleSchema.parse({
    vin: null,
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim ?? null,
    engine: null,
    bodyClass: null,
    fuelType: mpg?.fuelType ?? null,
    mpg: mpg ? { cityMpg: mpg.cityMpg, highwayMpg: mpg.highwayMpg, combinedMpg: mpg.combinedMpg } : null,
    specs: {},
    errors: [],
    ok: true,
  });
}

async function safeMpg(year: number, make: string, model: string) {
  try {
    return await getMpg(year, make, model);
  } catch {
    return null;
  }
}
