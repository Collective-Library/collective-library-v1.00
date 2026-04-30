import { createAdminClient } from "@/lib/supabase/admin";

/** Inline mirror of types/index.ts:isProfileComplete — keeps this module
 *  decoupled from the full Profile shape (we only need 6 columns). */
function isCompleteRow(row: {
  username: string | null;
  instagram: string | null;
  whatsapp: string | null;
  discord: string | null;
  goodreads_url: string | null;
  storygraph_url: string | null;
}): boolean {
  if (!row.username) return false;
  return Boolean(
    row.instagram || row.whatsapp || row.discord || row.goodreads_url || row.storygraph_url,
  );
}

/**
 * Auto-compute registry for OKR Key Results. Each entry's key matches the
 * `auto_compute_key` column on `okr_key_results`. The function returns the
 * KR's `current_value` resolved live from app data.
 *
 * Uses the service-role client so reads bypass RLS — caller must ensure
 * an admin gate is upstream (every Mastermind page calls requireAdmin()).
 */

export type AutoComputeKey =
  | "members_total"
  | "members_with_complete_profile"
  | "members_with_complete_profile_pct"
  | "weekly_active_members"
  | "books_total"
  | "books_with_owner_pct"
  | "members_with_at_least_one_book_pct"
  | "wanted_open_count"
  | "task_owned_pct"
  | "activity_book_linked_pct"
  | "app_live";

const SEVEN_DAYS_MS = 7 * 86400 * 1000;

export const AUTO_COMPUTE_KEYS: AutoComputeKey[] = [
  "members_total",
  "members_with_complete_profile",
  "members_with_complete_profile_pct",
  "weekly_active_members",
  "books_total",
  "books_with_owner_pct",
  "members_with_at_least_one_book_pct",
  "wanted_open_count",
  "task_owned_pct",
  "activity_book_linked_pct",
  "app_live",
];

export async function computeKr(key: string): Promise<number> {
  const supabase = createAdminClient();

  switch (key as AutoComputeKey) {
    case "members_total": {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    }

    case "members_with_complete_profile": {
      const { data } = await supabase
        .from("profiles")
        .select("username, instagram, whatsapp, discord, goodreads_url, storygraph_url");
      type Row = {
        username: string | null;
        instagram: string | null;
        whatsapp: string | null;
        discord: string | null;
        goodreads_url: string | null;
        storygraph_url: string | null;
      };
      return ((data ?? []) as Row[]).filter(isCompleteRow).length;
    }

    case "members_with_complete_profile_pct": {
      const [{ count: total }, completeCount] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        computeKr("members_with_complete_profile"),
      ]);
      const t = total ?? 0;
      return t === 0 ? 0 : Math.round((completeCount / t) * 100);
    }

    case "weekly_active_members": {
      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
      const { data } = await supabase
        .from("activity_log")
        .select("actor_user_id")
        .gte("created_at", sevenDaysAgo);
      const distinct = new Set((data ?? []).map((r) => r.actor_user_id as string));
      return distinct.size;
    }

    case "books_total": {
      const { count } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    }

    case "books_with_owner_pct": {
      // owner_id is NOT NULL by schema, but we still verify the FK target
      // exists (handle dangling refs from any prior data weirdness)
      const { data: books } = await supabase
        .from("books")
        .select("id, owner_id");
      if (!books || books.length === 0) return 0;
      const ownerIds = Array.from(new Set(books.map((b) => b.owner_id as string)));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .in("id", ownerIds);
      const liveOwners = new Set((profiles ?? []).map((p) => p.id as string));
      const withLiveOwner = books.filter((b) => liveOwners.has(b.owner_id as string));
      return Math.round((withLiveOwner.length / books.length) * 100);
    }

    case "members_with_at_least_one_book_pct": {
      const [{ count: total }, { data: books }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("books").select("owner_id"),
      ]);
      const t = total ?? 0;
      if (t === 0) return 0;
      const distinctOwners = new Set((books ?? []).map((b) => b.owner_id as string));
      return Math.round((distinctOwners.size / t) * 100);
    }

    case "wanted_open_count": {
      const { count } = await supabase
        .from("wanted_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      return count ?? 0;
    }

    case "task_owned_pct": {
      const [{ count: total }, { count: owned }] = await Promise.all([
        supabase.from("team_tasks").select("*", { count: "exact", head: true }),
        supabase
          .from("team_tasks")
          .select("*", { count: "exact", head: true })
          .not("owner_id", "is", null),
      ]);
      const t = total ?? 0;
      if (t === 0) return 0;
      return Math.round(((owned ?? 0) / t) * 100);
    }

    case "activity_book_linked_pct": {
      // Activity events that reference a book directly
      // (BOOK_ADDED + BOOK_STATUS_CHANGED). Excludes USER_JOINED + WTB_POSTED.
      const [{ count: total }, { count: bookLinked }] = await Promise.all([
        supabase.from("activity_log").select("*", { count: "exact", head: true }),
        supabase
          .from("activity_log")
          .select("*", { count: "exact", head: true })
          .in("type", ["BOOK_ADDED", "BOOK_STATUS_CHANGED"]),
      ]);
      const t = total ?? 0;
      if (t === 0) return 0;
      return Math.round(((bookLinked ?? 0) / t) * 100);
    }

    case "app_live": {
      // Production marker — the web app being live & in use is itself the signal.
      // This will report 1 (target met) once at least one BOOK_ADDED event exists.
      const { count } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("type", "BOOK_ADDED");
      return (count ?? 0) > 0 ? 1 : 0;
    }

    default:
      return 0;
  }
}

/** Bulk-compute a list of KR keys in parallel. Returns a Map<key, value>. */
export async function computeKrBatch(keys: string[]): Promise<Map<string, number>> {
  const unique = Array.from(new Set(keys));
  const results = await Promise.all(unique.map((k) => computeKr(k).catch(() => 0)));
  const map = new Map<string, number>();
  unique.forEach((k, i) => map.set(k, results[i]));
  return map;
}
