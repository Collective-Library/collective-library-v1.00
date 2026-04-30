import { createAdminClient } from "@/lib/supabase/admin";
import { computeKrBatch } from "./kr-compute";
import type { OkrKeyResult, OkrObjective, OkrObjectiveWithKRs } from "@/types";

/**
 * Read OKRs + KRs for the Control Tower. Auto-computed KRs get their
 * `current_value` resolved live; manual KRs keep the value persisted in
 * the DB.
 *
 * Note: we do NOT write the resolved auto-compute value back to the DB —
 * the source of truth stays the registry, and the dashboard always reads
 * fresh. The DB column is left as the "manual fallback / cached value".
 */

export async function listObjectives(quarter = "Q2-2026"): Promise<OkrObjectiveWithKRs[]> {
  const supabase = createAdminClient();

  const [{ data: objectives }, { data: krs }] = await Promise.all([
    supabase
      .from("okr_objectives")
      .select("*")
      .eq("quarter", quarter)
      .order("sort_order"),
    supabase
      .from("okr_key_results")
      .select("*")
      .order("sort_order"),
  ]);

  const objs = (objectives ?? []) as OkrObjective[];
  const allKrs = (krs ?? []) as OkrKeyResult[];

  // Resolve auto-compute keys live
  const computeKeys = allKrs
    .map((k) => k.auto_compute_key)
    .filter((k): k is string => Boolean(k));
  const computed = await computeKrBatch(computeKeys);

  return objs.map((obj) => {
    const own = allKrs
      .filter((k) => k.objective_id === obj.id)
      .map((kr) => {
        if (kr.auto_compute_key && computed.has(kr.auto_compute_key)) {
          return { ...kr, current_value: computed.get(kr.auto_compute_key)! };
        }
        return kr;
      });
    // Recompute objective progress as the avg of KR progress %
    const progressPct =
      own.length === 0
        ? Number(obj.progress_pct) || 0
        : Math.round(
            own.reduce((sum, kr) => {
              const target = Number(kr.target_value) || 0;
              const current = Number(kr.current_value) || 0;
              const krPct = target === 0 ? 0 : Math.min(100, (current / target) * 100);
              return sum + krPct;
            }, 0) / own.length,
          );
    return { ...obj, key_results: own, progress_pct: progressPct };
  });
}

export async function getObjectiveByCode(code: string): Promise<OkrObjectiveWithKRs | null> {
  const list = await listObjectives();
  return list.find((o) => o.code === code) ?? null;
}

export async function getKeyResultById(id: string): Promise<OkrKeyResult | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("okr_key_results")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return data as OkrKeyResult;
}

/** Used by the OKR edit drawer / API route. Validates input client-side
 *  but the RLS policy is the actual gate. */
export async function updateKeyResult(
  id: string,
  patch: { current_value?: number; status?: string; notes?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("okr_key_results")
    .update(patch)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
