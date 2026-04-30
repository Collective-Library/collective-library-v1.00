import { createClient } from "@/lib/supabase/server";
import type { WantedRequestWithRequester } from "@/types";

const REQUESTER_SELECT = `id, full_name, username, photo_url, city, whatsapp, whatsapp_public, instagram, discord, goodreads_url, storygraph_url`;

// Explicit columns for the WTB card list — what WantedCard actually renders.
// Avoids select(*) overfetch.
const WANTED_LIST_COLUMNS = `id, requester_id, title, author, cover_url, max_budget, desired_condition, city, notes, status, created_at`;

/** List open WTB requests, newest first. */
export async function listWantedRequests(opts?: {
  limit?: number;
  status?: "open" | "fulfilled" | "closed";
}): Promise<WantedRequestWithRequester[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wanted_requests")
    .select(`${WANTED_LIST_COLUMNS}, requester:profiles_public!wanted_requests_requester_id_fkey(${REQUESTER_SELECT})`)
    .eq("status", opts?.status ?? "open")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 60);

  if (error) {
    console.error("listWantedRequests", error);
    return [];
  }
  return (data ?? []) as unknown as WantedRequestWithRequester[];
}

/** Fetch one WTB request — DETAIL view uses all fields, keep `*`. */
export async function getWantedById(id: string): Promise<WantedRequestWithRequester | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wanted_requests")
    .select(`*, requester:profiles_public!wanted_requests_requester_id_fkey(${REQUESTER_SELECT})`)
    .eq("id", id)
    .maybeSingle();
  return data as unknown as WantedRequestWithRequester | null;
}
