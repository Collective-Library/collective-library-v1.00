"use client";

import { useEffect, useRef, useState } from "react";
import { LottieLoading } from "@/components/ui/lottie-loading";

/**
 * Indonesian kode pos picker. Type 5 digits, results pop in below — pick one
 * to lock in district + regency + lat/lng. Replaces free-text city/area
 * inputs so /peta + /anggota filters get canonical names + real coords.
 *
 * Calls /api/postal-code/lookup which proxies kodepos.vercel.app.
 */

export interface PostalCodeResult {
  postal_code: string;
  village: string;
  district: string; // kecamatan
  regency: string;  // kota / kabupaten
  province: string;
  lat: number | null;
  lng: number | null;
}

export function PostalCodePicker({
  initialPostalCode,
  initialDistrict,
  initialRegency,
  onPick,
}: {
  initialPostalCode?: string | null;
  initialDistrict?: string | null;
  initialRegency?: string | null;
  onPick: (result: PostalCodeResult) => void;
}) {
  const [query, setQuery] = useState(initialPostalCode ?? "");
  const [results, setResults] = useState<PostalCodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PostalCodeResult | null>(
    initialPostalCode && initialDistrict && initialRegency
      ? {
          postal_code: initialPostalCode,
          village: "",
          district: initialDistrict,
          regency: initialRegency,
          province: "",
          lat: null,
          lng: null,
        }
      : null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click / Esc
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

  // Debounced lookup — fires when query changes and is at least 3 chars
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError(null);
      return;
    }
    // Only trigger when query differs from picked code
    if (picked && trimmed === picked.postal_code) return;

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/postal-code/lookup?q=${encodeURIComponent(trimmed)}`,
          { signal: ctrl.signal },
        );
        if (ctrl.signal.aborted) return;
        if (!res.ok) {
          setError("Cari gagal. Coba lagi.");
          setResults([]);
        } else {
          const data = (await res.json()) as
            | { found: true; items: PostalCodeResult[] }
            | { found: false; items: PostalCodeResult[] };
          setResults(data.items ?? []);
          setOpen(true);
          if (!data.found) setError("Kode pos gak ketemu.");
        }
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          setError("Cari gagal. Coba lagi.");
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, picked]);

  function handlePick(r: PostalCodeResult) {
    setPicked(r);
    setQuery(r.postal_code);
    setOpen(false);
    onPick(r);
  }

  function handleClear() {
    setPicked(null);
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2 relative">
      <div className="flex flex-col gap-1.5">
        <label className="text-caption font-medium text-ink-soft">
          Kode pos
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={query}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5);
              setQuery(v);
              if (picked && v !== picked.postal_code) setPicked(null);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="50275"
            maxLength={5}
            className="w-full h-12 px-3.5 pr-12 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px] focus:pr-[47px] transition-colors font-mono tracking-wide"
            aria-autocomplete="list"
            aria-controls="postal-list"
            aria-expanded={open}
            role="combobox"
          />
          {loading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              <LottieLoading size={48} ariaLabel="Mencari kode pos" />
            </span>
          )}
          {!loading && picked && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus kode pos"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-caption text-muted">
          Cari kode pos lo di Google kalau gak hapal — auto-isi kecamatan + kota.
        </p>
      </div>

      {/* Resolved chip — shown after a pick */}
      {picked && picked.district && picked.regency && (
        <div className="flex items-start gap-2 rounded-card bg-(--color-lend-bg) border border-(--color-lend-bg) px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--color-lend) shrink-0 mt-0.5" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-(--color-lend) leading-snug">
              {picked.village ? `${picked.village}, ` : ""}
              {picked.district}
            </p>
            <p className="text-caption text-(--color-lend) opacity-80">
              {picked.regency}
              {picked.province ? ` · ${picked.province}` : ""}
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <p className="text-caption text-(--color-error)">{error}</p>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          id="postal-list"
          role="listbox"
          className="absolute left-0 right-0 top-[78px] mt-2 max-h-72 overflow-y-auto bg-paper border border-hairline rounded-card-lg shadow-modal z-30 divide-y divide-hairline-soft"
        >
          {results.map((r, i) => (
            <li key={`${r.postal_code}-${i}`} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-cream transition-colors"
              >
                <span className="text-body-sm font-semibold text-ink leading-snug">
                  {r.village ? `${r.village}, ` : ""}
                  {r.district}
                </span>
                <span className="text-caption text-muted">
                  {r.regency}
                  {r.province ? ` · ${r.province}` : ""}
                  {" "}
                  · {r.postal_code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
