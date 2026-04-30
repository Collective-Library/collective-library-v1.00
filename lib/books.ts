import { createClient } from "@/lib/supabase/server";
import type { Book, BookStatus, BookWithOwner } from "@/types";

const OWNER_SELECT = `id, full_name, username, photo_url, city, whatsapp, whatsapp_public, instagram, discord, goodreads_url, storygraph_url`;

/** List public books for the Collective Shelf, optionally filtered by status. */
export async function listShelfBooks(opts?: {
  status?: BookStatus | "all";
  search?: string;
  limit?: number;
}): Promise<BookWithOwner[]> {
  const supabase = await createClient();
  let query = supabase
    .from("books")
    .select(`*, owner:profiles_public!books_owner_id_fkey(${OWNER_SELECT}), community:communities(id, name, slug)`)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 60);

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts?.search) {
    const s = opts.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listShelfBooks", error);
    return [];
  }
  return (data ?? []) as unknown as BookWithOwner[];
}

/**
 * Full search across title and author. Owner-based search comes when FTS lands.
 * Returns BookWithOwner[] joined with the owner profile + community.
 */
export async function searchBooks(query: string, limit = 60): Promise<BookWithOwner[]> {
  if (!query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const safe = query.trim().replace(/[%_]/g, "");
  const { data } = await supabase
    .from("books")
    .select(`*, owner:profiles_public!books_owner_id_fkey(${OWNER_SELECT}), community:communities(id, name, slug)`)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .or(`title.ilike.%${safe}%,author.ilike.%${safe}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as BookWithOwner[];
}

/** Lightweight recent-activity rows for the /shelf "Aktivitas terbaru" widget. */
export interface RecentBookActivity {
  book_id: string;
  title: string;
  cover_url: string | null;
  status: BookStatus;
  created_at: string;
  owner_id: string;
  owner_name: string | null;
  owner_username: string | null;
  owner_photo: string | null;
}

/**
 * Returns the most recent book additions for the activity feed widget.
 * Lightweight version — no event table; just `books.created_at desc` joined
 * with public profile. Upgrade to a real activity_log when traffic demands.
 */
export async function getRecentBookActivity(limit = 5): Promise<RecentBookActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select(`
      id, title, cover_url, status, created_at, owner_id,
      owner:profiles_public!books_owner_id_fkey(full_name, username, photo_url)
    `)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentBookActivity", error);
    return [];
  }
  type Row = {
    id: string;
    title: string;
    cover_url: string | null;
    status: BookStatus;
    created_at: string;
    owner_id: string;
    owner: { full_name: string | null; username: string | null; photo_url: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((b) => ({
    book_id: b.id,
    title: b.title,
    cover_url: b.cover_url,
    status: b.status,
    created_at: b.created_at,
    owner_id: b.owner_id,
    owner_name: b.owner?.full_name ?? null,
    owner_username: b.owner?.username ?? null,
    owner_photo: b.owner?.photo_url ?? null,
  }));
}

/** Counts books per status — for the shelf stats bar. */
export async function getShelfCounts(): Promise<Record<BookStatus, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("status")
    .eq("is_hidden", false)
    .eq("visibility", "public");

  const counts: Record<BookStatus, number> = { sell: 0, lend: 0, trade: 0, unavailable: 0 };
  (data ?? []).forEach((b: { status: BookStatus }) => {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  });
  return counts;
}

/** Fetch a single book + owner profile by ID. */
export async function getBookById(id: string): Promise<BookWithOwner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select(`*, owner:profiles_public!books_owner_id_fkey(${OWNER_SELECT}), community:communities(id, name, slug)`)
    .eq("id", id)
    .eq("is_hidden", false)
    .maybeSingle();

  if (error) {
    console.error("getBookById", error);
    return null;
  }
  return data as unknown as BookWithOwner | null;
}

/** Fetch all books listed by a given owner (by username). */
export async function getBooksByOwnerUsername(username: string): Promise<Book[]> {
  const supabase = await createClient();
  // Use profiles_public — direct profiles table is now self-only (RLS).
  const { data: profile } = await supabase
    .from("profiles_public")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return [];

  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("owner_id", profile.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  return (data ?? []) as Book[];
}
