"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EventRsvpStatus } from "@/types";

interface Props {
  eventId: string;
  initialStatus: EventRsvpStatus | null;
  isAuthed: boolean;
  rsvpCount: number;
  capacity: number | null;
  onRsvpSuccess?: (status: EventRsvpStatus) => void;
}

const NEXT_STATUS: Record<EventRsvpStatus, EventRsvpStatus | null> = {
  going: "maybe",
  maybe: null,
  declined: "going",
};

export function RsvpButton({
  eventId,
  initialStatus,
  isAuthed,
  rsvpCount,
  capacity,
  onRsvpSuccess,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(initialStatus);
  const [busy, setBusy] = useState(false);

  if (!isAuthed) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={`/auth/login?next=/event/${eventId}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-card bg-ink text-paper text-body-sm font-semibold hover:bg-ink/90 transition-colors w-full"
        >
          ✅ Aku bakal hadir
        </a>
        <p className="text-caption text-muted text-center leading-relaxed">
          Masuk sebentar buat RSVP — biar orang lain bisa liat kamu tertarik datang.
        </p>
      </div>
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
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        // Surface the actual server error message so debugging
        // doesn't require Vercel logs.
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        const fallback = next === null ? "Gagal cancel RSVP." : "Gagal update RSVP.";
        throw new Error(`${errJson.error ?? fallback} (HTTP ${res.status})`);
      }

      if (next === null) {
        toast.success("RSVP dibatalkan.");
      } else if (next === "going") {
        toast.success("Sip — kamu bakal datang! 🎉");
        onRsvpSuccess?.(next);
      } else if (next === "maybe") {
        toast.success("Tercatat: 'mungkin hadir' — kabari kalau jadi.");
        onRsvpSuccess?.(next);
      }
      // Refresh server data so RSVP count + attendee list re-render
      router.refresh();
    } catch (err) {
      startTransition(() => {
        setOptimisticStatus(currentStatus);
      });
      toast.error(err instanceof Error ? err.message : "Gagal update RSVP.");
    } finally {
      setBusy(false);
    }
  }

  // Social-proof microcopy ↓
  let socialProof: string;
  if (rsvpCount === 0) {
    socialProof = "Belum ada yang RSVP. Jadi yang pertama buka lingkaran. ✨";
  } else if (capacity && rsvpCount >= capacity) {
    socialProof = `Penuh: ${rsvpCount} / ${capacity} sudah RSVP. Pilih 'mungkin' biar masuk waitlist.`;
  } else if (capacity) {
    socialProof = `${rsvpCount} siap datang · ${capacity - rsvpCount} kursi sisa`;
  } else if (rsvpCount === 1) {
    socialProof = optimisticStatus === "going" ? "Kamu satu-satunya yang siap datang sejauh ini." : "1 orang sudah siap datang.";
  } else {
    socialProof = `${rsvpCount} orang sudah tertarik hadir.`;
  }

  // Primary CTA label
  let label: string;
  let variant: "primary" | "secondary" = "primary";
  if (optimisticStatus === null) {
    label = "✅ Aku bakal hadir";
    variant = "primary";
  } else if (optimisticStatus === "going") {
    label = "✓ Bakal hadir — klik untuk ganti ke 'mungkin'";
    variant = "secondary";
  } else if (optimisticStatus === "maybe") {
    label = "🤔 Mungkin hadir — klik buat batalin";
    variant = "secondary";
  } else {
    label = "✅ Aku bakal hadir";
    variant = "primary";
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={variant}
        onClick={toggle}
        disabled={busy}
        className="w-full"
      >
        {busy ? "Menyimpan..." : label}
      </Button>
      <p className="text-caption text-muted text-center leading-relaxed">{socialProof}</p>
    </div>
  );
}
