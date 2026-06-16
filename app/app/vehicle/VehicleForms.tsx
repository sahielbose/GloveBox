"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Loader2,
  Check,
  AlertTriangle,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  updateMileageAction,
  setNicknameAction,
  setPrimaryAction,
  deleteVehicleAction,
  uploadDocumentAction,
  type FormResult,
} from "./actions";

const INITIAL: FormResult = { ok: false, message: undefined };

function Submit({
  children,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "contrast";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

/** Inline status line shared by every form. Only renders after a result. */
function Result({ state }: { state: FormResult }) {
  if (!state.message) return null;
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1.5 text-sm",
        state.ok ? "text-ok" : "text-alert",
      )}
    >
      {state.ok ? (
        <Check size={14} aria-hidden />
      ) : (
        <AlertTriangle size={14} aria-hidden />
      )}
      {state.message}
    </p>
  );
}

/* ── Mileage ──────────────────────────────────────────────────────────────── */

export function MileageForm({ vehicleId, mileage }: { vehicleId: string; mileage: number }) {
  const [state, action] = useActionState(updateMileageAction, INITIAL);
  return (
    <form action={action}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field label="Current mileage">
            <input
              name="mileage"
              defaultValue={mileage}
              inputMode="numeric"
              className={cn(inputClass, "font-mono")}
            />
          </Field>
        </div>
        <Submit variant="ghost">Update</Submit>
      </div>
      <Result state={state} />
    </form>
  );
}

/* ── Nickname ─────────────────────────────────────────────────────────────── */

export function NicknameForm({
  vehicleId,
  nickname,
}: {
  vehicleId: string;
  nickname: string | null;
}) {
  const [state, action] = useActionState(setNicknameAction, INITIAL);
  return (
    <form action={action}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field label="Nickname" hint="Optional.">
            <input
              name="nickname"
              defaultValue={nickname ?? ""}
              placeholder="The wagon"
              className={inputClass}
            />
          </Field>
        </div>
        <Submit variant="ghost">Save</Submit>
      </div>
      <Result state={state} />
    </form>
  );
}

/* ── Set primary ──────────────────────────────────────────────────────────── */

export function PrimaryForm({ vehicleId, isPrimary }: { vehicleId: string; isPrimary: boolean }) {
  const [state, action] = useActionState(setPrimaryAction, INITIAL);
  if (isPrimary) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-ash">
        <Star size={14} className="text-sage" aria-hidden />
        This is your primary car.
      </p>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <Submit variant="ghost">
        <Star size={14} aria-hidden /> Set as primary
      </Submit>
      <Result state={state} />
    </form>
  );
}

/* ── Delete (two-step confirm — destructive) ──────────────────────────────── */

export function DeleteForm({ vehicleId, label }: { vehicleId: string; label: string }) {
  const [state, action] = useActionState(deleteVehicleAction, INITIAL);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="inline-flex items-center gap-2 rounded-btn border border-alert/40 px-4 py-2.5 text-sm font-medium text-alert transition-colors hover:bg-alert/10"
        >
          <Trash2 size={14} aria-hidden /> Delete this car
        </button>
        <p className="mt-2 text-xs text-ash">
          Permanently removes {label} and all its service history, documents, and recalls.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-card border border-alert/40 bg-alert/10 p-4">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <p className="text-sm font-medium text-chalk">
        Delete {label}? This can&apos;t be undone.
      </p>
      <p className="mt-1 text-sm text-ash">
        Type <span className="font-mono text-chalk">DELETE</span> to confirm.
      </p>
      <input
        name="confirm"
        autoComplete="off"
        placeholder="DELETE"
        className={cn(inputClass, "mt-3 font-mono uppercase")}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-btn bg-alert px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-alert/90"
        >
          <Trash2 size={14} aria-hidden /> Confirm delete
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="text-sm text-ash underline underline-offset-4 hover:text-chalk"
        >
          Cancel
        </button>
      </div>
      <Result state={state} />
    </form>
  );
}

/* ── Document upload (file + optional pasted text → RAG) ───────────────────── */

const DOC_KINDS = [
  { value: "manual", label: "Owner's manual" },
  { value: "insurance", label: "Insurance" },
  { value: "registration", label: "Registration" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
] as const;

export function DocumentUploadForm({ vehicleId }: { vehicleId: string }) {
  const [state, action] = useActionState(uploadDocumentAction, INITIAL);
  // Re-mount the file/text inputs after a successful save by keying on the message.
  const formKey = state.ok ? state.message : "form";

  return (
    <form action={action} key={formKey} className="space-y-4">
      <input type="hidden" name="vehicleId" value={vehicleId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Document type">
          <select name="kind" defaultValue="manual" className={inputClass}>
            {DOC_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="File" hint="Stored privately for this car.">
          <input
            type="file"
            name="file"
            className="block w-full text-sm text-ash file:mr-3 file:rounded-btn file:border file:border-hairline file:bg-surface file:px-3 file:py-2 file:text-sm file:text-chalk hover:file:border-chalk/30"
          />
        </Field>
      </div>

      <Field
        label="Document text"
        hint="Optional — we OCR uploaded PDFs/photos automatically. Paste text here only to override or add key sections for Ask GloveBox to cite."
      >
        <textarea
          name="text"
          rows={4}
          placeholder="Paste manual sections, policy details, etc."
          className={cn(inputClass, "resize-y")}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Submit>
          <Upload size={15} aria-hidden /> Save document
        </Submit>
        <Result state={state} />
      </div>
    </form>
  );
}
