import { NextResponse, type NextRequest } from "next/server";
import { getAdminProfileOrNull } from "@/lib/mastermind/auth";
import { addNote } from "@/lib/mastermind/admin-notes";
import type { AdminNoteEntity } from "@/types";

const VALID_ENTITIES: AdminNoteEntity[] = [
  "user", "book", "wanted", "feedback", "okr_objective", "okr_key_result", "team_task",
];

/** POST a new admin note. Admin-only. */
export async function POST(request: NextRequest) {
  const admin = await getAdminProfileOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { entity_type?: string; entity_id?: string; note?: string }
    | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (!body.entity_type || !VALID_ENTITIES.includes(body.entity_type as AdminNoteEntity)) {
    return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });
  }
  if (!body.entity_id || typeof body.entity_id !== "string") {
    return NextResponse.json({ error: "Invalid entity_id" }, { status: 400 });
  }
  const note = (body.note ?? "").trim();
  if (note.length < 1 || note.length > 4000) {
    return NextResponse.json({ error: "Note length must be 1–4000 chars" }, { status: 400 });
  }

  const res = await addNote({
    entity_type: body.entity_type as AdminNoteEntity,
    entity_id: body.entity_id,
    note,
    created_by: admin.id,
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ ok: true, id: res.id });
}
