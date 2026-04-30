"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import type { BookStatus } from "@/types";

/**
 * Inline autocomplete search in the TopBar — replaces the old static link
 * to /search. Goal: don't bounce the user to a new page just to type.
 *
 * UX:
 * - Pill that looks like an input. Click anywhere → focuses + opens dropdown.
 * - Debounced (200ms) GET /api/search → max 8 results.
 * - Each result row: cover thumb + title/author/status pill (left) | small
 *   owner avatar + name (right). Click book → /book/[id]. Click owner
 *   avatar → /profile/{username}.
 * - Keyboard: ArrowDown/Up navigate, Enter opens highlighted, Esc closes.
 *   Press Enter with no highlight → /search?q={value} (full results page).
 * - "Lihat semua hasil →" footer link always opens /search.
 *
 * Mobile: pill expands to full-width when focused; dropdown sits flush below
 * the topbar via fixed positioning.
 */

interface SearchHit {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  status: BookStatus;
  owner: {
    id: string;
    full_name: string | null;
    username: string | null;
    photo_url: string | null;
    city: string | null;
  };
}

export function TopBarSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // Debounced fetch with cancelable AbortController per keystroke.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const j = (await res.json()) as { books: SearchHit[] };
        setHits(j.books);
        setHighlight(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setHits([]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [value]);

  // Outside click + Escape close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && hits[highlight]) {
        router.push(`/book/${hits[highlight].id}`);
        setOpen(false);
        setValue("");
      } else if (value.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(value.trim())}`);
        setOpen(false);
      }
    }
  }

  const showDropdown = open && (value.trim().length >= 2 || loading);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-2 hidden md:flex">
      <div className="relative w-full">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          aria-hidden
        >
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari judul, author, atau owner…"
          aria-label="Cari di rak komunitas"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(
            "w-full h-11 pl-12 pr-10 rounded-pill bg-paper border text-body-sm placeholder:text-muted text-ink",
            "focus:outline-none focus:border-ink focus:border-2 focus:pl-[47px] focus:pr-[39px]",
            "transition-colors",
            showDropdown ? "border-ink-soft shadow-card" : "border-hairline-strong hover:shadow-card",
          )}
        />
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Bersihin pencarian"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-pill text-muted hover:bg-cream hover:text-ink-soft"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-paper border border-hairline rounded-card-lg shadow-modal overflow-hidden animate-pop-fade-down"
        >
          {loading && hits.length === 0 ? (
            <DropdownState>Mencari…</DropdownState>
          ) : hits.length === 0 ? (
            <DropdownState>
              Belum nemu &ldquo;{value.trim()}&rdquo;.{" "}
              <Link
                href={`/wanted/add?title=${encodeURIComponent(value.trim())}`}
                className="text-ink font-medium underline underline-offset-4"
                onClick={() => setOpen(false)}
              >
                Posting WTB →
              </Link>
            </DropdownState>
          ) : (
            <>
              <ul className="max-h-[420px] overflow-y-auto py-1">
                {hits.map((b, i) => (
                  <li key={b.id}>
                    <ResultRow
                      hit={b}
                      highlighted={highlight === i}
                      onMouseEnter={() => setHighlight(i)}
                      onSelect={() => {
                        setOpen(false);
                        setValue("");
                      }}
                    />
                  </li>
                ))}
              </ul>
              <Link
                href={`/search?q=${encodeURIComponent(value.trim())}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-caption font-semibold text-ink-soft hover:text-ink hover:bg-cream border-t border-hairline-soft transition-colors text-center"
              >
                Lihat semua hasil →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  hit,
  highlighted,
  onMouseEnter,
  onSelect,
}: {
  hit: SearchHit;
  highlighted: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
}) {
  return (
    <Link
      href={`/book/${hit.id}`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={highlighted}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors",
        highlighted ? "bg-cream" : "hover:bg-cream/60",
      )}
    >
      <div className="shrink-0 w-9 h-12 bg-cream rounded-button border border-hairline-soft overflow-hidden">
        {hit.cover_url ? (
          <Image
            src={hit.cover_url}
            alt=""
            width={36}
            height={48}
            className="w-full h-full object-cover"
            aria-hidden
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-caption">
            📕
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-ink truncate leading-tight">{hit.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-caption text-muted truncate">{hit.author}</span>
          <span className="text-muted">·</span>
          <StatusBadge status={hit.status} />
        </div>
      </div>
      <div
        className="hidden sm:flex items-center gap-1.5 shrink-0 max-w-[140px] text-caption text-muted"
        aria-label={`owned by ${hit.owner.full_name ?? hit.owner.username}`}
      >
        <Avatar src={hit.owner.photo_url} name={hit.owner.full_name} size={22} />
        <span className="truncate">
          {hit.owner.full_name ?? (hit.owner.username ? `@${hit.owner.username}` : "anggota")}
        </span>
      </div>
    </Link>
  );
}

function DropdownState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-6 text-center text-body-sm text-muted">{children}</div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
