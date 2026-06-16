"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { signOut } from "@/auth";
import {
  getUser,
  getUserVehicles,
  updateUserSettings,
  deleteVehicle,
  listServiceRecords,
  listQuoteChecks,
  listSymptomReports,
} from "@/lib/db/queries";

/* ──────────────────────────────────────────────────────────────────────────
 * Reminders & channels. Plain settings write — no outbound side effect here, so
 * no confirm gate is needed (the confirm gate lives where reminders actually
 * SEND). SMS only works when Twilio is configured; otherwise it degrades to
 * email, which we state plainly in the UI.
 * ────────────────────────────────────────────────────────────────────────── */

export type SettingsState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

const CHANNELS = ["email", "sms", "none"] as const;
const FREQUENCIES = ["weekly", "monthly", "off"] as const;
type Channel = (typeof CHANNELS)[number];
type Frequency = (typeof FREQUENCIES)[number];

export async function saveSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();

  const channelRaw = String(formData.get("reminderChannel") ?? "email");
  const frequencyRaw = String(formData.get("digestFrequency") ?? "weekly");
  const phone = String(formData.get("phone") ?? "").trim();

  const reminderChannel: Channel = (CHANNELS as readonly string[]).includes(channelRaw)
    ? (channelRaw as Channel)
    : "email";
  const digestFrequency: Frequency = (FREQUENCIES as readonly string[]).includes(frequencyRaw)
    ? (frequencyRaw as Frequency)
    : "weekly";

  if (reminderChannel === "sms" && !phone) {
    return {
      status: "error",
      message: "Add a phone number to receive SMS reminders (or pick email).",
    };
  }

  try {
    await updateUserSettings(user.id, {
      reminderChannel,
      digestFrequency,
      phone: phone || null,
    });
  } catch {
    return { status: "error", message: "Couldn't save your settings. Try again." };
  }

  revalidatePath("/app/settings");
  return { status: "saved" };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Data export. Explicit / confirm-gated: the user clicks "Export my data", we
 * gather everything they own and return it as a JSON string the client turns
 * into a downloadable Blob. Nothing is sent or shared off-device.
 * ────────────────────────────────────────────────────────────────────────── */

export async function exportDataAction(): Promise<{ fileName: string; json: string }> {
  const user = await requireUser();

  const account = await getUser(user.id);
  const vehicles = await getUserVehicles(user.id);

  const fullVehicles = await Promise.all(
    vehicles.map(async (v) => ({
      ...v,
      serviceRecords: await listServiceRecords(v.id),
      quoteChecks: await listQuoteChecks(v.id),
      symptomReports: await listSymptomReports(v.id),
    })),
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "GloveBox",
    account: account
      ? {
          id: account.id,
          email: account.email,
          name: account.name,
          reminderChannel: account.reminderChannel,
          digestFrequency: account.digestFrequency,
          phone: account.phone,
        }
      : { id: user.id, email: user.email },
    vehicles: fullVehicles,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    fileName: `glovebox-export-${stamp}.json`,
    json: JSON.stringify(payload, null, 2),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Delete account. Destructive + irreversible → two-step confirm in the UI (the
 * user must type DELETE). We re-verify the typed token server-side, delete each
 * vehicle (cascade removes service records, quotes, symptoms, recalls, docs,
 * chunks, reminders), then sign out and redirect home.
 * ────────────────────────────────────────────────────────────────────────── */

export type DeleteState = { status: "idle" } | { status: "error"; message: string };

export async function deleteAccountAction(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const user = await requireUser();

  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { status: "error", message: 'Type DELETE exactly to confirm.' };
  }

  const vehicles = await getUserVehicles(user.id);
  for (const v of vehicles) {
    await deleteVehicle(user.id, v.id);
  }

  // Sign out clears the session and redirects home. signOut throws a redirect,
  // so anything after it won't run — that's expected.
  await signOut({ redirectTo: "/" });
  redirect("/");
}
