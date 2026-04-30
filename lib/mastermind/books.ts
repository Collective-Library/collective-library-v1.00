import { createAdminClient } from "@/lib/supabase/admin";
import type { Book, BookStatus, Profile } from "@/types";

export type BookQualityFlag =
  | "no-cover"
  | "no-genre"
  | "no-isbn"
  | "no-description"
  | "owner-missing"
  | "duplicate-isbn"
  | "duplicate-title-author";

export interface AdminBookRow {
  book: Book;
  owner: Pick<Profile, "id" | "full_name" | "username" | "photo_url"> | null;
  flags: BookQualityFlag[];
}

export interface ListBooksAdminOpts {
  search?: string;
  status?: BookStatus | "all";
  ownerId?: string;
  flag?: BookQualityFlag | "any-flag" | "none";
  sort?: "newest" | "oldest" | "title";
  limit?: number;
}

export async function listBooksAdmin(opts: ListBooksAdminOpts = {}): Promise<AdminBookRow[]> {
  const supabase = createAdminClient();
  const limit = Math.max(1, Math.min(opts.limit ?? 200, 500));

  let query = supabase
    .from("books")
    .select("*, owner:profiles!books_owner_id_fkey(id, full_name, username, photo_url)")
    .limit(limit);

  if (opts.search) {
    const s = opts.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%,isbn.ilike.%${s}%`);
  }
  if (opts.status && opts.status !== "all") query = query.eq("status", opts.status);
  if (opts.ownerId) query = query.eq("owner_id", opts.ownerId);

  switch (opts.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("listBooksAdmin", error);
    return [];
  }

  type Row = Book & {
    owner: AdminBookRow["owner"] | AdminBookRow["owner"][] | null;
  };
  const flatten = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  const rows: { book: Book; owner: AdminBookRow["owner"] }[] = (
    (data ?? []) as unknown as Row[]
  ).map((r) => ({ book: r as Book, owner: flatten(r.owner) }));

  // Build duplicate detection maps
  const isbnMap = new Map<string, number>();
  const titleAuthorMap = new Map<string, number>();
  for (const r of rows) {
    if (r.book.isbn) {
      const k = r.book.isbn.replace(/[-\s]/g, "").toLowerCase();
      isbnMap.set(k, (isbnMap.get(k) ?? 0) + 1);
    }
    const ta = `${r.book.title.toLowerCase().trim()}::${r.book.author.toLowerCase().trim()}`;
    titleAuthorMap.set(ta, (titleAuthorMap.get(ta) ?? 0) + 1);
  }

  let result: AdminBookRow[] = rows.map((r) => {
    const flags: BookQualityFlag[] = [];
    if (!r.book.cover_url) flags.push("no-cover");
    if (!r.book.genre) flags.push("no-genre");
    if (!r.book.isbn) flags.push("no-isbn");
    if (!r.book.description) flags.push("no-description");
    if (!r.owner) flags.push("owner-missing");
    if (r.book.isbn) {
      const k = r.book.isbn.replace(/[-\s]/g, "").toLowerCase();
      if ((isbnMap.get(k) ?? 0) > 1) flags.push("duplicate-isbn");
    }
    const ta = `${r.book.title.toLowerCase().trim()}::${r.book.author.toLowerCase().trim()}`;
    if ((titleAuthorMap.get(ta) ?? 0) > 1) flags.push("duplicate-title-author");

    return { book: r.book, owner: r.owner, flags };
  });

  if (opts.flag === "any-flag") result = result.filter((r) => r.flags.length > 0);
  else if (opts.flag === "none") result = result.filter((r) => r.flags.length === 0);
  else if (opts.flag) result = result.filter((r) => r.flags.includes(opts.flag as BookQualityFlag));

  return result;
}

export async function getBookAdmin(id: string): Promise<AdminBookRow | null> {
  const list = await listBooksAdmin({ limit: 500 });
  return list.find((r) => r.book.id === id) ?? null;
}
