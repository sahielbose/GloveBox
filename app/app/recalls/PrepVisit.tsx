"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Check, Copy, Loader2, Phone, X } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { draftRecallScriptAction, scheduleRecallReminderAction } from "./actions";

type Props = {
  campaignId: string;
  component: string;
  remedy: string;
};

/**
 * Prep visit: drafts a call script the owner uses to book the (free) dealer fix.
 * Drafting has no side effects. Scheduling a reminder is CONFIRM-GATED — a two-step
 * "Schedule" → "Confirm" runs the server action only on explicit click. Never books.
 */
export function PrepVisit({ campaignId, component, remedy }: Props) {
  const [drafting, startDraft] = useTransition();
  const [scheduling, startSchedule] = useTransition();
  const [script, setScript] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function draft() {
    setError(null);
    setOpen(true);
    startDraft(async () => {
      const res = await draftRecallScriptAction({ campaignId, component, remedy });
      if (res.ok) setScript(res.script);
      else setError(res.error ?? "Could not draft a script.");
    });
  }

  async function copy() {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed — select the text manually.");
    }
  }

  function confirmSchedule() {
    if (!script) return;
    setError(null);
    startSchedule(async () => {
      const res = await scheduleRecallReminderAction({ campaignId, component, script });
      if (res.ok) {
        setScheduled(true);
        setConfirming(false);
      } else {
        setError(res.error ?? "Could not schedule the reminder.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={draft}
        className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 text-sm font-medium text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      >
        <Phone size={14} aria-hidden /> Prep visit
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-card border border-hairline bg-ink/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">Call script</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-chip text-ash hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          aria-label="Close call script"
        >
          <X size={15} aria-hidden />
        </button>
      </div>

      <p className="mt-2 text-sm text-ash">
        Recall repairs are <span className="text-chalk">free at any franchised dealer</span>. Read this when you
        call — GloveBox never books or pays on your behalf.
      </p>

      {drafting && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ash">
          <Loader2 size={14} className="animate-spin" aria-hidden /> Drafting…
        </p>
      )}

      {script && (
        <>
          <pre className="mt-3 whitespace-pre-wrap rounded-chip border border-hairline bg-surface p-3 font-mono text-xs leading-relaxed text-chalk">
            {script}
          </pre>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 text-sm text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </button>

            {scheduled ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-ok">
                <Check size={14} aria-hidden /> Reminder scheduled (~2 days)
              </span>
            ) : confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ash">Schedule an email reminder to book?</span>
                <button
                  type="button"
                  disabled={scheduling}
                  onClick={confirmSchedule}
                  className={buttonClass("primary", "px-3 py-1.5")}
                >
                  {scheduling ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                  ) : (
                    <CalendarClock size={14} aria-hidden />
                  )}
                  Confirm &amp; schedule
                </button>
                <button
                  type="button"
                  disabled={scheduling}
                  onClick={() => setConfirming(false)}
                  className="rounded-btn px-2 py-1.5 text-sm text-ash hover:text-chalk"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 text-sm text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              >
                <CalendarClock size={14} aria-hidden /> Schedule a reminder to book
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
    </div>
  );
}
