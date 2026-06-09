import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createSpotAsHost, SPOT_TYPE_OPTIONS } from "@/lib/spots";
import type { SpotType } from "@/types";

const VALID_TYPES = SPOT_TYPE_OPTIONS.map((o) => o.value);

/**
 * POST /api/events/host-spot
 *
 * Host inline-create from the event create/edit form. Auth-required (the
 * RLS `spots_insert_host_eligible` policy enforces the ≥1 hosted-event
 * requirement; this route just adds friendly 400 / 403 responses around it).
 *
 * Returns the new Spot's id + slug + name + city on success — the form
 * uses these to auto-attach `node_id` to the event and pre-fill
 * `location_text` if empty.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    type?: string;
    city?: string;
    maps_url?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.type || !VALID_TYPES.includes(body.type as SpotType)) {
    return NextResponse.json({ error: "type is invalid" }, { status: 400 });
  }
  if (!body.city || typeof body.city !== "string") {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  const res = await createSpotAsHost(user.id, {
    name: body.name,
    type: body.type as SpotType,
    city: body.city,
    maps_url: typeof body.maps_url === "string" ? body.maps_url : undefined,
  });
  if ("error" in res) {
    // RLS denial surfaces as a Postgres error here. Map common ones to 403.
    const msg = res.error.toLowerCase();
    if (msg.includes("row-level security") || msg.includes("policy")) {
      return NextResponse.json(
        { error: "Belum bisa bikin Spot — host minimal harus pernah bikin 1 event dulu." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    id: res.id,
    slug: res.slug,
    name: res.name,
    city: res.city,
  });
}
