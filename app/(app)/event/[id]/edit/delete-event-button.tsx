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
    const { error } = await supabase
      .from("events")
      .update({ is_hidden: true, status: "cancelled" })
      .eq("id", eventId);

    if (error) {
      toast.error("Gagal batalin event: " + error.message);
      setBusy(false);
      return;
    }
    toast.success("Event dibatalkan.");
    router.replace("/event");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Batalin event ini
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-card border border-red-200 bg-red-50">
      <p className="text-body-sm text-red-700 font-medium">
        Yakin batalin event ini? Tindakan ini tidak bisa di-undo dari UI.
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
          {busy ? "Membatalkan..." : "Ya, batalin"}
        </Button>
      </div>
    </div>
  );
}
