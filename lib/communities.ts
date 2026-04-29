import { createClient } from "@/lib/supabase/server";
import type { Community } from "@/types";

/** The default seeded community — Journey Perintis Semarang. */
export const DEFAULT_COMMUNITY_SLUG = "journey-perintis";

/** Look up community by slug. Server-side. */
export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data as Community | null;
}

/** Returns the user's primary community membership (first joined), or null. */
export async function getPrimaryCommunityId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.community_id as string) ?? null;
}
