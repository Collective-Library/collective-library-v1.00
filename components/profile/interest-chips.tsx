"use client";

import {
  BROAD_INTERESTS,
  INTENTS,
  subInterestsFor,
  labelForInterest,
  emojiForInterest,
  labelForIntent,
  emojiForIntent,
} from "@/lib/interests";
import { cn } from "@/lib/cn";

// =============================================================================
// Layer 1 — broad interest chips (existing, unchanged behaviour)
// =============================================================================
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
        <p className="text-caption font-medium text-ink-soft">
          Interest <span className="text-muted">(broad)</span>
        </p>
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

// =============================================================================
// Layer 2 — sub-interest chips, gated by selected Layer 1
// =============================================================================
export function SubInterestChips({
  broad,
  value,
  onChange,
}: {
  broad: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  if (broad.length === 0) return null;
  const options = subInterestsFor(broad);
  if (options.length === 0) return null;

  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-caption font-medium text-ink-soft">
          Sub-interest <span className="text-muted">(opsional)</span>
        </p>
        <p className="text-caption text-muted">
          {value.length === 0 ? "—" : `${value.length} dipilih`}
        </p>
      </div>
      <p className="text-caption text-muted -mt-1">
        Lebih spesifik. Cuma muncul untuk broad yang lo pilih di atas.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((it) => {
          const active = value.includes(it.slug);
          return (
            <button
              key={it.slug}
              type="button"
              onClick={() => toggle(it.slug)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1 h-8 px-3 rounded-pill border text-caption font-medium transition-colors",
                active
                  ? "bg-ink-soft text-parchment border-ink-soft"
                  : "bg-paper text-ink-soft border-hairline hover:bg-cream",
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

// =============================================================================
// Layer 3 — intent chips (flat multi-select)
// =============================================================================
export function IntentChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-caption font-medium text-ink-soft">
          Intent <span className="text-muted">(buat apa)</span>
        </p>
        <p className="text-caption text-muted">
          {value.length === 0 ? "—" : `${value.length} dipilih`}
        </p>
      </div>
      <p className="text-caption text-muted -mt-1">
        Apa yang lo cari dari komunitas? Dipake buat matching.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {INTENTS.map((it) => {
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
                  ? "bg-(--color-lend) text-parchment border-(--color-lend)"
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

// =============================================================================
// Display-only chips for public profile + member card
// =============================================================================

/** Layer 1 display chip (dark) */
export function InterestList({ slugs }: { slugs: string[] | null | undefined }) {
  if (!slugs || slugs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {slugs.map((slug) => (
        <span
          key={slug}
          className="inline-flex items-center gap-1 rounded-pill bg-cream text-ink-soft border border-hairline px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ letterSpacing: "0.15px" }}
        >
          <span aria-hidden>{emojiForInterest(slug)}</span>
          <span>{labelForInterest(slug)}</span>
        </span>
      ))}
    </div>
  );
}

/** Layer 2 display chip (lighter, smaller) */
export function SubInterestList({ slugs }: { slugs: string[] | null | undefined }) {
  if (!slugs || slugs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {slugs.map((slug) => (
        <span
          key={slug}
          className="inline-flex items-center gap-1 rounded-pill bg-paper text-muted border border-hairline-soft px-2 py-0.5 text-[10px] font-medium"
        >
          <span aria-hidden>{emojiForInterest(slug)}</span>
          <span>{labelForInterest(slug)}</span>
        </span>
      ))}
    </div>
  );
}

/** Layer 3 display chip (accent) — what they want to DO */
export function IntentList({ slugs }: { slugs: string[] | null | undefined }) {
  if (!slugs || slugs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {slugs.map((slug) => (
        <span
          key={slug}
          className="inline-flex items-center gap-1 rounded-pill bg-(--color-lend-bg) text-(--color-lend) border border-(--color-lend-bg) px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ letterSpacing: "0.15px" }}
        >
          <span aria-hidden>{emojiForIntent(slug)}</span>
          <span>{labelForIntent(slug)}</span>
        </span>
      ))}
    </div>
  );
}
