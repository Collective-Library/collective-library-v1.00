import Link from "next/link";
import type { UserSignalWithDefinition } from "@/types";

/**
 * Renders a user's unlocked Collective Signals as linked chips.
 * Server component — no interactivity needed. Returns null when empty
 * (per design: no empty-state placeholder on profile).
 */
export function SignalList({ signals }: { signals: UserSignalWithDefinition[] }) {
  if (signals.length === 0) return null;

  return (
    <section aria-label="Collective Signals" className="mb-7">
      <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
        Collective Signals · {signals.length}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {signals.map((s) => {
          const def = s.definition;
          return (
            <Link
              key={s.id}
              href={`/signal/${s.id}`}
              title={def?.description ?? def?.name ?? s.signal_slug}
              className="inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold
                bg-[rgba(61,46,31,0.06)] border border-[rgba(61,46,31,0.15)] text-ink-soft
                hover:bg-[rgba(61,46,31,0.12)] hover:text-ink hover:border-[rgba(61,46,31,0.25)]
                transition-colors"
              style={{ letterSpacing: "0.15px" }}
            >
              {def?.emoji && <span aria-hidden>{def.emoji}</span>}
              <span>{def?.name ?? s.signal_slug}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
