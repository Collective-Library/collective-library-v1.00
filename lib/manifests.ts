import { createClient } from "@/lib/supabase/server";
import type { Manifest, ManifestFormValues, ManifestStatus, ManifestWithAuthor } from "@/types";

const AUTHOR_SELECT = `id, full_name, username, photo_url, city`;

const MANIFEST_LIST_COLUMNS = `id, author_id, body, mood, topic, is_anonymous,
  linked_event_id, linked_book_id, linked_profile_id,
  visibility, status, moderation_note, approved_at, approved_by,
  is_hidden, discord_announced_at, x_posted_url, x_posted_at,
  created_at, updated_at`;

// Supabase returns embedded relations as arrays; flatten to single object.
const flatten = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/**
 * List approved + public manifests for the /manifest page and landing strip.
 * Authors always see their own (including pending/rejected). Admins see all
 * via RLS — for the admin moderation queue use {@link listPendingManifests}.
 */
export async function listManifests(opts?: {
  page?: number;
  pageSize?: number;
  authorId?: string;
}): Promise<{ manifests: ManifestWithAuthor[]; total: number }> {
  const supabase = await createClient();
  const pageSize = Math.max(1, Math.min(opts?.pageSize ?? 20, 60));
  const page = Math.max(1, opts?.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("manifests")
    .select(
      `${MANIFEST_LIST_COLUMNS},
       author:profiles_public!manifests_author_id_fkey(${AUTHOR_SELECT}),
       linked_event:events(id, title, starts_at, cover_url),
       linked_book:books(id, title, author, cover_url)`,
      { count: "exact" }
    )
    .eq("is_hidden", false)
    .eq("status", "approved")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.authorId) {
    query = query.eq("author_id", opts.authorId);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listManifests", error);
    return { manifests: [], total: 0 };
  }

  type Row = {
    author: unknown;
    linked_event: unknown;
    linked_book: unknown;
  } & Record<string, unknown>;

  const manifests = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    author: flatten(r.author as never),
    linked_event: flatten(r.linked_event as never),
    linked_book: flatten(r.linked_book as never),
  })) as unknown as ManifestWithAuthor[];

  return { manifests, total: count ?? 0 };
}

/** Recent approved manifests for the landing strip. */
export async function getRecentManifests(limit = 6): Promise<ManifestWithAuthor[]> {
  const { manifests } = await listManifests({ pageSize: limit, page: 1 });
  return manifests;
}

/**
 * Single manifest detail. Approved + public is visible to everyone;
 * author can see own pending; admins can see all (RLS handles this).
 */
export async function getManifest(id: string): Promise<ManifestWithAuthor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("manifests")
    .select(
      `*,
       author:profiles_public!manifests_author_id_fkey(${AUTHOR_SELECT}),
       linked_event:events(id, title, starts_at, cover_url),
       linked_book:books(id, title, author, cover_url)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getManifest", error);
    return null;
  }
  if (!data) return null;

  type Row = {
    author: unknown;
    linked_event: unknown;
    linked_book: unknown;
  } & Record<string, unknown>;

  const row = data as unknown as Row;
  return {
    ...row,
    author: flatten(row.author as never),
    linked_event: flatten(row.linked_event as never),
    linked_book: flatten(row.linked_book as never),
  } as unknown as ManifestWithAuthor;
}

/**
 * Admin moderation queue — all manifests with status='pending'.
 * RLS gates access (only admins can read non-approved/non-own rows).
 */
export async function listPendingManifests(): Promise<ManifestWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("manifests")
    .select(
      `${MANIFEST_LIST_COLUMNS},
       author:profiles_public!manifests_author_id_fkey(${AUTHOR_SELECT}),
       linked_event:events(id, title, starts_at, cover_url),
       linked_book:books(id, title, author, cover_url)`
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listPendingManifests", error);
    return [];
  }

  type Row = {
    author: unknown;
    linked_event: unknown;
    linked_book: unknown;
  } & Record<string, unknown>;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    author: flatten(r.author as never),
    linked_event: flatten(r.linked_event as never),
    linked_book: flatten(r.linked_book as never),
  })) as unknown as ManifestWithAuthor[];
}

/**
 * Submit a new manifest. Autobase mode: publishes immediately (status=approved),
 * no admin pre-approval gate. Admin can moderate retroactively via hide/reject.
 * The activity trigger fires on INSERT with status='approved' (migration 0026).
 */
export async function createManifest(
  authorId: string,
  values: ManifestFormValues
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("manifests")
    .insert({
      author_id: authorId,
      body: values.body.trim(),
      mood: values.mood ?? null,
      topic: values.topic?.trim() || null,
      is_anonymous: values.is_anonymous ?? false,
      visibility: values.visibility ?? "public",
      linked_event_id: values.linked_event_id ?? null,
      linked_book_id: values.linked_book_id ?? null,
      // Autobase mode: go live immediately.
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("createManifest", error);
    return { error: error.message };
  }
  return { id: data.id as string };
}

/** Admin: approve a pending manifest. Fires MANIFEST_POSTED activity via trigger. */
export async function approveManifest(
  manifestId: string,
  adminProfileId: string,
  note?: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("manifests")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminProfileId,
      moderation_note: note?.trim() || null,
    })
    .eq("id", manifestId);

  if (error) {
    console.error("approveManifest", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Admin: reject a pending manifest. */
export async function rejectManifest(
  manifestId: string,
  adminProfileId: string,
  note: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("manifests")
    .update({
      status: "rejected",
      approved_at: null,
      approved_by: adminProfileId,
      moderation_note: note.trim(),
    })
    .eq("id", manifestId);

  if (error) {
    console.error("rejectManifest", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Mark manifest as posted to X (records the URL for backlink). */
export async function markManifestXPosted(
  manifestId: string,
  xPostedUrl: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("manifests")
    .update({
      x_posted_url: xPostedUrl.trim(),
      x_posted_at: new Date().toISOString(),
    })
    .eq("id", manifestId);

  if (error) {
    console.error("markManifestXPosted", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Fetch raw manifest (no joins) for ownership checks in API routes. */
export async function getRawManifest(id: string): Promise<Manifest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("manifests").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("getRawManifest", error);
    return null;
  }
  return data as Manifest | null;
}

/**
 * Admin moderation — recent public manifests for retroactive review.
 * Autobase mode means the pending queue is empty for new manifests; admin
 * reviews live content here instead.
 */
export async function listRecentManifests(limit = 20): Promise<ManifestWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("manifests")
    .select(
      `${MANIFEST_LIST_COLUMNS},
       author:profiles_public!manifests_author_id_fkey(${AUTHOR_SELECT}),
       linked_event:events(id, title, starts_at, cover_url),
       linked_book:books(id, title, author, cover_url)`
    )
    .eq("status", "approved")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listRecentManifests", error);
    return [];
  }

  type Row = {
    author: unknown;
    linked_event: unknown;
    linked_book: unknown;
  } & Record<string, unknown>;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    author: flatten(r.author as never),
    linked_event: flatten(r.linked_event as never),
    linked_book: flatten(r.linked_book as never),
  })) as unknown as ManifestWithAuthor[];
}

/** Status update helper for admin actions. */
export async function setManifestStatus(
  manifestId: string,
  status: ManifestStatus,
  adminProfileId: string,
  note?: string
): Promise<{ ok: true } | { error: string }> {
  if (status === "approved") return approveManifest(manifestId, adminProfileId, note);
  if (status === "rejected") {
    if (!note?.trim()) return { error: "Catatan moderator wajib saat reject." };
    return rejectManifest(manifestId, adminProfileId, note);
  }
  // status === "pending" — reset to pending (admin can undo their decision)
  const supabase = await createClient();
  const { error } = await supabase
    .from("manifests")
    .update({
      status: "pending",
      approved_at: null,
      approved_by: null,
      moderation_note: note?.trim() || null,
    })
    .eq("id", manifestId);
  if (error) return { error: error.message };
  return { ok: true };
}
