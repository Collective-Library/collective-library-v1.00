"use client";

import { useOptimistic, useTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EventRsvpStatus } from "@/types";

interface Props {
  eventId: string;
  initialStatus: EventRsvpStatus | null;
  isAuthed: boolean;
}

const NEXT_STATUS: Record<EventRsvpStatus, EventRsvpStatus | null> = {
  going: "maybe",
  maybe: null,
  declined: "going",
};

export function RsvpButton({ eventId, initialStatus, isAuthed }: Props) {
  const [, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(initialStatus);
  const [busy, setBusy] = useState(false);

  if (!isAuthed) {
    return (
      <a
        href={`/auth/login?next=/event/${eventId}`}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-card bg-ink text-paper text-body-sm font-semibold hover:bg-ink/90 transition-colors w-full"
      >
        Hadir di event ini →
      </a>
    );
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);

    const currentStatus = optimisticStatus;
    const next = currentStatus === null ? "going" : NEXT_STATUS[currentStatus];

    startTransition(() => {
      setOptimisticStatus(next);
    });

    try {
      if (next === null) {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: null }),
        });
        if (!res.ok) throw new Error("Gagal cancel RSVP.");
        toast.success("RSVP dibatalkan.");
      } else {
        const res = await fetch(`/api/events/${eventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error("Gagal update RSVP.");
        const label = next === "going" ? "Oke, lo bakal hadir! 🎉" : "Tercatat sebagai 'mungkin hadir'.";
        toast.success(label);
      }
    } catch (err) {
      startTransition(() => {
        setOptimisticStatus(currentStatus);
      });
      toast.error(err instanceof Error ? err.message : "Gagal update RSVP.");
    } finally {
      setBusy(false);
    }
  }

  const label =
    optimisticStatus === null
      ? "Hadir di event ini"
      : optimisticStatus === "going"
      ? "✓ Bakal hadir — klik untuk ganti ke Mungkin"
      : optimisticStatus === "maybe"
      ? "~ Mungkin hadir — klik untuk batal"
      : "Hadir di event ini";

  const variant: "primary" | "secondary" =
    optimisticStatus === null ? "primary" : "secondary";

  return (
    <Button
      variant={variant}
      onClick={toggle}
      disabled={busy}
      className="w-full"
    >
      {busy ? "Menyimpan..." : label}
    </Button>
  );
}
