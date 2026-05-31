import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const editPage = readFileSync("app/(app)/wanted/[id]/edit/page.tsx", "utf8");
const form = readFileSync("components/wanted/wanted-form.tsx", "utf8");
const deleteBtn = readFileSync("components/wanted/delete-wanted-button.tsx", "utf8");
const card = readFileSync("components/wanted/wanted-card.tsx", "utf8");
const listPage = readFileSync("app/(app)/wanted/page.tsx", "utf8");

test("edit route gates non-owners with notFound()", () => {
  assert.match(editPage, /wanted\.requester_id !== user\.id/);
  assert.match(editPage, /notFound\(\)/);
});

test("WantedForm supports an edit mode that updates in place", () => {
  assert.match(form, /mode\?: "create" \| "edit"/);
  assert.match(form, /\.update\(/);
  assert.match(form, /\.eq\("id", wantedId\)/);
});

test("WantedForm edit mode always resets status to open so the card stays visible", () => {
  // A WTB with a stale non-open status would be filtered out of listWantedRequests()
  // which defaults to status="open". Editing must force it back to open.
  assert.match(form, /status: "open"/);
});

test("DeleteWantedButton hard-deletes and detects the not-owner case", () => {
  assert.match(deleteBtn, /\.delete\(\)/);
  assert.match(deleteBtn, /data\.length === 0/);
});

test("WantedCard shows an owner-only edit/delete link", () => {
  assert.match(card, /isOwner/);
  assert.match(card, /\/wanted\/\$\{wanted\.id\}\/edit/);
});

test("wanted list page passes isOwner per card", () => {
  assert.match(listPage, /isOwner=\{viewerProfile\?\.id === w\.requester_id\}/);
});
