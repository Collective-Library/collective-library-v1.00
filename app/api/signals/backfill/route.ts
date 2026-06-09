import { NextResponse, type NextRequest } from "next/server";
import { getAdminProfileOrNull } from "@/lib/mastermind/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateUser } from "@/lib/signals/engine";

export const runtime = "nodejs";

/**
 * Admin-only silent sweep: evaluates every profile against all Signal rules
 * and writes user_signals rows for any newly eligible unlocks.
 *
 * Silent mode (announce:false, notify:false) means:
 * - NO activity_log SIGNAL_UNLOCKED rows  → no Discord "Signal Drop"
 * - NO user_notifications rows            → no bell unread count change
 * Unlocks appear on profiles and /signal/[id] immediately.
 *
 * Idempotent — safe to re-run. The engine uses upsert + ignoreDuplicates so
 * previously unlocked Signals are skipped at the DB level.
 *
 * POST /api/signals/backfill
 *   ?limit=N  — process only the first N profiles (useful for dry-run)
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminProfileOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 5000) : 5000;

  const db = createAdminClient();
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[signals/backfill] failed to fetch profiles", error);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const results: { user_id: string; unlocked: string[] }[] = [];
  let totalUnlocks = 0;

  for (const p of profiles ?? []) {
    try {
      const unlocked = await evaluateUser(p.id as string, {
        announce: false,
        notify: false,
      });
      if (unlocked.length > 0) {
        results.push({
          user_id: p.id as string,
          unlocked: unlocked.map((u) => u.signal_slug),
        });
        totalUnlocks += unlocked.length;
      }
    } catch (err) {
      console.error("[signals/backfill] evaluateUser failed for", p.id, err);
    }
  }

  return NextResponse.json({
    ok: true,
    profiles_processed: (profiles ?? []).length,
    total_new_unlocks: totalUnlocks,
    unlocks: results,
  });
}

export async function GET() {
  return NextResponse.json({
    hint: "POST to this endpoint to run the backfill sweep. Admin only.",
  });
}
