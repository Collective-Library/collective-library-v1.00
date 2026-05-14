"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRelativeID } from "@/lib/format";

interface Props {
  eventId: string;
  discordAnnouncedAt: string | null;
}

export function DiscordAnnounceButton({ eventId, discordAnnouncedAt }: Props) {
  const [announcedAt, setAnnouncedAt] = useState(discordAnnouncedAt);
  const [busy, setBusy] = useState(false);

  async function announce() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/announce`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; discord?: boolean; announcedAt?: string; error?: string };

      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Gagal kirim ke Discord.");
        return;
      }
      if (json.discord === false) {
        toast.warning("Event disimpan tapi Discord webhook belum dikonfigurasi.");
      } else {
        toast.success("Event diumumkan ke Discord! 📣");
      }
      if (json.announcedAt) setAnnouncedAt(json.announcedAt);
    } catch {
      toast.error("Koneksi gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant="secondary" onClick={announce} disabled={busy} className="w-full">
        {busy ? "Mengirim..." : "📣 Umumkan ke Discord"}
      </Button>
      {announcedAt && (
        <p className="text-caption text-muted text-center">
          Diumumkan {formatRelativeID(announcedAt)} — klik untuk umumkan lagi
        </p>
      )}
    </div>
  );
}
