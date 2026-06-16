import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format cents (integer) as USD. Money is stored as integer cents everywhere. */
export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Format an integer mileage with thousands separators. */
export function formatMiles(mi: number | null | undefined): string {
  if (mi == null) return "—";
  return `${new Intl.NumberFormat("en-US").format(mi)} mi`;
}
