import assert from "node:assert/strict";
import { test } from "node:test";
import { bucketMemberBooks } from "../lib/member-books.ts";

test("counts every row per owner, even when covers are missing", () => {
  const rows = [
    { owner_id: "a", cover_url: null },
    { owner_id: "a", cover_url: null },
    { owner_id: "a", cover_url: null },
    { owner_id: "b", cover_url: "https://x/1.jpg" },
  ];
  const { countByOwner, coversByOwner } = bucketMemberBooks(rows);

  // Regression: a member with books but no cover_url must still be counted.
  assert.equal(countByOwner.get("a"), 3);
  assert.deepEqual(coversByOwner.get("a"), []);
  assert.equal(countByOwner.get("b"), 1);
  assert.deepEqual(coversByOwner.get("b"), ["https://x/1.jpg"]);
});

test("caps covers per owner at coverCap while count stays exact", () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({
    owner_id: "a",
    cover_url: `https://x/${i}.jpg`,
  }));
  const { countByOwner, coversByOwner } = bucketMemberBooks(rows, 3);

  assert.equal(countByOwner.get("a"), 10);
  assert.deepEqual(coversByOwner.get("a"), [
    "https://x/0.jpg",
    "https://x/1.jpg",
    "https://x/2.jpg",
  ]);
});

test("a prolific owner does not starve a quiet owner of their count", () => {
  // Mirrors the old global-limit bug at the bucketing layer: every owner's
  // rows must be counted regardless of how many another owner contributed.
  const rows = [
    ...Array.from({ length: 50 }, () => ({ owner_id: "prolific", cover_url: "c.jpg" })),
    { owner_id: "quiet", cover_url: "q.jpg" },
  ];
  const { countByOwner } = bucketMemberBooks(rows);

  assert.equal(countByOwner.get("prolific"), 50);
  assert.equal(countByOwner.get("quiet"), 1);
});

test("skips null covers but still collects up to the cap from non-null ones", () => {
  const rows = [
    { owner_id: "a", cover_url: null },
    { owner_id: "a", cover_url: "1.jpg" },
    { owner_id: "a", cover_url: null },
    { owner_id: "a", cover_url: "2.jpg" },
  ];
  const { countByOwner, coversByOwner } = bucketMemberBooks(rows, 3);

  assert.equal(countByOwner.get("a"), 4);
  assert.deepEqual(coversByOwner.get("a"), ["1.jpg", "2.jpg"]);
});

test("empty input yields empty maps", () => {
  const { countByOwner, coversByOwner } = bucketMemberBooks([]);
  assert.equal(countByOwner.size, 0);
  assert.equal(coversByOwner.size, 0);
});
