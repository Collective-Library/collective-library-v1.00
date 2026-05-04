"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchGoogleBooks, type BookSearchResult } from "@/lib/openlibrary";
import { SearchSpinner } from "@/components/ui/search-spinner";
import { CoverImage } from "@/components/books/cover-image";

/**
 * Search-as-you-type book picker. Hits Google Books, shows a dropdown of
 * candidates with cover thumbnails. On click, calls onPick with the full
 * metadata so the parent form can autofill its fields.
 *
 * Naval: leverage = users bring their own discovery. Friction → 0.
 */
export function BookPicker({
  onPick,
  placeholder = "Cari judul, author, atau ISBN…",
}: {
  onPick: (book: BookSearchResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const doSearch = useCallback(async (q: string, signal: AbortSignal) => {
    try {
      const res = await searchGoogleBooks(q);
      if (signal.aborted) return;
      setResults(res);
      setOpen(res.length > 0);
      setActiveIdx(0);
    } catch {
      // ignore aborted / network errors
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      const q = value.trim();

      // Cancel previous
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();

      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        setLoading(false);
        return;
      }

      // Show loading state immediately
      setLoading(true);
      setResults([]);
      setOpen(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      debounceRef.current = setTimeout(() => {
        doSearch(q, ctrl.signal);
      }, 300);
    },
    [doSearch]
  );

  // Close on outside click + Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[activeIdx];
      if (picked) {
        onPick(picked);
        setQuery("");
        setOpen(false);
      }
    }
  }

  function pick(book: BookSearchResult) {
    onPick(book);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          aria-hidden
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-12 rounded-button bg-paper text-ink border border-hairline-strong placeholder:text-muted-soft focus:outline-none focus:border-ink focus:border-2 focus:pl-[43px] focus:pr-[47px] transition-colors"
          aria-autocomplete="list"
          aria-controls="bookpicker-list"
          aria-expanded={open}
          role="combobox"
        />
      </div>

      {open && (
        <ul
          id="bookpicker-list"
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-paper border border-hairline rounded-card-lg shadow-modal z-30 divide-y divide-hairline-soft"
        >
          {loading && results.length === 0 ? (
            <li className="px-4 py-5 text-muted text-center flex items-center justify-center gap-2">
              <SearchSpinner />
              <span className="text-body-sm">Lagi cari buku lo..</span>
            </li>
          ) : results.length === 0 ? (
            <li className="px-4 py-5 text-body-sm text-muted text-center">
              Hmm buku lo ga ketemu. Coba cari pake kata kunci lain atau bisa input manual.
            </li>
          ) : (
            results.map((b, i) => (
              <li
                key={b.id}
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <button
                  type="button"
                  onClick={() => pick(b)}
                  className={
                    "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors " +
                    (i === activeIdx ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]")
                  }
                >
                  <div className="w-10 h-14 shrink-0 rounded-[4px] overflow-hidden bg-cream border border-hairline flex items-center justify-center">
                    <CoverImage
                      src={b.cover_url}
                      alt={b.title}
                      title={b.title}
                      author={b.author ?? ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-ink line-clamp-2 leading-snug">
                      {b.title}
                    </p>
                    <p className="text-caption text-muted line-clamp-1">
                      {b.author ?? "—"}
                      {b.year && <span className="ml-1">· {b.year}</span>}
                      {b.publisher && <span className="ml-1">· {b.publisher}</span>}
                    </p>
                    {b.isbn && (
                      <p className="text-[11px] text-muted-soft font-mono mt-0.5">ISBN {b.isbn}</p>
                    )}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
