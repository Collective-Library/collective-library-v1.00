import { NextResponse, type NextRequest } from "next/server";
import { getAdminProfileOrNull } from "@/lib/mastermind/auth";
import { updateTask } from "@/lib/mastermind/tasks";
import type { TaskPriority, TaskStatus } from "@/types";

const VALID_STATUS: TaskStatus[] = ["todo", "in_progress", "blocked", "done", "canceled"];
const VALID_PRIORITY: TaskPriority[] = ["low", "med", "high", "urgent"];

/** PATCH a single team task. Admin-only. */
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
    | {
        status?: string;
        priority?: string;
        progress_pct?: number;
        owner_id?: string | null;
        end_date?: string | null;
        milestone?: string | null;
        deliverable?: string | null;
        output_link?: string | null;
        notes?: string | null;
      }
    | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const patch: Parameters<typeof updateTask>[1] = {};
  if (body.status && VALID_STATUS.includes(body.status as TaskStatus)) {
    patch.status = body.status as TaskStatus;
  }
  if (body.priority && VALID_PRIORITY.includes(body.priority as TaskPriority)) {
    patch.priority = body.priority as TaskPriority;
  }
  if (typeof body.progress_pct === "number" && Number.isFinite(body.progress_pct)) {
    patch.progress_pct = Math.max(0, Math.min(100, body.progress_pct));
  }
  if (body.owner_id !== undefined) patch.owner_id = body.owner_id;
  if (body.end_date !== undefined) patch.end_date = body.end_date;
  if (body.milestone !== undefined) patch.milestone = body.milestone;
  if (body.deliverable !== undefined) patch.deliverable = body.deliverable;
  if (body.output_link !== undefined) patch.output_link = body.output_link;
  if (body.notes !== undefined) patch.notes = body.notes;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const res = await updateTask(id, patch);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
