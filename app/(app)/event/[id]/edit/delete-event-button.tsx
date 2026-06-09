"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function performDelete() {
    setBusy(true);
    const supabase = createClient();
    // Hard delete via the events_delete_own RLS policy. FK cascades clean up
    // RSVPs and the activity_log row, so the event no longer lingers in the
    // activity feed / landing strips after deletion. `.select()` lets us detect
    // the not-owner case (RLS returns zero rows without raising an error).
    const { data, error } = await supabase.from("events").delete().eq("id", eventId).select("id");

    if (error) {
      toast.error("Gagal hapus event: " + error.message);
      setBusy(false);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Gagal hapus event — kamu bukan host-nya.");
      setBusy(false);
      return;
    }
    toast.success("Event dihapus.");
    router.replace("/event");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Hapus event ini
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-card border border-red-200 bg-red-50">
      <p className="text-body-sm text-red-700 font-medium">
        Yakin hapus event ini? Event, RSVP, dan jejaknya di activity feed bakal ilang permanen.
        Nggak bisa di-undo.
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="flex-1"
        >
          Nggak jadi
        </Button>
        <Button
          onClick={performDelete}
          disabled={busy}
          className="flex-1 !bg-red-700 hover:!bg-red-800"
        >
          {busy ? "Menghapus..." : "Ya, hapus"}
        </Button>
      </div>
    </div>
  );
}
