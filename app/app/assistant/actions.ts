"use server";

import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle } from "@/lib/db/queries";
import { askVehicle, type AskResult } from "@/lib/services/askVehicle";

/** A single turn in the running conversation, mirrored on the client. */
export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AskState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "ok"; question: string } & AskResult);

/**
 * ask — answer a question grounded in the ACTIVE car's own context (curated
 * schedules, cached recall/safety data, the owner's uploaded docs) via the
 * askVehicle verb. Read-only: it never sends, books, or mutates anything, so no
 * confirm gate is required. Returns the answer + citations + grounding flags so
 * the UI can render them honestly (we never hide a "not in your context" answer,
 * and we surface when the LLM was unavailable).
 */
export async function ask(question: string, history: ChatTurn[]): Promise<AskState> {
  const user = await requireUser();

  const trimmed = question.trim();
  if (!trimmed) {
    return { status: "error", message: "Type a question about your car first." };
  }

  const { active } = await getActiveVehicle(user.id);
  if (!active) {
    return {
      status: "error",
      message: "Add a car first — the assistant only answers from a car's own data.",
    };
  }

  try {
    const result = await askVehicle({
      question: trimmed,
      vehicle: { ...toVehicle(active), id: active.id },
      // Only pass prior user/assistant turns; keep the running thread coherent.
      history: history.slice(-8),
    });
    return { status: "ok", question: trimmed, ...result };
  } catch {
    return {
      status: "error",
      message: "Something went wrong reaching the assistant. Try again in a moment.",
    };
  }
}
