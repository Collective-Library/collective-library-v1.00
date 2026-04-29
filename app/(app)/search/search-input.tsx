"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Debounced search input. Updates the URL ?q= parameter — server component
 * up the tree re-runs the query.
 */
export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount for fast typing
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced URL update
  useEffect(() => {
    const t = setTimeout(() => {
      const current = params.get("q") ?? "";
      if (value === current) return;
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `/search?${qs}` : "/search");
      });
    }, 250);
    return () => clearTimeout(t);
  }, [value, params, router]);

  return (
    <div className="relative">
      <span
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari judul, author, atau owner…"
        className="w-full h-14 pl-12 pr-4 rounded-pill bg-paper text-ink border border-hairline-strong text-body-lg placeholder:text-muted-soft focus:outline-none focus:border-ink focus:border-2 focus:pl-[47px] transition-colors"
      />
      {isPending && (
        <span
          className="absolute right-5 top-1/2 -translate-y-1/2 text-muted text-caption"
          aria-live="polite"
        >
          Mencari…
        </span>
      )}
    </div>
  );
}
