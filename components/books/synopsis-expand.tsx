"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Animated read-more for book synopsis. Collapses to ~6 lines with a soft
 * gradient fade so the reader knows there's more. "Baca lengkap" toggles a
 * height transition (no jank, no cliff).
 *
 * Behavior:
 * - If the description fits within the collapsed height, the toggle is hidden
 *   (no fake "read more" on already-short text).
 * - The animation uses max-height (capped to the measured scrollHeight) so
 *   long descriptions reveal smoothly without slamming open.
 * - aria-expanded + aria-controls wired so screen readers track the state.
 */
const COLLAPSED_PX = 168; // ≈ 6 lines at body line-height (~24px × 7-ish)

export function SynopsisExpand({
  text,
  attribution,
}: {
  text: string;
  attribution?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);

  // Measure on mount + on resize. If the natural height is taller than
  // the collapsed cap, we show the toggle.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    function measure() {
      if (!el) return;
      const h = el.scrollHeight;
      setFullHeight(h);
      setNeedsToggle(h > COLLAPSED_PX + 8); // small slack to avoid 1px cases
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [text]);

  const maxH = !needsToggle
    ? "none"
    : expanded
      ? `${fullHeight ?? COLLAPSED_PX}px`
      : `${COLLAPSED_PX}px`;

  return (
    <div className="relative">
      <div
        id="synopsis-content"
        aria-hidden={false}
        className={cn(
          "relative overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        )}
        style={{ maxHeight: maxH }}
      >
        <div ref={contentRef}>
          <p className="text-body-lg text-ink leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
          {attribution && (
            <p className="mt-3 text-caption text-muted italic">— {attribution}</p>
          )}
        </div>
        {needsToggle && !expanded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper via-paper/85 to-transparent"
          />
        )}
      </div>

      {needsToggle && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="synopsis-content"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-semibold text-ink underline underline-offset-4 decoration-hairline-strong hover:decoration-ink transition-colors"
        >
          <span>{expanded ? "Tutup sinopsis" : "Baca lengkap"}</span>
          <span
            aria-hidden
            className={cn(
              "inline-block transition-transform duration-300",
              expanded ? "rotate-180" : "rotate-0",
            )}
          >
            ↓
          </span>
        </button>
      )}
    </div>
  );
}
