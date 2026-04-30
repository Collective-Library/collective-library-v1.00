import { cn } from "@/lib/cn";

/**
 * KPI tile for Mission Control. Shows a single metric with optional sub-text
 * (e.g., "of 100 target") and an optional pill (e.g., "+12 minggu ini").
 */
export function KpiCard({
  label,
  value,
  sub,
  pill,
  pillTone = "neutral",
  hint,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  pill?: string;
  pillTone?: "positive" | "negative" | "warning" | "neutral";
  hint?: string;
  className?: string;
}) {
  const pillCls = {
    positive: "bg-(--color-okr-on-track-bg) text-(--color-okr-on-track)",
    negative: "bg-(--color-okr-behind-bg) text-(--color-okr-behind)",
    warning: "bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk)",
    neutral: "bg-cream text-ink-soft border border-hairline",
  }[pillTone];

  return (
    <div
      className={cn(
        "bg-paper border border-hairline rounded-card-lg shadow-card p-4 flex flex-col gap-2",
        className,
      )}
      title={hint}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          {label}
        </p>
        {pill && (
          <span className={cn("inline-flex items-center h-5 px-1.5 rounded-pill text-[10px] font-semibold", pillCls)}>
            {pill}
          </span>
        )}
      </div>
      <p className="font-display text-display-md text-ink leading-none">
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </p>
      {sub && <p className="text-caption text-muted">{sub}</p>}
    </div>
  );
}

/** Responsive grid for KPI cards. */
export function MetricGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[cols];
  return <div className={cn("grid gap-3", colClass)}>{children}</div>;
}
