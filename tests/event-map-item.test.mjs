import assert from "node:assert/strict";
import { test } from "node:test";
import { eventToMapItem } from "../lib/map.ts";

// Minimal EventForMap stand-in — the display-safe shape listEventsForMap returns
// (coords already resolved from the linked public Spot).
function fakeEvent(overrides = {}) {
  return {
    id: "e-1",
    title: "Baca Bareng Sore",
    starts_at: "2026-06-20T12:00:00.000Z",
    timezone: "Asia/Jakarta",
    cover_url: null,
    spot: { name: "Kopi & Buku", slug: "kopi-dan-buku", city: "Semarang" },
    latitude: -6.99,
    longitude: 110.42,
    ...overrides,
  };
}

test("maps an event to an EXACT event map item (coords borrowed from the Spot)", () => {
  const item = eventToMapItem(fakeEvent());

  assert.equal(item.type, "event");
  assert.equal(item.coordPrecision, "exact");
  assert.equal(item.key, "event:e-1");
  assert.equal(item.lat, -6.99);
  assert.equal(item.lng, 110.42);
});

test("carries the linked Spot + schedule into data for the popup", () => {
  const item = eventToMapItem(fakeEvent());

  assert.equal(item.data.title, "Baca Bareng Sore");
  assert.equal(item.data.spot.name, "Kopi & Buku");
  assert.equal(item.data.spot.slug, "kopi-dan-buku");
  assert.equal(item.data.starts_at, "2026-06-20T12:00:00.000Z");
});

test("type-prefixes the key so an event id cannot collide with a spot/member id", () => {
  const item = eventToMapItem(fakeEvent({ id: "42" }));

  assert.equal(item.key, "event:42");
  assert.notEqual(item.key, "spot:42");
});
