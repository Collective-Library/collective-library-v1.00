import type { ScoreBreakdown } from "@/lib/mastermind/scoring";
import { cn } from "@/lib/cn";

/**
 * Explainable score badge. Hover/title shows the factors so it's never a
 * black box — every score must be defensible.
 */
export function ScoreBadge({
  score,
  label,
  factors,
  size = "sm",
  className,
}: {
  score: number;
  label?: string;
  factors?: ScoreBreakdown["factors"];
  size?: "sm" | "md";
  className?: string;
}) {
  const tone =
    score >= 80
      ? "bg-(--color-okr-on-track-bg) text-(--color-okr-on-track)"
      : score >= 50
        ? "bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk)"
        : "bg-(--color-okr-behind-bg) text-(--color-okr-behind)";

  const sizeCls = size === "md" ? "h-8 px-3 text-caption" : "h-6 px-2 text-[11px]";
  const tooltip = factors
    ? factors.map((f) => `${f.label}: +${f.got}/${f.weight}`).join(" · ")
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-semibold tracking-wide",
        tone,
        sizeCls,
        className,
      )}
      title={tooltip}
    >
      {label && <span className="opacity-70">{label}</span>}
      <span>{score}</span>
    </span>
  );
}
