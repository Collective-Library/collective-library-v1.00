/**
 * Typed map-item model for Collective Maps (/peta).
 *
 * `/peta` started members-only. This discriminated union lets the map render
 * multiple item types behind one renderer without losing per-type richness:
 * each variant carries its full typed row in `data`, so popups stay strongly
 * typed (no `metadata: Record<string, unknown>` escape hatch).
 *
 * Slice 2 ships the union + the member adapter only — members render exactly as
 * before. `SpotMapItem` / `EventMapItem` are typed placeholders for Slices 3/4;
 * no loader or renderer produces them yet.
 *
 * Kept free of any Supabase / server / React imports (only a type-only import
 * of `MapMember`, which is erased at runtime) so it stays unit-testable with
 * `node --test`, mirroring `lib/member-books.ts`.
 *
 * `coordPrecision` is load-bearing: members are placed at an approximate
 * (kecamatan-level) coordinate and get deterministic jitter; Spots/events are
 * public places shown at exact coordinates and must NOT be jittered.
 */
import type { MapMember } from "@/lib/profile";

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
 * Placeholder for the Spots layer (Slice 3). Spots are public places, so they
 * render at `coordPrecision: "exact"`. Not produced by any loader yet.
 */
export interface SpotMapItem extends MapItemBase {
  type: "spot";
  data: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    image_url?: string | null;
    description?: string | null;
    maps_url?: string | null;
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
