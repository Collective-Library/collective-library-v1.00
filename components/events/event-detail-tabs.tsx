"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatEventWhen, formatRelativeID } from "@/lib/format";
import { AttendeeCard } from "@/components/events/attendee-card";
import type { EventRsvpWithProfile, EventWithHost } from "@/types";

type Tab = "tentang" | "detail" | "host" | "hadir";

const TAB_LABELS: Record<Tab, string> = {
  tentang: "Tentang",
  detail: "Detail",
  host: "Host",
  hadir: "Hadir",
};

interface Props {
  event: EventWithHost;
  rsvps: EventRsvpWithProfile[];
  isHost: boolean;
}

export function EventDetailTabs({ event, rsvps, isHost }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("tentang");
  const hostName = event.host.full_name ?? event.host.username ?? "host";
  const hostHref = event.host.username ? `/profile/${event.host.username}` : "#";
  const when = formatEventWhen(event.starts_at, event.ends_at, event.timezone);

  const goingRsvps = rsvps.filter((r) => r.status === "going");
  const maybeRsvps = rsvps.filter((r) => r.status === "maybe");

  const tabs: Tab[] = [
    "tentang",
    "detail",
    "host",
    ...(rsvps.length > 0 ? (["hadir"] as Tab[]) : []),
  ];

  return (
    <>
      {/* ═══════════════ MOBILE ═══════════════ */}
      <div className="md:hidden">
        <div role="tablist" className="flex border-b border-hairline mb-5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={activeTab === t}
              onClick={() => setActiveTab(t)}
              className={
                "px-4 py-2.5 text-body-sm font-semibold transition-colors border-b-2 -mb-px shrink-0 " +
                (activeTab === t
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink-soft")
              }
            >
              {TAB_LABELS[t]}
              {t === "hadir" && goingRsvps.length > 0 && (
                <span className="ml-1 text-caption text-muted">({goingRsvps.length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[140px]">
          {activeTab === "tentang" && <TentangContent event={event} isHost={isHost} />}
          {activeTab === "detail" && <DetailContent event={event} when={when} />}
          {activeTab === "host" && <HostContent hostHref={hostHref} hostName={hostName} event={event} />}
          {activeTab === "hadir" && (
            <HadirContent goingRsvps={goingRsvps} maybeRsvps={maybeRsvps} />
          )}
        </div>
      </div>

      {/* ═══════════════ DESKTOP ═══════════════ */}
      <div className="hidden md:flex flex-col gap-6">
        <section className="p-6 rounded-card-lg border border-hairline bg-paper shadow-card">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-3">
            Tentang event ini
          </p>
          <TentangContent event={event} isHost={isHost} />
        </section>

        <section className="p-6 rounded-card-lg border border-hairline bg-paper shadow-card">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-3">
            Detail
          </p>
          <DetailContent event={event} when={when} />
        </section>

        <Link
          href={hostHref}
          className="flex items-center gap-3 p-4 rounded-card border border-hairline bg-paper hover:bg-cream transition-colors"
        >
          <Avatar src={event.host.photo_url} name={event.host.full_name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-ink truncate">{hostName}</p>
            <p className="text-caption text-muted truncate">
              {event.host.city ?? "Semarang"} · posted {formatRelativeID(event.created_at)}
            </p>
          </div>
          <span className="text-caption text-muted shrink-0">→</span>
        </Link>

        {rsvps.length > 0 && (
          <section className="p-5 rounded-card-lg border border-hairline bg-paper shadow-card">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-3">
              {goingRsvps.length} siap datang{maybeRsvps.length > 0 ? ` · ${maybeRsvps.length} mungkin` : ""}
            </p>
            <HadirContent goingRsvps={goingRsvps} maybeRsvps={maybeRsvps} />
          </section>
        )}
      </div>
    </>
  );
}

function TentangContent({ event, isHost }: { event: EventWithHost; isHost: boolean }) {
  const whatToExpect = event.what_to_expect ?? [];

  return (
    <div className="flex flex-col gap-5">
      {event.theme && (
        <p className="text-body-lg text-ink italic leading-relaxed">{event.theme}</p>
      )}

      {event.description ? (
        <p className="text-body text-ink leading-relaxed whitespace-pre-wrap">
          {event.description}
        </p>
      ) : !event.theme ? (
        <p className="text-body text-ink-soft leading-relaxed">
          Belum ada deskripsi.{" "}
          {isHost ? (
            <Link
              href={`/event/${event.id}/edit`}
              className="text-ink font-semibold underline underline-offset-4 decoration-hairline-strong hover:decoration-ink"
            >
              Tambahin →
            </Link>
          ) : (
            "Tanya langsung ke host."
          )}
        </p>
      ) : null}

      {whatToExpect.length > 0 && (
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
            Di event ini kamu bisa
          </p>
          <ul className="flex flex-col gap-2">
            {whatToExpect.map((line, idx) => (
              <li key={idx} className="flex gap-2 text-body text-ink-soft">
                <span aria-hidden className="text-ink shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.reminder_text && (
        <div className="pl-3 border-l-2 border-ink/20">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1.5">
            Reminder dari host
          </p>
          <p className="text-body text-ink-soft italic whitespace-pre-wrap leading-relaxed">
            {event.reminder_text}
          </p>
        </div>
      )}

      {event.hashtags && event.hashtags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 pt-1">
          {event.hashtags.map((tag) => (
            <li
              key={tag}
              className="text-caption text-ink-soft bg-cream px-2 py-0.5 rounded-pill"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetailContent({ event, when }: { event: EventWithHost; when: string }) {
  return (
    <dl className="grid grid-cols-1 gap-y-4">
      <DetailRow label="Kapan" value={when} />
      {event.is_online ? (
        <DetailRow label="Format" value="Online" />
      ) : (
        event.location_text && <DetailRow label="Lokasi" value={event.location_text} />
      )}
      {event.location_url && (
        <div>
          <dt className="text-caption text-muted uppercase tracking-wide font-semibold">
            {event.is_online ? "Link meeting" : "Maps"}
          </dt>
          <dd className="mt-0.5">
            <a
              href={event.location_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-ink underline underline-offset-4 hover:text-ink-soft break-all"
            >
              {event.location_url}
            </a>
          </dd>
        </div>
      )}
      {event.capacity && (
        <DetailRow label="Kapasitas" value={`${event.rsvp_count} / ${event.capacity}`} />
      )}
      {event.community_name && (
        <DetailRow label="Komunitas" value={event.community_name} />
      )}
      {!event.community_name && event.community && (
        <DetailRow label="Komunitas" value={event.community.name} />
      )}
    </dl>
  );
}

function HostContent({
  hostHref,
  hostName,
  event,
}: {
  hostHref: string;
  hostName: string;
  event: EventWithHost;
}) {
  return (
    <Link href={hostHref} className="flex items-center gap-3">
      <Avatar src={event.host.photo_url} name={event.host.full_name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink truncate">{hostName}</p>
        <p className="text-caption text-muted truncate">
          {event.host.city ?? "Semarang"}
        </p>
      </div>
      <span className="text-caption text-muted shrink-0">→</span>
    </Link>
  );
}

function HadirContent({
  goingRsvps,
  maybeRsvps,
}: {
  goingRsvps: EventRsvpWithProfile[];
  maybeRsvps: EventRsvpWithProfile[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {goingRsvps.length > 0 && (
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
            Siap datang ({goingRsvps.length})
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goingRsvps.map((r) => (
              <AttendeeCard key={r.profile_id} rsvp={r} />
            ))}
          </ul>
        </div>
      )}
      {maybeRsvps.length > 0 && (
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
            Mungkin hadir ({maybeRsvps.length})
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {maybeRsvps.map((r) => (
              <AttendeeCard key={r.profile_id} rsvp={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted uppercase tracking-wide font-semibold">{label}</dt>
      <dd className="mt-0.5 text-body text-ink">{value}</dd>
    </div>
  );
}
