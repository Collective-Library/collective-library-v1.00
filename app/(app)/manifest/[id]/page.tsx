import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getManifest } from "@/lib/manifests";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getAppUrl } from "@/lib/url";
import { formatRelativeID } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { ManifestXTemplate } from "@/components/manifest/manifest-x-template";

export const dynamic = "force-dynamic";

const MOOD_EMOJI: Record<string, string> = {
  curious: "🤔",
  hopeful: "🌱",
  frustrated: "😤",
  grateful: "🙏",
  reflective: "🪞",
  playful: "🎈",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = await getManifest(id);
  if (!m) return { title: "Manifesto gak ditemukan" };
  if (m.status !== "approved") return { title: "Manifesto · Collective Library" };

  const displayName = m.is_anonymous ? "Anonymous" : m.author.full_name ?? m.author.username ?? "Anggota";
  const snippet = m.body.slice(0, 140) + (m.body.length > 140 ? "…" : "");
  return {
    title: `"${snippet}"`,
    description: `Manifesto dari ${displayName} di Collective Library`,
    openGraph: {
      title: snippet,
      description: m.body,
      type: "article",
    },
  };
}

export default async function ManifestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, viewerProfile, manifest] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getManifest(id),
  ]);
  if (!manifest) notFound();

  const isAuthor = user?.id === manifest.author_id;
  const isAdmin = viewerProfile?.is_admin ?? false;
  const canSee =
    manifest.status === "approved" ||
    isAuthor ||
    isAdmin;
  if (!canSee) notFound();

  const isAnon = manifest.is_anonymous;
  const displayName = isAnon ? "Anonymous" : manifest.author.full_name ?? manifest.author.username ?? "Anggota";
  const authorHref = isAnon || !manifest.author.username ? null : `/profile/${manifest.author.username}`;
  const moodEmoji = manifest.mood ? MOOD_EMOJI[manifest.mood] : null;
  const manifestUrl = `${getAppUrl()}/manifest/${manifest.id}`;
  const showXTemplate = manifest.status === "approved" && (isAuthor || isAdmin);

  return (
    <article className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Status banner for non-approved */}
      {manifest.status === "pending" && (
        <div className="px-4 py-3 rounded-card bg-amber-50 border border-amber-200">
          <p className="text-body-sm text-amber-900">
            ⏳ <strong>Pending review.</strong> Manifesto kamu nungguin approval admin. Cuma kamu + admin yang bisa liat ini sekarang.
          </p>
        </div>
      )}
      {manifest.status === "rejected" && (
        <div className="px-4 py-3 rounded-card bg-red-50 border border-red-200">
          <p className="text-body-sm text-red-900">
            ❌ <strong>Rejected.</strong>
            {manifest.moderation_note && (
              <>
                {" "}Catatan moderator: <em>&ldquo;{manifest.moderation_note}&rdquo;</em>
              </>
            )}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-3">
        {isAnon ? (
          <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center text-ink-soft text-title-md">
            <span aria-hidden>?</span>
          </div>
        ) : (
          <Avatar src={manifest.author.photo_url} name={manifest.author.full_name} size={44} />
        )}
        <div className="min-w-0 flex-1">
          {authorHref ? (
            <Link href={authorHref} className="text-body font-semibold text-ink hover:underline underline-offset-4">
              {displayName}
            </Link>
          ) : (
            <p className="text-body font-semibold text-ink">{displayName}</p>
          )}
          <p className="text-caption text-muted">
            {!isAnon && manifest.author.city ? `${manifest.author.city} · ` : ""}
            {formatRelativeID(manifest.created_at)}
          </p>
        </div>
        {(moodEmoji || manifest.topic) && (
          <div className="flex flex-wrap gap-1.5 text-caption shrink-0">
            {moodEmoji && <span className="text-title-md" aria-label={manifest.mood ?? undefined}>{moodEmoji}</span>}
            {manifest.topic && (
              <span className="bg-cream text-ink-soft px-2 py-1 rounded-pill">{manifest.topic}</span>
            )}
          </div>
        )}
      </header>

      {/* Body — the manifesto itself */}
      <blockquote className="font-display text-display-md md:text-display-lg text-ink leading-snug italic">
        &ldquo;{manifest.body}&rdquo;
      </blockquote>

      {/* Linked objects */}
      {(manifest.linked_event || manifest.linked_book) && (
        <div className="flex flex-wrap gap-2 text-body-sm">
          {manifest.linked_event && (
            <Link
              href={`/event/${manifest.linked_event.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-cream text-ink-soft hover:bg-ink hover:text-paper"
            >
              📅 {manifest.linked_event.title}
            </Link>
          )}
          {manifest.linked_book && (
            <Link
              href={`/book/${manifest.linked_book.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-cream text-ink-soft hover:bg-ink hover:text-paper"
            >
              📖 {manifest.linked_book.title}
            </Link>
          )}
        </div>
      )}

      {/* X backlink (if posted) */}
      {manifest.x_posted_url && (
        <a
          href={manifest.x_posted_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-sm text-ink underline underline-offset-4 hover:text-ink-soft self-start"
        >
          𝕏 Lihat di X →
        </a>
      )}

      {/* X copy template — author + admin only on approved */}
      {showXTemplate && (
        <ManifestXTemplate
          manifestId={manifest.id}
          manifestUrl={manifestUrl}
          body={manifest.body}
          topic={manifest.topic}
          isAnonymous={isAnon}
          authorDisplay={isAnon ? null : displayName}
          initialXPostedUrl={manifest.x_posted_url}
          isAdmin={isAdmin}
        />
      )}

      {/* Back link */}
      <Link
        href="/manifest"
        className="text-caption text-muted hover:text-ink underline underline-offset-4 self-start"
      >
        ← Semua manifesto
      </Link>
    </article>
  );
}
