import { createAdminClient } from "@/lib/supabase/admin";

const THIRTY_DAYS_MS = 30 * 86400 * 1000;

export interface ContributorRow {
  user_id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  event_count: number;
}

export interface OwnerRow {
  user_id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
  book_count: number;
}

export interface AreaRow {
  city: string;
  area: string | null;
  member_count: number;
}

export interface InterestCount {
  slug: string;
  count: number;
}

/** Top contributors by activity_log event count over a 30-day window. */
export async function topContributors(limit = 10): Promise<ContributorRow[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const { data: events } = await supabase
    .from("activity_log")
    .select("actor_user_id")
    .gte("created_at", since);
  if (!events || events.length === 0) return [];

  const counts = new Map<string, number>();
  for (const e of events as { actor_user_id: string }[]) {
    counts.set(e.actor_user_id, (counts.get(e.actor_user_id) ?? 0) + 1);
  }
  const ids = Array.from(counts.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, photo_url")
    .in("id", ids);

  const byId = new Map<string, { full_name: string | null; username: string | null; photo_url: string | null }>();
  for (const p of (profiles ?? []) as { id: string; full_name: string | null; username: string | null; photo_url: string | null }[]) {
    byId.set(p.id, { full_name: p.full_name, username: p.username, photo_url: p.photo_url });
  }

  return Array.from(counts.entries())
    .map(([user_id, count]) => ({
      user_id,
      full_name: byId.get(user_id)?.full_name ?? null,
      username: byId.get(user_id)?.username ?? null,
      photo_url: byId.get(user_id)?.photo_url ?? null,
      event_count: count,
    }))
    .sort((a, b) => b.event_count - a.event_count)
    .slice(0, limit);
}

/** Top book owners by total books listed. */
export async function topOwners(limit = 10): Promise<OwnerRow[]> {
  const supabase = createAdminClient();
  const { data: books } = await supabase.from("books").select("owner_id");
  if (!books || books.length === 0) return [];

  const counts = new Map<string, number>();
  for (const b of books as { owner_id: string }[]) {
    counts.set(b.owner_id, (counts.get(b.owner_id) ?? 0) + 1);
  }
  const ids = Array.from(counts.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, photo_url")
    .in("id", ids);

  const byId = new Map<string, { full_name: string | null; username: string | null; photo_url: string | null }>();
  for (const p of (profiles ?? []) as { id: string; full_name: string | null; username: string | null; photo_url: string | null }[]) {
    byId.set(p.id, { full_name: p.full_name, username: p.username, photo_url: p.photo_url });
  }

  return Array.from(counts.entries())
    .map(([user_id, count]) => ({
      user_id,
      full_name: byId.get(user_id)?.full_name ?? null,
      username: byId.get(user_id)?.username ?? null,
      photo_url: byId.get(user_id)?.photo_url ?? null,
      book_count: count,
    }))
    .sort((a, b) => b.book_count - a.book_count)
    .slice(0, limit);
}

/** Geographic spread — members per city/area. */
export async function areaSpread(limit = 20): Promise<AreaRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("city, address_area")
    .not("city", "is", null);
  if (!data) return [];
  const map = new Map<string, AreaRow>();
  for (const row of data as { city: string | null; address_area: string | null }[]) {
    if (!row.city) continue;
    const city = row.city.trim();
    const area = row.address_area?.trim() || null;
    const key = `${city}::${area ?? ""}`;
    const existing = map.get(key);
    if (existing) existing.member_count += 1;
    else map.set(key, { city, area, member_count: 1 });
  }
  return Array.from(map.values())
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, limit);
}

/** Tally interest slugs across profiles (Layer 1 broad). */
export async function interestCounts(): Promise<InterestCount[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("interests");
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const row of data as { interests: string[] | null }[]) {
    for (const slug of row.interests ?? []) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

/** Tally intent slugs across profiles (Layer 3). */
export async function intentCounts(): Promise<InterestCount[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("intents");
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const row of data as { intents: string[] | null }[]) {
    for (const slug of row.intents ?? []) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}
