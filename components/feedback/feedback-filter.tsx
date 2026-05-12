import { cn } from "@/lib/cn";
import { FeedbackCategory, FeedbackStatus } from "@/types";
import Link from "next/link";

export function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">{children}</div>
    </div>
  );
}

export function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream"
      )}
    >
      {label}
    </Link>
  );
}

type SP = {
  status?: FeedbackStatus | "all";
  category?: FeedbackCategory | "all";
};

export function hrefWith(opts: SP, route: string): string {
  const params = new URLSearchParams();
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.category && opts.category !== "all") params.set("category", opts.category);
  const qs = params.toString();
  return route + (qs ? `?${qs}` : "");
}
