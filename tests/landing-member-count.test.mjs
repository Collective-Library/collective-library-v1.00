import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const profileSource = readFileSync("lib/profile.ts", "utf8");
const stripSource = readFileSync("components/landing/recent-members-strip.tsx", "utf8");

test("listLandingMembers no longer caps member books with a global limit", () => {
  // The global `.limit(ids.length * 6)` starved members of rows → "0 buku".
  assert.doesNotMatch(profileSource, /ids\.length\s*\*\s*6/);
});

test("listLandingMembers buckets via the pure, unit-tested helper", () => {
  assert.match(profileSource, /bucketMemberBooks/);
});

test("member strip empty state is keyed on book_count, not book_covers", () => {
  // Members with books but no covers must not render "Belum ada buku".
  assert.match(stripSource, /m\.book_count > 0/);
  assert.match(stripSource, /\{m\.book_count\} buku/);
});
