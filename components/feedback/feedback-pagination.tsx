import { FeedbackCategory, FeedbackStatus } from "@/types";
import Link from "next/link";

export function buildPageHref(opts: {
  page: number;
  status: FeedbackStatus | "all";
  category: FeedbackCategory | "all";
}): string {
  const params = new URLSearchParams();
  if (opts.status !== "all") params.set("status", opts.status);
  if (opts.category !== "all") params.set("category", opts.category);
  if (opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return "/feedback" + (qs ? `?${qs}` : "");
}

export function Pagination({
  page,
  totalPages,
  totalReports,
  status,
  category,
  rangeStart,
  rangeEnd,
}: {
  page: number;
  totalPages: number;
  totalReports: number;
  status: FeedbackStatus | "all";
  category: FeedbackCategory | "all";
  rangeStart: number;
  rangeEnd: number;
}) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 pt-2 border-t border-hairline-soft"
    >
      <p className="text-caption text-muted">
        Feedback{" "}
        <span className="font-semibold text-ink-soft">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        dari <span className="font-semibold text-ink-soft">{totalReports}</span>
      </p>
      <div className="flex items-center gap-2">
        <PaginationLink
          href={buildPageHref({ page: prev, status, category })}
          disabled={!hasPrev}
          ariaLabel="Halaman sebelumnya"
        >
          ← Sebelumnya
        </PaginationLink>
        <span className="text-caption text-muted px-2 hidden sm:inline">
          Hal. {page} / {totalPages}
        </span>
        <PaginationLink
          href={buildPageHref({ page: next, status, category })}
          disabled={!hasNext}
          ariaLabel="Halaman selanjutnya"
        >
          Selanjutnya →
        </PaginationLink>
      </div>
    </nav>
  );
}

export function PaginationLink({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-label={ariaLabel}
        aria-disabled="true"
        className="inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-cream text-muted-soft cursor-not-allowed"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper text-ink-soft border border-hairline hover:bg-cream transition-colors"
    >
      {children}
    </Link>
  );
}
