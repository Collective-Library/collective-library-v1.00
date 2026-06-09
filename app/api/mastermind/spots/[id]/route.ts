import { NextResponse, type NextRequest } from "next/server";
import { getAdminProfileOrNull } from "@/lib/mastermind/auth";
import {
  SPOT_STATUS_OPTIONS,
  SPOT_TYPE_OPTIONS,
  SPOT_VISIBILITY_OPTIONS,
  deleteSpotAdmin,
  setSpotActiveAdmin,
  setSpotStatusAdmin,
  setSpotVisibilityAdmin,
  updateSpotAdmin,
} from "@/lib/spots";
import type { SpotFormValues, SpotStatus, SpotType, SpotVisibility } from "@/types";

const VALID_TYPES = SPOT_TYPE_OPTIONS.map((o) => o.value);
const VALID_STATUS = SPOT_STATUS_OPTIONS.map((o) => o.value);
const VALID_VISIBILITY = SPOT_VISIBILITY_OPTIONS.map((o) => o.value);

/**
 * PATCH /api/mastermind/spots/[id] — admin update.
 *
 * Accepts:
 *   - Editable fields (forwarded to updateSpotAdmin)
 *   - Privileged fields: status, is_active, visibility — each routed to its
 *     dedicated entry point so admin actions stay greppable.
 *
 * Returns 400 on validation failure, 403 on non-admin, 500 on DB error.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminProfileOrNull();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | (Partial<SpotFormValues> & {
        status?: SpotStatus;
        is_active?: boolean;
        visibility?: SpotVisibility;
      })
    | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Validate enum-ish fields up front.
  if (body.type !== undefined && !VALID_TYPES.includes(body.type as SpotType)) {
    return NextResponse.json({ error: "type is invalid" }, { status: 400 });
  }
  if (body.status !== undefined && !VALID_STATUS.includes(body.status as SpotStatus)) {
    return NextResponse.json({ error: "status is invalid" }, { status: 400 });
  }
  if (
    body.visibility !== undefined &&
    !VALID_VISIBILITY.includes(body.visibility as SpotVisibility)
  ) {
    return NextResponse.json({ error: "visibility is invalid" }, { status: 400 });
  }
  if (body.is_active !== undefined && typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active must be boolean" }, { status: 400 });
  }

  // Privileged single-field updates (status / is_active / visibility) routed
  // through dedicated entry points. Each fires the appropriate side-effect
  // (status transition → emit_node_created trigger).
  if (body.status !== undefined) {
    const r = await setSpotStatusAdmin(id, body.status);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 });
  }
  if (body.is_active !== undefined) {
    const r = await setSpotActiveAdmin(id, body.is_active);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 });
  }
  if (body.visibility !== undefined) {
    const r = await setSpotVisibilityAdmin(id, body.visibility);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 500 });
  }

  // Editable fields → updateSpotAdmin (which itself ignores privileged columns).
  const editablePatch: Partial<SpotFormValues> & { slug?: string } = {};
  if (body.name !== undefined) editablePatch.name = body.name;
  if (body.slug !== undefined) editablePatch.slug = body.slug;
  if (body.type !== undefined) editablePatch.type = body.type as SpotType;
  if (body.city !== undefined) editablePatch.city = body.city;
  if (body.address !== undefined) editablePatch.address = body.address;
  if (body.latitude !== undefined) editablePatch.latitude = body.latitude;
  if (body.longitude !== undefined) editablePatch.longitude = body.longitude;
  if (body.maps_url !== undefined) editablePatch.maps_url = body.maps_url;
  if (body.description !== undefined) editablePatch.description = body.description;
  if (body.image_url !== undefined) editablePatch.image_url = body.image_url;
  if (body.operating_hours !== undefined) editablePatch.operating_hours = body.operating_hours;
  if (body.community_id !== undefined) editablePatch.community_id = body.community_id;

  if (Object.keys(editablePatch).length > 0) {
    const r = await updateSpotAdmin(id, editablePatch);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/mastermind/spots/[id] — admin hard-delete. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminProfileOrNull();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const res = await deleteSpotAdmin(id);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
