import { createAdminClient } from "@/lib/supabase/admin";
import { computeKr } from "./kr-compute";

/**
 * Mission Control metric aggregates. Service-role queries because the
 * dashboard needs cross-RLS reads (e.g. all profiles, audit_log).
 *
 * Modeled after lib/stats.ts — Promise.all of cheap HEAD-only counts where
 * possible. If a metric requires materializing rows, we keep the projection
 * tight.
 */

export interface MissionControlMetrics {
  // People
  totalMembers: number;
  newMembersThisWeek: number;
  completedProfiles: number;
  incompleteProfiles: number;
  membersWithBook: number;
  weeklyActiveMembers: number;
  // Books
  totalBooks: number;
  booksAvailable: number; // status in (sell, lend, trade)
  booksUnavailable: number;
  booksMissingCover: number;
  // Requests
  wantedOpen: number;
  wantedFulfilled: number;
  wantedClosed: number;
  // Activity
  activityLast7d: number;
  activityLast30d: number;
  // Data health (top-line)
  feedbackOpen: number;       // status='new' or 'triaged'
  auditEventsLast7d: number;
  // Tasks
  tasksTotal: number;
  tasksDone: number;
  tasksBlocked: number;
  tasksOwnedPct: number;
  // Geographic
  distinctCities: number;
  distinctAreas: number;
}

const SEVEN_DAYS_MS = 7 * 86400 * 1000;
const THIRTY_DAYS_MS = 30 * 86400 * 1000;

export async function getMissionControl(): Promise<MissionControlMetrics> {
  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const [
    membersTotal,
    newMembersWeek,
    completedCount,
    membersWithBook,
    weeklyActive,
    booksTotal,
    booksAvailable,
    booksUnavailable,
    booksMissingCover,
    wantedOpen,
    wantedFulfilled,
    wantedClosed,
    activity7d,
    activity30d,
    feedbackOpen,
    audit7d,
    tasksTotal,
    tasksDone,
    tasksBlocked,
    tasksOwnedPct,
    citiesData,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    computeKr("members_with_complete_profile"),
    computeKr("members_with_at_least_one_book_pct").then(async (pct) => {
      // Convert % → absolute count for display
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return Math.round(((count ?? 0) * pct) / 100);
    }),
    computeKr("weekly_active_members"),
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .in("status", ["sell", "lend", "trade"]),
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("status", "unavailable"),
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .is("cover_url", null),
    supabase
      .from("wanted_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("wanted_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "fulfilled"),
    supabase
      .from("wanted_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "closed"),
    supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "triaged"]),
    supabase
      .from("audit_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("team_tasks").select("*", { count: "exact", head: true }),
    supabase
      .from("team_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "done"),
    supabase
      .from("team_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "blocked"),
    computeKr("task_owned_pct"),
    supabase.from("profiles").select("city, address_area").not("city", "is", null),
  ]);

  const total = membersTotal.count ?? 0;
  const cities = new Set<string>();
  const areas = new Set<string>();
  for (const row of (citiesData.data ?? []) as { city: string | null; address_area: string | null }[]) {
    if (row.city) cities.add(row.city.toLowerCase().trim());
    if (row.city && row.address_area) {
      areas.add(`${row.city.toLowerCase().trim()}::${row.address_area.toLowerCase().trim()}`);
    }
  }

  return {
    totalMembers: total,
    newMembersThisWeek: newMembersWeek.count ?? 0,
    completedProfiles: completedCount,
    incompleteProfiles: Math.max(0, total - completedCount),
    membersWithBook,
    weeklyActiveMembers: weeklyActive,
    totalBooks: booksTotal.count ?? 0,
    booksAvailable: booksAvailable.count ?? 0,
    booksUnavailable: booksUnavailable.count ?? 0,
    booksMissingCover: booksMissingCover.count ?? 0,
    wantedOpen: wantedOpen.count ?? 0,
    wantedFulfilled: wantedFulfilled.count ?? 0,
    wantedClosed: wantedClosed.count ?? 0,
    activityLast7d: activity7d.count ?? 0,
    activityLast30d: activity30d.count ?? 0,
    feedbackOpen: feedbackOpen.count ?? 0,
    auditEventsLast7d: audit7d.count ?? 0,
    tasksTotal: tasksTotal.count ?? 0,
    tasksDone: tasksDone.count ?? 0,
    tasksBlocked: tasksBlocked.count ?? 0,
    tasksOwnedPct,
    distinctCities: cities.size,
    distinctAreas: areas.size,
  };
}
