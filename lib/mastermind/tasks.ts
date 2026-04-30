import { createAdminClient } from "@/lib/supabase/admin";
import type { TaskStatus, TaskPriority, TeamTask, Profile } from "@/types";

export interface TaskWithRefs extends TeamTask {
  owner: Pick<Profile, "id" | "full_name" | "username" | "photo_url"> | null;
  objective: { id: string; code: string; title: string } | null;
  kr: { id: string; code: string; title: string } | null;
}

export async function listTasks(opts?: {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  ownerId?: string | "unassigned" | "any";
  objectiveId?: string;
}): Promise<TaskWithRefs[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("team_tasks")
    .select(`
      *,
      owner:profiles!team_tasks_owner_id_fkey(id, full_name, username, photo_url),
      objective:okr_objectives!team_tasks_related_objective_id_fkey(id, code, title),
      kr:okr_key_results!team_tasks_related_kr_id_fkey(id, code, title)
    `)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.status && opts.status !== "all") query = query.eq("status", opts.status);
  if (opts?.priority && opts.priority !== "all") query = query.eq("priority", opts.priority);
  if (opts?.ownerId === "unassigned") query = query.is("owner_id", null);
  else if (opts?.ownerId && opts.ownerId !== "any") query = query.eq("owner_id", opts.ownerId);
  if (opts?.objectiveId) query = query.eq("related_objective_id", opts.objectiveId);

  const { data, error } = await query;
  if (error) {
    console.error("listTasks", error);
    return [];
  }

  type Row = TeamTask & {
    owner: TaskWithRefs["owner"] | TaskWithRefs["owner"][] | null;
    objective: TaskWithRefs["objective"] | TaskWithRefs["objective"][] | null;
    kr: TaskWithRefs["kr"] | TaskWithRefs["kr"][] | null;
  };
  const flatten = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    owner: flatten(r.owner),
    objective: flatten(r.objective),
    kr: flatten(r.kr),
  }));
}

export async function getTaskById(id: string): Promise<TaskWithRefs | null> {
  const list = await listTasks();
  return list.find((t) => t.id === id) ?? null;
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<TeamTask, "status" | "priority" | "progress_pct" | "owner_id" | "end_date" | "milestone" | "deliverable" | "output_link" | "notes">>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("team_tasks")
    .update(patch)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createTask(input: {
  title: string;
  detail?: string;
  related_objective_id?: string | null;
  related_kr_id?: string | null;
  owner_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  end_date?: string | null;
  milestone?: string | null;
  deliverable?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("team_tasks")
    .insert(input)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
  return { ok: true, id: data.id as string };
}
