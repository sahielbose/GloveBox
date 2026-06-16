"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Download, Loader2 } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import {
  saveSettingsAction,
  exportDataAction,
  deleteAccountAction,
  type SettingsState,
  type DeleteState,
} from "./actions";

type UserSettings = {
  reminderChannel: string;
  digestFrequency: string;
  phone: string | null;
};

const selectClass = inputClass;

/* ── Reminders & channels ─────────────────────────────────────────────────── */

export function RemindersForm({ user }: { user: UserSettings }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(saveSettingsAction, {
    status: "idle",
  });
  const [channel, setChannel] = useState(user.reminderChannel);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Reminder channel" hint="How you'd like to hear about due maintenance and new recalls.">
          <select
            name="reminderChannel"
            defaultValue={user.reminderChannel}
            onChange={(e) => setChannel(e.target.value)}
            className={selectClass}
          >
            <option value="email">Email</option>
            <option value="sms">SMS (text)</option>
            <option value="none">None</option>
          </select>
        </Field>

        <Field label="Digest frequency" hint="A quiet summary of what's due and what's new.">
          <select name="digestFrequency" defaultValue={user.digestFrequency} className={selectClass}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="off">Off</option>
          </select>
        </Field>
      </div>

      <Field
        label="Phone number"
        hint={
          channel === "sms"
            ? "Required for SMS. SMS needs Twilio configured on the server; without it, reminders fall back to email."
            : "Optional — only used if you switch to SMS reminders."
        }
      >
        <input
          type="tel"
          name="phone"
          defaultValue={user.phone ?? ""}
          placeholder="+1 555 123 4567"
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <SaveButton />
        {state.status === "saved" && <StatusBadge status="ok" label="Saved" />}
        {state.status === "error" && (
          <span className="text-sm text-alert">{state.message}</span>
        )}
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden /> Saving…
        </>
      ) : (
        "Save changes"
      )}
    </Button>
  );
}

/* ── Data export (explicit, confirm-gated) ────────────────────────────────── */

export function DataExport() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function run() {
    setError(null);
    startTransition(async () => {
      try {
        const { fileName, json } = await exportDataAction();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setConfirming(false);
      } catch {
        setError("Couldn't build your export. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ash">
        Download everything GloveBox holds for you — your vehicles, service history, saved quote
        checks, and symptom reports — as a single JSON file. It stays on your device; nothing is
        sent or shared.
      </p>

      {!confirming ? (
        <div>
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
            <Download size={15} aria-hidden /> Export my data
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={run} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden /> Preparing…
              </>
            ) : (
              "Confirm & download"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      )}

      {error && <span className="text-sm text-alert">{error}</span>}
    </div>
  );
}

/* ── Delete account (two-step, type DELETE) ───────────────────────────────── */

export function DeleteAccount() {
  const [state, formAction] = useActionState<DeleteState, FormData>(deleteAccountAction, {
    status: "idle",
  });
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");

  return (
    <div className="rounded-card border border-alert/40 bg-alert/5 p-5">
      <h3 className="text-base font-medium text-chalk">Delete account</h3>
      <p className="mt-2 text-sm text-ash">
        Permanently deletes your account and every car you own — along with all service records,
        quote checks, symptom reports, recalls, documents, and reminders. This cannot be undone.
      </p>

      {!armed ? (
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => setArmed(true)}
            className="bg-alert text-ink hover:bg-alert/90"
          >
            Delete my account…
          </Button>
        </div>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <Field label='Type DELETE to confirm' hint="This is your last step. There is no undo.">
            <input
              name="confirm"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              className={cn(inputClass, "font-mono")}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <DeleteButton enabled={typed.trim() === "DELETE"} />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setArmed(false);
                setTyped("");
              }}
            >
              Cancel
            </Button>
          </div>
          {state.status === "error" && (
            <span className="text-sm text-alert">{state.message}</span>
          )}
        </form>
      )}
    </div>
  );
}

function DeleteButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={!enabled || pending}
      className="bg-alert text-ink hover:bg-alert/90"
    >
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden /> Deleting…
        </>
      ) : (
        "Permanently delete account"
      )}
    </Button>
  );
}
