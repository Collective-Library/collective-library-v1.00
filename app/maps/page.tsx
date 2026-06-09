import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth";
import { isProfileComplete } from "@/types";
import { listMembersForMap, type MapMember } from "@/lib/profile";
import { listSpotsForMap, type SpotForMap } from "@/lib/spots";
import { listEventsForMap, type EventForMap } from "@/lib/events";
import { memberToMapItem, spotToMapItem, eventToMapItem } from "@/lib/map";
import { MapsCanvasClient } from "@/components/map/maps-canvas-client";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collective Maps",
  description:
    "Peta layar penuh komunitas Collective Library — anggota, Spot baca, dan event publik di sekitar lo.",
};

type Layer = "members" | "spots" | "events";
type SP = { layer?: Layer };

export default async function MapsPage({ searchParams }: { searchParams: Promise<SP> }) {
  // Auth + onboarding gate. /maps lives outside the (app) route group on
  // purpose — it must NOT inherit PageShell (TopBar/BottomNav/max-width) so it
  // can render as a true fullscreen surface. That means we replicate the gate
  // from app/(app)/layout.tsx here. proxy.ts already gates /map* at the edge
  // (`isAppRoute` matches the `/map` prefix, which covers `/maps`).
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");
  if (!isProfileComplete(profile)) redirect("/onboarding");

  const { layer } = await searchParams;
  const showMembers = !layer || layer === "members";
  const showSpots = !layer || layer === "spots";
  const showEvents = !layer || layer === "events";

  // Fetch only the active layers, in parallel. The loaders are RLS-gated,
  // display-safe, and fail soft (return [] on error) — an empty layer never
  // throws the page.
  const [members, spots, events] = await Promise.all([
    showMembers ? listMembersForMap() : Promise.resolve<MapMember[]>([]),
    showSpots ? listSpotsForMap() : Promise.resolve<SpotForMap[]>([]),
    showEvents ? listEventsForMap() : Promise.resolve<EventForMap[]>([]),
  ]);

  // Reuse the existing adapters + typed union. Members stay approximate
  // (kecamatan + jitter, applied in the canvas); Spots/events are exact
  // public-place pins.
  const items = [
    ...members.map(memberToMapItem),
    ...spots.map(spotToMapItem),
    ...events.map(eventToMapItem),
  ];
  const counts = { members: members.length, spots: spots.length, events: events.length };
  const countLine = mapsCountLine(layer, counts);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-paper">
      {/* Fullscreen map canvas (client-only — Leaflet needs window/document). */}
      <MapsCanvasClient items={items} />

      {/* Top floating chrome: back-to-app + search + layer chips.
          pointer-events-none on the container keeps the map draggable in the
          gaps; interactive children opt back in with pointer-events-auto.
          z-[1000] sits above Leaflet's panes/controls. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-2 p-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/home"
            aria-label="Balik ke app"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-hairline-strong bg-paper/95 text-ink-soft shadow-card backdrop-blur hover:bg-cream"
          >
            <span aria-hidden>←</span>
          </Link>
          <form action="/search" className="min-w-0 flex-1">
            <input
              type="search"
              name="q"
              placeholder="Cari buku di Collective…"
              aria-label="Cari buku"
              className="h-10 w-full rounded-pill border border-hairline-strong bg-paper/95 px-4 text-body-sm text-ink shadow-card backdrop-blur placeholder:text-muted focus:border-ink-soft focus:outline-none"
            />
          </form>
        </div>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto scrollbar-none">
          <MapChip href="/maps" active={!layer} label="Semua" />
          <MapChip href="/maps?layer=members" active={layer === "members"} label="Anggota" />
          <MapChip href="/maps?layer=spots" active={layer === "spots"} label="Spots" />
          <MapChip href="/maps?layer=events" active={layer === "events"} label="Event" />
        </div>
      </div>

      {/* Bottom-left floating status + privacy card. Kept left so it clears the
          global FeedbackChip (bottom-right). */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto max-w-sm rounded-card-lg border border-hairline-strong bg-paper/95 p-3 shadow-card backdrop-blur">
          <p className="text-body-sm font-medium text-ink">{countLine}</p>
          <p className="mt-1 text-caption text-muted">
            Pin anggota ditaruh di tengah kecamatan, bukan alamat persis. Spot &amp; event pakai
            lokasi publik.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Status/empty copy adapted to the active layer. */
function mapsCountLine(
  layer: Layer | undefined,
  c: { members: number; spots: number; events: number }
): string {
  if (layer === "members") {
    return c.members === 0
      ? "Belum ada anggota yang opt-in di peta."
      : `${c.members} anggota tampil di peta.`;
  }
  if (layer === "spots") {
    return c.spots === 0
      ? "Belum ada Spot publik yang aktif di peta."
      : `${c.spots} Spot aktif. Tap pin buat lihat tempat bacanya.`;
  }
  if (layer === "events") {
    return c.events === 0
      ? "Belum ada event publik mendatang di peta."
      : `${c.events} event mendatang. Tap pin buat lihat detailnya.`;
  }
  const total = c.members + c.spots + c.events;
  if (total === 0) {
    return "Belum ada yang muncul di peta. Jadi yang pertama — tampilin lokasi lo lewat profil.";
  }
  return `${c.members} anggota · ${c.spots} Spot · ${c.events} event di sekitar.`;
}

function MapChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-pill px-4 text-body-sm font-medium shadow-card backdrop-blur transition-colors",
        active
          ? "bg-ink text-parchment"
          : "border border-hairline-strong bg-paper/95 text-ink-soft hover:bg-cream"
      )}
    >
      {label}
    </Link>
  );
}
