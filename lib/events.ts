import { createClient } from "@/lib/supabase/server";
import type {
  Event,
  EventFormValues,
  EventRsvpStatus,
  EventRsvpWithProfile,
  EventStatus,
  EventWithHost,
} from "@/types";

const HOST_SELECT = `id, full_name, username, photo_url, city, whatsapp, whatsapp_public, instagram, discord`;

const EVENT_LIST_COLUMNS = `id, host_id, community_id, title, starts_at, ends_at, timezone, location_text, location_url, is_online, capacity, cover_url, visibility, status, is_hidden, discord_announced_at, created_at, updated_at`;

// Supabase returns embedded relations as arrays; flatten to single object.
const flatten = <T,>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

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
       rsvps:event_rsvps(count)`,
      { count: "exact" },
    )
    .eq("is_hidden", false)
    .range(from, to);

  if (filter === "upcoming") {
    query = query
      .gte("starts_at", now)
      .in("status", ["scheduled"])
      .order("starts_at", { ascending: true });
  } else if (filter === "past") {
    query = query
      .lt("starts_at", now)
      .order("starts_at", { ascending: false });
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
    rsvps: Array<{ count: number }> | null;
  } & Record<string, unknown>;

  const events = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    host: flatten(r.host as never),
    community: flatten(r.community as never),
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
       rsvps:event_rsvps(count)`,
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
    rsvps: Array<{ count: number }> | null;
  } & Record<string, unknown>;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    host: flatten(r.host as never),
    community: flatten(r.community as never),
    rsvp_count: r.rsvps?.[0]?.count ?? 0,
    viewer_rsvp: null,
  })) as unknown as EventWithHost[];
}

/**
 * Single event detail with host profile, community, RSVP count, and the
 * requesting viewer's own RSVP status (null when called server-side without
 * a viewer session — callers supply viewerId explicitly).
 */
export async function getEvent(
  id: string,
  viewerId?: string,
): Promise<EventWithHost | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `*,
       host:profiles_public!events_host_id_fkey(${HOST_SELECT}),
       community:communities(id, name, slug),
       rsvps:event_rsvps(count)`,
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
    rsvp_count: row.rsvps?.[0]?.count ?? 0,
    viewer_rsvp: viewerRsvp,
  } as unknown as EventWithHost;
}

/** Create a new event. Returns the new row id on success or an error string. */
export async function createEvent(
  hostId: string,
  values: EventFormValues,
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
  patch: Partial<EventFormValues> & { status?: EventStatus },
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
    })
    .eq("id", id);

  if (error) {
    console.error("updateEvent", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Soft-delete: set is_hidden = true so activity_log cascade keeps history. */
export async function deleteEvent(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ is_hidden: true, status: "cancelled" })
    .eq("id", id);

  if (error) {
    console.error("deleteEvent", error);
    return { error: error.message };
  }
  return { ok: true };
}

/**
 * Upsert an RSVP for a profile. The trigger only fires on INSERT so
 * updating going → maybe → going doesn't create duplicate activity rows.
 */
export async function rsvpEvent(
  eventId: string,
  profileId: string,
  status: EventRsvpStatus,
  note?: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("event_rsvps").upsert(
    {
      event_id: eventId,
      profile_id: profileId,
      status,
      note: note ?? null,
    },
    { onConflict: "event_id,profile_id" },
  );

  if (error) {
    console.error("rsvpEvent", error);
    return { error: error.message };
  }
  return { ok: true };
}

/** Remove a profile's RSVP entirely (cancel attendance). */
export async function cancelRsvp(
  eventId: string,
  profileId: string,
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

/** All RSVPs for an event with attendee profile data, for the "Hadir" tab. */
export async function listEventRsvps(eventId: string): Promise<EventRsvpWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_rsvps")
    .select(
      `event_id, profile_id, status, note, created_at,
       profile:profiles_public!event_rsvps_profile_id_fkey(id, full_name, username, photo_url)`,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listEventRsvps", error);
    return [];
  }

  type Row = {
    profile: unknown;
  } & Record<string, unknown>;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    profile: flatten(r.profile as never),
  })) as unknown as EventRsvpWithProfile[];
}

/** Fetch a raw Event row (no joins). Used by API routes that just need ownership check. */
export async function getRawEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getRawEvent", error);
    return null;
  }
  return data as Event | null;
}
