"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BookPicker } from "@/components/books/book-picker";
import { cn } from "@/lib/cn";
import type { BookSearchResult } from "@/lib/openlibrary";
import type { BookStatus } from "@/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  unavailable: "Koleksi (gak dijual)",
  sell: "Dijual",
  lend: "Dipinjamkan",
  trade: "Ditukar",
};

/**
 * Search-driven bulk add. Users search via the BookPicker and tap candidates
 * to add them to a basket. One status applies to the whole batch.
 *
 * Compounds with the regular Add Book flow (single, with full detail) and
 * the Goodreads CSV import (largest batch, but only if you have Goodreads).
 */
export function BulkAddForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<BookSearchResult[]>([]);
  const [status, setStatus] = useState<BookStatus>("unavailable");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPick(book: BookSearchResult) {
    setError(null);
    // Dedup by id, fall back to title+author for results without a stable id
    const key = book.id || `${book.title}::${book.author}`;
    const exists = items.some(
      (it) => (it.id || `${it.title}::${it.author}`) === key,
    );
    if (exists) {
      toast.message(`"${book.title}" udah ada di daftar.`);
      return;
    }
    setItems((prev) => [...prev, book]);
    toast.success(`Tambah "${book.title}"`);
  }

  function onRemove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function onClearAll() {
    setItems([]);
  }

  function publish() {
    if (items.length === 0) {
      setError("Pilih minimal satu buku dulu.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();

      // Look up community once
      const { data: membership } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", userId)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      const community_id = (membership?.community_id as string) ?? null;

      const rows = items.map((b) => ({
        title: b.title,
        author: b.author ?? "",
        isbn: b.isbn ?? null,
        publisher: b.publisher ?? null,
        description: b.description ?? null,
        language:
          b.language === "id"
            ? "Indonesia"
            : b.language === "en"
              ? "English"
              : "Indonesia",
        cover_url: b.cover_url ?? null,
        owner_id: userId,
        community_id,
        status,
        condition: "good" as const,
        source: "manual" as const,
      }));

      const { error: insertErr, count } = await supabase
        .from("books")
        .insert(rows, { count: "exact" });

      if (insertErr) {
        toast.error("Gagal publikasikan — coba lagi.");
        setError(insertErr.message);
        return;
      }
      toast.success(`${count ?? items.length} buku masuk ke rak ✓`);
      router.replace("/shelf");
      router.refresh();
    });
  }

  return (
    <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8 flex flex-col gap-6">
      {/* Search picker */}
      <div className="flex flex-col gap-2">
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">
          Cari buku
        </p>
        <BookPicker onPick={onPick} placeholder="Cari judul, author, atau ISBN…" />
        <p className="text-caption text-muted">
          Klik dari hasil → masuk ke daftar di bawah.
        </p>
      </div>

      {/* Basket */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-caption font-semibold text-ink uppercase tracking-wide">
            Daftar buku ({items.length})
          </p>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-caption text-muted hover:text-ink-soft underline underline-offset-4"
            >
              Hapus semua
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-card border border-hairline bg-cream/50 p-8 text-center">
            <p className="text-body-sm text-muted">
              Belum ada buku. Cari dulu di atas, terus klik hasilnya.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline-soft border border-hairline rounded-card overflow-hidden">
            {items.map((book) => (
              <li
                key={book.id}
                className="flex items-start gap-3 p-3 bg-paper"
              >
                <div className="w-10 h-14 shrink-0 rounded-[4px] overflow-hidden bg-cream border border-hairline flex items-center justify-center">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt=""
                      width={40}
                      height={56}
                      sizes="40px"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] text-muted">📖</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-ink line-clamp-2 leading-snug">
                    {book.title}
                  </p>
                  <p className="text-caption text-muted line-clamp-1">
                    {book.author ?? "—"}
                    {book.year && <span className="ml-1">· {book.year}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(book.id)}
                  aria-label={`Hapus ${book.title}`}
                  className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-pill text-muted hover:text-(--color-error) hover:bg-cream transition-colors"
                >
                  <span aria-hidden className="text-[18px]">✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Status applies to all */}
      <div className="flex flex-col gap-2">
        <p className="text-caption font-semibold text-ink uppercase tracking-wide">
          Status untuk semua
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STATUS_LABELS) as BookStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "h-12 rounded-button border text-body-sm font-medium transition-colors",
                status === s
                  ? "border-ink bg-ink text-parchment"
                  : "border-hairline-strong bg-paper text-ink-soft hover:bg-cream",
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-caption text-muted">
          Bisa diubah per buku nanti dari Kelola Buku di profil lo.
        </p>
      </div>

      {error && <p className="text-caption text-(--color-error)">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Batal
        </Button>
        <Button
          type="button"
          onClick={publish}
          disabled={pending || items.length === 0}
          className="flex-1"
        >
          {pending
            ? "Lagi publikasikan ke rak…"
            : items.length === 0
              ? "Pilih minimal 1 buku"
              : `Publikasikan ${items.length} buku`}
        </Button>
      </div>
    </div>
  );
}
