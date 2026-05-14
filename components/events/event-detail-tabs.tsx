"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatEventWhen, formatRelativeID } from "@/lib/format";
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

  const goingCount = rsvps.filter((r) => r.status === "going").length;
  const maybeCount = rsvps.filter((r) => r.status === "maybe").length;

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
              {t === "hadir" && goingCount > 0 && (
                <span className="ml-1 text-caption text-muted">({goingCount})</span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[140px]">
          {activeTab === "tentang" && <TentangContent event={event} isHost={isHost} />}
          {activeTab === "detail" && <DetailContent event={event} when={when} />}
          {activeTab === "host" && <HostContent hostHref={hostHref} hostName={hostName} event={event} />}
          {activeTab === "hadir" && (
            <HadirContent rsvps={rsvps} goingCount={goingCount} maybeCount={maybeCount} />
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
              {goingCount} hadir{maybeCount > 0 ? ` · ${maybeCount} mungkin` : ""}
            </p>
            <HadirContent rsvps={rsvps} goingCount={goingCount} maybeCount={maybeCount} />
          </section>
        )}
      </div>
    </>
  );
}

function TentangContent({ event, isHost }: { event: EventWithHost; isHost: boolean }) {
  return (
    <div>
      {event.description ? (
        <p className="text-body text-ink leading-relaxed whitespace-pre-wrap">{event.description}</p>
      ) : (
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
      {event.community && (
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
  rsvps,
  goingCount,
  maybeCount,
}: {
  rsvps: EventRsvpWithProfile[];
  goingCount: number;
  maybeCount: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {goingCount > 0 && (
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
            Hadir ({goingCount})
          </p>
          <ul className="flex flex-col gap-2">
            {rsvps
              .filter((r) => r.status === "going")
              .map((r) => (
                <RsvpRow key={r.profile_id} rsvp={r} />
              ))}
          </ul>
        </div>
      )}
      {maybeCount > 0 && (
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2">
            Mungkin ({maybeCount})
          </p>
          <ul className="flex flex-col gap-2">
            {rsvps
              .filter((r) => r.status === "maybe")
              .map((r) => (
                <RsvpRow key={r.profile_id} rsvp={r} />
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RsvpRow({ rsvp }: { rsvp: EventRsvpWithProfile }) {
  const profileHref = rsvp.profile.username ? `/profile/${rsvp.profile.username}` : "#";
  return (
    <li>
      <Link href={profileHref} className="flex items-center gap-2.5 hover:opacity-80">
        <Avatar src={rsvp.profile.photo_url} name={rsvp.profile.full_name} size={32} />
        <p className="text-body-sm text-ink truncate">
          {rsvp.profile.full_name ?? rsvp.profile.username ?? "Anggota"}
        </p>
      </Link>
    </li>
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
