import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const formSource = readFileSync("components/books/add-book-form.tsx", "utf8");
const olSource = readFileSync("lib/openlibrary.ts", "utf8");

test("applyAutofill enriches the synopsis via lookupIsbn when a pick lacks a description", () => {
  // "cara cepat" picks (esp. Open Library) arrive without a synopsis; the form
  // must fetch the fuller record so the synopsis is filled.
  assert.match(formSource, /async function applyAutofill/);
  assert.match(formSource, /if \(!b\.description && b\.isbn\)/);
  assert.match(formSource, /await lookupIsbn\(b\.isbn\)/);
});

test("add-book-form surfaces a cover-upload failure instead of failing silently", () => {
  assert.match(formSource, /coverUpdateErr/);
  assert.match(formSource, /toast\.warning/);
});

test("Open Library search still omits description (the gap the enrichment patches)", () => {
  // Locks the assumption behind the fix: OL search returns description: null.
  assert.match(olSource, /description: null/);
});
