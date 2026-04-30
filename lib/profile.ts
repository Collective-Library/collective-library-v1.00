import { createClient } from "@/lib/supabase/server";
import type { Community, Profile } from "@/types";

/** Get a profile by username. Uses the public view (whatsapp masked unless public/self). */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles_public")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return data as Profile | null;
}

/** Check if a username is available (case-insensitive). */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const supabase = await createClient();
  let q = supabase.from("profiles_public").select("id").ilike("username", username);
  if (excludeUserId) q = q.neq("id", excludeUserId);
  const { data } = await q.limit(1);
  return !data || data.length === 0;
}

/** Member-directory row — slim shape, no whatsapp. */
export interface MemberSummary {
  id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  city: string | null;
  address_area: string | null;
  bio: string | null;
  profession: string | null;
  campus_or_workplace: string | null;
  interests: string[] | null;
  intents: string[] | null;
  open_for_lending: boolean;
  open_for_selling: boolean;
  open_for_trade: boolean;
  created_at: string;
  book_count: number;
}

/**
 * List members for the directory page. Filters: interest slug, city, and
 * "open for" preferences (lending/selling/trade).
 *
 * Joins books count via a separate query (PostgREST count-aggregate is heavy
 * for this shape; two queries keeps it predictable).
 */
/**
 * Returns distinct city/area pairs from profiles_public for filter pills.
 * Aggregated client-side — small dataset for first 100s of users; if it
 * grows past 1k profiles, replace with an SQL aggregate.
 */
export interface AreaOption {
  city: string;
  area: string | null;
  member_count: number;
}

export async function listAreas(): Promise<AreaOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles_public")
    .select("city, address_area")
    .not("username", "is", null)
    .not("city", "is", null);
  if (error || !data) return [];

  const map = new Map<string, AreaOption>();
  for (const row of data) {
    const city = ((row.city as string) ?? "").trim();
    if (!city) continue;
    const area = ((row.address_area as string | null) ?? "").trim() || null;
    const key = `${city}::${area ?? ""}`;
    const existing = map.get(key);
    if (existing) existing.member_count++;
    else map.set(key, { city, area, member_count: 1 });
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      b.member_count - a.member_count ||
      a.city.localeCompare(b.city) ||
      (a.area ?? "").localeCompare(b.area ?? ""),
  );
}

export async function listMembers(opts?: {
  interest?: string;
  intent?: string;
  city?: string;
  area?: string;
  openFor?: "lending" | "selling" | "trade";
  limit?: number;
}): Promise<MemberSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles_public")
    .select(
      "id, full_name, username, photo_url, city, address_area, bio, profession, campus_or_workplace, interests, intents, open_for_lending, open_for_selling, open_for_trade, created_at",
    )
    .not("username", "is", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 60);

  if (opts?.interest) {
    query = query.contains("interests", [opts.interest]);
  }
  if (opts?.intent) {
    query = query.contains("intents", [opts.intent]);
  }
  if (opts?.city) {
    query = query.ilike("city", opts.city);
  }
  if (opts?.area) {
    query = query.ilike("address_area", opts.area);
  }
  if (opts?.openFor === "lending") query = query.eq("open_for_lending", true);
  if (opts?.openFor === "selling") query = query.eq("open_for_selling", true);
  if (opts?.openFor === "trade") query = query.eq("open_for_trade", true);

  const { data: profiles, error } = await query;
  if (error) {
    console.error("listMembers", error);
    return [];
  }

  // Book counts per owner — single roundtrip
  const ids = (profiles ?? []).map((p) => p.id);
  let countMap: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: books } = await supabase
      .from("books")
      .select("owner_id")
      .in("owner_id", ids)
      .eq("is_hidden", false)
      .eq("visibility", "public");
    countMap = (books ?? []).reduce<Record<string, number>>((acc, b) => {
      acc[b.owner_id as string] = (acc[b.owner_id as string] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (profiles ?? []).map((p) => ({
    ...(p as Omit<MemberSummary, "book_count">),
    book_count: countMap[p.id as string] ?? 0,
  }));
}

/**
 * Member shape for the community map (/peta). Includes coords + a few book
 * cover URLs for the popup preview. Only members with show_on_map=true AND
 * resolved coordinates are returned.
 */
export interface MapMember {
  id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  city: string | null;
  address_area: string | null;
  bio: string | null;
  profession: string | null;
  interests: string[] | null;
  open_for_lending: boolean;
  open_for_selling: boolean;
  open_for_trade: boolean;
  map_lat: number;
  map_lng: number;
  book_count: number;
  book_covers: string[];
}

export async function listMembersForMap(): Promise<MapMember[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles_public")
    .select(
      "id, full_name, username, photo_url, city, address_area, bio, profession, interests, open_for_lending, open_for_selling, open_for_trade, map_lat, map_lng",
    )
    .eq("show_on_map", true)
    .not("map_lat", "is", null)
    .not("map_lng", "is", null)
    .not("username", "is", null);

  if (error || !profiles) {
    if (error) console.error("listMembersForMap", error);
    return [];
  }

  const ids = profiles.map((p) => p.id as string);
  if (ids.length === 0) return [];

  // Fetch up to 4 covers per owner in a single query, then bucket client-side.
  const { data: books } = await supabase
    .from("books")
    .select("owner_id, cover_url, created_at")
    .in("owner_id", ids)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(ids.length * 8); // headroom; we'll cap to 4 per owner below

  const coversByOwner = new Map<string, string[]>();
  const countByOwner = new Map<string, number>();
  for (const b of books ?? []) {
    const owner = b.owner_id as string;
    countByOwner.set(owner, (countByOwner.get(owner) ?? 0) + 1);
    const arr = coversByOwner.get(owner) ?? [];
    if (arr.length < 4 && b.cover_url) arr.push(b.cover_url as string);
    coversByOwner.set(owner, arr);
  }

  return profiles.map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string | null) ?? null,
    username: (p.username as string | null) ?? null,
    photo_url: (p.photo_url as string | null) ?? null,
    city: (p.city as string | null) ?? null,
    address_area: (p.address_area as string | null) ?? null,
    bio: (p.bio as string | null) ?? null,
    profession: (p.profession as string | null) ?? null,
    interests: (p.interests as string[] | null) ?? null,
    open_for_lending: Boolean(p.open_for_lending),
    open_for_selling: Boolean(p.open_for_selling),
    open_for_trade: Boolean(p.open_for_trade),
    map_lat: p.map_lat as number,
    map_lng: p.map_lng as number,
    book_count: countByOwner.get(p.id as string) ?? 0,
    book_covers: coversByOwner.get(p.id as string) ?? [],
  }));
}

/**
 * Members visible on the public landing page. Uses the same opt-in flag as
 * /peta (`show_on_map`), so the toggle gates BOTH surfaces — one consent
 * line covers both. Unlike `listMembersForMap`, we don't require coords:
 * a member can be on the landing strip even if geocoding hasn't resolved.
 */
export interface LandingMember {
  id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  city: string | null;
  address_area: string | null;
  profession: string | null;
  book_count: number;
  book_covers: string[];
}

export async function listLandingMembers(limit = 12): Promise<LandingMember[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles_public")
    .select(
      "id, full_name, username, photo_url, city, address_area, profession, updated_at",
    )
    .eq("show_on_map", true)
    .not("username", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !profiles) {
    if (error) console.error("listLandingMembers", error);
    return [];
  }

  const ids = profiles.map((p) => p.id as string);
  if (ids.length === 0) return [];

  // Fetch covers — one trip, bucket client-side (cap 3 per owner)
  const { data: books } = await supabase
    .from("books")
    .select("owner_id, cover_url, created_at")
    .in("owner_id", ids)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(ids.length * 6);

  const coversByOwner = new Map<string, string[]>();
  const countByOwner = new Map<string, number>();
  for (const b of books ?? []) {
    const owner = b.owner_id as string;
    countByOwner.set(owner, (countByOwner.get(owner) ?? 0) + 1);
    const arr = coversByOwner.get(owner) ?? [];
    if (arr.length < 3 && b.cover_url) arr.push(b.cover_url as string);
    coversByOwner.set(owner, arr);
  }

  return profiles.map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string | null) ?? null,
    username: (p.username as string | null) ?? null,
    photo_url: (p.photo_url as string | null) ?? null,
    city: (p.city as string | null) ?? null,
    address_area: (p.address_area as string | null) ?? null,
    profession: (p.profession as string | null) ?? null,
    book_count: countByOwner.get(p.id as string) ?? 0,
    book_covers: coversByOwner.get(p.id as string) ?? [],
  }));
}

/** Fetch the communities a user belongs to. */
export async function getProfileCommunities(
  userId: string,
): Promise<Pick<Community, "id" | "name" | "slug">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community:communities(id, name, slug)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  // Each row is { community: {...} } — Supabase types this as an array even
  // for to-one relations, so cast through unknown and normalize either shape.
  type Row = { community: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null };
  const rows = (data ?? []) as unknown as Row[];
  return rows
    .map((row) => (Array.isArray(row.community) ? row.community[0] ?? null : row.community))
    .filter((c): c is { id: string; name: string; slug: string } => c !== null);
}
