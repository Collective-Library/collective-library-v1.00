import { NextResponse, type NextRequest } from "next/server";
import { getAdminProfileOrNull } from "@/lib/mastermind/auth";
import { createSpotAdmin } from "@/lib/spots";
import type { SpotFormValues, SpotType, SpotVisibility } from "@/types";
import { SPOT_TYPE_OPTIONS, SPOT_VISIBILITY_OPTIONS } from "@/lib/spots";

const VALID_TYPES = SPOT_TYPE_OPTIONS.map((o) => o.value);
const VALID_VISIBILITY = SPOT_VISIBILITY_OPTIONS.map((o) => o.value);

/** POST /api/mastermind/spots — create a new Spot. Admin-only. */
export async function POST(request: NextRequest) {
  const admin = await getAdminProfileOrNull();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Partial<SpotFormValues> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.slug || typeof body.slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  if (!body.type || !VALID_TYPES.includes(body.type as SpotType)) {
    return NextResponse.json({ error: "type is invalid" }, { status: 400 });
  }
  if (!body.city || typeof body.city !== "string") {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }
  if (body.visibility && !VALID_VISIBILITY.includes(body.visibility as SpotVisibility)) {
    return NextResponse.json({ error: "visibility is invalid" }, { status: 400 });
  }

  const values: SpotFormValues = {
    name: body.name,
    slug: body.slug,
    type: body.type as SpotType,
    city: body.city,
    address: typeof body.address === "string" ? body.address : undefined,
    latitude: typeof body.latitude === "number" ? body.latitude : undefined,
    longitude: typeof body.longitude === "number" ? body.longitude : undefined,
    maps_url: typeof body.maps_url === "string" ? body.maps_url : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    image_url: typeof body.image_url === "string" ? body.image_url : undefined,
    operating_hours: typeof body.operating_hours === "string" ? body.operating_hours : undefined,
    community_id: typeof body.community_id === "string" ? body.community_id : undefined,
    visibility: body.visibility as SpotVisibility | undefined,
    // status / is_active are deliberately NOT taken from create payload —
    // server forces status='needs_audit' and is_active=true. Promotion goes
    // through PATCH below with explicit status/is_active fields.
  };

  const res = await createSpotAdmin(admin.id, values);
  if ("error" in res) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: res.id, slug: res.slug });
}
