import { createAdminClient } from "@/lib/supabase/admin";
import type { SignalMetric } from "@/types";

/**
 * Count the current value of a single metric for a user.
 * All queries use the service-role client so we can read feedback + signal_rules
 * without public RLS policies. Returns 0 on any DB error (degrades gracefully —
 * the engine skips the signal and the backfill sweep retries later).
 *
 * Metric semantics:
 *   any_activity       — count of real activities (SIGNAL_UNLOCKED excluded)
 *   books_added        — books owned by user, not hidden
 *   lendable_books     — current state: books with status='lend', not hidden
 *   events_hosted      — events created by user, not hidden
 *   events_rsvped      — event RSVPs with status='going'
 *   manifests_posted   — approved manifests by user
 *   wtb_posted         — wanted requests posted (any status)
 *   spots_created      — library_nodes created by user
 *   feedback_submitted — feedback rows with a user_id match
 *   referrals          — 0 (no data source yet; rule is is_active=false)
 *   curations          — 0 (no data source yet; rule is is_active=false)
 */
export async function computeMetric(userId: string, metric: SignalMetric): Promise<number> {
  const db = createAdminClient();

  try {
    switch (metric) {
      case "any_activity": {
        const { count, error } = await db
          .from("activity_log")
          .select("id", { count: "exact", head: true })
          .eq("actor_user_id", userId)
          .neq("type", "SIGNAL_UNLOCKED");
        if (error) throw error;
        return count ?? 0;
      }

      case "books_added": {
        const { count, error } = await db
          .from("books")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .eq("is_hidden", false);
        if (error) throw error;
        return count ?? 0;
      }

      case "lendable_books": {
        const { count, error } = await db
          .from("books")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", userId)
          .eq("status", "lend")
          .eq("is_hidden", false);
        if (error) throw error;
        return count ?? 0;
      }

      case "events_hosted": {
        const { count, error } = await db
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("host_id", userId)
          .eq("is_hidden", false);
        if (error) throw error;
        return count ?? 0;
      }

      case "events_rsvped": {
        const { count, error } = await db
          .from("event_rsvps")
          .select("event_id", { count: "exact", head: true })
          .eq("profile_id", userId)
          .eq("status", "going");
        if (error) throw error;
        return count ?? 0;
      }

      case "manifests_posted": {
        const { count, error } = await db
          .from("manifests")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId)
          .eq("status", "approved");
        if (error) throw error;
        return count ?? 0;
      }

      case "wtb_posted": {
        const { count, error } = await db
          .from("wanted_requests")
          .select("id", { count: "exact", head: true })
          .eq("requester_id", userId);
        if (error) throw error;
        return count ?? 0;
      }

      case "spots_created": {
        const { count, error } = await db
          .from("library_nodes")
          .select("id", { count: "exact", head: true })
          .eq("created_by", userId);
        if (error) throw error;
        return count ?? 0;
      }

      case "feedback_submitted": {
        const { count, error } = await db
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        if (error) throw error;
        return count ?? 0;
      }

      case "referrals":
      case "curations":
        return 0;

      default:
        return 0;
    }
  } catch (err) {
    console.error(`[signals/metrics] computeMetric(${metric}, ${userId}) failed`, err);
    return 0;
  }
}
