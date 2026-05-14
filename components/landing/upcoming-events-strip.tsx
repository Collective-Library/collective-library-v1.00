import Image from "next/image";
import { getUpcomingEvents } from "@/lib/events";
import { formatEventWhen } from "@/lib/format";
import { GatedLink } from "./gated-link";

/**
 * Horizontal-scroll strip of upcoming community events — landing social proof.
 * Pulls up to 8 upcoming scheduled events ordered by starts_at asc.
 * Returns null when no upcoming events so the landing page stays clean on a fresh deploy.
 */
export async function UpcomingEventsStrip() {
  const events = await getUpcomingEvents(8);
  if (events.length === 0) return null;

  return (
    <section
      className="px-6 md:px-10 py-12"
      aria-label="Event komunitas yang akan datang"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Events
            </p>
            <h2 className="mt-1 font-display text-display-md md:text-display-lg text-ink leading-tight">
              Yang akan datang
            </h2>
          </div>
          <GatedLink
            href="/event"
            className="shrink-0 text-body-sm font-medium text-ink hover:underline underline-offset-4"
          >
            Lihat semua →
          </GatedLink>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-6 px-6 md:-mx-10 md:px-10 pb-2"
          aria-label="Daftar event — geser ke samping"
        >
          {events.map((ev) => {
            const when = formatEventWhen(ev.starts_at, ev.ends_at, ev.timezone);
            return (
              <GatedLink
                key={ev.id}
                href={`/event/${ev.id}`}
                className="group shrink-0 snap-start w-[220px] flex flex-col gap-2"
              >
                <div className="relative w-[220px] aspect-video rounded-card overflow-hidden bg-cream border border-hairline shadow-card group-hover:shadow-card-hover transition-shadow">
                  {ev.cover_url ? (
                    <Image
                      src={ev.cover_url}
                      alt=""
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-cream to-parchment">
                      <p className="font-display text-title-sm text-ink line-clamp-2 text-center">
                        {ev.title}
                      </p>
                    </div>
                  )}
                  {ev.is_online && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-ink/70 text-paper text-caption font-semibold">
                      Online
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-caption text-muted font-medium leading-tight truncate">
                    {when}
                  </p>
                  <p className="text-body-sm font-semibold text-ink line-clamp-2 leading-snug mt-0.5">
                    {ev.title}
                  </p>
                  {ev.location_text && !ev.is_online && (
                    <p className="text-caption text-muted truncate">{ev.location_text}</p>
                  )}
                  {ev.rsvp_count > 0 && (
                    <p className="text-caption text-muted mt-0.5">{ev.rsvp_count} hadir</p>
                  )}
                </div>
              </GatedLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
