import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getEvent, listEventRsvps } from "@/lib/events";
import { getCurrentUser } from "@/lib/auth";
import { formatEventWhen } from "@/lib/format";
import { getAppUrl } from "@/lib/url";
import { EventDetailTabs } from "@/components/events/event-detail-tabs";
import { RsvpButton } from "@/components/events/rsvp-button";
import { DiscordAnnounceButton } from "@/components/events/discord-announce-button";
import { CalendarButton } from "@/components/events/calendar-button";
import { RsvpContextPrompt } from "@/components/events/rsvp-context-prompt";
import { CoverImage } from "@/components/books/cover-image";
import { CommunityBadge } from "@/components/ui/community-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event gak ditemukan" };

  const when = formatEventWhen(event.starts_at, event.ends_at, event.timezone);
  const host = event.host.full_name ?? event.host.username ?? "anggota";
  const where = event.is_online ? "online" : event.location_text ?? "Semarang";
  const themeOrDesc = event.theme ?? event.description ?? "";
  const description = `${event.title} — ${when} di ${where}. Host: ${host}.${themeOrDesc ? ` ${themeOrDesc.slice(0, 120)}` : ""}`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.cover_url ? [{ url: event.cover_url }] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, eventEarly] = await Promise.all([getCurrentUser(), getEvent(id)]);
  if (!eventEarly) notFound();

  // Re-fetch event with viewer's RSVP state if authed
  const event = user ? await getEvent(id, user.id) : eventEarly;
  if (!event) notFound();

  const rsvps = await listEventRsvps(id);
  const isHost = user?.id === event.host_id;
  const hostName = event.host.full_name ?? event.host.username ?? "anggota";
  const publicUrl = `${getAppUrl()}/event/${event.id}`;

  // Viewer's own RSVP row — used to pre-populate context prompt
  const viewerRsvp = user
    ? rsvps.find((r) => r.profile_id === user.id) ?? null
    : null;

  // Registration deadline: hide CTA after deadline passes
  const registrationOpen =
    Boolean(event.registration_url) &&
    (!event.registration_deadline || new Date(event.registration_deadline).getTime() > Date.now());

  return (
    <article className="max-w-4xl mx-auto">
      {/* ── Hero ── */}
      <div className="relative -mx-4 md:-mx-6 mb-3 md:mb-8 overflow-hidden rounded-none md:rounded-card-lg">
        <div className="relative aspect-video md:aspect-[21/9] bg-cream">
          {event.cover_url ? (
            <CoverImage
              src={event.cover_url}
              alt={event.title}
              title={event.title}
              className="object-cover w-full h-full absolute inset-0"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cream to-parchment flex items-center justify-center p-6">
              <p className="font-display text-display-md md:text-display-xl text-ink line-clamp-3 text-center">
                {event.title}
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-parchment/90" />
        </div>

        <div className="relative -mt-20 px-4 md:px-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-ink text-parchment text-caption font-semibold">
              {formatEventWhen(event.starts_at, event.ends_at, event.timezone)}
            </span>
            {event.is_online && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-paper text-ink border border-hairline-strong text-caption font-semibold">
                Online
              </span>
            )}
            {event.status === "cancelled" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-red-50 text-red-700 border border-red-200 text-caption font-semibold">
                Dibatalkan
              </span>
            )}
            {event.community_name ? (
              <CommunityBadge name={event.community_name} />
            ) : (
              event.community && <CommunityBadge name={event.community.name} />
            )}
            {isHost && (
              <Link
                href={`/event/${event.id}/edit`}
                className="ml-auto inline-flex items-center h-7 px-2.5 rounded-pill bg-paper text-ink-soft border border-hairline-strong text-caption font-medium hover:bg-cream"
              >
                ✎ Edit
              </Link>
            )}
          </div>

          <h1 className="font-display text-display-md md:text-display-xl text-ink leading-tight">
            {event.title}
          </h1>

          {event.theme && (
            <p className="text-body-lg text-ink-soft italic leading-relaxed mt-1">
              {event.theme}
            </p>
          )}

          <p className="text-body text-ink-soft mt-1">
            di-host oleh{" "}
            {event.host.username ? (
              <Link
                href={`/profile/${event.host.username}`}
                className="text-ink font-medium underline underline-offset-4 hover:text-ink-soft"
              >
                {hostName}
              </Link>
            ) : (
              <span className="text-ink font-medium">{hostName}</span>
            )}
            {event.community_name && (
              <>
                {" · "}
                {event.community_instagram_url ? (
                  <a
                    href={event.community_instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink font-medium underline underline-offset-4 hover:text-ink-soft"
                  >
                    {event.community_name}
                  </a>
                ) : (
                  <span className="text-ink font-medium">{event.community_name}</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-5 md:gap-8">
        <div className="min-w-0">
          <EventDetailTabs event={event} rsvps={rsvps} isHost={isHost} />
        </div>

        <aside className="order-first md:order-none md:sticky md:top-20 md:self-start flex flex-col gap-4">
          {/* ── RSVP card ── */}
          <div className="p-4 md:p-5 rounded-card-lg border border-hairline bg-paper shadow-card flex flex-col gap-3">
            {event.status === "scheduled" ? (
              <>
                <RsvpButton
                  eventId={event.id}
                  initialStatus={event.viewer_rsvp}
                  isAuthed={Boolean(user)}
                  rsvpCount={event.rsvp_count}
                  capacity={event.capacity}
                />

                {user && viewerRsvp && (
                  <RsvpContextPrompt
                    eventId={event.id}
                    profileId={user.id}
                    initialContext={{
                      origin_city: viewerRsvp.origin_city,
                      bringing_book: viewerRsvp.bringing_book,
                      conversation_topic: viewerRsvp.conversation_topic,
                    }}
                  />
                )}

                {/* External registration form CTA */}
                {registrationOpen && event.registration_url && (
                  <>
                    <div className="h-px bg-hairline" />
                    <a
                      href={event.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-card border border-ink-soft text-body-sm text-ink font-medium hover:bg-cream transition-colors"
                    >
                      📝 {event.registration_label || "Daftar via form penyelenggara"}
                    </a>
                    <p className="text-caption text-muted text-center leading-relaxed">
                      RSVP di sini ngebantu orang lain liat siapa yang tertarik hadir. Untuk pendaftaran resmi, ikutin form di atas.
                      {event.registration_deadline && (
                        <>
                          {" "}Deadline: {formatEventWhen(event.registration_deadline, null, event.timezone)}.
                        </>
                      )}
                    </p>
                  </>
                )}

                <div className="h-px bg-hairline" />
                <CalendarButton event={event} publicUrl={publicUrl} />

                {isHost && (
                  <>
                    <div className="h-px bg-hairline" />
                    <DiscordAnnounceButton
                      eventId={event.id}
                      discordAnnouncedAt={event.discord_announced_at}
                    />
                  </>
                )}
              </>
            ) : (
              <p className="text-body-sm text-ink-soft text-center py-2 leading-relaxed">
                Event ini {event.status === "cancelled" ? "dibatalkan" : "sudah selesai"}.
              </p>
            )}
          </div>

          {/* ── Social links card (only if any social link exists) ── */}
          {(event.instagram_url || event.community_instagram_url) && (
            <div className="p-4 rounded-card-lg border border-hairline bg-paper shadow-card flex flex-col gap-2">
              <p className="text-caption text-muted uppercase tracking-wide font-semibold">
                Sosial
              </p>
              {event.instagram_url && (
                <a
                  href={event.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-body-sm text-ink hover:text-ink-soft"
                >
                  <InstagramIcon /> Post event di Instagram
                </a>
              )}
              {event.community_instagram_url && event.community_name && (
                <a
                  href={event.community_instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-body-sm text-ink hover:text-ink-soft"
                >
                  <InstagramIcon /> {event.community_name}
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function InstagramIcon() {
  return (
    <svg
      width={16}
      height={16}
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
