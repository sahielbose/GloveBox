"use server";
import { signOut } from "@/auth";
import { cookies } from "next/headers";
import { ACTIVE_VEHICLE_COOKIE } from "@/lib/app-context";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function setActiveVehicleAction(vehicleId: string) {
  const c = await cookies();
  c.set(ACTIVE_VEHICLE_COOKIE, vehicleId, { path: "/", httpOnly: false, sameSite: "lax" });
}
