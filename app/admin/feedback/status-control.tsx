"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { FeedbackStatus } from "@/types";

const STATUSES: { slug: FeedbackStatus; label: string }[] = [
  { slug: "new", label: "Baru" },
  { slug: "triaged", label: "Triaged" },
  { slug: "planned", label: "Planned" },
  { slug: "shipped", label: "Shipped" },
  { slug: "wontfix", label: "Won't fix" },
];

/**
 * Inline status + internal note control on each feedback row in the admin
 * inbox. Updates via Supabase client directly — RLS allows update for
 * profiles where is_admin = true.
 */
export function FeedbackStatusControl({
  id,
  currentStatus,
  currentNote,
}: {
  id: string;
  currentStatus: FeedbackStatus;
  currentNote: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<FeedbackStatus>(currentStatus);
  const [note, setNote] = useState(currentNote);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(nextStatus: FeedbackStatus, nextNote: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("feedback")
        .update({ status: nextStatus, internal_note: nextNote.trim() || null })
        .eq("id", id);
      if (error) {
        toast.error("Gagal update — cek RLS / network.");
        return;
      }
      toast.success("Tersimpan ✓");
      router.refresh();
      setEditing(false);
    });
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-hairline-soft">
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => {
          const active = status === s.slug;
          return (
            <button
              key={s.slug}
              type="button"
              disabled={pending}
              onClick={() => {
                setStatus(s.slug);
                save(s.slug, note);
              }}
              className={
                "inline-flex items-center h-8 px-3 rounded-pill text-caption font-medium transition-colors disabled:opacity-50 " +
                (active
                  ? "bg-ink text-parchment border border-ink"
                  : "bg-paper text-ink-soft border border-hairline hover:bg-cream")
              }
            >
              → {s.label}
            </button>
          );
        })}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Catatan internal (cuma admin yang lihat)…"
            className="w-full px-3 py-2 bg-paper text-ink rounded-button border border-hairline focus:outline-none focus:border-ink text-body-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save(status, note)}
              disabled={pending}
              className="inline-flex items-center h-8 px-4 rounded-pill bg-ink text-parchment text-caption font-semibold hover:bg-ink-soft disabled:opacity-50"
            >
              Simpan note
            </button>
            <button
              type="button"
              onClick={() => {
                setNote(currentNote);
                setEditing(false);
              }}
              className="inline-flex items-center h-8 px-4 rounded-pill bg-paper text-ink-soft text-caption font-medium border border-hairline hover:bg-cream"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 flex-wrap">
          {note ? (
            <p className="text-caption text-muted italic whitespace-pre-wrap flex-1 min-w-0">
              📝 {note}
            </p>
          ) : (
            <p className="text-caption text-muted italic">Belum ada note internal.</p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-caption text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            {note ? "Edit" : "Tambah note"}
          </button>
        </div>
      )}
    </div>
  );
}
