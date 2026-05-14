import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getEvent, listEventRsvps } from "@/lib/events";
import { getCurrentUser } from "@/lib/auth";
import { formatEventWhen } from "@/lib/format";
import { EventDetailTabs } from "@/components/events/event-detail-tabs";
import { RsvpButton } from "@/components/events/rsvp-button";
import { DiscordAnnounceButton } from "@/components/events/discord-announce-button";
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
  const description = `${event.title} — ${when} di ${where}. Host: ${host}.`;

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
  const when = formatEventWhen(event.starts_at, event.ends_at, event.timezone);
  const hostName = event.host.full_name ?? event.host.username ?? "anggota";

  return (
    <article className="max-w-4xl mx-auto">
      {/* ── Hero ── */}
      <div className="relative -mx-4 md:-mx-6 mb-3 md:mb-8 overflow-hidden rounded-none md:rounded-card-lg">
        <div className="relative aspect-video md:aspect-[21/9] bg-cream">
          {event.cover_url ? (
            <Image
              src={event.cover_url}
              alt={event.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
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
              {when}
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
            {event.community && <CommunityBadge name={event.community.name} />}
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
          <p className="text-body text-ink-soft">
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
          </p>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-5 md:gap-8">
        <div className="min-w-0">
          <EventDetailTabs event={event} rsvps={rsvps} isHost={isHost} />
        </div>

        <aside className="order-first md:order-none md:sticky md:top-20 md:self-start">
          <div className="p-4 md:p-5 rounded-card-lg border border-hairline bg-paper shadow-card flex flex-col gap-3">
            {event.status === "scheduled" ? (
              <>
                <RsvpButton
                  eventId={event.id}
                  initialStatus={event.viewer_rsvp}
                  isAuthed={Boolean(user)}
                />
                <p className="text-caption text-muted text-center leading-relaxed">
                  {event.rsvp_count > 0
                    ? `${event.rsvp_count} udah RSVP. ${event.capacity ? `Kapasitas ${event.capacity}.` : "Belum ada batas."}`
                    : "Lo bisa jadi yang pertama RSVP. Nggak nge-bind."}
                </p>
                {isHost && (
                  <>
                    <hr className="border-hairline" />
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
        </aside>
      </div>
    </article>
  );
}
