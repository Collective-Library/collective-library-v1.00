"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { STATUS_FILTER_OPTIONS } from "@/lib/status";
import type { BookStatus } from "@/types";

/**
 * Client shell for the /shelf page filter row + book grid.
 *
 * Why this exists:
 *   The old filter pills were plain <Link> components. React 18 concurrent
 *   rendering keeps the stale grid visible (frozen) until the server responds,
 *   giving zero visual feedback. This component fixes that with:
 *
 *   1. Optimistic active pill — the clicked filter highlights *immediately*,
 *      before the server even starts responding.
 *   2. Pending dot — a small pulsing dot on the active pill while loading.
 *   3. Grid fade — the book grid dims to 50% opacity during the round-trip,
 *      so the user knows their click registered without a jarring blank screen.
 *
 * The BookGrid + Pagination are passed as children so they remain server-
 * rendered (no client bundle cost for book data), but inherit the fade
 * during transitions.
 */
interface Props {
  /** Current filter from the server (syncs back after navigation completes). */
  filter: BookStatus | "all";
  /** Current search query — preserved in filter navigation URLs. */
  q?: string;
  children: React.ReactNode;
}

export function ShelfClientWrapper({ filter, q, children }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Optimistic: update immediately on click; server prop takes over once done.
  const [optimisticFilter, setOptimisticFilter] = useState<BookStatus | "all">(filter);

  const activeFilter = isPending ? optimisticFilter : filter;

  function navigate(value: BookStatus | "all") {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    if (q) params.set("q", q);
    const qs = params.toString();
    setOptimisticFilter(value);
    startTransition(() => {
      router.push("/shelf" + (qs ? `?${qs}` : ""));
    });
  }

  return (
    <>
      {/* ── Filter pills ── */}
      <div
        role="tablist"
        aria-label="Filter status buku"
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
      >
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const active = activeFilter === opt.value;
          const loading = isPending && active;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => navigate(opt.value)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
                active
                  ? "bg-ink text-parchment"
                  : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
              )}
            >
              {opt.label}
              {loading && (
                <span
                  aria-hidden
                  className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Book grid — fades to 50% while pending ── */}
      <div
        className={cn(
          "transition-opacity duration-200",
          isPending && "opacity-50 pointer-events-none select-none",
        )}
      >
        {children}
      </div>
    </>
  );
}
