import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const buttonSource = readFileSync(
  "app/(app)/event/[id]/edit/delete-event-button.tsx",
  "utf8",
);
const eventsLib = readFileSync("lib/events.ts", "utf8");

test("DeleteEventButton hard-deletes instead of soft-hiding", () => {
  assert.match(buttonSource, /\.delete\(\)/);
  assert.doesNotMatch(buttonSource, /is_hidden: true/);
});

test("DeleteEventButton detects the not-owner / zero-row case", () => {
  assert.match(buttonSource, /data\.length === 0/);
});

test("deleteEvent lib helper also hard-deletes (no soft-delete update)", () => {
  // Prettier splits the chain across lines so we match each method separately.
  assert.match(eventsLib, /\.from\("events"\)/);
  assert.match(eventsLib, /\.delete\(\)/);
  assert.doesNotMatch(eventsLib, /update\(\{ is_hidden: true, status: "cancelled" \}\)/);
});

test("deleteEvent lib helper detects RLS no-op via row count, not just error", () => {
  // Without .select("id") the function returned {ok:true} even when RLS silently
  // deleted 0 rows. The guard prevents false success for non-owner callers.
  assert.match(eventsLib, /\.select\("id"\)/);
  assert.match(eventsLib, /data\.length === 0/);
  assert.match(eventsLib, /Unauthorized or not found/);
});
