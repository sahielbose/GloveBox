"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Car, Plus } from "lucide-react";
import Link from "next/link";
import { setActiveVehicleAction } from "@/lib/actions/auth";

type Item = { id: string; year: number | null; make: string; model: string; nickname: string | null };

export function VehicleSwitcher({ vehicles, activeId }: { vehicles: Item[]; activeId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (vehicles.length === 0) {
    return (
      <Link href="/app/onboarding" className="inline-flex items-center gap-2 rounded-btn bg-sage px-4 py-2 text-sm font-medium text-ink">
        <Plus size={15} /> Add your car
      </Link>
    );
  }

  const label = (v: Item) => v.nickname || [v.year, v.make, v.model].filter(Boolean).join(" ");

  return (
    <div className="flex items-center gap-2">
      <Car size={16} className="text-ash" aria-hidden />
      <select
        value={activeId ?? ""}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setActiveVehicleAction(e.target.value);
            router.refresh();
          })
        }
        className="min-h-11 rounded-btn border border-hairline bg-surface px-3 py-1.5 text-sm text-chalk focus:border-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        aria-label="Active vehicle"
      >
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {label(v)}
          </option>
        ))}
      </select>
      <Link href="/app/onboarding" className="inline-flex h-11 w-11 items-center justify-center rounded-btn border border-hairline text-ash hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage" aria-label="Add a car">
        <Plus size={16} />
      </Link>
    </div>
  );
}
