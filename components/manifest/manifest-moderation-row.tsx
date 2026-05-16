"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeID } from "@/lib/format";
import type { ManifestWithAuthor } from "@/types";

/**
 * Single row in the admin /admin/manifests queue. Shows pending manifest
 * with author, body, optional links, and approve/reject CTAs.
 *
 * Reject requires a note (so the author gets a reason; admin can DM it
 * manually for now). Approve fires the activity_log trigger (MANIFEST_POSTED).
 */
export function ManifestModerationRow({ manifest }: { manifest: ManifestWithAuthor }) {
  const router = useRouter();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const authorName = manifest.author.full_name ?? manifest.author.username ?? "Anggota";
  const authorHref = manifest.author.username ? `/profile/${manifest.author.username}` : null;

  async function approve() {
    setBusy("approve");
    try {
      const res = await fetch(`/api/manifests/${manifest.id}/approve`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Gagal approve.");
        return;
      }
      toast.success("Manifesto di-approve — sekarang publik.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (rejectNote.trim().length < 5) {
      toast.error("Catatan minimal 5 karakter — penulis butuh alasannya.");
      return;
    }
    setBusy("reject");
    try {
      const res = await fetch(`/api/manifests/${manifest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Gagal reject.");
        return;
      }
      toast.success("Manifesto ditolak.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-card-lg border border-hairline bg-paper p-5 shadow-card flex flex-col gap-4">
      {/* Author */}
      <header className="flex items-center gap-3">
        <Avatar src={manifest.author.photo_url} name={manifest.author.full_name} size={36} />
        <div className="min-w-0 flex-1">
          {authorHref ? (
            <Link href={authorHref} className="text-body-sm font-semibold text-ink hover:underline underline-offset-4">
              {authorName}
            </Link>
          ) : (
            <p className="text-body-sm font-semibold text-ink">{authorName}</p>
          )}
          <p className="text-caption text-muted">
            {manifest.author.city ?? "Anggota"} · submitted {formatRelativeID(manifest.created_at)}
          </p>
        </div>
        {manifest.is_anonymous && (
          <span className="text-caption bg-amber-100 text-amber-800 px-2 py-0.5 rounded-pill">
            ANON
          </span>
        )}
      </header>

      {/* Body */}
      <blockquote className="text-body text-ink italic leading-relaxed border-l-2 border-ink/20 pl-4">
        &ldquo;{manifest.body}&rdquo;
      </blockquote>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 text-caption text-muted">
        {manifest.mood && (
          <span className="bg-cream px-2 py-0.5 rounded-pill capitalize">{manifest.mood}</span>
        )}
        {manifest.topic && (
          <span className="bg-cream px-2 py-0.5 rounded-pill">{manifest.topic}</span>
        )}
        <span className="bg-cream px-2 py-0.5 rounded-pill capitalize">{manifest.visibility}</span>
      </div>

      {/* Linked objects */}
      {(manifest.linked_event || manifest.linked_book) && (
        <div className="flex flex-wrap gap-2 text-caption">
          {manifest.linked_event && (
            <Link
              href={`/event/${manifest.linked_event.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-cream text-ink-soft hover:bg-ink hover:text-paper"
            >
              📅 {manifest.linked_event.title}
            </Link>
          )}
          {manifest.linked_book && (
            <Link
              href={`/book/${manifest.linked_book.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-cream text-ink-soft hover:bg-ink hover:text-paper"
            >
              📖 {manifest.linked_book.title}
            </Link>
          )}
        </div>
      )}

      {/* Actions */}
      {!showRejectForm ? (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRejectForm(true)} disabled={busy !== null}>
            Reject
          </Button>
          <Button onClick={approve} disabled={busy !== null} className="flex-1">
            {busy === "approve" ? "Approving..." : "✅ Approve & publish"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3 rounded-card bg-red-50 border border-red-200">
          <p className="text-caption text-red-800 font-semibold">
            Reject — kasih catatan kenapa
          </p>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Contoh: judul terlalu pribadi / berisi info kontak / spam"
            rows={2}
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setShowRejectForm(false); setRejectNote(""); }}
              disabled={busy !== null}
              className="flex-1"
            >
              Batal
            </Button>
            <Button onClick={reject} disabled={busy !== null} className="flex-1 !bg-red-700 hover:!bg-red-800">
              {busy === "reject" ? "..." : "Konfirmasi reject"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
