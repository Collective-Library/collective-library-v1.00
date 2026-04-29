import { createClient } from "@/lib/supabase/server";
import type { Community, Profile } from "@/types";

/** Get a profile by username. Uses the public view (whatsapp masked unless public/self). */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles_public")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return data as Profile | null;
}

/** Check if a username is available (case-insensitive). */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const supabase = await createClient();
  let q = supabase.from("profiles_public").select("id").ilike("username", username);
  if (excludeUserId) q = q.neq("id", excludeUserId);
  const { data } = await q.limit(1);
  return !data || data.length === 0;
}

/** Fetch the communities a user belongs to. */
export async function getProfileCommunities(
  userId: string,
): Promise<Pick<Community, "id" | "name" | "slug">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community:communities(id, name, slug)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });
  // Each row is { community: {...} } — Supabase types this as an array even
  // for to-one relations, so cast through unknown and normalize either shape.
  type Row = { community: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null };
  const rows = (data ?? []) as unknown as Row[];
  return rows
    .map((row) => (Array.isArray(row.community) ? row.community[0] ?? null : row.community))
    .filter((c): c is { id: string; name: string; slug: string } => c !== null);
}
