"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { runDigitize, type InspectionState } from "./actions";
import { InspectionCard } from "@/components/cards/InspectionCard";
import { inputClass } from "@/components/ui";

const PLACEHOLDER = `Front brake pads ...... 3mm  YELLOW
Rear brake pads ....... 8mm  GREEN
Front rotors .......... RED — replace
Tires (tread) ......... 5/32 YELLOW
Battery ............... 11.8V RED
Engine air filter ..... GREEN`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-btn bg-sage px-5 py-3 font-medium text-ink transition-colors hover:bg-sage-hover disabled:opacity-50"
    >
      {pending ? "Reading the sheet…" : "Digitize inspection →"}
    </button>
  );
}

export function InspectionForm() {
  const [state, action] = useActionState<InspectionState, FormData>(runDigitize, { ok: null });

  return (
    <div className="mt-8 space-y-6">
      <form action={action} className="rounded-card border border-hairline bg-surface p-5">
        <label className="block">
          <span className="text-sm text-ash">Paste your shop&apos;s multi-point inspection</span>
          <textarea
            name="text"
            rows={8}
            placeholder={PLACEHOLDER}
            className={`${inputClass} mt-2 resize-y font-mono text-sm`}
          />
        </label>
        <p className="mt-2 text-xs text-ash/80">
          Most shops hand you a green/yellow/red sheet. Paste it here — we&apos;ll organize it and tell
          you, in plain English, what&apos;s urgent and what can wait. Safety items are never softened.
        </p>
        <div className="mt-4">
          <SubmitButton />
        </div>
      </form>

      {state.ok === false && (
        <p className="rounded-card border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-chalk">{state.error}</p>
      )}

      {state.ok === true && <InspectionCard data={state.result} />}
    </div>
  );
}
