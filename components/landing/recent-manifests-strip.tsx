import { getRecentManifests } from "@/lib/manifests";
import { GatedLink } from "./gated-link";

const MOOD_EMOJI: Record<string, string> = {
  curious: "🤔",
  hopeful: "🌱",
  frustrated: "😤",
  grateful: "🙏",
  reflective: "🪞",
  playful: "🎈",
};

/**
 * Horizontal-scroll strip of approved manifests — landing growth-loop signal.
 * Returns null when no approved manifests so the landing stays clean before
 * the first one ships.
 */
export async function RecentManifestsStrip() {
  const manifests = await getRecentManifests(6);
  if (manifests.length === 0) return null;

  return (
    <section
      className="px-6 md:px-10 py-12 bg-cream/40"
      aria-label="Manifesto terbaru dari komunitas"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Manifesto
            </p>
            <h2 className="mt-1 font-display text-display-md md:text-display-lg text-ink leading-tight">
              Yang lagi dipikirin pembaca
            </h2>
          </div>
          <GatedLink
            href="/manifest"
            className="shrink-0 text-body-sm font-medium text-ink hover:underline underline-offset-4"
          >
            Lihat semua →
          </GatedLink>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-6 px-6 md:-mx-10 md:px-10 pb-2"
          aria-label="Manifesto — geser ke samping"
        >
          {manifests.map((m) => {
            const isAnon = m.is_anonymous;
            const displayName = isAnon
              ? "Anonymous"
              : m.author.full_name ?? m.author.username ?? "Anggota";
            const moodEmoji = m.mood ? MOOD_EMOJI[m.mood] : null;
            return (
              <GatedLink
                key={m.id}
                href={`/manifest/${m.id}`}
                className="group shrink-0 snap-start w-[280px] flex flex-col gap-2 p-4 rounded-card-lg border border-hairline bg-paper hover:shadow-card-hover transition-shadow"
              >
                {(moodEmoji || m.topic) && (
                  <div className="flex items-center gap-1.5 text-caption text-muted">
                    {moodEmoji && <span aria-hidden>{moodEmoji}</span>}
                    {m.topic && <span>{m.topic}</span>}
                  </div>
                )}
                <p className="font-display text-title-md text-ink leading-snug italic line-clamp-5">
                  &ldquo;{m.body}&rdquo;
                </p>
                <p className="text-caption text-muted mt-auto">— {displayName}</p>
              </GatedLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
