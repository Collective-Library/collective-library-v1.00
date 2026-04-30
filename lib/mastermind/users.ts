import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types";
import { profileCompletionScore, memberPotentialScore, type ScoreBreakdown } from "./scoring";

const THIRTY_DAYS_MS = 30 * 86400 * 1000;

export interface AdminMemberRow {
  profile: Profile;
  bookCount: number;
  activityLast30d: number;
  completion: ScoreBreakdown;
  potential: ScoreBreakdown;
}

export interface ListMembersAdminOpts {
  search?: string;
  filter?: "all" | "complete" | "incomplete" | "no-book" | "no-photo" | "admin" | "dormant";
  city?: string;
  area?: string;
  sort?: "newest" | "oldest" | "potential" | "books" | "activity";
  limit?: number;
}

/** Admin-only listing of all members. Uses service-role to bypass profiles
 *  RLS (which restricts SELECT to own row only). */
export async function listMembersAdmin(opts: ListMembersAdminOpts = {}): Promise<AdminMemberRow[]> {
  const supabase = createAdminClient();
  const limit = Math.max(1, Math.min(opts.limit ?? 200, 500));

  let query = supabase.from("profiles").select("*").limit(limit);

  if (opts.search) {
    const s = opts.search.replace(/[%_]/g, "");
    query = query.or(
      `full_name.ilike.%${s}%,username.ilike.%${s}%,instagram.ilike.%${s}%,whatsapp.ilike.%${s}%,city.ilike.%${s}%`,
    );
  }
  if (opts.city) query = query.ilike("city", opts.city);
  if (opts.area) query = query.ilike("address_area", opts.area);
  if (opts.filter === "admin") query = query.eq("is_admin", true);
  if (opts.filter === "no-photo") query = query.is("photo_url", null);

  switch (opts.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("listMembersAdmin", error);
    return [];
  }

  const profiles = (data ?? []) as Profile[];
  if (profiles.length === 0) return [];

  // Two parallel reads: book counts + recent activity counts
  const ids = profiles.map((p) => p.id);
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const [booksRes, activityRes] = await Promise.all([
    supabase.from("books").select("owner_id").in("owner_id", ids),
    supabase
      .from("activity_log")
      .select("actor_user_id")
      .in("actor_user_id", ids)
      .gte("created_at", thirtyDaysAgo),
  ]);

  const bookCountByOwner = new Map<string, number>();
  for (const b of (booksRes.data ?? []) as { owner_id: string }[]) {
    bookCountByOwner.set(b.owner_id, (bookCountByOwner.get(b.owner_id) ?? 0) + 1);
  }
  const activityByActor = new Map<string, number>();
  for (const a of (activityRes.data ?? []) as { actor_user_id: string }[]) {
    activityByActor.set(a.actor_user_id, (activityByActor.get(a.actor_user_id) ?? 0) + 1);
  }

  let rows: AdminMemberRow[] = profiles.map((p) => {
    const bookCount = bookCountByOwner.get(p.id) ?? 0;
    const activityLast30d = activityByActor.get(p.id) ?? 0;
    return {
      profile: p,
      bookCount,
      activityLast30d,
      completion: profileCompletionScore(p),
      potential: memberPotentialScore({ profile: p, bookCount, activityLast30d }),
    };
  });

  // Apply post-fetch filters (depend on derived metrics)
  if (opts.filter === "complete") rows = rows.filter((r) => r.completion.score >= 80);
  if (opts.filter === "incomplete") rows = rows.filter((r) => r.completion.score < 80);
  if (opts.filter === "no-book") rows = rows.filter((r) => r.bookCount === 0);
  if (opts.filter === "dormant") rows = rows.filter((r) => r.activityLast30d === 0);

  // Apply post-fetch sorts
  if (opts.sort === "potential") rows.sort((a, b) => b.potential.score - a.potential.score);
  if (opts.sort === "books") rows.sort((a, b) => b.bookCount - a.bookCount);
  if (opts.sort === "activity") rows.sort((a, b) => b.activityLast30d - a.activityLast30d);

  return rows;
}

export async function getMemberAdmin(id: string): Promise<AdminMemberRow | null> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return null;
  const p = profile as Profile;

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const [booksRes, activityRes] = await Promise.all([
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", id),
    supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("actor_user_id", id)
      .gte("created_at", thirtyDaysAgo),
  ]);

  return {
    profile: p,
    bookCount: booksRes.count ?? 0,
    activityLast30d: activityRes.count ?? 0,
    completion: profileCompletionScore(p),
    potential: memberPotentialScore({
      profile: p,
      bookCount: booksRes.count ?? 0,
      activityLast30d: activityRes.count ?? 0,
    }),
  };
}
