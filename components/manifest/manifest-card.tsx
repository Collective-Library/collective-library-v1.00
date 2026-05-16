import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeID } from "@/lib/format";
import type { ManifestWithAuthor } from "@/types";

const MOOD_EMOJI: Record<string, string> = {
  curious: "🤔",
  hopeful: "🌱",
  frustrated: "😤",
  grateful: "🙏",
  reflective: "🪞",
  playful: "🎈",
};

export function ManifestCard({ manifest }: { manifest: ManifestWithAuthor }) {
  const isAnon = manifest.is_anonymous;
  const displayName = isAnon ? "Anonymous" : manifest.author.full_name ?? manifest.author.username ?? "Anggota";
  const authorHref = isAnon || !manifest.author.username ? null : `/profile/${manifest.author.username}`;
  const moodEmoji = manifest.mood ? MOOD_EMOJI[manifest.mood] : null;

  return (
    <article className="rounded-card-lg border border-hairline bg-paper p-5 md:p-6 shadow-card hover:shadow-card-hover transition-shadow flex flex-col gap-4">
      {/* Header: who + when */}
      <header className="flex items-center gap-3">
        {isAnon ? (
          <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center text-ink-soft">
            <span aria-hidden>?</span>
          </div>
        ) : (
          <Avatar src={manifest.author.photo_url} name={manifest.author.full_name} size={36} />
        )}
        <div className="min-w-0 flex-1">
          {authorHref ? (
            <Link
              href={authorHref}
              className="text-body-sm font-semibold text-ink leading-tight hover:underline underline-offset-4"
            >
              {displayName}
            </Link>
          ) : (
            <p className="text-body-sm font-semibold text-ink leading-tight">{displayName}</p>
          )}
          <p className="text-caption text-muted leading-tight">
            {!isAnon && manifest.author.city ? `${manifest.author.city} · ` : ""}
            {formatRelativeID(manifest.created_at)}
          </p>
        </div>
        {(moodEmoji || manifest.topic) && (
          <span className="text-caption text-muted shrink-0 flex items-center gap-1.5">
            {moodEmoji && <span aria-label={manifest.mood ?? undefined}>{moodEmoji}</span>}
            {manifest.topic && (
              <span className="bg-cream px-2 py-0.5 rounded-pill">{manifest.topic}</span>
            )}
          </span>
        )}
      </header>

      {/* Body */}
      <Link
        href={`/manifest/${manifest.id}`}
        className="font-display text-title-lg md:text-title-xl text-ink leading-relaxed italic hover:opacity-90"
      >
        &ldquo;{manifest.body}&rdquo;
      </Link>

      {/* Linked objects (event / book) */}
      {(manifest.linked_event || manifest.linked_book) && (
        <div className="flex flex-wrap gap-2 text-caption">
          {manifest.linked_event && (
            <Link
              href={`/event/${manifest.linked_event.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-cream text-ink-soft hover:bg-ink hover:text-paper transition-colors"
            >
              📅 {manifest.linked_event.title}
            </Link>
          )}
          {manifest.linked_book && (
            <Link
              href={`/book/${manifest.linked_book.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-cream text-ink-soft hover:bg-ink hover:text-paper transition-colors"
            >
              📖 {manifest.linked_book.title}
            </Link>
          )}
        </div>
      )}

      {/* Footer: optional X backlink */}
      {manifest.x_posted_url && (
        <a
          href={manifest.x_posted_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-ink-soft hover:text-ink underline underline-offset-4 self-start"
        >
          Lihat di X →
        </a>
      )}
    </article>
  );
}
