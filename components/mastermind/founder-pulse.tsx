import type { FounderPulse, PulseSignal } from "@/lib/mastermind/pulse";
import { cn } from "@/lib/cn";

/**
 * Founder Pulse — what changed / growing / stuck / needs attention. Compact
 * narrative widget that sits near the top of Mission Control so the founder
 * gets a one-glance read of the week.
 */
export function FounderPulseCard({ pulse }: { pulse: FounderPulse }) {
  const blocks = [
    { label: "🌱 Growing", items: pulse.whatGrowing, tone: "positive" as const },
    { label: "⚠️ Needs attention", items: pulse.needsAttention, tone: "negative" as const },
    { label: "🪨 Stuck", items: pulse.whatStuck, tone: "warning" as const },
    { label: "↔️ Changed", items: pulse.whatChanged, tone: "neutral" as const },
  ].filter((b) => b.items.length > 0);

  return (
    <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-6 flex flex-col gap-4">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Founder pulse
        </p>
        <h2 className="mt-1 font-display text-display-md text-ink leading-tight">
          Minggu ini, in one glance.
        </h2>
        <p className="mt-1 text-body-sm text-muted">
          Bandingkan 7 hari terakhir vs 7 hari sebelumnya.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {pulse.signals.map((s) => (
          <SignalChip key={s.label} signal={s} />
        ))}
      </div>

      {blocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blocks.map((b) => (
            <div
              key={b.label}
              className="bg-cream/60 border border-hairline-soft rounded-card p-4 flex flex-col gap-2"
            >
              <p className="text-caption font-semibold text-ink uppercase tracking-wide">
                {b.label}
              </p>
              <ul className="flex flex-col gap-1 text-body-sm text-ink-soft">
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SignalChip({ signal }: { signal: PulseSignal }) {
  const arrow = signal.direction === "up" ? "↑" : signal.direction === "down" ? "↓" : "→";
  const toneCls = {
    positive: "text-(--color-okr-on-track)",
    negative: "text-(--color-okr-behind)",
    neutral: "text-muted",
  }[signal.tone];

  return (
    <div className="bg-cream/60 border border-hairline-soft rounded-card p-3 flex flex-col gap-1">
      <p className="text-caption text-muted truncate" title={signal.label}>
        {signal.label}
      </p>
      <p className="font-display text-title-lg text-ink leading-none">{signal.current}</p>
      <p className={cn("text-caption font-semibold", toneCls)}>
        {arrow} {Math.abs(signal.deltaPct)}% vs minggu lalu ({signal.prior})
      </p>
    </div>
  );
}
