/**
 * Calendar helpers — Google Calendar deep-link + iCalendar (.ics) generator.
 *
 * Goal: 1-click "Add to Calendar" without OAuth, full Google sync, or any
 * backend infra. Google Calendar gets a URL that opens its "Save event" UI
 * pre-filled; .ics generates a download-able file that any calendar app
 * (Apple Calendar, Outlook, Google import) can consume.
 *
 * Full Google Calendar API sync would need OAuth scope, refresh tokens,
 * two-way sync state — much bigger project. Deep-link covers 95% of "I just
 * want to add this to my calendar" use cases.
 */

import type { Event } from "@/types";

/** Format Date → ICS basic format (UTC): 20260530T080000Z */
function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** Default end time if event.ends_at is null — assume 2-hour duration. */
function inferEndsAt(event: Pick<Event, "starts_at" | "ends_at">): string {
  if (event.ends_at) return event.ends_at;
  const d = new Date(event.starts_at);
  d.setHours(d.getHours() + 2);
  return d.toISOString();
}

/**
 * Builds a Google Calendar "render event" URL — opens Google Calendar in a
 * new tab with the event pre-filled. User clicks Save → event lands in
 * their calendar. No OAuth needed.
 *
 * Format reference: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 */
export function googleCalendarUrl(
  event: Pick<
    Event,
    "title" | "description" | "starts_at" | "ends_at" | "location_text" | "location_url" | "is_online" | "theme"
  >,
  publicUrl?: string,
): string {
  const startUtc = toIcsUtc(event.starts_at);
  const endUtc = toIcsUtc(inferEndsAt(event));

  const detailsParts: string[] = [];
  if (event.theme) detailsParts.push(event.theme);
  if (event.description) detailsParts.push(event.description);
  if (publicUrl) detailsParts.push(`Detail: ${publicUrl}`);
  const details = detailsParts.join("\n\n");

  const location = event.is_online
    ? event.location_url ?? "Online"
    : event.location_text ?? "";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startUtc}/${endUtc}`,
  });
  if (details) params.set("details", details);
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates a minimal but valid iCalendar (.ics) file body. Compatible with
 * Apple Calendar, Outlook, Google Calendar import. RFC 5545 compliant
 * subset — single VEVENT, no recurrence, no alarms (deferred).
 */
export function buildIcs(
  event: Pick<
    Event,
    | "id"
    | "title"
    | "description"
    | "starts_at"
    | "ends_at"
    | "location_text"
    | "location_url"
    | "is_online"
    | "theme"
  >,
  publicUrl?: string,
): string {
  const startUtc = toIcsUtc(event.starts_at);
  const endUtc = toIcsUtc(inferEndsAt(event));
  const nowUtc = toIcsUtc(new Date().toISOString());

  const descLines: string[] = [];
  if (event.theme) descLines.push(event.theme);
  if (event.description) descLines.push(event.description);
  if (publicUrl) descLines.push(`Detail: ${publicUrl}`);
  // ICS escape: \, → \\ and , → \, and ; → \; and newline → \n
  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
  const description = escape(descLines.join("\n\n"));

  const location = escape(
    event.is_online ? event.location_url ?? "Online" : event.location_text ?? "",
  );

  // UID: stable, unique, domain-prefixed
  const uid = `event-${event.id}@collectivelibrary.vercel.app`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Collective Library//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${escape(event.title)}`,
    description ? `DESCRIPTION:${description}` : null,
    location ? `LOCATION:${location}` : null,
    publicUrl ? `URL:${publicUrl}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Build a safe filename from the event title. */
export function icsFilename(eventTitle: string): string {
  const slug = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "event"}.ics`;
}
