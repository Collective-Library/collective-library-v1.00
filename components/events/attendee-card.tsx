import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { EventRsvpWithProfile } from "@/types";

/**
 * Attendee card — shows who's going as a *social signal*, not just a name.
 * Per the BMC: "oh, yang dateng menarik juga ya" (not just "oh, ada 1 orang").
 *
 * Surfaces:
 *   - avatar + name
 *   - city (where they're coming from)
 *   - top interests (what they care about)
 *   - book count in their shelf (proxy for "actually a reader")
 *   - optional RSVP context: bringing book / conversation topic
 *   - Instagram icon → opens their profile (NOT DM — show, don't intrude)
 *   - "View profile" link to /profile/[username]
 */
export function AttendeeCard({ rsvp }: { rsvp: EventRsvpWithProfile }) {
  const p = rsvp.profile;
  const displayName = p.full_name ?? p.username ?? "Anggota";
  const profileHref = p.username ? `/profile/${p.username}` : null;
  const igUrl = p.instagram ? buildInstagramUrl(p.instagram) : null;
  const city = rsvp.origin_city ?? p.city;
  const topInterests = (p.interests ?? []).slice(0, 3);

  return (
    <li className="rounded-card border border-hairline bg-paper p-4 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar src={p.photo_url} name={p.full_name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-ink truncate leading-tight">
            {displayName}
          </p>
          <MetaLine city={city} bookCount={p.book_count} />
        </div>
      </div>

      {topInterests.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
          {topInterests.map((interest) => (
            <li
              key={interest}
              className="text-caption text-ink-soft bg-cream px-2 py-0.5 rounded-pill capitalize"
            >
              {interest}
            </li>
          ))}
        </ul>
      )}

      {(rsvp.bringing_book || rsvp.conversation_topic) && (
        <dl className="text-caption flex flex-col gap-1.5 pt-1 border-t border-hairline">
          {rsvp.bringing_book && (
            <div className="flex gap-2">
              <dt className="text-muted font-semibold shrink-0">Bawa:</dt>
              <dd className="text-ink-soft line-clamp-1">{rsvp.bringing_book}</dd>
            </div>
          )}
          {rsvp.conversation_topic && (
            <div className="flex gap-2">
              <dt className="text-muted font-semibold shrink-0">Pengen ngobrol:</dt>
              <dd className="text-ink-soft line-clamp-1">{rsvp.conversation_topic}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="flex items-center gap-2 pt-1">
        {profileHref && (
          <Link
            href={profileHref}
            className="text-caption text-ink font-medium underline underline-offset-4 hover:text-ink-soft"
          >
            View profile →
          </Link>
        )}
        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${displayName}`}
            title="Lihat Instagram"
            className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-full bg-cream text-ink-soft hover:bg-ink hover:text-paper transition-colors"
          >
            <InstagramIcon size={14} />
          </a>
        )}
      </div>
    </li>
  );
}

function MetaLine({ city, bookCount }: { city: string | null; bookCount: number }) {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (bookCount > 0) parts.push(`${bookCount} buku di rak`);
  if (parts.length === 0) return null;
  return (
    <p className="text-caption text-muted leading-tight truncate">{parts.join(" · ")}</p>
  );
}

/** Best-effort: turn a stored IG handle (with or without @) into a profile URL. */
function buildInstagramUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const handle = raw.replace(/^@/, "");
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
