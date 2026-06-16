"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Car, Hash, Loader2, AlertTriangle, Check, Gauge } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  decodeAction,
  saveVehicleAction,
  type DecodeState,
  type SaveState,
} from "./actions";

type Mode = "vin" | "ymm";

function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

function Errors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="rounded-card border border-alert/40 bg-alert/10 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-chalk">
        <AlertTriangle size={15} className="text-alert" aria-hidden />
        We couldn&apos;t use that.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-ash">
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

export function OnboardingForm() {
  const [mode, setMode] = useState<Mode>("vin");
  const [decodeState, decode] = useActionState<DecodeState, FormData>(decodeAction, {
    status: "idle",
  });

  // Once decoded, swap to the confirm step.
  if (decodeState.status === "decoded") {
    return <ConfirmStep decoded={decodeState.decoded} onBack={() => window.location.reload()} />;
  }

  return (
    <form action={decode} className="space-y-6">
      {/* Mode toggle */}
      <div className="inline-flex rounded-btn border border-hairline p-1">
        <button
          type="button"
          onClick={() => setMode("vin")}
          className={cn(
            "flex items-center gap-2 rounded-[6px] px-4 py-2 text-sm transition-colors",
            mode === "vin" ? "bg-surface text-chalk" : "text-ash hover:text-chalk",
          )}
        >
          <Hash size={14} aria-hidden /> VIN
        </button>
        <button
          type="button"
          onClick={() => setMode("ymm")}
          className={cn(
            "flex items-center gap-2 rounded-[6px] px-4 py-2 text-sm transition-colors",
            mode === "ymm" ? "bg-surface text-chalk" : "text-ash hover:text-chalk",
          )}
        >
          <Car size={14} aria-hidden /> Year / make / model
        </button>
      </div>

      <input type="hidden" name="mode" value={mode} />

      {mode === "vin" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="VIN" hint="17 characters, usually on the dashboard or driver-side door jamb.">
              <input
                name="vin"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={17}
                placeholder="1HGCM82633A004352"
                className={cn(inputClass, "font-mono uppercase tracking-wide")}
              />
            </Field>
          </div>
          <Field label="Year" hint="Helps older or partial VINs.">
            <input
              name="vinYear"
              inputMode="numeric"
              placeholder="2018"
              className={cn(inputClass, "font-mono")}
            />
          </Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Year">
            <input
              name="year"
              inputMode="numeric"
              placeholder="2018"
              className={cn(inputClass, "font-mono")}
            />
          </Field>
          <Field label="Make">
            <input name="make" placeholder="Honda" className={inputClass} />
          </Field>
          <Field label="Model">
            <input name="model" placeholder="Civic" className={inputClass} />
          </Field>
          <Field label="Trim" hint="Optional.">
            <input name="trim" placeholder="EX-L" className={inputClass} />
          </Field>
        </div>
      )}

      {decodeState.status === "error" && <Errors errors={decodeState.errors} />}

      <div className="flex items-center gap-3">
        <SubmitButton>Decode car →</SubmitButton>
        <p className="text-xs text-ash">We read public NHTSA + EPA data. Nothing is saved yet.</p>
      </div>
    </form>
  );
}

function ConfirmStep({
  decoded,
  onBack,
}: {
  decoded: import("@/lib/services/decodeVehicle").DecodedVehicle;
  onBack: () => void;
}) {
  const [saveState, save] = useActionState<SaveState, FormData>(saveVehicleAction, {
    status: "idle",
  });

  const label = [decoded.year, decoded.make, decoded.model, decoded.trim]
    .filter(Boolean)
    .join(" ");
  const mpg = decoded.mpg;

  const specs: { k: string; v: string | null }[] = [
    { k: "Year", v: decoded.year ? String(decoded.year) : null },
    { k: "Make", v: decoded.make },
    { k: "Model", v: decoded.model },
    { k: "Trim", v: decoded.trim },
    { k: "Engine", v: decoded.engine },
    { k: "Body", v: decoded.bodyClass },
    { k: "Fuel", v: decoded.fuelType },
    {
      k: "MPG (city / hwy / combined)",
      v: mpg
        ? [mpg.cityMpg, mpg.highwayMpg, mpg.combinedMpg]
            .map((n) => (n != null ? String(n) : "—"))
            .join(" / ")
        : null,
    },
  ];

  return (
    <form action={save} className="space-y-6">
      <input type="hidden" name="decoded" value={JSON.stringify(decoded)} />

      <div className="rounded-card border border-hairline bg-surface p-5">
        <div className="flex items-center gap-2">
          <Check size={15} className="text-ok" aria-hidden />
          <span className="text-sm font-medium text-chalk">Decoded — confirm this is your car</span>
        </div>

        <h2 className="display-m mt-2 text-chalk">{label || "Your car"}</h2>
        {decoded.vin && (
          <p className="mt-1 font-mono text-sm text-ash">{decoded.vin}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {specs.map((s) => (
            <div key={s.k}>
              <dt className="text-xs uppercase tracking-wide text-ash">{s.k}</dt>
              <dd className="mt-0.5 text-sm text-chalk">{s.v ?? "Not reported"}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs text-ash">
          Specs come from the public NHTSA vPIC decode and EPA FuelEconomy data. MPG is an EPA
          estimate, not a measured figure for your exact car.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current mileage" hint="So we can tell what's due.">
          <div className="relative">
            <Gauge
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash"
              aria-hidden
            />
            <input
              name="mileage"
              inputMode="numeric"
              placeholder="78400"
              className={cn(inputClass, "pl-9 font-mono")}
            />
          </div>
        </Field>
        <Field label="Nickname" hint="Optional — e.g. “the wagon.”">
          <input name="nickname" placeholder="The wagon" className={inputClass} />
        </Field>
      </div>

      {saveState.status === "error" && <Errors errors={saveState.errors} />}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save car →</SubmitButton>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-ash underline underline-offset-4 hover:text-chalk"
        >
          Start over
        </button>
      </div>
    </form>
  );
}
