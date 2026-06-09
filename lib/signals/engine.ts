import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/url";
import { computeMetric } from "./metrics";
import type { SignalDefinition, SignalMetric } from "@/types";

export interface EvaluateOptions {
  /** Fire SIGNAL_UNLOCKED activity row + Discord embed for milestone signals. */
  announce: boolean;
  /** Write user_notifications private inbox entry. */
  notify: boolean;
  /** activity_log.id that triggered this evaluation (for source_activity_id FK). */
  sourceActivityId?: string;
}

export interface UnlockResult {
  signal_slug: string;
  user_signal_id: string;
}

type RuleRow = {
  signal_slug: string;
  metric: string;
  threshold: number;
  is_active: boolean;
  definition: SignalDefinition | SignalDefinition[] | null;
};

const flatten = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/**
 * Evaluate all active signal rules for a user and unlock any newly eligible
 * Signals. Idempotent: user_signals has UNIQUE(user_id, signal_slug) so
 * calling this N times for the same user produces exactly one row per Signal.
 *
 * Writes are independent per signal: a failed notification or activity_log
 * insert does NOT roll back the user_signals unlock (durable first).
 *
 * Called from:
 *   /api/signals/evaluate  (real-time, announce+notify)
 *   /api/feedback POST     (feedback edge case, announce+notify)
 *   /api/signals/backfill  (sweep, announce:false notify:false)
 */
export async function evaluateUser(userId: string, opts: EvaluateOptions): Promise<UnlockResult[]> {
  const { announce, notify, sourceActivityId } = opts;
  const db = createAdminClient();

  // Load all active rules with their signal definition in one round-trip.
  // signal_rules has no public RLS policy — service-role only.
  const { data: rules, error: rulesErr } = await db
    .from("signal_rules")
    .select(
      `signal_slug, metric, threshold, is_active,
       definition:signal_definitions!signal_slug(
         slug, name, description, emoji, category, announce,
         card_headline, card_subcopy, sort_order, created_at
       )`
    )
    .eq("is_active", true);

  if (rulesErr || !rules) {
    console.error("[signals/engine] failed to load rules", rulesErr);
    return [];
  }

  // Group rules by signal_slug so multi-rule signals use AND logic.
  const rulesBySlug = new Map<string, RuleRow[]>();
  for (const rule of rules as RuleRow[]) {
    const group = rulesBySlug.get(rule.signal_slug) ?? [];
    group.push(rule);
    rulesBySlug.set(rule.signal_slug, group);
  }

  const results: UnlockResult[] = [];
  const base = getAppUrl();

  for (const [slug, signalRules] of rulesBySlug) {
    const def = flatten(signalRules[0]?.definition) as SignalDefinition | null;
    if (!def) continue;

    // AND-combine: every rule must meet its threshold.
    let allMet = true;
    for (const rule of signalRules) {
      const val = await computeMetric(userId, rule.metric as SignalMetric);
      if (val < rule.threshold) {
        allMet = false;
        break;
      }
    }
    if (!allMet) continue;

    // Idempotent insert — ON CONFLICT DO NOTHING via ignoreDuplicates.
    // data is null when the row already existed (conflict), so we skip
    // downstream writes for already-unlocked signals.
    const { data: newSignal } = await db
      .from("user_signals")
      .upsert(
        {
          user_id: userId,
          signal_slug: slug,
          source_activity_id: sourceActivityId ?? null,
        },
        { onConflict: "user_id,signal_slug", ignoreDuplicates: true }
      )
      .select("id")
      .maybeSingle();

    if (!newSignal) continue; // already unlocked

    const userSignalId = newSignal.id as string;
    results.push({ signal_slug: slug, user_signal_id: userSignalId });

    // Private notification — always when notify=true.
    if (notify) {
      const { error: notifErr } = await db.from("user_notifications").insert({
        recipient_user_id: userId,
        actor_user_id: null,
        type: "SIGNAL_UNLOCKED",
        object_type: "signal",
        object_id: userSignalId,
        title: `Kamu unlock ${def.name}`,
        body: def.card_subcopy ?? def.description ?? null,
        url: `${base}/signal/${userSignalId}`,
        image_url: `${base}/api/og/signal/${userSignalId}?format=preview`,
        metadata: { signal_slug: slug, emoji: def.emoji ?? null },
      });

      if (notifErr && notifErr.code !== "23505") {
        console.error(`[signals/engine] notification insert failed for ${slug}`, notifErr);
      }
    }

    // Public SIGNAL_UNLOCKED activity row — milestone signals only.
    // This is what the existing discord-webhook DB webhook picks up.
    if (announce && def.announce) {
      const { error: actErr } = await db.from("activity_log").insert({
        actor_user_id: userId,
        type: "SIGNAL_UNLOCKED",
        user_signal_id: userSignalId,
        metadata: {
          signal_slug: slug,
          signal_name: def.name,
          emoji: def.emoji ?? null,
        },
      });

      if (actErr) {
        // Non-fatal: unlock is durable. Discord won't fire but the Signal
        // is still on the profile and in the private notification.
        console.error(
          `[signals/engine] SIGNAL_UNLOCKED activity insert failed for ${slug}`,
          actErr
        );
      }
    }
  }

  return results;
}
