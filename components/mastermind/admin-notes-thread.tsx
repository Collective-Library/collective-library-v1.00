"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";
import type { AdminNoteEntity, AdminNoteWithAuthor } from "@/types";

/** Notes thread for an entity (user/book/wanted/etc). Inline add form +
 *  reverse-chrono list. */
export function AdminNotesThread({
  entityType,
  entityId,
  notes,
}: {
  entityType: AdminNoteEntity;
  entityId: string;
  notes: AdminNoteWithAuthor[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const note = text.trim();
    if (note.length < 1) return;
    startTransition(async () => {
      const res = await fetch("/api/mastermind/admin-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, note }),
      });
      if (!res.ok) {
        toast.error("Gagal simpan note.");
        return;
      }
      setText("");
      toast.success("Note tersimpan ✓");
      router.refresh();
    });
  }

  return (
    <section className="bg-paper border border-hairline rounded-card-lg p-4 md:p-5 flex flex-col gap-4">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Admin notes
        </p>
        <p className="mt-0.5 text-caption text-muted">
          Cuma admin yang lihat. Pakai buat catetan internal — promotion log,
          watch-list, follow-up, atau decision context.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder={`Tulis note internal… (e.g. "core contributor candidate", "promote to admin 2026-04-30")`}
          className="w-full px-3 py-2 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[11px] focus:py-[7px] transition-colors resize-y text-body-sm"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || text.trim().length < 1}
            className="inline-flex items-center h-9 px-4 rounded-pill bg-ink text-parchment text-caption font-semibold hover:bg-ink-soft disabled:opacity-50"
          >
            {pending ? "Simpan…" : "Simpan note"}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-caption text-muted italic">Belum ada note.</p>
      ) : (
        <ul className="flex flex-col gap-3 border-t border-hairline-soft pt-3">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-2.5">
              <Avatar
                src={n.author?.photo_url}
                name={n.author?.full_name ?? n.author?.username}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <p className="text-caption">
                  {n.author?.username ? (
                    <Link
                      href={`/profile/${n.author.username}`}
                      target="_blank"
                      className="text-ink-soft underline underline-offset-4 hover:text-ink font-medium"
                    >
                      {n.author.full_name ?? `@${n.author.username}`}
                    </Link>
                  ) : (
                    <span className="text-ink-soft font-medium">admin</span>
                  )}
                  <span className="text-muted"> · {formatRelativeID(n.created_at)}</span>
                </p>
                <p className="mt-1 text-body-sm text-ink whitespace-pre-wrap leading-relaxed">
                  {n.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
