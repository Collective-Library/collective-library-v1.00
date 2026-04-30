import { createClient } from "@/lib/supabase/server";

export interface CommunityStats {
  total_books: number;
  total_members: number;
  total_cities: number;
  active_wanted: number;
  joined_this_week: number;
}

/**
 * Cheap aggregate stats for landing page social proof.
 * Each query uses HEAD-only counts when possible (no row payload).
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [books, members, cities, wanted, joinedThisWeek] = await Promise.all([
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("is_hidden", false)
      .eq("visibility", "public"),
    supabase
      .from("profiles_public")
      .select("*", { count: "exact", head: true })
      .not("username", "is", null),
    supabase
      .from("profiles_public")
      .select("city")
      .not("username", "is", null)
      .not("city", "is", null),
    supabase
      .from("wanted_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("type", "USER_JOINED")
      .gte("created_at", sevenDaysAgo),
  ]);

  const distinctCities = new Set(
    (cities.data ?? [])
      .map((r) => (r.city as string)?.toLowerCase().trim())
      .filter(Boolean),
  );

  return {
    total_books: books.count ?? 0,
    total_members: members.count ?? 0,
    total_cities: distinctCities.size,
    active_wanted: wanted.count ?? 0,
    joined_this_week: joinedThisWeek.count ?? 0,
  };
}
