"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { markServiceDoneAction } from "./actions";

/**
 * Mark-done control. Two-step: the user clicks "Mark done" → a small confirm
 * appears → clicking "Confirm" runs the server action. Writing a service record
 * is a deliberate, explicit action (not a destructive send, but we still confirm).
 */
export function MarkDone({ service }: { service: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-ok">
        <Check size={14} aria-hidden /> Logged
      </span>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-btn border border-hairline px-3 py-1.5 text-sm font-medium text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      >
        Mark done
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ash">Log at current mileage?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await markServiceDoneAction(service);
            if (res.ok) setDone(true);
            else setError(res.error ?? "Could not save.");
          })
        }
        className={buttonClass("primary", "px-3 py-1.5")}
      >
        {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Check size={14} aria-hidden />}
        Confirm
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="rounded-btn px-2 py-1.5 text-sm text-ash hover:text-chalk"
      >
        Cancel
      </button>
      {error && <span className="text-sm text-alert">{error}</span>}
    </div>
  );
}
