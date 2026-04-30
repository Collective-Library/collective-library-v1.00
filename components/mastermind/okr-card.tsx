import Link from "next/link";
import type { OkrObjectiveWithKRs, OkrKeyResult } from "@/types";
import { cn } from "@/lib/cn";

const STATUS_TONE = {
  on_track: "bg-(--color-okr-on-track-bg) text-(--color-okr-on-track)",
  at_risk: "bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk)",
  behind: "bg-(--color-okr-behind-bg) text-(--color-okr-behind)",
  done: "bg-(--color-okr-done-bg) text-(--color-okr-done)",
} as const;

const STATUS_LABEL = {
  on_track: "On track",
  at_risk: "At risk",
  behind: "Behind",
  done: "Done",
} as const;

const CATEGORY_EMOJI: Record<string, string> = {
  people: "👥",
  data: "📊",
  system: "⚙️",
  integration: "🔗",
  foundation: "🏛️",
  activation: "🚀",
};

export function OkrCard({ objective }: { objective: OkrObjectiveWithKRs }) {
  return (
    <article className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{CATEGORY_EMOJI[objective.category] ?? "🎯"}</span>
          <span className="text-caption text-muted uppercase tracking-wide font-semibold">
            {objective.code} · {objective.category}
          </span>
          <span
            className={cn(
              "inline-flex items-center h-5 px-2 rounded-pill text-[10px] font-semibold tracking-wide",
              STATUS_TONE[objective.status],
            )}
          >
            {STATUS_LABEL[objective.status]}
          </span>
        </div>
        <h2 className="font-display text-title-lg text-ink leading-tight">{objective.title}</h2>
        {objective.detail && (
          <p className="text-body-sm text-ink-soft leading-relaxed">{objective.detail}</p>
        )}
        <ProgressBar pct={objective.progress_pct} />
        <p className="text-caption text-muted">
          Avg progress KR: <span className="font-semibold text-ink">{Math.round(objective.progress_pct)}%</span>
          {" · "}
          {objective.key_results.length} Key Result{objective.key_results.length === 1 ? "" : "s"}
        </p>
      </header>

      <ul className="flex flex-col gap-2.5 border-t border-hairline-soft pt-4">
        {objective.key_results.map((kr) => (
          <li key={kr.id}>
            <KrRow kr={kr} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function KrRow({ kr }: { kr: OkrKeyResult }) {
  const target = Number(kr.target_value);
  const current = Number(kr.current_value);
  const pct = target === 0 ? 0 : Math.min(100, Math.round((current / target) * 100));

  const formatVal = (v: number) => {
    if (kr.target_unit === "percent") return `${v}%`;
    return v.toLocaleString("id-ID");
  };

  return (
    <Link
      href={`/mastermind/okrs/${kr.id}`}
      className="group block bg-cream/40 hover:bg-cream border border-hairline-soft hover:border-hairline rounded-card p-3.5 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-ink font-medium leading-snug">
            {kr.title}
          </p>
          <p className="mt-0.5 text-caption text-muted font-mono">
            {kr.code}
            {kr.auto_compute_key && (
              <span className="ml-2 inline-flex items-center h-4 px-1 rounded-pill bg-paper text-[9px] font-semibold tracking-wide text-muted border border-hairline">
                AUTO
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-title-md text-ink leading-none">
            {formatVal(current)}
            <span className="text-muted text-body"> / {formatVal(target)}</span>
          </p>
          <p className={cn(
            "mt-1 text-caption font-semibold",
            pct >= 100 ? "text-(--color-okr-on-track)" : pct >= 70 ? "text-(--color-okr-at-risk)" : "text-(--color-okr-behind)",
          )}>
            {pct}%
          </p>
        </div>
      </div>
      <ProgressBar pct={pct} className="mt-2" />
    </Link>
  );
}

function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, pct));
  const tone =
    safe >= 100
      ? "bg-(--color-okr-on-track)"
      : safe >= 70
        ? "bg-(--color-okr-at-risk)"
        : safe >= 30
          ? "bg-(--color-okr-at-risk)"
          : "bg-(--color-okr-behind)";
  return (
    <div className={cn("h-2 rounded-pill bg-hairline overflow-hidden", className)}>
      <div className={cn("h-full transition-all", tone)} style={{ width: `${safe}%` }} />
    </div>
  );
}
