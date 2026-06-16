import "server-only";
import { cookies } from "next/headers";
import { getUserVehicles } from "@/lib/db/queries";

export const ACTIVE_VEHICLE_COOKIE = "gb_vehicle";

/** The active vehicle for the session: the cookie selection if owned, else primary. */
export async function getActiveVehicle(userId: string) {
  const list = await getUserVehicles(userId);
  if (list.length === 0) return { active: null, vehicles: list };
  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_VEHICLE_COOKIE)?.value;
  const active = list.find((v) => v.id === selected) ?? list[0];
  return { active, vehicles: list };
}
