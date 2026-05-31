/**
 * Typed map-item model for Collective Maps (/peta).
 *
 * `/peta` started members-only. This discriminated union lets the map render
 * multiple item types behind one renderer without losing per-type richness:
 * each variant carries its full typed row in `data`, so popups stay strongly
 * typed (no `metadata: Record<string, unknown>` escape hatch).
 *
 * Slices 2–3 ship the member + Spot adapters. `EventMapItem` is a typed
 * placeholder for Slice 4; no loader or renderer produces it yet.
 *
 * Kept free of any Supabase / server / React runtime imports (only type-only
 * imports of source row shapes, which are erased at runtime) so it stays
 * unit-testable with `node --test`, mirroring `lib/member-books.ts`.
 *
 * `coordPrecision` is load-bearing: members are placed at an approximate
 * (kecamatan-level) coordinate and get deterministic jitter; Spots/events are
 * public places shown at exact coordinates and must NOT be jittered.
 */
import type { MapMember } from "@/lib/profile";
import type { SpotForMap } from "@/lib/spots";
import type { SpotType } from "@/types";

export type MapItemType = "member" | "spot" | "event";

export interface MapItemBase {
  /**
   * Stable React key and, for approximate items, the jitter seed. Type-prefixed
   * (e.g. `member:<id>`) so ids cannot collide across item types.
   */
  key: string;
  lat: number;
  lng: number;
  coordPrecision: "approximate" | "exact";
}

export interface MemberMapItem extends MapItemBase {
  type: "member";
  data: MapMember;
}

/**
 * Spots layer (Slice 3). Spots are public places, so they render at
 * `coordPrecision: "exact"` — never jittered. `spotType` drives the marker
 * emoji + popup label via `SPOT_TYPE_OPTIONS`.
 */
export interface SpotMapItem extends MapItemBase {
  type: "spot";
  data: {
    id: string;
    name: string;
    slug: string;
    spotType: SpotType;
    city: string | null;
    image_url: string | null;
    description: string | null;
    maps_url: string | null;
  };
}

/**
 * Placeholder for the Events layer (Slice 4). Events inherit their coordinate
 * from a linked public Spot, so they also render at `coordPrecision: "exact"`.
 * Not produced by any loader yet.
 */
export interface EventMapItem extends MapItemBase {
  type: "event";
  data: {
    id: string;
    title: string;
    starts_at: string;
    timezone?: string | null;
    cover_url?: string | null;
    spot?: {
      name: string;
      slug: string;
      city: string | null;
    } | null;
  };
}

export type CollectiveMapItem = MemberMapItem | SpotMapItem | EventMapItem;

/**
 * Adapt a `/peta` member into a map item. Members are approximate by privacy
 * design (kecamatan centroid); the renderer applies deterministic jitter for
 * `coordPrecision === "approximate"`. Pure — no I/O, safe to unit-test.
 */
export function memberToMapItem(m: MapMember): MemberMapItem {
  return {
    type: "member",
    key: `member:${m.id}`,
    lat: m.map_lat,
    lng: m.map_lng,
    coordPrecision: "approximate",
    data: m,
  };
}

/**
 * Adapt a public Spot into a map item. Spots are public places shown at exact
 * coordinates — `coordPrecision: "exact"`, so the renderer never jitters them.
 * Pure — no I/O, safe to unit-test.
 */
export function spotToMapItem(s: SpotForMap): SpotMapItem {
  return {
    type: "spot",
    key: `spot:${s.id}`,
    lat: s.latitude,
    lng: s.longitude,
    coordPrecision: "exact",
    data: {
      id: s.id,
      name: s.name,
      slug: s.slug,
      spotType: s.type,
      city: s.city,
      image_url: s.image_url,
      description: s.description,
      maps_url: s.maps_url,
    },
  };
}
