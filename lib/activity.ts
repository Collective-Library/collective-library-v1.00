import { createClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/types";

export type ActivityType =
  | "USER_JOINED"
  | "BOOK_ADDED"
  | "BOOK_STATUS_CHANGED"
  | "WTB_POSTED";

export interface ActivityActor {
  id: string;
  full_name: string | null;
  username: string | null;
  photo_url: string | null;
}

export interface ActivityBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  status: BookStatus;
}

export interface ActivityWanted {
  id: string;
  title: string;
  author: string | null;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  created_at: string;
  metadata: { old_status?: BookStatus; new_status?: BookStatus } | null;
  actor: ActivityActor | null;
  book: ActivityBook | null;
  wanted: ActivityWanted | null;
}

const SELECT = `
  id, type, created_at, metadata,
  actor:profiles_public!actor_user_id(id, full_name, username, photo_url),
  book:books(id, title, author, cover_url, status),
  wanted:wanted_requests(id, title, author)
`;

/**
 * Reads the unified activity feed from public.activity_log.
 * Optional `interest` filter narrows to events whose actor has that interest slug.
 */
export async function listActivity(
  limitOrOpts: number | { limit?: number; interest?: string } = 50,
): Promise<ActivityItem[]> {
  const opts =
    typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts;
  const limit = opts.limit ?? 50;

  const supabase = await createClient();

  let actorIds: string[] | null = null;
  if (opts.interest) {
    const { data: matchingProfiles } = await supabase
      .from("profiles_public")
      .select("id")
      .contains("interests", [opts.interest]);
    actorIds = (matchingProfiles ?? []).map((p) => p.id as string);
    if (actorIds.length === 0) return [];
  }

  let query = supabase
    .from("activity_log")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (actorIds) {
    query = query.in("actor_user_id", actorIds);
  }
  const { data, error } = await query;

  if (error) {
    console.error("listActivity", error);
    return [];
  }

  type Row = {
    id: string;
    type: ActivityType;
    created_at: string;
    metadata: ActivityItem["metadata"];
    actor: ActivityActor | ActivityActor[] | null;
    book: ActivityBook | ActivityBook[] | null;
    wanted: ActivityWanted | ActivityWanted[] | null;
  };

  // Supabase types embedded relations as arrays; flatten to single object.
  const flatten = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? v[0] ?? null : v;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    type: r.type,
    created_at: r.created_at,
    metadata: r.metadata,
    actor: flatten(r.actor),
    book: flatten(r.book),
    wanted: flatten(r.wanted),
  }));
}
