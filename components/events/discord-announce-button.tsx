"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRelativeID } from "@/lib/format";

interface Props {
  eventId: string;
  discordAnnouncedAt: string | null;
}

type Status = "idle" | "announcing" | "success" | "warning" | "error";

export function DiscordAnnounceButton({ eventId, discordAnnouncedAt }: Props) {
  const [announcedAt, setAnnouncedAt] = useState(discordAnnouncedAt);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function announce() {
    if (status === "announcing") return;
    setStatus("announcing");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/events/${eventId}/announce`, { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        discord?: boolean;
        announcedAt?: string;
        error?: string;
      };

      if (!res.ok || !json.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Gagal kirim ke Discord.");
        toast.error(json.error ?? "Gagal kirim ke Discord.");
        return;
      }
      if (json.discord === false) {
        setStatus("warning");
        toast.warning("Event disimpan tapi Discord webhook belum dikonfigurasi.");
      } else {
        setStatus("success");
        toast.success("Event diumumkan ke Discord! 📣");
      }
      if (json.announcedAt) setAnnouncedAt(json.announcedAt);
    } catch {
      setStatus("error");
      setErrorMsg("Koneksi gagal. Coba lagi.");
      toast.error("Koneksi gagal. Coba lagi.");
    }
  }

  const buttonLabel =
    status === "announcing"
      ? "Mengirim..."
      : announcedAt
        ? "📣 Umumkan ulang ke Discord"
        : "📣 Umumkan ke Discord";

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="secondary"
        onClick={announce}
        disabled={status === "announcing"}
        className="w-full"
      >
        {buttonLabel}
      </Button>
      <StatusLine
        status={status}
        announcedAt={announcedAt}
        errorMsg={errorMsg}
      />
    </div>
  );
}

function StatusLine({
  status,
  announcedAt,
  errorMsg,
}: {
  status: Status;
  announcedAt: string | null;
  errorMsg: string | null;
}) {
  if (status === "error" && errorMsg) {
    return (
      <p className="text-caption text-red-700 text-center leading-relaxed">
        ❌ {errorMsg}
      </p>
    );
  }
  if (status === "warning") {
    return (
      <p className="text-caption text-amber-700 text-center leading-relaxed">
        ⚠️ Webhook Discord belum di-set di Vercel env.
      </p>
    );
  }
  if (announcedAt) {
    return (
      <p className="text-caption text-muted text-center leading-relaxed">
        ✅ Diumumkan {formatRelativeID(announcedAt)}
      </p>
    );
  }
  return (
    <p className="text-caption text-muted text-center leading-relaxed">
      Belum diumumkan ke Discord. Klik buat broadcast ke channel.
    </p>
  );
}
