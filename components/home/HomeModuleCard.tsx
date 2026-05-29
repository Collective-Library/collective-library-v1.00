import Link from "next/link";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import type { NavIconProps } from "@/components/layout/nav-icons";

export interface HomeModuleCardProps {
  /** Short noun label, e.g. "My Library", "Members". */
  label: string;
  /** One-line live signal (e.g. "3 buku di rak lo") or warm empty state. */
  signal: string;
  /** Icon component from `nav-icons`. */
  icon: ComponentType<NavIconProps>;
  /** Where the card links to. */
  href: string;
  /**
   * Visual tier.
   *  - `primary`   — default photo-first card (Notion warm-neutral).
   *  - `secondary` — same primitive but slightly muted background; used in
   *    the secondary row (Wanted / Manifest / Spots).
   *  - `feature`   — cream-background callout used to make the Map card
   *    read as the social discovery surface, not a utility.
   */
  emphasis?: "primary" | "secondary" | "feature";
  /** Optional badge in the top-right (e.g. "People" on the Map card). */
  badge?: string;
}

/**
 * One module card on the /home cockpit grid. Card primitive shared by
 * primary, secondary, and feature emphasis. Renders icon + label +
 * one-line signal, links to the surface route.
 *
 * Never fakes data — the caller decides the signal copy and falls back
 * to a warm empty-state string when no live signal is available.
 */
export function HomeModuleCard({
  label,
  signal,
  icon: Icon,
  href,
  emphasis = "primary",
  badge,
}: HomeModuleCardProps) {
  const isFeature = emphasis === "feature";
  const isSecondary = emphasis === "secondary";

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-2 rounded-card-lg border p-4 transition-all",
        "hover:shadow-card hover:-translate-y-px",
        isFeature
          ? "bg-cream border-hairline-strong"
          : isSecondary
            ? "bg-paper/70 border-hairline-soft"
            : "bg-paper border-hairline"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center justify-center w-9 h-9 rounded-pill transition-colors",
            isFeature ? "bg-paper text-ink" : "bg-cream text-ink group-hover:bg-cream/70"
          )}
        >
          <Icon size={18} />
        </span>
        {badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-body-sm font-semibold text-ink leading-tight">{label}</p>
        <p className="text-caption text-ink-soft leading-snug">{signal}</p>
      </div>
    </Link>
  );
}
