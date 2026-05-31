"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteWantedButton({ wantedId }: { wantedId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function performDelete() {
    setBusy(true);
    const supabase = createClient();
    // Hard delete via the wanted_delete_own RLS policy. `.select()` lets us
    // detect the not-owner case (RLS returns zero rows without an error).
    const { data, error } = await supabase
      .from("wanted_requests")
      .delete()
      .eq("id", wantedId)
      .select("id");

    if (error) {
      toast.error("Gagal hapus WTB: " + error.message);
      setBusy(false);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Gagal hapus WTB — kamu bukan yang posting.");
      setBusy(false);
      return;
    }
    toast.success("WTB request dihapus.");
    router.replace("/wanted");
    router.refresh();
  }

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Hapus WTB ini
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 rounded-card border border-red-200 bg-red-50">
      <p className="text-body-sm text-red-700 font-medium">
        Yakin hapus WTB request ini? Nggak bisa di-undo.
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
