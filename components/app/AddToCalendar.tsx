"use client";
import { CalendarPlus } from "lucide-react";

function fmt(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * "Add to calendar" — prepares a Google Calendar link + a downloadable .ics.
 * Nothing is auto-added; the owner clicks/downloads (the click IS the confirm).
 */
export function AddToCalendar({
  title,
  description,
  date,
  durationMinutes = 60,
}: {
  title: string;
  description?: string;
  date: string | Date;
  durationMinutes?: number;
}) {
  const start = new Date(date);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const gcal = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: description ?? "",
  }).toString()}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GloveBox//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description ?? "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  const slug = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);

  const cls =
    "inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-1.5 text-xs text-ash transition-colors hover:border-chalk/30 hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage";

  return (
    <div className="flex items-center gap-2">
      <a href={gcal} target="_blank" rel="noopener noreferrer" className={cls}>
        <CalendarPlus size={13} aria-hidden /> Google Calendar
      </a>
      <a href={icsHref} download={`${slug || "event"}.ics`} className={cls}>
        .ics
      </a>
    </div>
  );
}
