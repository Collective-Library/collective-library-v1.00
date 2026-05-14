// =============================================================================
// /api/events/[id]/announce — host-only Discord embed for an event
//
// Mirrors /api/feedback pattern: source of truth stays in Supabase
// (events.discord_announced_at), Discord webhook is a notification surface
// only. Idempotent on the UI side via discord_announced_at timestamp.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/url";
import { getRawEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await getRawEvent(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can announce." }, { status: 403 });
  }

  // Pull host display info
  const { data: host } = await supabase
    .from("profiles_public")
    .select("full_name, username")
    .eq("id", event.host_id)
    .maybeSingle();
  const hostDisplay =
    (host?.full_name as string | null) ?? (host?.username as string | null) ?? "Anggota";
  const hostHandle = (host?.username as string | null) ?? null;

  const webhookUrl =
    process.env.DISCORD_EVENTS_WEBHOOK_URL ??
    process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("[events.announce] no Discord webhook configured");
    return NextResponse.json({ ok: true, discord: false });
  }

  const eventUrl = `${getAppUrl()}/event/${event.id}`;
  const whenIso = event.starts_at;
  const whenLabel = new Date(whenIso).toLocaleString("id-ID", {
    timeZone: event.timezone || "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const whereLabel = event.is_online
    ? `Online${event.location_url ? ` — ${event.location_url}` : ""}`
    : event.location_text ?? "TBD";

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: "Kapan", value: whenLabel, inline: true },
    { name: "Di mana", value: whereLabel.slice(0, 200), inline: true },
    {
      name: "Host",
      value: hostHandle ? `${hostDisplay} (@${hostHandle})` : hostDisplay,
      inline: false,
    },
    { name: "RSVP", value: `[Buka event di Collective Library](${eventUrl})`, inline: false },
  ];

  const description = event.description
    ? event.description.length > 1500
      ? event.description.slice(0, 1500) + "…"
      : event.description
    : "Klik RSVP buat detail lengkap.";

  const embed = {
    title: `📅 ${event.title}`,
    description,
    color: 0x4338ca,
    url: eventUrl,
    fields,
    timestamp: whenIso,
    footer: { text: "Collective Library · events" },
    ...(event.cover_url ? { image: { url: event.cover_url } } : {}),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        "[events.announce] discord webhook failed",
        res.status,
        text.slice(0, 200),
      );
      return NextResponse.json({ ok: true, discord: false });
    }
  } catch (err) {
    console.warn(
      "[events.announce] discord fetch error",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ ok: true, discord: false });
  }

  // Bump idempotency timestamp. Host owns the row so anon-key RLS allows this.
  const announcedAt = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("events")
    .update({ discord_announced_at: announcedAt })
    .eq("id", event.id);

  if (updateErr) {
    console.warn("[events.announce] timestamp update failed", updateErr);
  }

  return NextResponse.json({ ok: true, discord: true, announcedAt });
}
