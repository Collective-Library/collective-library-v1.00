import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, WantedRequest, WantedStatus } from "@/types";

export interface AdminWantedRow {
  wanted: WantedRequest;
  requester: Pick<Profile, "id" | "full_name" | "username" | "photo_url" | "city"> | null;
}

export interface WantedAdminCounts {
  open: number;
  fulfilled: number;
  closed: number;
  total: number;
}

export async function listWantedAdmin(opts?: {
  status?: WantedStatus | "all";
  search?: string;
  limit?: number;
}): Promise<{ rows: AdminWantedRow[]; counts: WantedAdminCounts }> {
  const supabase = createAdminClient();
  const limit = Math.max(1, Math.min(opts?.limit ?? 200, 500));

  let query = supabase
    .from("wanted_requests")
    .select("*, requester:profiles!wanted_requests_requester_id_fkey(id, full_name, username, photo_url, city)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts?.status && opts.status !== "all") query = query.eq("status", opts.status);
  if (opts?.search) {
    const s = opts.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%`);
  }

  const [rowsRes, openRes, fulRes, closedRes, totalRes] = await Promise.all([
    query,
    supabase.from("wanted_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("wanted_requests").select("*", { count: "exact", head: true }).eq("status", "fulfilled"),
    supabase.from("wanted_requests").select("*", { count: "exact", head: true }).eq("status", "closed"),
    supabase.from("wanted_requests").select("*", { count: "exact", head: true }),
  ]);

  type Row = WantedRequest & {
    requester: AdminWantedRow["requester"] | AdminWantedRow["requester"][] | null;
  };
  const flatten = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  const rows: AdminWantedRow[] = ((rowsRes.data ?? []) as unknown as Row[]).map((r) => ({
    wanted: r as WantedRequest,
    requester: flatten(r.requester),
  }));

  return {
    rows,
    counts: {
      open: openRes.count ?? 0,
      fulfilled: fulRes.count ?? 0,
      closed: closedRes.count ?? 0,
      total: totalRes.count ?? 0,
    },
  };
}
