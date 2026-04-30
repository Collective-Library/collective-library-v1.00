"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BROAD_INTERESTS, INTENTS } from "@/lib/interests";
import { cn } from "@/lib/cn";

/**
 * Bumble-flavored filter sheet for /anggota. Replaces the four inline pill
 * rows with a single popup → way less visual noise on the listing.
 *
 * Mobile: bottom sheet (slides up). Desktop: centered modal. Both share
 * one component — only the wrapper positioning changes via Tailwind.
 *
 * State:
 * - Hydrates from initialFilters (URL params → server props).
 * - Local draft state inside the sheet — not committed until "Terapkan".
 * - "Reset" clears local draft + clears URL on apply.
 *
 * Apply pushes to /anggota?... — the existing server page handles the rest.
 */

export interface AnggotaFilters {
  city?: string;
  area?: string;
  interest?: string;
  intent?: string;
  open?: "lending" | "selling" | "trade";
}

export interface CityOption {
  city: string;
  count: number;
}

export interface AreaOption {
  city: string;
  area: string;
  count: number;
}

export function AnggotaFilterSheet({
  initialFilters,
  cityOptions,
  areaOptions,
}: {
  initialFilters: AnggotaFilters;
  cityOptions: CityOption[];
  areaOptions: AreaOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AnggotaFilters>(initialFilters);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Re-sync draft when URL params change (e.g. after a sibling Reset link)
  useEffect(() => {
    setDraft(initialFilters);
  }, [
    initialFilters.city,
    initialFilters.area,
    initialFilters.interest,
    initialFilters.intent,
    initialFilters.open,
  ]);

  // Body scroll lock + Escape close while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeCount = countActive(initialFilters);

  // Areas scoped to current draft.city
  const draftAreas = draft.city
    ? areaOptions.filter((a) => a.city.toLowerCase() === draft.city!.toLowerCase())
    : [];

  function apply(reset = false) {
    const next = reset ? {} : draft;
    const params = new URLSearchParams();
    if (next.city) params.set("city", next.city);
    if (next.area) params.set("area", next.area);
    if (next.interest) params.set("interest", next.interest);
    if (next.intent) params.set("intent", next.intent);
    if (next.open) params.set("open", next.open);
    const qs = params.toString();
    router.push(qs ? `/anggota?${qs}` : "/anggota");
    setOpen(false);
  }

  return (
    <>
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-pill text-body-sm font-medium transition-colors",
          activeCount > 0
            ? "bg-ink text-parchment hover:bg-ink-soft"
            : "bg-paper text-ink-soft border border-hairline-strong hover:bg-cream",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <FilterIcon />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill bg-parchment text-ink text-[11px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Tutup filter"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-overlay-fade-in"
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className={cn(
              "relative w-full sm:max-w-lg bg-parchment border-t sm:border border-hairline-strong sm:rounded-card-lg sm:shadow-modal flex flex-col",
              "rounded-t-card-lg sm:rounded-t-card-lg",
              "max-h-[88vh] sm:max-h-[80vh]",
              "animate-sheet-slide-up sm:animate-pop-fade-down",
            )}
          >
            {/* Drag handle (mobile aesthetic) */}
            <div className="sm:hidden pt-2 pb-1 flex justify-center">
              <div className="w-9 h-1 rounded-pill bg-hairline-strong" aria-hidden />
            </div>

            <header className="flex items-center justify-between gap-3 px-5 pt-3 sm:pt-5 pb-4 border-b border-hairline-soft">
              <div>
                <p className="text-caption text-muted uppercase tracking-wide font-semibold">
                  Filter anggota
                </p>
                <h2 id="filter-title" className="font-display text-title-lg text-ink leading-tight">
                  Pilih siapa yang mau lo lihat
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-pill text-muted hover:bg-cream hover:text-ink-soft"
              >
                <CloseIcon />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
              {cityOptions.length > 1 && (
                <Section label="Kota">
                  <Chip
                    active={!draft.city}
                    onClick={() => setDraft((d) => ({ ...d, city: undefined, area: undefined }))}
                    label="Semua kota"
                  />
                  {cityOptions.map((c) => (
                    <Chip
                      key={c.city}
                      active={draft.city?.toLowerCase() === c.city.toLowerCase()}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          city: d.city?.toLowerCase() === c.city.toLowerCase() ? undefined : c.city,
                          area: undefined,
                        }))
                      }
                      label={`${c.city}`}
                      count={c.count}
                    />
                  ))}
                </Section>
              )}

              {draftAreas.length > 0 && (
                <Section label={`Area di ${draft.city}`}>
                  <Chip
                    active={!draft.area}
                    onClick={() => setDraft((d) => ({ ...d, area: undefined }))}
                    label="Semua area"
                  />
                  {draftAreas.map((a) => (
                    <Chip
                      key={`${a.city}-${a.area}`}
                      active={draft.area?.toLowerCase() === a.area.toLowerCase()}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          area: d.area?.toLowerCase() === a.area.toLowerCase() ? undefined : a.area,
                        }))
                      }
                      label={a.area}
                      count={a.count}
                    />
                  ))}
                </Section>
              )}

              <Section label="Interest">
                <Chip
                  active={!draft.interest}
                  onClick={() => setDraft((d) => ({ ...d, interest: undefined }))}
                  label="Semua interest"
                />
                {BROAD_INTERESTS.map((i) => (
                  <Chip
                    key={i.slug}
                    active={draft.interest === i.slug}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        interest: d.interest === i.slug ? undefined : i.slug,
                      }))
                    }
                    label={`${i.emoji} ${i.label}`}
                  />
                ))}
              </Section>

              <Section label="Available untuk">
                <Chip
                  active={!draft.intent}
                  onClick={() => setDraft((d) => ({ ...d, intent: undefined }))}
                  label="Apa aja"
                />
                {INTENTS.map((i) => (
                  <Chip
                    key={i.slug}
                    active={draft.intent === i.slug}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        intent: d.intent === i.slug ? undefined : i.slug,
                      }))
                    }
                    label={`${i.emoji} ${i.label}`}
                  />
                ))}
              </Section>

              <Section label="Mode">
                <Chip
                  active={!draft.open}
                  onClick={() => setDraft((d) => ({ ...d, open: undefined }))}
                  label="Semua mode"
                />
                <Chip
                  active={draft.open === "lending"}
                  onClick={() =>
                    setDraft((d) => ({ ...d, open: d.open === "lending" ? undefined : "lending" }))
                  }
                  label="📚 Buka pinjam"
                />
                <Chip
                  active={draft.open === "selling"}
                  onClick={() =>
                    setDraft((d) => ({ ...d, open: d.open === "selling" ? undefined : "selling" }))
                  }
                  label="💸 Buka jual"
                />
                <Chip
                  active={draft.open === "trade"}
                  onClick={() =>
                    setDraft((d) => ({ ...d, open: d.open === "trade" ? undefined : "trade" }))
                  }
                  label="🔄 Buka tukar"
                />
              </Section>
            </div>

            <footer className="px-5 py-4 border-t border-hairline-soft bg-paper/50 flex items-center gap-3" style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}>
              <button
                type="button"
                onClick={() => apply(true)}
                className="inline-flex items-center justify-center h-11 px-5 rounded-pill bg-paper text-ink-soft border border-hairline-strong text-body-sm font-medium hover:bg-cream"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => apply(false)}
                className="flex-1 inline-flex items-center justify-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft active:scale-[0.99] transition-all"
              >
                Terapkan{countActive(draft) > 0 && ` (${countActive(draft)})`}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center h-9 px-3.5 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment border border-ink"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-1.5 inline-flex items-center h-5 px-1.5 rounded-pill text-[10px] font-semibold",
            active ? "bg-parchment/20 text-parchment" : "bg-cream text-muted",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function countActive(f: AnggotaFilters): number {
  return Object.values(f).filter((v) => v != null && v !== "").length;
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
