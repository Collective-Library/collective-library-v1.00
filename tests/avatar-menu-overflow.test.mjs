import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const menuSource = readFileSync("components/layout/avatar-menu.tsx", "utf8");
const navConfig = readFileSync("components/layout/nav-config.ts", "utf8");

test("avatar dropdown is scroll-safe so Sign out stays reachable on mobile", () => {
  assert.match(menuSource, /overflow-y-auto/);
  assert.match(menuSource, /max-h-\[/);
  // The old clipping container (no max-height) must be gone.
  assert.doesNotMatch(menuSource, /shadow-modal overflow-hidden z-50/);
});

test("avatar menu still renders Sign out", () => {
  assert.match(menuSource, /Sign out/);
});

test("avatar menu nav items are curated (duplicated nav links removed, Add book kept)", () => {
  // Activity / Members / Events / Manifest are reachable from the persistent nav.
  assert.doesNotMatch(navConfig, /id: "a-activity"/);
  assert.doesNotMatch(navConfig, /id: "a-members"/);
  assert.doesNotMatch(navConfig, /id: "a-events"/);
  assert.doesNotMatch(navConfig, /id: "a-manifest"/);
  assert.match(navConfig, /id: "a-addbook"/);
});
