import { cn } from "@/lib/cn";

/**
 * "Tracking belum diimplementasi" empty-state card. Used in Phase-2/3
 * sections so we never show fake metrics — instead we show what data
 * would unlock the section.
 */
export function SectionEmpty({
  title,
  reason,
  needs,
  phase,
  className,
}: {
  title: string;
  reason: string;
  needs?: string[];
  phase?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-paper border border-hairline rounded-card-lg shadow-card p-8 md:p-10 flex flex-col items-start gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center h-6 px-2 rounded-pill bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk) text-[11px] font-semibold tracking-wide">
          ⚠ Tracking belum ada
        </span>
        {phase && (
          <span className="inline-flex items-center h-6 px-2 rounded-pill bg-cream text-muted border border-hairline text-[11px] font-semibold tracking-wide">
            Phase {phase}
          </span>
        )}
      </div>
      <h2 className="font-display text-display-md text-ink leading-tight">{title}</h2>
      <p className="text-body text-ink-soft max-w-2xl leading-relaxed">{reason}</p>
      {needs && needs.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5">
          <p className="text-caption font-semibold text-ink uppercase tracking-wide">
            Yang dibutuhkan biar section ini hidup
          </p>
          <ul className="flex flex-col gap-1.5 text-body-sm text-ink-soft">
            {needs.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <span aria-hidden className="text-muted">→</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
