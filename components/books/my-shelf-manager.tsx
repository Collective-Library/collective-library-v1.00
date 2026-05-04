"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import type { Book, BookStatus } from "@/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  unavailable: "Koleksi",
  sell: "Dijual",
  lend: "Dipinjamkan",
  trade: "Ditukar",
};

/**
 * Renders the user's books grid. When the viewer is the owner, exposes a
 * "Kelola" toggle that puts the grid into multi-select mode for bulk
 * status changes / delete. Designed so non-owners just see the regular grid.
 */
export function MyShelfManager({
  books,
  isOwner,
}: {
  books: Book[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelected(new Set(books.map((b) => b.id)));
  }
  function clearAll() {
    setSelected(new Set());
  }
  function exitManage() {
    setManage(false);
    setSelected(new Set());
    setConfirmDelete(false);
  }

  function batchUpdateStatus(status: BookStatus) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("books").update({ status }).in("id", ids);
      if (error) {
        toast.error("Gagal ubah status. Coba lagi.");
        return;
      }
      toast.success(`${ids.length} buku diubah ke "${STATUS_LABELS[status]}" ✓`);
      exitManage();
      router.refresh();
    });
  }

  function batchDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("books").delete().in("id", ids);
      if (error) {
        toast.error("Gagal hapus. Coba lagi.");
        return;
      }
      toast.success(`${ids.length} buku dihapus dari rak.`);
      exitManage();
      router.refresh();
    });
  }

  if (books.length === 0) {
    return (
      <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
        <p className="text-body text-muted">Belum ada buku di rak.</p>
      </div>
    );
  }

  return (
    <>
      {/* Section header with Kelola toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-display-md text-ink">Rak buku</h2>
        {isOwner && (
          <ManageToggle
            manage={manage}
            selectedCount={selected.size}
            totalCount={books.length}
            onEnter={() => setManage(true)}
            onExit={exitManage}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />
        )}
      </div>

      {/* Books grid */}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-7",
          manage && "pb-32 md:pb-24",
        )}
      >
        {books.map((book) => {
          const isSel = selected.has(book.id);
          if (!manage) {
            return (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="group flex flex-col gap-2"
              >
                <BookTile book={book} />
                <p className="text-caption font-medium text-ink line-clamp-2 leading-snug">
                  {book.title}
                </p>
                <p className="text-caption text-muted line-clamp-1">{book.author}</p>
              </Link>
            );
          }
          return (
            <button
              key={book.id}
              type="button"
              onClick={() => toggle(book.id)}
              className="group flex flex-col gap-2 text-left focus-visible:outline-none"
              aria-pressed={isSel}
            >
              <div
                className={cn(
                  "relative aspect-[3/4] rounded-card overflow-hidden bg-cream border transition-all",
                  isSel
                    ? "border-ink ring-4 ring-ink/20"
                    : "border-hairline group-hover:border-hairline-strong",
                )}
              >
                {book.cover_url ? (
                  <img
            src={book.cover_url}
            alt={book.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <p className="font-display text-title-sm text-ink line-clamp-3 text-center">
                      {book.title}
                    </p>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={book.status} />
                </div>
                {/* Selection indicator */}
                <div
                  className={cn(
                    "absolute top-2 right-2 w-7 h-7 rounded-pill border-2 flex items-center justify-center transition-colors",
                    isSel
                      ? "bg-ink border-ink text-parchment"
                      : "bg-paper/90 border-paper",
                  )}
                  aria-hidden
                >
                  {isSel && <CheckIcon size={16} />}
                </div>
              </div>
              <p className="text-caption font-medium text-ink line-clamp-2 leading-snug">
                {book.title}
              </p>
              <p className="text-caption text-muted line-clamp-1">{book.author}</p>
            </button>
          );
        })}
      </div>

      {/* Bottom action bar — sticky above BottomNav on mobile */}
      {manage && selected.size > 0 && (
        <div
          className="fixed inset-x-0 z-40 bg-paper border-t border-hairline shadow-modal animate-in slide-in-from-bottom"
          style={{ bottom: "calc(64px + var(--safe-bottom, 0px))" }}
        >
          <div className="md:hidden mx-auto max-w-md px-4 py-3 flex flex-col gap-2">
            <p className="text-body-sm font-semibold text-ink text-center">
              {selected.size} buku dipilih
            </p>
            {!confirmDelete ? (
              <ActionGrid
                onStatus={batchUpdateStatus}
                onDelete={() => setConfirmDelete(true)}
                pending={pending}
              />
            ) : (
              <ConfirmDeleteRow
                count={selected.size}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={batchDelete}
                pending={pending}
              />
            )}
          </div>
          <div className="hidden md:flex mx-auto max-w-4xl px-4 py-3 items-center gap-3">
            <p className="text-body-sm font-semibold text-ink mr-auto">
              {selected.size} buku dipilih
            </p>
            {!confirmDelete ? (
              <ActionGridDesktop
                onStatus={batchUpdateStatus}
                onDelete={() => setConfirmDelete(true)}
                pending={pending}
              />
            ) : (
              <ConfirmDeleteRow
                count={selected.size}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={batchDelete}
                pending={pending}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BookTile({ book }: { book: Book }) {
  return (
    <div className="relative aspect-[3/4] rounded-card overflow-hidden bg-cream border border-hairline group-hover:shadow-card-hover transition-shadow">
      {book.cover_url ? (
        <img
            src={book.cover_url}
            alt={book.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3">
          <p className="font-display text-title-sm text-ink line-clamp-3 text-center">
            {book.title}
          </p>
        </div>
      )}
      <div className="absolute top-2 left-2">
        <StatusBadge status={book.status} />
      </div>
    </div>
  );
}

function ManageToggle({
  manage,
  selectedCount,
  totalCount,
  onEnter,
  onExit,
  onSelectAll,
  onClearAll,
}: {
  manage: boolean;
  selectedCount: number;
  totalCount: number;
  onEnter: () => void;
  onExit: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  if (!manage) {
    return (
      <button
        type="button"
        onClick={onEnter}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-paper text-ink-soft border border-hairline-strong text-body-sm font-medium hover:bg-cream hover:text-ink transition-colors"
        aria-label="Kelola buku — pilih banyak buku untuk ubah status atau hapus"
      >
        <ManageIcon size={16} />
        <span>Kelola</span>
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={selectedCount === totalCount ? onClearAll : onSelectAll}
        className="inline-flex items-center h-9 px-3 rounded-pill text-caption font-medium text-ink-soft hover:bg-cream"
      >
        {selectedCount === totalCount ? "Batal pilih semua" : "Pilih semua"}
      </button>
      <button
        type="button"
        onClick={onExit}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-ink text-parchment text-body-sm font-medium hover:bg-ink-soft"
      >
        Selesai
      </button>
    </div>
  );
}

function ActionGrid({
  onStatus,
  onDelete,
  pending,
}: {
  onStatus: (s: BookStatus) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatus(s)}
            disabled={pending}
            className="h-10 rounded-button border border-hairline-strong bg-paper text-ink-soft text-body-sm font-medium hover:bg-cream disabled:opacity-50"
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="h-10 rounded-button border border-(--color-error) text-(--color-error) text-body-sm font-medium hover:bg-(--color-error) hover:text-paper transition-colors disabled:opacity-50"
      >
        Hapus
      </button>
    </>
  );
}

function ActionGridDesktop({
  onStatus,
  onDelete,
  pending,
}: {
  onStatus: (s: BookStatus) => void;
  onDelete: () => void;
  pending: boolean;
}) {
  return (
    <>
      <div className="flex gap-1.5">
        {(Object.keys(STATUS_LABELS) as BookStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatus(s)}
            disabled={pending}
            className="h-9 px-3 rounded-pill border border-hairline-strong bg-paper text-ink-soft text-body-sm font-medium hover:bg-cream disabled:opacity-50"
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="h-9 px-3 rounded-pill border border-(--color-error) text-(--color-error) text-body-sm font-medium hover:bg-(--color-error) hover:text-paper disabled:opacity-50 transition-colors"
      >
        Hapus
      </button>
    </>
  );
}

function ConfirmDeleteRow({
  count,
  onCancel,
  onConfirm,
  pending,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <p className="text-caption text-ink-soft flex-1">
        Hapus {count} buku ini permanen?
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="h-9 px-3.5 rounded-pill border border-hairline-strong text-body-sm font-medium text-ink-soft hover:bg-cream"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={pending}
        className="h-9 px-3.5 rounded-pill bg-(--color-error) text-paper text-body-sm font-medium disabled:opacity-50"
      >
        {pending ? "Menghapus…" : "Iya, hapus"}
      </button>
    </div>
  );
}

/* SVG icons */

function ManageIcon({ size = 16 }: { size?: number }) {
  // checklist + pencil hybrid — signals "select & edit"
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 5h7a2 2 0 0 1 2 2v3" />
      <path d="M3 9.5L4.5 11l3-3" />
      <path d="M3 16.5L4.5 18l3-3" />
      <path d="M11 10h7" />
      <path d="M11 17h4" />
      <path d="M19 14l3 3-4 4h-3v-3z" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
