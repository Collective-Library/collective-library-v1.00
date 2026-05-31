import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  SLUG_REGEX,
  SPOT_STATUS_OPTIONS,
  SPOT_TYPE_OPTIONS,
  SPOT_VISIBILITY_OPTIONS,
  slugify,
} from "@/lib/spots-constants";
import type {
  LibraryNode,
  Spot,
  SpotFormValues,
  SpotStatus,
  SpotType,
  SpotVisibility,
} from "@/types";

// Re-export so existing callers (admin pages, API routes, components that
// already import these from "@/lib/spots") keep working.
export { SLUG_REGEX, SPOT_STATUS_OPTIONS, SPOT_TYPE_OPTIONS, SPOT_VISIBILITY_OPTIONS, slugify };

/**
 * Admin-side CRUD for Library Nodes (UI label: "Spots").
 *
 * Slice 2 of feature/library-nodes — admin-only management surface.
 * Public list / detail pages are intentionally deferred.
 *
 * Permission model:
 * - All functions here use the SERVICE-ROLE client and assume the caller has
 *   already passed the `requireAdmin()` / `getAdminProfileOrNull()` gate.
 *   Never call these from a non-admin route. RLS is bypassed — the gate is
 *   the only thing guarding them.
 * - Non-admin host create path (Slice 3, inline event form) will instead use
 *   the regular `lib/supabase/server` client and hit the RLS-enforced
 *   `spots_insert_host_eligible` policy. That code does NOT live here.
 *
 * Mirrors the shape conventions of `lib/events.ts`:
 * - column constant + select with related joins
 * - flatten helper for embedded relations
 * - `{ ok: true, ... } | { error: string }` return type for writes
 */

const SPOT_LIST_COLUMNS = `id, name, slug, type, city, address, latitude, longitude, maps_url, description, image_url, operating_hours, community_id, status, is_active, visibility, created_by, created_at, updated_at`;

/** Trim → null helper for optional text fields. */
function nullable(v: string | null | undefined): string | null {
  if (v == null) return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** List Spots for the admin list page, with filters + sort. */
export async function listSpotsAdmin(opts?: {
  status?: SpotStatus | "all";
  type?: SpotType | "all";
  city?: string;
  search?: string;
}): Promise<Spot[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("library_nodes")
    .select(SPOT_LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);

  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts?.type && opts.type !== "all") q = q.eq("type", opts.type);
  if (opts?.city && opts.city.trim()) q = q.ilike("city", `%${opts.city.trim()}%`);
  if (opts?.search && opts.search.trim()) {
    const s = opts.search.trim();
    q = q.or(`name.ilike.%${s}%,slug.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("listSpotsAdmin", error);
    return [];
  }
  return (data ?? []) as unknown as Spot[];
}

/** Count Spots by status — powers the filter-pill count badges. */
export async function countSpotsByStatus(): Promise<Record<SpotStatus | "all", number>> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("library_nodes").select("status");
  const counts: Record<SpotStatus | "all", number> = {
    all: 0,
    needs_audit: 0,
    active: 0,
    inactive: 0,
  };
  for (const row of data ?? []) {
    counts.all += 1;
    const s = (row as { status: SpotStatus }).status;
    if (s in counts) counts[s] += 1;
  }
  return counts;
}

/** Fetch a single Spot by id. Admin path — bypasses RLS. */
export async function getSpotByIdAdmin(id: string): Promise<Spot | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("library_nodes")
    .select(SPOT_LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getSpotByIdAdmin", error);
    return null;
  }
  return (data as unknown as Spot) ?? null;
}

/** Check whether a slug is already taken (excluding optional `exceptId`). */
export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createAdminClient();
  let q = supabase.from("library_nodes").select("id").eq("slug", slug).limit(1);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q;
  return (data ?? []).length > 0;
}

/**
 * Create a Spot from the admin form. Forces server-controlled defaults so a
 * malicious payload can't pre-promote to `active` via this path. (Server-side
 * gate is the layout's `requireAdmin`; this function is the inner contract.)
 *
 * Returns inserted row id or an error string.
 */
export async function createSpotAdmin(
  adminId: string,
  values: SpotFormValues
): Promise<{ ok: true; id: string; slug: string } | { error: string }> {
  // Validate slug format early (matches DB CHECK).
  if (!SLUG_REGEX.test(values.slug)) {
    return { error: "Slug invalid — pakai a-z, 0-9, dan tanda hubung." };
  }
  if (values.name.trim().length < 3 || values.name.trim().length > 140) {
    return { error: "Nama harus 3–140 karakter." };
  }
  if (values.city.trim().length < 1 || values.city.trim().length > 120) {
    return { error: "Kota harus 1–120 karakter." };
  }
  if ((values.description?.length ?? 0) > 2000) {
    return { error: "Deskripsi maks 2000 karakter." };
  }
  if ((values.operating_hours?.length ?? 0) > 500) {
    return { error: "Jam buka maks 500 karakter." };
  }

  if (await isSlugTaken(values.slug)) {
    return { error: `Slug "${values.slug}" sudah dipakai. Pilih yang lain.` };
  }

  const supabase = createAdminClient();
  const payload = {
    name: values.name.trim(),
    slug: values.slug,
    type: values.type,
    city: values.city.trim(),
    address: nullable(values.address),
    latitude: typeof values.latitude === "number" ? values.latitude : null,
    longitude: typeof values.longitude === "number" ? values.longitude : null,
    maps_url: nullable(values.maps_url),
    description: nullable(values.description),
    image_url: nullable(values.image_url),
    operating_hours: nullable(values.operating_hours),
    community_id: nullable(values.community_id),
    // Admin-controlled defaults — explicitly NOT taking from the form's
    // status/is_active/visibility on initial create, so the only way to
    // promote is via the dedicated setSpotStatusAdmin / setSpotActiveAdmin
    // entry points (clearer audit trail).
    status: "needs_audit" as SpotStatus,
    is_active: true,
    visibility: (values.visibility ?? "public") as SpotVisibility,
    created_by: adminId,
  };

  const { data, error } = await supabase
    .from("library_nodes")
    .insert(payload)
    .select("id, slug")
    .single();

  if (error) {
    console.error("createSpotAdmin", error);
    return { error: error.message };
  }
  return { ok: true, id: (data as { id: string }).id, slug: (data as { slug: string }).slug };
}

/**
 * Update editable fields of a Spot. Does NOT touch status / is_active /
 * visibility — those go through dedicated entry points below so each admin
 * action is intentional + greppable.
 */
export async function updateSpotAdmin(
  id: string,
  patch: Partial<Omit<SpotFormValues, "slug" | "status" | "is_active" | "visibility">> & {
    slug?: string;
  }
): Promise<{ ok: true } | { error: string }> {
  if (patch.slug !== undefined) {
    if (!SLUG_REGEX.test(patch.slug)) {
      return { error: "Slug invalid — pakai a-z, 0-9, dan tanda hubung." };
    }
    if (await isSlugTaken(patch.slug, id)) {
      return { error: `Slug "${patch.slug}" sudah dipakai.` };
    }
  }
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (n.length < 3 || n.length > 140) return { error: "Nama harus 3–140 karakter." };
  }
  if (patch.city !== undefined) {
    const c = patch.city.trim();
    if (c.length < 1 || c.length > 120) return { error: "Kota harus 1–120 karakter." };
  }
  if (patch.description !== undefined && (patch.description?.length ?? 0) > 2000) {
    return { error: "Deskripsi maks 2000 karakter." };
  }
  if (patch.operating_hours !== undefined && (patch.operating_hours?.length ?? 0) > 500) {
    return { error: "Jam buka maks 500 karakter." };
  }

  const supabase = createAdminClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.slug !== undefined) update.slug = patch.slug;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.city !== undefined) update.city = patch.city.trim();
  if (patch.address !== undefined) update.address = nullable(patch.address);
  if (patch.latitude !== undefined) update.latitude = patch.latitude ?? null;
  if (patch.longitude !== undefined) update.longitude = patch.longitude ?? null;
  if (patch.maps_url !== undefined) update.maps_url = nullable(patch.maps_url);
  if (patch.description !== undefined) update.description = nullable(patch.description);
  if (patch.image_url !== undefined) update.image_url = nullable(patch.image_url);
  if (patch.operating_hours !== undefined) update.operating_hours = nullable(patch.operating_hours);
  if (patch.community_id !== undefined) update.community_id = nullable(patch.community_id);

  if (Object.keys(update).length === 0) {
    return { error: "Nothing to update." };
  }

  const { error } = await supabase.from("library_nodes").update(update).eq("id", id);
  if (error) {
    console.error("updateSpotAdmin", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Admin-only status setter — triggers emit_node_created when promoting → active. */
export async function setSpotStatusAdmin(
  id: string,
  status: SpotStatus
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("library_nodes").update({ status }).eq("id", id);
  if (error) {
    console.error("setSpotStatusAdmin", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Admin-only hard kill-switch — independent of `status` lifecycle. */
export async function setSpotActiveAdmin(
  id: string,
  is_active: boolean
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("library_nodes").update({ is_active }).eq("id", id);
  if (error) {
    console.error("setSpotActiveAdmin", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Admin-only visibility setter (public ↔ community). */
export async function setSpotVisibilityAdmin(
  id: string,
  visibility: SpotVisibility
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("library_nodes").update({ visibility }).eq("id", id);
  if (error) {
    console.error("setSpotVisibilityAdmin", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Hard-delete a Spot row. Cascades activity_log via FK. */
export async function deleteSpotAdmin(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("library_nodes").delete().eq("id", id);
  if (error) {
    console.error("deleteSpotAdmin", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Minimal community-options helper for the form dropdown. */
export async function listCommunitiesForPicker(): Promise<
  Array<{ id: string; name: string; slug: string; city: string | null }>
> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("communities")
    .select("id, name, slug, city")
    .order("name", { ascending: true });
  return (data ?? []) as Array<{ id: string; name: string; slug: string; city: string | null }>;
}

/* =============================================================================
 * Host-side helpers (Slice 3) — used by the event create/edit form.
 *
 * These do NOT bypass RLS. They use the regular server supabase client so
 * `spots_select_public` and `spots_insert_host_eligible` policies apply.
 * Safe to call from non-admin server contexts.
 * ============================================================================= */

/**
 * Light Spot shape used by the picker — keeps payload small. Includes only
 * what the form needs to render an option and auto-fill location_text.
 */
export interface SelectableSpot {
  id: string;
  name: string;
  slug: string;
  type: SpotType;
  city: string;
  maps_url: string | null;
}

/** Spots visible to the picker: active + public + is_active=true. */
export async function listSelectableSpots(): Promise<SelectableSpot[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("library_nodes")
    .select("id, name, slug, type, city, maps_url")
    .eq("status", "active")
    .eq("is_active", true)
    .eq("visibility", "public")
    .order("name", { ascending: true })
    .limit(500);
  if (error) {
    console.error("listSelectableSpots", error);
    return [];
  }
  return (data ?? []) as SelectableSpot[];
}

/**
 * Check whether the given user is eligible to inline-create a Spot from the
 * event form. Eligibility = has hosted ≥1 event (matches the
 * `spots_insert_host_eligible` RLS policy).
 */
export async function isHostEligibleForSpotCreate(userId: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("events").select("id").eq("host_id", userId).limit(1);
  if (error) {
    console.error("isHostEligibleForSpotCreate", error);
    return false;
  }
  return (data ?? []).length > 0;
}

/**
 * Minimal payload accepted from the host inline-create form.
 */
export interface HostSpotCreateInput {
  name: string;
  type: SpotType;
  city: string;
  maps_url?: string;
}

/**
 * Server-side host inline-create. Uses the regular server client so RLS
 * `spots_insert_host_eligible` policy enforces the host-event requirement.
 * Called from POST /api/events/host-spot.
 */
export async function createSpotAsHost(
  userId: string,
  input: HostSpotCreateInput
): Promise<{ ok: true; id: string; slug: string; name: string; city: string } | { error: string }> {
  const name = input.name.trim();
  if (name.length < 3 || name.length > 140) return { error: "Nama harus 3–140 karakter." };
  const city = input.city.trim();
  if (city.length < 1 || city.length > 120) return { error: "Kota harus 1–120 karakter." };

  // Pick a slug. Append a short suffix until we find a free one (cap 5 tries).
  const base = slugify(name) || "spot";
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!SLUG_REGEX.test(slug)) break;
    if (!(await isSlugTaken(slug))) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  if (!SLUG_REGEX.test(slug)) return { error: "Tidak bisa menentukan slug yang valid." };

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("library_nodes")
    .insert({
      name,
      slug,
      type: input.type,
      city,
      maps_url: input.maps_url?.trim() || null,
      // Server-controlled defaults; status=needs_audit & is_active=true are
      // the DB defaults so we don't even send them. The host cannot pre-promote.
      created_by: userId,
    })
    .select("id, slug, name, city")
    .single();

  if (error) {
    console.error("createSpotAsHost", error);
    return { error: error.message };
  }
  const row = data as { id: string; slug: string; name: string; city: string };
  return { ok: true, id: row.id, slug: row.slug, name: row.name, city: row.city };
}

/* =============================================================================
 * Public-facing reads (Slice 3 — public /spots and /spots/[slug] pages).
 * Use the regular server client so RLS `spots_select_public` policy filters
 * (only active + public + is_active=true rows visible to anon).
 * ============================================================================= */

const PUBLIC_SPOT_COLUMNS = `id, name, slug, type, city, address, latitude, longitude, maps_url, description, image_url, operating_hours, community_id, status, is_active, visibility, created_by, created_at, updated_at`;

/** Public Spot listing with optional filters. Anon-safe — RLS gates rows. */
export async function listPublicSpots(opts?: {
  type?: SpotType | "all";
  search?: string;
}): Promise<Spot[]> {
  const supabase = await createServerClient();
  let q = supabase
    .from("library_nodes")
    .select(PUBLIC_SPOT_COLUMNS)
    // RLS already restricts to active+public+is_active=true for anon, but we
    // re-state here to be explicit + defensive for authed-but-non-admin readers
    // (whose RLS branch also exposes their own rows).
    .eq("status", "active")
    .eq("is_active", true)
    .eq("visibility", "public")
    .order("name", { ascending: true })
    .limit(200);

  if (opts?.type && opts.type !== "all") q = q.eq("type", opts.type);
  if (opts?.search && opts.search.trim()) {
    const s = opts.search.trim();
    q = q.or(`name.ilike.%${s}%,city.ilike.%${s}%,description.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("listPublicSpots", error);
    return [];
  }
  return (data ?? []) as unknown as Spot[];
}

/** Public Spot detail by slug. Returns null for unknown / hidden Spots. */
export async function getSpotBySlug(slug: string): Promise<Spot | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("library_nodes")
    .select(PUBLIC_SPOT_COLUMNS)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_active", true)
    .eq("visibility", "public")
    .maybeSingle();
  if (error) {
    console.error("getSpotBySlug", error);
    return null;
  }
  return (data as unknown as Spot) ?? null;
}

/** Distinct city list for the public /spots filter row. */
export async function listSpotCities(): Promise<string[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("library_nodes")
    .select("city")
    .eq("status", "active")
    .eq("is_active", true)
    .eq("visibility", "public");
  if (error) {
    console.error("listSpotCities", error);
    return [];
  }
  const set = new Set<string>();
  for (const r of data ?? []) {
    const c = (r as { city: string }).city?.trim();
    if (c) set.add(c);
  }
  return Array.from(set).sort();
}

/* =============================================================================
 * Map loader (Collective Maps / Slice 3). Returns a display-safe, coord-bearing
 * subset for /peta pins. RLS-safe server client only — never service-role on
 * the public map. Projects only display-safe columns (no created_by, no
 * community_id, no operating_hours), exact public-place coordinates.
 * ============================================================================= */

/** Display-safe Spot shape for the /peta map. Coordinates are guaranteed non-null. */
export interface SpotForMap {
  id: string;
  name: string;
  slug: string;
  type: SpotType;
  city: string | null;
  image_url: string | null;
  description: string | null;
  maps_url: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Active, public, coord-bearing Spots for the map. Mirrors `listPublicSpots`
 * gating (status=active AND is_active AND visibility=public) plus a NOT NULL
 * coordinate filter, and projects only display-safe fields. Fails soft — a
 * query error logs server-side and yields an empty layer, never a thrown page.
 */
export async function listSpotsForMap(): Promise<SpotForMap[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("library_nodes")
    .select("id, name, slug, type, city, image_url, description, maps_url, latitude, longitude")
    .eq("status", "active")
    .eq("is_active", true)
    .eq("visibility", "public")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(500);

  if (error || !data) {
    if (error) console.error("listSpotsForMap", error);
    return [];
  }

  return (data as Array<Record<string, unknown>>).flatMap((r) => {
    const latitude = Number(r.latitude);
    const longitude = Number(r.longitude);
    // Defensive: the NOT NULL filter can't catch a non-numeric value, and a row
    // could lose coords between filter and read. Keeps `latitude/longitude:
    // number` honest by dropping anything non-finite.
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const description = (r.description as string | null) ?? null;
    return [
      {
        id: r.id as string,
        name: r.name as string,
        slug: r.slug as string,
        type: r.type as SpotType,
        city: (r.city as string | null) ?? null,
        image_url: (r.image_url as string | null) ?? null,
        description:
          description && description.length > 160 ? `${description.slice(0, 159)}…` : description,
        maps_url: (r.maps_url as string | null) ?? null,
        latitude,
        longitude,
      },
    ];
  });
}

/**
 * Upcoming public events at a given Spot. Reused on /spots/[slug] to render
 * the "Event mendatang" section. Joins host minimally so we can render a
 * compact event card without re-fetching profiles separately.
 */
export interface SpotUpcomingEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  is_online: boolean;
  cover_url: string | null;
  host: { full_name: string | null; username: string | null } | null;
}

export async function listUpcomingEventsForSpot(
  nodeId: string,
  limit = 8
): Promise<SpotUpcomingEvent[]> {
  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, title, starts_at, ends_at, timezone, is_online, cover_url,
       host:profiles_public!events_host_id_fkey(full_name, username)`
    )
    .eq("node_id", nodeId)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .in("status", ["scheduled"])
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("listUpcomingEventsForSpot", error);
    return [];
  }
  type Row = {
    host: unknown;
  } & Record<string, unknown>;
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    host: Array.isArray(r.host) ? ((r.host[0] as never) ?? null) : (r.host as never),
  })) as unknown as SpotUpcomingEvent[];
}

/** Re-export raw row type for convenience. */
export type { LibraryNode };
