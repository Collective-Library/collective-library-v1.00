import Link from "next/link";
import type { Metadata } from "next";
import { listMembersForMap, type MapMember } from "@/lib/profile";
import { listSpotsForMap, type SpotForMap } from "@/lib/spots";
import { listEventsForMap, type EventForMap } from "@/lib/events";
import { getCurrentProfile } from "@/lib/auth";
import { PetaClient } from "@/components/map/peta-client";
import { memberToMapItem, spotToMapItem, eventToMapItem } from "@/lib/map";
import { INTENTS } from "@/lib/interests";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Peta komunitas",
  description:
    "Sebaran anggota Collective Library di kecamatan masing-masing. Klik bubble buat lihat siapa & rak buku mereka.",
};

type Layer = "members" | "spots" | "events";

type SP = {
  intent?: string;
  open?: "lending" | "selling" | "trade";
  layer?: Layer;
};

export default async function PetaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { intent, open, layer } = await searchParams;
  const showMembers = !layer || layer === "members";
  const showSpots = !layer || layer === "spots";
  const showEvents = !layer || layer === "events";

  // Fetch only the layers in view (parallel — no waterfall). `me` is always
  // needed for the "Tampilin gue / Edit lokasi" CTA.
  const [allMembers, me, spots, events] = await Promise.all([
    showMembers ? listMembersForMap() : Promise.resolve<MapMember[]>([]),
    getCurrentProfile(),
    showSpots ? listSpotsForMap() : Promise.resolve<SpotForMap[]>([]),
    showEvents ? listEventsForMap() : Promise.resolve<EventForMap[]>([]),
  ]);

  // Member intent/mode filters apply to the members layer only. Filtered
  // in-memory over the already-fetched set (small, opt-in cohort).
  const filteredMembers = showMembers
    ? allMembers.filter((m) => {
        if (intent && !(m.intents ?? []).includes(intent)) return false;
        if (open === "lending" && !m.open_for_lending) return false;
        if (open === "selling" && !m.open_for_selling) return false;
        if (open === "trade" && !m.open_for_trade) return false;
        return true;
      })
    : [];

  const meOnMap = me?.show_on_map === true && me.map_lat != null && me.map_lng != null;
  const hasFilter = Boolean(intent || open);

  // Adapt each source into the typed map-item union. Members render exactly as
  // before (approximate + jitter); Spots and events are exact public-place pins.
  const memberItems = filteredMembers.map(memberToMapItem);
  const spotItems = spots.map(spotToMapItem);
  const eventItems = events.map(eventToMapItem);
  const items = [...memberItems, ...spotItems, ...eventItems];

  const memberCount = memberItems.length;
  const spotCount = spotItems.length;
  const eventCount = eventItems.length;
  const countLine = mapCountLine({ layer, memberCount, spotCount, eventCount, hasFilter });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Peta komunitas
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Sebaran komunitas
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">{countLine}</p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper border border-hairline-strong text-ink-soft hover:bg-cream"
        >
          {meOnMap ? "Edit lokasi" : "Tampilin gue"}
        </Link>
      </div>

      {/* Layer + filter rows */}
      <div className="flex flex-col gap-3">
        <FilterRow label="Tampilkan">
          <FilterPill href={buildHref({ intent, open })} active={!layer} label="Semua" />
          <FilterPill
            href={buildHref({ layer: "members", intent, open })}
            active={layer === "members"}
            label="Anggota"
          />
          <FilterPill
            href={buildHref({ layer: "spots" })}
            active={layer === "spots"}
            label="Spots"
          />
          <FilterPill
            href={buildHref({ layer: "events" })}
            active={layer === "events"}
            label="Event"
          />
        </FilterRow>

        {showMembers && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">
                Filter anggota
              </p>
              {hasFilter && (
                <Link
                  href={buildHref({ layer })}
                  className="text-caption text-muted hover:text-ink underline underline-offset-4"
                >
                  Reset
                </Link>
              )}
            </div>

            <FilterRow label="Available untuk">
              <FilterPill href={buildHref({ open, layer })} active={!intent} label="Apa aja" />
              {INTENTS.map((i) => (
                <FilterPill
                  key={i.slug}
                  href={buildHref({ intent: i.slug, open, layer })}
                  active={intent === i.slug}
                  label={`${i.emoji} ${i.label}`}
                />
              ))}
            </FilterRow>

            <FilterRow label="Mode">
              <FilterPill href={buildHref({ intent, layer })} active={!open} label="Semua mode" />
              <FilterPill
                href={buildHref({ intent, open: "lending", layer })}
                active={open === "lending"}
                label="Buka pinjam"
              />
              <FilterPill
                href={buildHref({ intent, open: "selling", layer })}
                active={open === "selling"}
                label="Buka jual"
              />
              <FilterPill
                href={buildHref({ intent, open: "trade", layer })}
                active={open === "trade"}
                label="Buka tukar"
              />
            </FilterRow>
          </>
        )}
      </div>

      <PetaClient items={items} />

      {showMembers && (
        <div className="rounded-card-lg border border-hairline bg-cream/40 p-4 text-caption text-muted">
          <p className="font-medium text-ink-soft mb-1">Tentang visibilitas</p>
          Pin di-tempatin di tengah <span className="text-ink-soft">kecamatan</span>, bukan alamat
          persis lo. Toggle yang sama juga nampilin lo di{" "}
          <span className="text-ink-soft">landing publik</span> sebagai member card. Default mati —
          atur di{" "}
          <Link href="/profile/edit" className="text-ink-soft underline underline-offset-4">
            profile lo
          </Link>
          .
        </div>
      )}
    </div>
  );
}

function buildHref(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.layer) params.set("layer", opts.layer);
  if (opts.intent) params.set("intent", opts.intent);
  if (opts.open) params.set("open", opts.open);
  const qs = params.toString();
  return qs ? `/peta?${qs}` : "/peta";
}

/** Header subline copy, adapted to the active layer + member filter state. */
function mapCountLine(opts: {
  layer?: Layer;
  memberCount: number;
  spotCount: number;
  eventCount: number;
  hasFilter: boolean;
}): string {
  const { layer, memberCount, spotCount, eventCount, hasFilter } = opts;
  if (layer === "spots") {
    if (spotCount === 0) return "Belum ada Spot publik yang aktif di peta.";
    return `${spotCount} Spot aktif. Klik buat lihat tempat baca & komunitasnya.`;
  }
  if (layer === "events") {
    if (eventCount === 0) return "Belum ada event publik mendatang di peta.";
    return `${eventCount} event mendatang. Klik buat lihat detail & lokasinya.`;
  }
  if (layer === "members") {
    if (memberCount === 0) {
      return hasFilter
        ? "Gak ada anggota cocok di filter ini. Coba reset atau ganti pilihan."
        : "Belum ada anggota yang opt-in. Lo bisa jadi yang pertama.";
    }
    return `${memberCount} anggota visible${hasFilter ? " (filter aktif)" : ""}. Pin di kecamatan, bukan alamat persis.`;
  }
  if (memberCount + spotCount + eventCount === 0) {
    return "Belum ada yang muncul di peta. Lo bisa jadi yang pertama.";
  }
  return `${memberCount} anggota + ${spotCount} Spot + ${eventCount} event. Pin anggota di kecamatan, bukan alamat persis.`;
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide px-4 md:px-0">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {children}
      </div>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream"
      )}
    >
      {label}
    </Link>
  );
}
