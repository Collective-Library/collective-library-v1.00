import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { formatEventWhen } from "@/lib/format";
import type { EventWithHost } from "@/types";

export function EventCard({ event }: { event: EventWithHost }) {
  const when = formatEventWhen(event.starts_at, event.ends_at, event.timezone);

  return (
    <Link
      href={`/event/${event.id}`}
      className="group flex flex-col gap-3 focus-visible:outline-none"
    >
      {/* Cover plate — 16:9 ratio */}
      <div className="relative aspect-video rounded-card overflow-hidden bg-cream border border-hairline group-hover:shadow-card-hover transition-shadow">
        {event.cover_url ? (
          <Image
            src={event.cover_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover"
          />
        ) : (
          <EventCoverPlaceholder title={event.title} />
        )}

        {event.is_online && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-ink/70 text-paper text-caption font-semibold backdrop-blur-sm">
            Online
          </span>
        )}

        {event.status !== "scheduled" && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-ink/70 text-paper text-caption font-semibold capitalize backdrop-blur-sm">
            {event.status === "cancelled" ? "Dibatalkan" : "Selesai"}
          </span>
        )}
      </div>

      {/* Meta block */}
      <div className="flex flex-col gap-1.5">
        <p className="text-caption text-muted font-medium leading-tight">{when}</p>

        <h3 className="text-title-sm font-semibold text-ink line-clamp-2 leading-snug">
          {event.title}
        </h3>

        {event.location_text && !event.is_online && (
          <p className="text-caption text-muted line-clamp-1">{event.location_text}</p>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="flex items-center gap-1.5 min-w-0">
            <Avatar src={event.host.photo_url} name={event.host.full_name} size={20} />
            <span className="text-caption text-ink-soft truncate">
              {event.host.full_name ?? event.host.username}
            </span>
          </span>
          {event.rsvp_count > 0 && (
            <span className="text-caption text-muted shrink-0">
              {event.rsvp_count} hadir
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventCoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-cream to-parchment">
      <p className="font-display text-title-md text-ink line-clamp-3 text-center leading-tight">
        {title}
      </p>
    </div>
  );
}
