"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { RecallCard } from "@/components/cards/RecallCard";
import { inputClass } from "@/components/ui";
import { lookupRecalls, type RecallLookupResult } from "./actions";
import { cn } from "@/lib/utils";

type Mode = "ymm" | "vin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-sage px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-sage-hover disabled:opacity-60"
    >
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {pending ? "Checking official feeds…" : "Look up recalls"}
    </button>
  );
}

/**
 * Public recall lookup form — VIN or year/make/model, results rendered as
 * RecallCards. No account, nothing saved; a soft "Add your car" CTA is the funnel
 * into the monitored app experience.
 */
export function RecallLookup() {
  const [mode, setMode] = useState<Mode>("ymm");
  const [state, formAction] = useActionState<RecallLookupResult | null, FormData>(
    lookupRecalls,
    null,
  );

  return (
    <div>
      <form action={formAction} className="rounded-card border border-hairline bg-surface p-6 md:p-7">
        {/* Mode toggle */}
        <div
          className="inline-flex rounded-btn border border-hairline p-1"
          role="radiogroup"
          aria-label="Look up by"
        >
          {(["ymm", "vin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "min-h-11 rounded-[6px] px-4 text-sm font-medium transition-colors",
                mode === m ? "bg-chalk text-ink" : "text-ash hover:text-chalk",
              )}
            >
              {m === "ymm" ? "Year / make / model" : "VIN"}
            </button>
          ))}
        </div>

        {/* Hidden field carries the active mode to the server action. */}
        <input type="hidden" name="mode" value={mode} />

        {mode === "ymm" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.4fr_1.4fr]">
            <label className="block">
              <span className="text-sm text-ash">Year</span>
              <input
                name="year"
                inputMode="numeric"
                placeholder="2018"
                className={cn(inputClass, "mt-1.5")}
              />
            </label>
            <label className="block">
              <span className="text-sm text-ash">Make</span>
              <input name="make" placeholder="BMW" className={cn(inputClass, "mt-1.5")} />
            </label>
            <label className="block">
              <span className="text-sm text-ash">Model</span>
              <input name="model" placeholder="X5" className={cn(inputClass, "mt-1.5")} />
            </label>
          </div>
        ) : (
          <div className="mt-5">
            <label className="block">
              <span className="text-sm text-ash">VIN</span>
              <input
                name="vin"
                placeholder="5UXKR0C58J0XXXXXX"
                autoComplete="off"
                spellCheck={false}
                className={cn(inputClass, "mt-1.5 font-mono uppercase tracking-wide")}
              />
            </label>
            <p className="mt-2 text-xs text-ash">
              17 characters, usually on the driver-side dashboard or door jamb. We decode it
              against NHTSA&rsquo;s public vPIC service.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <SubmitButton />
          <span className="text-xs text-ash">No account needed · nothing is saved.</span>
        </div>
      </form>

      {/* Error state */}
      {state && !state.ok && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-card border border-warn/40 bg-warn/10 p-4 text-sm text-chalk"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden />
          <p>{state.error}</p>
        </div>
      )}

      {/* Results */}
      {state && state.ok && (
        <div className="mt-10">
          {state.matches.length === 0 ? (
            <div className="rounded-card border border-hairline bg-surface p-6">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-ok" aria-hidden />
                <h2 className="text-base font-medium text-chalk">
                  No open recalls found for {state.vehicleLabel}.
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ash">
                NHTSA lists no open vehicle recalls for this year, make, and model right now.
                That can change — manufacturers issue new campaigns regularly. Add your car to
                get notified the moment a new one lands.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="display-m text-chalk">
                  {state.matches.length} recall{state.matches.length === 1 ? "" : "s"} for{" "}
                  {state.vehicleLabel}
                </h2>
                <span className="font-mono text-xs text-ash">
                  Source: NHTSA{state.vin ? ` · VIN ${state.vin}` : ""}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash">
                Each entry shows its official campaign ID and a link to the NHTSA notice. Recalls
                are almost always repaired free of charge at a franchised dealer.
              </p>
              <div className="mt-7 grid gap-5 lg:grid-cols-2">
                {state.matches.map((m) => (
                  <RecallCard key={`${m.source}-${m.campaignId}`} data={m} />
                ))}
              </div>
            </>
          )}

          {/* Funnel CTA */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-ink p-6">
            <div>
              <h3 className="text-base font-medium text-chalk">Want this watched for you?</h3>
              <p className="mt-1 text-sm text-ash">
                Add your car and GloveBox checks NHTSA and CPSC daily, then tells you what a new
                recall means and what to do.
              </p>
            </div>
            <Link
              href="/app/onboarding"
              className="inline-flex min-h-11 shrink-0 items-center rounded-btn bg-sage px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-sage-hover"
            >
              Add your car
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
