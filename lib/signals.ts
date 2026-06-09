/**
 * Public read API for Collective Signals.
 * Uses the service-role client so it works from server components and API
 * routes without needing a session cookie (public data anyway — both tables
 * have for-select-using(true) RLS policies).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { SignalDefinition, UserSignalWithDefinition } from "@/types";

const flatten = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

const DEFINITION_COLS = `
  slug, name, description, emoji, category, announce,
  card_headline, card_subcopy, sort_order, created_at
`;

const SIGNAL_SELECT = `
  id, user_id, signal_slug, unlocked_at, source_activity_id,
  definition:signal_definitions!signal_slug(${DEFINITION_COLS})
`;

/** All Signals unlocked by a user, newest first. */
export async function listUserSignals(userId: string): Promise<UserSignalWithDefinition[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("user_signals")
    .select(SIGNAL_SELECT)
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    console.error("[signals] listUserSignals", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    user_id: r.user_id as string,
    signal_slug: r.signal_slug as string,
    unlocked_at: r.unlocked_at as string,
    source_activity_id: r.source_activity_id as string | null,
    definition: flatten(r.definition as SignalDefinition | SignalDefinition[] | null),
  }));
}

/** Single unlocked Signal by user_signals.id (used for /signal/[id] detail). */
export async function getUserSignal(id: string): Promise<UserSignalWithDefinition | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("user_signals")
    .select(SIGNAL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[signals] getUserSignal", error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id as string,
    user_id: data.user_id as string,
    signal_slug: data.signal_slug as string,
    unlocked_at: data.unlocked_at as string,
    source_activity_id: data.source_activity_id as string | null,
    definition: flatten(data.definition as SignalDefinition | SignalDefinition[] | null),
  };
}

/** Full catalog of Signal definitions, ordered by sort_order. */
export async function listSignalDefinitions(): Promise<SignalDefinition[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("signal_definitions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[signals] listSignalDefinitions", error);
    return [];
  }

  return (data ?? []) as SignalDefinition[];
}
