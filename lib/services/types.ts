import { z } from "zod";

/** Minimal canonical vehicle shape the verbs operate on. */
export const VehicleSchema = z.object({
  id: z.string().optional(),
  vin: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  make: z.string(),
  model: z.string(),
  trim: z.string().optional().nullable(),
  engine: z.string().optional().nullable(),
  mileage: z.number().int().nonnegative().optional().nullable(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export function vehicleLabel(v: Pick<Vehicle, "year" | "make" | "model" | "trim">): string {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
}
