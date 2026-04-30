"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { SynopsisExpand } from "@/components/books/synopsis-expand";
import { CONDITION_LABELS } from "@/lib/status";
import { formatIDR, formatRelativeID } from "@/lib/format";
import type { BookWithOwner } from "@/types";

/**
 * Mobile-first content tabs for the book detail page.
 *
 * Mobile  → compact underline tab bar (Tentang / Info / Pemilik) with flat,
 *           card-less content so the CTA stays visible above the fold.
 * Desktop → all three sections rendered as stacked cards in the left column,
 *           same as the original page; tabs hidden.
 */

type Tab = "tentang" | "info" | "pemilik";

const TAB_LABELS: Record<Tab, string> = {
  tentang: "Tentang",
  info: "Info",
  pemilik: "Pemilik",
};

interface Props {
  book: BookWithOwner;
  ownerBookCount: number;
  isOwner: boolean;
}

export function BookDetailTabs({ book, ownerBookCount, isOwner }: Props) {
  const ownerName = book.owner.full_name ?? book.owner.username ?? "anggota";

  // Same signal-only logic as the server page had — only show specs that
  // actually carry information (hide "good" condition, hide Indonesian language, etc.)
  const showCondition = book.condition !== "good";
  const showLanguage = Boolean(book.language && book.language !== "Indonesia");
  const showPrice = book.status === "sell" && book.price != null && book.price > 0;
  const showLending = book.status === "lend" && Boolean(book.lending_duration_days);
  const hasInfo =
    showCondition || book.genre || showLanguage || showPrice ||
    showLending || book.pickup_area || book.isbn;

  // Only show the Info tab if there's something to show.
  const tabs: Tab[] = ["tentang", ...(hasInfo ? (["info"] as Tab[]) : []), "pemilik"];
  const [activeTab, setActiveTab] = useState<Tab>("tentang");

  const ownerHref = book.owner.username ? `/profile/${book.owner.username}` : "#";
  const ownerMeta = [
    book.owner.city ?? "Semarang",
    ownerBookCount > 1 ? `${ownerBookCount} buku di rak` : null,
    `posted ${formatRelativeID(book.created_at)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* ════════════════════════════════════════════
          MOBILE — underline tabs + flat content
          ════════════════════════════════════════════ */}
      <div className="md:hidden">
        <div role="tablist" className="flex border-b border-hairline mb-5">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={activeTab === t}
              onClick={() => setActiveTab(t)}
              className={
                "px-4 py-2.5 text-body-sm font-semibold transition-colors border-b-2 -mb-px " +
                (activeTab === t
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink-soft")
              }
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* min-h prevents jarring height shifts when switching tabs */}
        <div role="tabpanel" className="min-h-[140px]">

          {/* ── Tentang ── */}
          {activeTab === "tentang" && (
            <div className="flex flex-col gap-4">
              {book.description ? (
                <p className="text-body-lg text-ink leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              ) : (
                <p className="text-body text-ink-soft leading-relaxed">
                  Belum ada sinopsis.{" "}
                  {isOwner ? (
                    <Link
                      href={`/book/${book.id}/edit`}
                      className="text-ink font-semibold underline underline-offset-4 decoration-hairline-strong hover:decoration-ink"
                    >
                      Tambahin →
                    </Link>
                  ) : (
                    <>Tanya langsung ke {ownerName}.</>
                  )}
                </p>
              )}
              {book.notes && (
                <div className="pl-3 border-l-2 border-ink/20">
                  <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1.5">
                    Catatan dari {ownerName.split(" ")[0]}
                  </p>
                  <p className="text-body text-ink-soft italic whitespace-pre-wrap leading-relaxed">
                    {book.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Info ── */}
          {activeTab === "info" && hasInfo && (
            <dl className="grid grid-cols-2 gap-y-4 gap-x-4">
              {showCondition && (
                <Detail label="Kondisi" value={CONDITION_LABELS[book.condition]} />
              )}
              {book.genre && <Detail label="Genre" value={book.genre} />}
              {showLanguage && <Detail label="Bahasa" value={book.language} />}
              {showPrice && (
                <Detail
                  label="Harga"
                  value={`${formatIDR(book.price!)}${book.negotiable ? " · Bisa nego" : ""}`}
                />
              )}
              {showLending && (
                <Detail
                  label="Durasi pinjam"
                  value={`${book.lending_duration_days} hari`}
                />
              )}
              {book.pickup_area && <Detail label="Area pickup" value={book.pickup_area} />}
              {book.isbn && <Detail label="ISBN" value={book.isbn} />}
            </dl>
          )}

          {/* ── Pemilik ── */}
          {activeTab === "pemilik" && (
            <Link href={ownerHref} className="flex items-center gap-3">
              <Avatar src={book.owner.photo_url} name={book.owner.full_name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink truncate">{ownerName}</p>
                <p className="text-caption text-muted truncate">{ownerMeta}</p>
              </div>
              <span className="text-caption text-muted shrink-0">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          DESKTOP — all sections stacked with cards
          ════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col gap-6">
        <section className="p-6 rounded-card-lg border border-hairline bg-paper shadow-card">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-3">
            Tentang buku ini
          </p>
          {book.description ? (
            <SynopsisExpand text={book.description} />
          ) : (
            <p className="text-body text-ink-soft leading-relaxed">
              Belum ada sinopsis di sini.{" "}
              {isOwner ? (
                <Link
                  href={`/book/${book.id}/edit`}
                  className="text-ink font-semibold underline underline-offset-4 decoration-hairline-strong hover:decoration-ink"
                >
                  Edit buku ini →
                </Link>
              ) : (
                <>Kalau penasaran, tanya langsung ke {ownerName}. Sekalian kenalan.</>
              )}
            </p>
          )}
          {book.notes && (
            <div className="mt-4 pl-3 border-l-2 border-ink/20">
              <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1.5">
                Catatan dari {ownerName.split(" ")[0]}
              </p>
              <p className="text-body text-ink-soft italic whitespace-pre-wrap leading-relaxed">
                {book.notes}
              </p>
            </div>
          )}
        </section>

        <Link
          href={ownerHref}
          className="flex items-center gap-3 p-4 rounded-card border border-hairline bg-paper hover:bg-cream transition-colors"
        >
          <Avatar src={book.owner.photo_url} name={book.owner.full_name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-ink truncate">{ownerName}</p>
            <p className="text-caption text-muted truncate">{ownerMeta}</p>
          </div>
          <span className="text-caption text-muted shrink-0">→</span>
        </Link>

        {hasInfo && (
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 p-5 rounded-card border border-hairline bg-paper">
            {showCondition && (
              <Detail label="Kondisi" value={CONDITION_LABELS[book.condition]} />
            )}
            {book.genre && <Detail label="Genre" value={book.genre} />}
            {showLanguage && <Detail label="Bahasa" value={book.language} />}
            {showPrice && (
              <Detail
                label="Harga"
                value={`${formatIDR(book.price!)}${book.negotiable ? " · Bisa nego" : ""}`}
              />
            )}
            {showLending && (
              <Detail
                label="Durasi pinjam"
                value={`${book.lending_duration_days} hari`}
              />
            )}
            {book.pickup_area && <Detail label="Area pickup" value={book.pickup_area} />}
            {book.isbn && <Detail label="ISBN" value={book.isbn} />}
          </dl>
        )}
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted uppercase tracking-wide font-semibold">
        {label}
      </dt>
      <dd className="mt-0.5 text-body text-ink">{value}</dd>
    </div>
  );
}
