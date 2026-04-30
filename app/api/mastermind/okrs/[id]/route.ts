import { NextResponse, type NextRequest } from "next/server";
import { getAdminProfileOrNull } from "@/lib/mastermind/auth";
import { updateKeyResult } from "@/lib/mastermind/okrs";
import type { OkrStatus } from "@/types";

const VALID_STATUS: OkrStatus[] = ["on_track", "at_risk", "behind", "done"];

/** PATCH a single Key Result. Admin-only via requireAdmin gate. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminProfileOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { current_value?: number; status?: string; notes?: string }
    | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const patch: { current_value?: number; status?: OkrStatus; notes?: string | null } = {};
  if (typeof body.current_value === "number" && Number.isFinite(body.current_value)) {
    patch.current_value = Math.max(0, body.current_value);
  }
  if (body.status && VALID_STATUS.includes(body.status as OkrStatus)) {
    patch.status = body.status as OkrStatus;
  }
  if (typeof body.notes === "string") {
    patch.notes = body.notes.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const res = await updateKeyResult(id, patch);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
