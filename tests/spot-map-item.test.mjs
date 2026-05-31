import assert from "node:assert/strict";
import { test } from "node:test";
import { spotToMapItem } from "../lib/map.ts";

// Minimal SpotForMap stand-in — the display-safe shape listSpotsForMap returns.
function fakeSpot(overrides = {}) {
  return {
    id: "s-1",
    name: "Kopi & Buku",
    slug: "kopi-dan-buku",
    type: "cafe",
    city: "Semarang",
    image_url: null,
    description: "Tempat baca santai dekat kampus.",
    maps_url: "https://maps.example/kopi-dan-buku",
    latitude: -6.99,
    longitude: 110.42,
    ...overrides,
  };
}

test("maps a spot to an EXACT spot map item (so the renderer never jitters it)", () => {
  const item = spotToMapItem(fakeSpot());

  assert.equal(item.type, "spot");
  assert.equal(item.coordPrecision, "exact");
  assert.equal(item.key, "spot:s-1");
  assert.equal(item.lat, -6.99);
  assert.equal(item.lng, 110.42);
});

test("projects display-safe fields into data, mapping the DB `type` to `spotType`", () => {
  const item = spotToMapItem(fakeSpot({ type: "library", maps_url: null }));

  assert.equal(item.data.spotType, "library");
  assert.equal(item.data.name, "Kopi & Buku");
  assert.equal(item.data.slug, "kopi-dan-buku");
  assert.equal(item.data.city, "Semarang");
  assert.equal(item.data.maps_url, null);
});

test("type-prefixes the key so a spot id cannot collide with a member id", () => {
  const item = spotToMapItem(fakeSpot({ id: "42" }));

  assert.equal(item.key, "spot:42");
  assert.notEqual(item.key, "member:42");
});
