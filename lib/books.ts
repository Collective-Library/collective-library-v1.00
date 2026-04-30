import { createClient } from "@/lib/supabase/server";
import type { Book, BookStatus, BookWithOwner } from "@/types";

const OWNER_SELECT = `id, full_name, username, photo_url, city, whatsapp, whatsapp_public, instagram, discord, goodreads_url, storygraph_url`;

/**
 * List public books for the Collective Shelf, optionally filtered + paginated.
 * Returns books + total count so the caller can render page links.
 *
 * Pagination uses Supabase's `range(from, to)` (inclusive). Page is 1-based;
 * page=1 returns rows 0..limit-1, page=2 returns rows limit..2*limit-1, etc.
 */
export async function listShelfBooks(opts?: {
  status?: BookStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ books: BookWithOwner[]; total: number }> {
  const supabase = await createClient();
  const pageSize = Math.max(1, Math.min(opts?.pageSize ?? 24, 60));
  const page = Math.max(1, opts?.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("books")
    .select(
      `*, owner:profiles_public!books_owner_id_fkey(${OWNER_SELECT}), community:communities(id, name, slug)`,
      { count: "exact" },
    )
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts?.search) {
    const s = opts.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listShelfBooks", error);
    return { books: [], total: 0 };
  }
  return {
    books: (data ?? []) as unknown as BookWithOwner[],
    total: count ?? 0,
  };
}

/**
 * Full search across title and author using the generated `search_text`
 * tsvector + GIN index from migration 0006. Uses `websearch` query type so
 * users can naturally type "harari sapiens", quoted phrases, OR / NOT.
 *
 * Falls back to ilike if the tsvector returns 0 hits (helps when user types
 * partial/short tokens that FTS won't match — e.g. "sap" instead of
 * "sapiens"). Both queries are GIN-indexed; tsvector ranks matches.
 */
export async function searchBooks(query: string, limit = 60): Promise<BookWithOwner[]> {
  if (!query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const safe = query.trim().replace(/[%_]/g, "");

  const baseSelect = `*, owner:profiles_public!books_owner_id_fkey(${OWNER_SELECT}), community:communities(id, name, slug)`;

  // 1. Try FTS via websearch query type (handles "harari sapiens" as AND,
  //    "exact phrase" as quoted, OR / NOT operators)
  const { data: ftsHits } = await supabase
    .from("books")
    .select(baseSelect)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .textSearch("search_text", safe, { type: "websearch" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ftsHits && ftsHits.length > 0) {
    return ftsHits as unknown as BookWithOwner[];
  }

  // 2. Fallback to ilike — catches partial / single-token typos that FTS
  //    misses (e.g. typing "sap" before completing "sapiens")
  const { data } = await supabase
    .from("books")
    .select(baseSelect)
    .eq("is_hidden", false)
    .eq("visibility", "public")
    .or(`title.ilike.%${safe}%,author.ilike.%${safe}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as BookWithOwner[];
}

/** @deprecated Use lib/activity.ts:listActivity. Retained as a fallback if the
 * activity_log migration hasn't been run yet. */
export interface RecentBookActivity {
  book_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  status: BookStatus;
  created_at: string;
  owner_id: string;
  owner_name: string | null;
  owner_username: string | null;
  owner_photo: string | null;
}

/** @deprecated Use lib/activity.ts:listActivity instead. */
export async function getRecentBookActivity(limit = 5): Promise<RecentBookActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select(`
      id, title, author, cover_url, status, created_at, owner_id,
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
    author: string;
    cover_url: string | null;
    status: BookStatus;
    created_at: string;
    owner_id: string;
    owner: { full_name: string | null; username: string | null; photo_url: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((b) => ({
    book_id: b.id,
    title: b.title,
    author: b.author,
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
