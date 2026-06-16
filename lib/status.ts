/**
 * One shared status vocabulary across health, maintenance, recalls, and "safe to
 * drive" verdicts — so the whole product reads the same way. Per the design system,
 * status is ALWAYS communicated as icon + word, never color alone (a11y §9).
 */
export type Status = "ok" | "soon" | "alert";

export const STATUS_VOCAB: Record<
  Status,
  { label: string; token: "ok" | "warn" | "alert"; hex: string }
> = {
  ok: { label: "OK", token: "ok", hex: "#6FA873" },
  soon: { label: "Soon", token: "warn", hex: "#D8A24A" },
  alert: { label: "Overdue", token: "alert", hex: "#CE5B52" },
};

/** Urgency vocabulary for the symptom decoder maps onto the same three tiers. */
export type Urgency = "safe" | "soon" | "stop";

export const URGENCY_TO_STATUS: Record<Urgency, Status> = {
  safe: "ok",
  soon: "soon",
  stop: "alert",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  safe: "Safe to drive",
  soon: "Service soon",
  stop: "Stop driving — get it inspected",
};

/** Quote-check verdict vocabulary. */
export type Verdict = "fair" | "high" | "overpriced";

export const VERDICT_LABEL: Record<Verdict, string> = {
  fair: "Fair",
  high: "On the high side",
  overpriced: "Overpriced",
};

export const VERDICT_TO_STATUS: Record<Verdict, Status> = {
  fair: "ok",
  high: "soon",
  overpriced: "alert",
};
