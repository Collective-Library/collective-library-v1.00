import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Reusable filter pill row, modeled after /shelf, /anggota, /admin/feedback.
 * Link-based for shareable URLs and zero JS for filter state.
 */
export function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">{children}</div>
    </div>
  );
}

export function FilterPill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
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
    </Link>
  );
}
