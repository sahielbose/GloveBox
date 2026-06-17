"use client";
import { useState, useTransition } from "react";
import { BellPlus, Check } from "lucide-react";
import { setMaintenanceReminderAction } from "./actions";

/**
 * Confirm-gated "remind me" for a maintenance item. The reminder is only created
 * after the explicit Confirm click — nothing schedules or sends on the first tap.
 */
export function RemindMe({ service, dueDate }: { service: string; dueDate: string | null }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ok">
        <Check size={13} aria-hidden /> Reminder set
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 text-xs text-ash transition-colors hover:border-chalk/30 hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      >
        <BellPlus size={13} aria-hidden /> Remind me
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-card border border-hairline bg-surface p-4 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)]">
          <p className="text-xs leading-relaxed text-ash">
            Set a reminder {dueDate ? "for when this is due" : "for a week from now"}, sent via your
            chosen channel (Settings)?
          </p>
          {error && <p className="mt-2 text-xs text-alert">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await setMaintenanceReminderAction(service, dueDate);
                  if (r.ok) {
                    setDone(true);
                    setOpen(false);
                  } else {
                    setError(r.error);
                  }
                })
              }
              className="rounded-btn bg-sage px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sage-hover disabled:opacity-50"
            >
              {pending ? "Setting…" : "Confirm reminder"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-btn border border-hairline px-3 py-1.5 text-xs text-ash hover:text-chalk"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
