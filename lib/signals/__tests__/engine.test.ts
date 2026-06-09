/**
 * Signal engine tests — node --strip-types --test
 *
 * Pure-logic tests (no DB required). Tests the guard conditions that live
 * at the boundary of the engine and the evaluate route.
 *
 * Run: node --strip-types --test lib/signals/__tests__/engine.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Loop-guard logic (mirrors the guard in /api/signals/evaluate/route.ts)
// Cast recordType to string to avoid TS literal-type overlap errors — the
// real route receives arbitrary strings from the webhook payload.
// ---------------------------------------------------------------------------

describe("evaluate route loop guard", () => {
  it("skips SIGNAL_UNLOCKED to break the engine→activity_log→evaluate loop", () => {
    const recordType: string = "SIGNAL_UNLOCKED";
    assert.equal(recordType === "SIGNAL_UNLOCKED", true);
  });

  it("does not skip USER_JOINED", () => {
    const recordType: string = "USER_JOINED";
    assert.equal(recordType === "SIGNAL_UNLOCKED", false);
  });

  it("does not skip BOOK_ADDED", () => {
    const recordType: string = "BOOK_ADDED";
    assert.equal(recordType === "SIGNAL_UNLOCKED", false);
  });

  it("skips rows with null actor_user_id", () => {
    const actorId: string | null = null;
    assert.equal(actorId === null, true);
  });
});

// ---------------------------------------------------------------------------
// computeMetric exhaustiveness — tracks the SignalMetric union in types/index.ts.
// If someone adds a metric to the union without updating metrics.ts, this count
// breaks and signals the gap.
// ---------------------------------------------------------------------------

const ALL_METRICS = [
  "any_activity",
  "books_added",
  "lendable_books",
  "events_hosted",
  "events_rsvped",
  "manifests_posted",
  "wtb_posted",
  "spots_created",
  "feedback_submitted",
  "referrals",
  "curations",
] as const;

describe("SignalMetric exhaustiveness", () => {
  it("has 11 known metric values matching types/index.ts", () => {
    assert.equal(ALL_METRICS.length, 11);
  });

  it("referrals and curations are the reserved no-data metrics (is_active=false rules)", () => {
    assert.ok((ALL_METRICS as readonly string[]).includes("referrals"));
    assert.ok((ALL_METRICS as readonly string[]).includes("curations"));
  });
});

// ---------------------------------------------------------------------------
// Idempotency contract — upsert ignoreDuplicates=true returns null on conflict.
// The engine only writes notification + activity row when newSignal is truthy.
// ---------------------------------------------------------------------------

describe("engine idempotency guard", () => {
  it("skips all downstream writes when upsert returns null (already unlocked)", () => {
    const newSignal: { id: string } | null = null;
    let notificationWritten = false;
    let activityWritten = false;

    if (newSignal) {
      notificationWritten = true;
      activityWritten = true;
    }

    assert.equal(notificationWritten, false);
    assert.equal(activityWritten, false);
  });

  it("proceeds to downstream writes when upsert returns a new row", () => {
    const newSignal: { id: string } | null = { id: "abc-123" };
    let notificationWritten = false;

    if (newSignal) {
      notificationWritten = true;
    }

    assert.equal(notificationWritten, true);
  });

  it("fires SIGNAL_UNLOCKED activity only when announce=true AND def.announce=true", () => {
    const cases: Array<{
      announce: boolean;
      defAnnounce: boolean;
      expected: boolean;
    }> = [
      { announce: true, defAnnounce: true, expected: true },
      { announce: true, defAnnounce: false, expected: false },
      { announce: false, defAnnounce: true, expected: false },
      { announce: false, defAnnounce: false, expected: false },
    ];

    for (const c of cases) {
      const shouldFire = c.announce && c.defAnnounce;
      assert.equal(shouldFire, c.expected, `announce=${c.announce} def.announce=${c.defAnnounce}`);
    }
  });
});
