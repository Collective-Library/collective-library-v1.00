/**
 * Server-side read utilities for user_notifications.
 * Uses the service-role client so they work without a session cookie
 * (caller is responsible for passing the authenticated user's ID).
 * Client-side mutations (mark as read) are done in components via
 * the browser Supabase client, relying on RLS select_own / update_own.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserNotification } from "@/types";

/** Fast unread count via partial index on (recipient_user_id, read_at). */
export async function getUnreadCount(userId: string): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("read_at", null);
  if (error) {
    console.error("[notifications] getUnreadCount", error);
    return 0;
  }
  return count ?? 0;
}

/** Recent notifications for a user, newest first. */
export async function listNotifications(userId: string, limit = 50): Promise<UserNotification[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("user_notifications")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[notifications] listNotifications", error);
    return [];
  }
  return (data ?? []) as UserNotification[];
}
