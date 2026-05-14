"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildIcs, googleCalendarUrl, icsFilename } from "@/lib/calendar";
import type { Event } from "@/types";

interface Props {
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
  >;
  publicUrl?: string;
}

export function CalendarButton({ event, publicUrl }: Props) {
  const [open, setOpen] = useState(false);

  function openGoogle() {
    const url = googleCalendarUrl(event, publicUrl);
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function downloadIcs() {
    const ics = buildIcs(event, publicUrl);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = icsFilename(event.title);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        className="w-full"
      >
        🗓️ Tambah ke Kalender
      </Button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-0 right-0 mt-2 z-20 rounded-card border border-hairline bg-paper shadow-card-hover overflow-hidden"
          >
            <button
              type="button"
              role="menuitem"
              onClick={openGoogle}
              className="w-full text-left px-4 py-3 text-body-sm text-ink hover:bg-cream transition-colors flex items-center gap-2"
            >
              <span aria-hidden>📅</span>
              <span>Buka di Google Calendar</span>
            </button>
            <div className="h-px bg-hairline" />
            <button
              type="button"
              role="menuitem"
              onClick={downloadIcs}
              className="w-full text-left px-4 py-3 text-body-sm text-ink hover:bg-cream transition-colors flex items-center gap-2"
            >
              <span aria-hidden>⬇️</span>
              <span>Download .ics (Apple / Outlook / lainnya)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
