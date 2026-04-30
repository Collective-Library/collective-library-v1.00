"use client";

import { BROAD_INTERESTS } from "@/lib/interests";
import { cn } from "@/lib/cn";

/**
 * Selectable chip set for Layer-1 broad interests.
 * Pure UI — parent owns the value+onChange so it composes inside any form.
 */
export function InterestChips({
  value,
  onChange,
  min = 3,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  min?: number;
}) {
  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  }
  const selectedCount = value.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-caption font-medium text-ink-soft">Interest</p>
        <p className="text-caption text-muted">
          {selectedCount < min
            ? `Pilih minimal ${min} (sekarang ${selectedCount})`
            : `${selectedCount} dipilih`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {BROAD_INTERESTS.map((it) => {
          const active = value.includes(it.slug);
          return (
            <button
              key={it.slug}
              type="button"
              onClick={() => toggle(it.slug)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill border text-body-sm font-medium transition-colors",
                active
                  ? "bg-ink text-parchment border-ink"
                  : "bg-paper text-ink-soft border-hairline-strong hover:bg-cream",
              )}
            >
              <span aria-hidden>{it.emoji}</span>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Read-only display of selected interest chips for the public profile. */
export function InterestList({ slugs }: { slugs: string[] | null | undefined }) {
  if (!slugs || slugs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {slugs.map((slug) => {
        const item = BROAD_INTERESTS.find((b) => b.slug === slug);
        const label = item?.label ?? slug.replace(/-/g, " ");
        const emoji = item?.emoji ?? "✦";
        return (
          <span
            key={slug}
            className="inline-flex items-center gap-1 rounded-pill bg-cream text-ink-soft border border-hairline px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ letterSpacing: "0.15px" }}
          >
            <span aria-hidden>{emoji}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}
