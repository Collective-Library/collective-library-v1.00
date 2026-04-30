import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminNote, AdminNoteEntity, AdminNoteWithAuthor } from "@/types";

/** List notes for a given entity (newest first). Joins author profile. */
export async function listNotesFor(
  entityType: AdminNoteEntity,
  entityId: string,
): Promise<AdminNoteWithAuthor[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_notes")
    .select(`
      *,
      author:profiles!admin_notes_created_by_fkey(id, full_name, username, photo_url)
    `)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listNotesFor", error);
    return [];
  }

  type Row = AdminNote & {
    author: AdminNoteWithAuthor["author"] | AdminNoteWithAuthor["author"][] | null;
  };
  const flatten = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    author: flatten(r.author),
  }));
}

export async function addNote(input: {
  entity_type: AdminNoteEntity;
  entity_id: string;
  note: string;
  created_by: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_notes")
    .insert(input)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
  return { ok: true, id: data.id as string };
}
