import { createClient } from "@/lib/supabase/server";
import type {
  AttendeeProfile,
  Event,
  EventFormValues,
  EventRsvpStatus,
  EventRsvpWithProfile,
  EventStatus,
  EventWithHost,
  RsvpContextValues,
} from "@/types";

const HOST_SELECT = `id, full_name, username, photo_url, city, whatsapp, whatsapp_public, instagram, discord`;

const EVENT_LIST_COLUMNS = `id, host_id, community_id, title, starts_at, ends_at, timezone, location_text, location_url, is_online, capacity, cover_url, visibility, status, is_hidden, discord_announced_at, node_id, created_at, updated_at`;

// Supabase returns embedded relations as arrays; flatten to single object.
const flatten = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/**
 * List events with optional filter, pagination, and host scoping.
 * Default: upcoming events ordered by starts_at ascending.
 */
export async function listEvents(opts?: {
  filter?: "upcoming" | "past" | "all";
  hostId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ events: EventWithHost[]; total: number }> {
  const supabase = await createClient();
  const pageSize = Math.max(1, Math.min(opts?.pageSize ?? 20, 60));
  const page = Math.max(1, opts?.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const now = new Date().toISOString();
  const filter = opts?.filter ?? "upcoming";

  let query = supabase
    .from("events")
    .select(
      `${EVENT_LIST_COLUMNS},
       host:profiles_public!events_host_id_fkey(${HOST_SELECT}),
       community:communities(id, name, slug),
       node:library_nodes(id, name, slug, type, city),
       rsvps:event_rsvps(count)`,
      { count: "exact" }
    )
    .eq("is_hidden", false)
    .range(from, to);

  if (filter === "upcoming") {
    query = query
      .gte("starts_at", now)
      .in("status", ["scheduled"])
      .order("starts_at", { ascending: true });
  } else if (filter === "past") {
    query = query.lt("starts_at", now).order("starts_at", { ascending: false });
  } else {
    query = query.order("starts_at", { ascending: false });
  }

  if (opts?.hostId) {
    query = query.eq("host_id", opts.hostId);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listEvents", error);
    return { events: [], total: 0 };
  }

  type Row = {
    host: unknown;
    community: unknown;
    node: unknown;
    rsvps: Array<{ count: number }> | null;
  } & Record<string, unknown>;

  const events = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    host: flatten(r.host as never),
    community: flatten(r.community as never),
    node: flatten(r.node as never),
    rsvp_count: r.rsvps?.[0]?.count ?? 0,
    viewer_rsvp: null,
  })) as unknown as EventWithHost[];

  return { events, total: count ?? 0 };
}

/**
 * Upcoming events for the landing strip and shelf widget.
 * Skips pagination — returns just the first N events.
 */
export async function getUpcomingEvents(limit = 8): Promise<EventWithHost[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select(
      `${EVENT_LIST_COLUMNS},
       host:profiles_public!events_host_id_fkey(${HOST_SELECT}),
       community:communities(id, name, slug),
       node:library_nodes(id, name, slug, type, city),
       rsvps:event_rsvps(count)`
    )
    .eq("is_hidden", false)
    .eq("status", "scheduled")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("getUpcomingEvents", error);
    return [];
  }

  type Row = {
    host: unknown;
    community: unknown;
    node: unknown;
    rsvps: Array<{ count: number }> | null;
  } & Record<string, unknown>;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    host: flatten(r.host as never),
    community: flatten(r.community as never),
    node: flatten(r.node as never),
    rsvp_count: r.rsvps?.[0]?.count ?? 0,
    viewer_rsvp: null,
  })) as unknown as EventWithHost[];
}

/**
 * Single event detail with host profile, community, RSVP count, and the
 * requesting viewer's own RSVP status (null when called server-side without
 * a viewer session — callers supply viewerId explicitly).
 */
export async function getEvent(id: string, viewerId?: string): Promise<EventWithHost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `*,
       host:profiles_public!events_host_id_fkey(${HOST_SELECT}),
       community:communities(id, name, slug),
       node:library_nodes(id, name, slug, type, city),
       rsvps:event_rsvps(count)`
    )
    .eq("id", id)
    .eq("is_hidden", false)
    .maybeSingle();

  if (error) {
    console.error("getEvent", error);
    return null;
  }
  if (!data) return null;

  type Row = {
    host: unknown;
    community: unknown;
    node: unknown;
    rsvps: Array<{ count: number }> | null;
  } & Record<string, unknown>;

  const row = data as unknown as Row;
  let viewerRsvp: EventRsvpStatus | null = null;

  if (viewerId) {
    const { data: rsvpRow } = await supabase
      .from("event_rsvps")
      .select("status")
      .eq("event_id", id)
      .eq("profile_id", viewerId)
      .maybeSingle();
    viewerRsvp = (rsvpRow?.status as EventRsvpStatus) ?? null;
  }

  return {
    ...row,
    host: flatten(row.host as never),
    community: flatten(row.community as never),
    node: flatten(row.node as never),
    rsvp_count: row.rsvps?.[0]?.count ?? 0,
    viewer_rsvp: viewerRsvp,
  } as unknown as EventWithHost;
}

/** Create a new event. Returns the new row id on success or an error string. */
export async function createEvent(
  hostId: string,
  values: EventFormValues
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: hostId,
      title: values.title,
      description: values.description ?? null,
      starts_at: values.starts_at,
      ends_at: values.ends_at ?? null,
      timezone: values.timezone ?? "Asia/Jakarta",
      location_text: values.location_text ?? null,
      location_url: values.location_url ?? null,
      is_online: values.is_online ?? false,
      capacity: values.capacity ?? null,
      cover_url: values.cover_url ?? null,
      contact_method: values.contact_method ?? "whatsapp",
      visibility: values.visibility ?? "public",
      theme: values.theme ?? null,
      what_to_expect: values.what_to_expect ?? null,
      hashtags: values.hashtags ?? null,
      reminder_text: values.reminder_text ?? null,
      registration_url: values.registration_url ?? null,
      registration_label: values.registration_label ?? null,
      registration_deadline: values.registration_deadline ?? null,
      instagram_url: values.instagram_url ?? null,
      community_name: values.community_name ?? null,
      community_instagram_url: values.community_instagram_url ?? null,
      community_logo_url: values.community_logo_url ?? null,
      node_id: values.node_id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createEvent", error);
    return { error: error.message };
  }
  return { id: data.id as string };
}

/** Update an event. Host ownership is enforced by RLS. */
export async function updateEvent(
  id: string,
  patch: Partial<EventFormValues> & { status?: EventStatus }
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.starts_at !== undefined && { starts_at: patch.starts_at }),
      ...(patch.ends_at !== undefined && { ends_at: patch.ends_at }),
      ...(patch.timezone !== undefined && { timezone: patch.timezone }),
      ...(patch.location_text !== undefined && { location_text: patch.location_text }),
      ...(patch.location_url !== undefined && { location_url: patch.location_url }),
      ...(patch.is_online !== undefined && { is_online: patch.is_online }),
      ...(patch.capacity !== undefined && { capacity: patch.capacity }),
      ...(patch.cover_url !== undefined && { cover_url: patch.cover_url }),
      ...(patch.contact_method !== undefined && { contact_method: patch.contact_method }),
      ...(patch.visibility !== undefined && { visibility: patch.visibility }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.theme !== undefined && { theme: patch.theme }),
      ...(patch.what_to_expect !== undefined && { what_to_expect: patch.what_to_expect }),
      ...(patch.hashtags !== undefined && { hashtags: patch.hashtags }),
      ...(patch.reminder_text !== undefined && { reminder_text: patch.reminder_text }),
      ...(patch.registration_url !== undefined && { registration_url: patch.registration_url }),
      ...(patch.registration_label !== undefined && {
        registration_label: patch.registration_label,
      }),
      ...(patch.registration_deadline !== undefined && {
        registration_deadline: patch.registration_deadline,
      }),
      ...(patch.instagram_url !== undefined && { instagram_url: patch.instagram_url }),
      ...(patch.community_name !== undefined && { community_name: patch.community_name }),
      ...(patch.community_instagram_url !== undefined && {
        community_instagram_url: patch.community_instagram_url,
      }),
      ...(patch.community_logo_url !== undefined && {
        community_logo_url: patch.community_logo_url,
      }),
      ...(patch.node_id !== undefined && { node_id: patch.node_id }),
    })
    .eq("id", id);

  if (error) {
    console.error("updateEvent", error);
    return { error: error.message };
  }
  return { ok: true };
}

/**
 * Hard delete via the events_delete_own RLS policy. FK cascades remove the
 * event's RSVPs and its activity_log row, so a deleted event no longer lingers
 * in the activity feed / landing strips.
 *
 * `.select("id")` is intentional: RLS silently deletes 0 rows for non-owners
 * without raising an error, so we check the row count to distinguish a real
 * delete from an unauthorised no-op and return a clear error to the caller.
 */
export async function deleteEvent(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("events").delete().eq("id", id).select("id");

  if (error) {
    console.error("deleteEvent", error);
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "Unauthorized or not found" };
  }
  return { ok: true };
}

/**
 * Upsert an RSVP for a profile. The trigger only fires on INSERT so
 * updating going → maybe → going doesn't create duplicate activity rows.
 * Optional context (bringing_book, conversation_topic, origin_city, note)
 * surfaces on attendee cards as social signal. Context columns are only
 * written when actually populated — defensive against migrations that
 * haven't landed yet.
 */
export async function rsvpEvent(
  eventId: string,
  profileId: string,
  status: EventRsvpStatus,
  context?: RsvpContextValues
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const payload: Record<string, unknown> = {
    event_id: eventId,
    profile_id: profileId,
    status,
  };
  if (context?.note) payload.note = context.note;
  if (context?.origin_city) payload.origin_city = context.origin_city;
  if (context?.bringing_book) payload.bringing_book = context.bringing_book;
  if (context?.conversation_topic) payload.conversation_topic = context.conversation_topic;

  const { error } = await supabase
    .from("event_rsvps")
    .upsert(payload, { onConflict: "event_id,profile_id" });

  if (error) {
    console.error("rsvpEvent failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return { error: error.message };
  }
  return { ok: true };
}

/**
 * Update only RSVP context fields without changing status. Used by the
 * optional post-RSVP context prompt — user RSVPs first (fast), then can
 * enrich with what they're bringing / want to discuss.
 */
export async function updateRsvpContext(
  eventId: string,
  profileId: string,
  context: RsvpContextValues
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_rsvps")
    .update({
      ...(context.origin_city !== undefined && { origin_city: context.origin_city || null }),
      ...(context.bringing_book !== undefined && { bringing_book: context.bringing_book || null }),
      ...(context.conversation_topic !== undefined && {
        conversation_topic: context.conversation_topic || null,
      }),
      ...(context.note !== undefined && { note: context.note || null }),
    })
    .eq("event_id", eventId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("updateRsvpContext", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Remove a profile's RSVP entirely (cancel attendance). */
export async function cancelRsvp(
  eventId: string,
  profileId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("cancelRsvp", error);
    return { error: error.message };
  }
  return { ok: true };
}

/**
 * All RSVPs for an event with **rich** attendee profile signals for the
 * "Hadir" tab — city, interests, book count, social links. Built so attendee
 * cards read as "social signal" (oh, ada yang dari Demak, interest-nya
 * systems-thinking, bawa Atomic Habits) instead of just "1 nama doang".
 */
export async function listEventRsvps(eventId: string): Promise<EventRsvpWithProfile[]> {
  const supabase = await createClient();

  // Try rich select with context columns; if migration 0022 hasn't applied,
  // fall back to basic select so the page still works.
  const richSelect = `event_id, profile_id, status, note, origin_city, bringing_book, conversation_topic, created_at,
       profile:profiles_public!event_rsvps_profile_id_fkey(id, full_name, username, photo_url, city, interests, instagram, discord)`;
  const fallbackSelect = `event_id, profile_id, status, note, created_at,
       profile:profiles_public!event_rsvps_profile_id_fkey(id, full_name, username, photo_url, city, interests, instagram, discord)`;

  const initial = await supabase
    .from("event_rsvps")
    .select(richSelect)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  let data: unknown[] | null = initial.data;
  let error = initial.error;

  if (error && /column .* (does not exist|undefined)/i.test(error.message)) {
    console.warn("listEventRsvps: context columns missing, falling back to basic select");
    const fallback = await supabase
      .from("event_rsvps")
      .select(fallbackSelect)
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("listEventRsvps", error);
    return [];
  }

  type Row = {
    profile: unknown;
  } & Record<string, unknown>;

  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    profile: flatten(r.profile as never),
  })) as unknown as Array<EventRsvpWithProfile & { profile: AttendeeProfile }>;

  // Batch-fetch book counts for all attendees in one query (no N+1)
  const attendeeIds = rows.map((r) => r.profile?.id).filter((id): id is string => Boolean(id));

  const bookCounts = new Map<string, number>();
  if (attendeeIds.length > 0) {
    const { data: countRows } = await supabase
      .from("books")
      .select("owner_id")
      .in("owner_id", attendeeIds)
      .eq("is_hidden", false)
      .eq("visibility", "public");

    for (const row of countRows ?? []) {
      const ownerId = (row as { owner_id: string }).owner_id;
      bookCounts.set(ownerId, (bookCounts.get(ownerId) ?? 0) + 1);
    }
  }

  return rows.map((r) => ({
    ...r,
    profile: {
      ...r.profile,
      book_count: r.profile?.id ? (bookCounts.get(r.profile.id) ?? 0) : 0,
    },
  })) as EventRsvpWithProfile[];
}

/** Fetch a raw Event row (no joins). Used by API routes that just need ownership check. */
export async function getRawEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getRawEvent", error);
    return null;
  }
  return data as Event | null;
}
