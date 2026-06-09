/**
 * /api/signals/evaluate — Supabase Database Webhook receiver for Collective Signals.
 *
 * Setup (mirrors /api/discord-webhook):
 *   1. Supabase Dashboard → Database → Webhooks → Create:
 *      - Table: activity_log
 *      - Events: INSERT
 *      - HTTP method: POST
 *      - URL: https://<your-app>/api/signals/evaluate
 *      - HTTP headers: Authorization=Bearer <SIGNALS_WEBHOOK_SECRET>
 *      - Save → enable
 *   2. Vercel env: SIGNALS_WEBHOOK_SECRET=<same random string>
 *      (can reuse DISCORD_WEBHOOK_SECRET or use a separate value)
 *
 * Flow:
 *   activity_log INSERT → this route → loop guard → evaluateUser
 *                      → user_signals (idempotent) → user_notifications
 *                      → (milestone) SIGNAL_UNLOCKED activity row
 *                      → discord-webhook fires on that new row
 *
 * Returns 200 on all non-auth paths (including errors) so Supabase
 * does not retry and create duplicate noise.
 */

import { NextResponse, type NextRequest } from "next/server";
import { evaluateUser } from "@/lib/signals/engine";

export const runtime = "nodejs";

const SHARED_SECRET = process.env.SIGNALS_WEBHOOK_SECRET;

interface WebhookRecord {
  id: string;
  actor_user_id: string | null;
  type: string;
  created_at: string;
  [key: string]: unknown;
}

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: WebhookRecord;
  old_record: unknown;
}

export async function POST(request: NextRequest) {
  // Auth — reject unknown callers
  if (SHARED_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${SHARED_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = (await request.json()) as SupabaseWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "activity_log") {
    return NextResponse.json({ ok: true, skipped: "not activity_log INSERT" });
  }

  const record = payload.record;

  // Loop guard: SIGNAL_UNLOCKED rows are written by the engine itself.
  // Evaluating on them would re-trigger evaluation → infinite loop.
  if (record.type === "SIGNAL_UNLOCKED") {
    return NextResponse.json({ ok: true, skipped: "SIGNAL_UNLOCKED loop guard" });
  }

  if (!record.actor_user_id) {
    return NextResponse.json({ ok: true, skipped: "no actor" });
  }

  try {
    const unlocked = await evaluateUser(record.actor_user_id, {
      announce: true,
      notify: true,
      sourceActivityId: record.id,
    });

    return NextResponse.json({
      ok: true,
      evaluated: record.actor_user_id,
      unlocked: unlocked.map((u) => u.signal_slug),
    });
  } catch (err) {
    // Return 200 so Supabase doesn't retry — the backfill sweep covers misses.
    console.error("[signals/evaluate] evaluateUser threw", err);
    return NextResponse.json({ ok: true, error: "evaluation failed" });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(SHARED_SECRET),
    note: "POST only — Supabase DB webhook on activity_log INSERT",
  });
}
