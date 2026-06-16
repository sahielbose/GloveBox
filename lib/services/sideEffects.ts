import { complete, isLLMAvailable } from "@/lib/llm/client";
import { type Vehicle, vehicleLabel } from "./types";

/**
 * Confirm-gated "side-effect" verbs. These DRAFT/PREPARE only — they never send,
 * post, schedule, book, or pay. A server action sends the result ONLY after an
 * explicit in-UI confirm. Never handles credentials or payment.
 */

export type DraftMessageContext = {
  kind: "recall" | "quote" | "symptom" | "general";
  detail: string;
};

/** Draft a message to a shop (the human reviews + sends). */
export async function draftShopMessage(
  vehicle: Vehicle,
  ctx: DraftMessageContext,
): Promise<string> {
  const template = `Hi — I have a ${vehicleLabel(vehicle)}${vehicle.mileage ? ` with about ${vehicle.mileage.toLocaleString()} miles` : ""}. ${ctx.detail} Could you let me know availability and an estimate? Thanks.`;
  if (!isLLMAvailable()) return template;
  try {
    return await complete({
      system:
        "Draft a short, polite message from a car owner to a repair shop. Be concise and specific. " +
        "Do not promise payment or share any personal/credentials. The owner will review and send it.",
      prompt: `Vehicle: ${vehicleLabel(vehicle)} (${vehicle.mileage ?? "?"} mi)\nContext (${ctx.kind}): ${ctx.detail}\n\nWrite the message.`,
      maxTokens: 250,
      offline: template,
    });
  } catch {
    return template;
  }
}

/** Draft a phone/booking script for a recall "Prep visit" (the owner books). */
export function draftBookingScript(
  vehicle: Vehicle,
  recall: { campaignId: string; component: string; remedy: string },
): string {
  return [
    `Call script — ${vehicleLabel(vehicle)}`,
    ``,
    `"Hi, I'd like to schedule a recall repair. My vehicle is a ${vehicleLabel(vehicle)}${vehicle.vin ? `, VIN ${vehicle.vin}` : ""}.`,
    `There's an open recall — NHTSA campaign ${recall.campaignId}, affecting the ${recall.component.toLowerCase()}.`,
    `The remedy is: ${recall.remedy}`,
    `Recall repairs are free at any franchised dealer. When's your earliest availability?"`,
    ``,
    `Reminder: you place the call and book — GloveBox never books or pays on your behalf.`,
  ].join("\n");
}

export type CalendarEvent = {
  title: string;
  description?: string;
  start: Date;
  durationMinutes?: number;
};

/** Build a Google Calendar "add event" link (opens a prefilled event; user saves). */
export function buildGoogleCalendarLink(ev: CalendarEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(ev.start.getTime() + (ev.durationMinutes ?? 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${fmt(ev.start)}/${fmt(end)}`,
    details: ev.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Build an .ics file body for download (user imports; nothing auto-added). */
export function buildIcs(ev: CalendarEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(ev.start.getTime() + (ev.durationMinutes ?? 60) * 60000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GloveBox//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(ev.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${(ev.description ?? "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
