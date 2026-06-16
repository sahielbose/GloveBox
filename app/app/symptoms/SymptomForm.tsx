"use client";

import { useActionState } from "react";
import { OctagonAlert, AlertCircle, ArrowRight, BookText, Check } from "lucide-react";
import { LinkButton, Button, Field, inputClass } from "@/components/ui";
import { SymptomCard } from "@/components/cards/SymptomCard";
import { cn } from "@/lib/utils";
import {
  runDecodeSymptom,
  runRepairStory,
  type SymptomState,
  type RepairStoryState,
} from "./actions";

export function SymptomForm({ vehicleLabel }: { vehicleLabel: string }) {
  const [state, formAction, pending] = useActionState<SymptomState, FormData>(
    runDecodeSymptom,
    null,
  );

  const result = state?.ok ? state.result : null;
  const topCause = result?.causes[0]?.cause ?? "";

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        <div className="rounded-card border border-hairline bg-surface p-5">
          <Field
            label="Describe the noise, smell, or behavior"
            hint="Plain words are fine — e.g. “grinding when I brake at low speed.”"
          >
            <textarea
              name="text"
              rows={4}
              placeholder="What's it doing, and when?"
              className={cn(inputClass, "min-h-[6rem] resize-y")}
            />
          </Field>

          <div className="mt-5">
            <Field
              label="Trouble code (optional)"
              hint="If your scanner or dash shows one — e.g. P0301."
            >
              <input
                name="dtc"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="P0301"
                className={cn(inputClass, "max-w-[12rem] font-mono uppercase")}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Decoding…" : "Decode this"}
            </Button>
            <span className="text-xs text-ash">
              Informational, not a diagnosis. We never reassure about an unsafe symptom.
            </span>
          </div>
        </div>
      </form>

      {state && !state.ok && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-card border border-alert/40 bg-alert/10 p-4 text-sm text-chalk"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-alert" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      {result && (
        <section aria-label="Symptom result" className="space-y-5">
          {/* Stop-driving banner — never softened. */}
          {result.urgency === "stop" && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-card border-2 border-alert bg-alert/15 p-4"
            >
              <OctagonAlert size={22} className="mt-0.5 shrink-0 text-alert" aria-hidden />
              <div>
                <p className="text-base font-semibold text-chalk">
                  Stop driving — get it inspected.
                </p>
                <p className="mt-1 text-sm text-chalk/90">{result.urgencyReason}</p>
              </div>
            </div>
          )}

          <SymptomCard
            data={{
              input: state?.ok ? state.input || result.dtcCode || "—" : "—",
              urgency: result.urgency,
              urgencyReason: result.urgencyReason,
              causes: result.causes,
              costLowCents: result.costLowCents,
              costHighCents: result.costHighCents,
              dtcCode: result.dtcCode,
              summary: result.summary,
            }}
          />

          {/* Plain-English summary */}
          <div className="rounded-card border border-hairline bg-surface p-5">
            <span className="eyebrow">In plain English</span>
            <p className="mt-3 text-base leading-relaxed text-chalk">{result.summary}</p>
          </div>

          {/* Follow-ups */}
          <div className="rounded-card border border-hairline bg-surface p-5">
            <span className="eyebrow">Next step</span>
            <p className="mt-3 text-sm text-ash">
              Turn this into a fair-price check before you call a shop, or save it to your log as a
              repair story.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <LinkButton href="/app/quote-check">
                Turn into a Quote Check <ArrowRight size={15} aria-hidden />
              </LinkButton>
              <RepairStoryPanel
                symptom={state?.ok ? state.input : ""}
                diagnosis={topCause}
                vehicleLabel={vehicleLabel}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Repair-story sub-form. Drafting the C/C/C is free; writing it to the service
 * log is an explicit second confirm (the contract's confirm gate).
 */
function RepairStoryPanel({
  symptom,
  diagnosis,
  vehicleLabel,
}: {
  symptom: string;
  diagnosis: string;
  vehicleLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RepairStoryState, FormData>(
    runRepairStory,
    null,
  );

  const story = state?.ok ? state.story : null;

  return (
    <div className="w-full">
      <form action={formAction} className="inline">
        <input type="hidden" name="symptom" value={symptom} />
        <input type="hidden" name="diagnosis" value={diagnosis} />
        <Button type="submit" variant="ghost" disabled={pending}>
          <BookText size={15} aria-hidden />
          {pending ? "Writing…" : "Save as Repair Story"}
        </Button>
      </form>

      {state && !state.ok && (
        <p role="alert" className="mt-3 text-sm text-alert">
          {state.error}
        </p>
      )}

      {story && (
        <div className="mt-4 rounded-card border border-hairline bg-ink/40 p-4">
          <span className="font-mono text-xs text-ash">{vehicleLabel} · repair story</span>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ash">Complaint</dt>
              <dd className="mt-0.5 text-chalk">{story.complaint}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ash">Cause</dt>
              <dd className="mt-0.5 text-chalk">{story.cause}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ash">Correction</dt>
              <dd className="mt-0.5 text-chalk">{story.correction}</dd>
            </div>
          </dl>

          {state?.ok && state.saved ? (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-ok">
              <Check size={15} aria-hidden /> Saved to your service log.
            </p>
          ) : (
            // Explicit second step: the user confirms before it's written to the log.
            <form action={formAction} className="mt-4">
              <input type="hidden" name="symptom" value={symptom} />
              <input type="hidden" name="diagnosis" value={diagnosis} />
              <input type="hidden" name="confirmSave" value="1" />
              <Button type="submit" disabled={pending}>
                Confirm & save to service log
              </Button>
              <span className="ml-3 text-xs text-ash">
                Adds a “Repair story” entry to your log. Nothing is sent anywhere.
              </span>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
