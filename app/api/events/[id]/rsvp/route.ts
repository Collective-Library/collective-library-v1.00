import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelRsvp, rsvpEvent } from "@/lib/events";
import type { EventRsvpStatus, RsvpContextValues } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<EventRsvpStatus>(["going", "maybe", "declined"]);

interface Body {
  status: EventRsvpStatus | null;
  note?: string | null;
  origin_city?: string | null;
  bringing_book?: string | null;
  conversation_topic?: string | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (body.status === null) {
    const result = await cancelRsvp(eventId, user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: null });
  }

  if (!VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const context: RsvpContextValues = {
    note: body.note?.trim().slice(0, 280) || undefined,
    origin_city: body.origin_city?.trim().slice(0, 80) || undefined,
    bringing_book: body.bringing_book?.trim().slice(0, 200) || undefined,
    conversation_topic: body.conversation_topic?.trim().slice(0, 200) || undefined,
  };

  const result = await rsvpEvent(eventId, user.id, body.status, context);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status: body.status });
}
