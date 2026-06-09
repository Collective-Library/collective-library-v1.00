import assert from "node:assert/strict";
import { test } from "node:test";
import { memberToMapItem } from "../lib/map.ts";

// Minimal MapMember stand-in — only the fields memberToMapItem reads/forwards.
function fakeMember(overrides = {}) {
  return {
    id: "u-123",
    full_name: "Test Reader",
    username: "testreader",
    photo_url: null,
    city: "Semarang",
    address_area: "Tembalang",
    bio: null,
    profession: null,
    interests: null,
    intents: null,
    open_for_lending: false,
    open_for_selling: false,
    open_for_trade: false,
    map_lat: -6.9932,
    map_lng: 110.4203,
    book_count: 5,
    book_covers: [],
    ...overrides,
  };
}

test("maps a member to an approximate member map item", () => {
  const item = memberToMapItem(fakeMember());

  assert.equal(item.type, "member");
  assert.equal(item.coordPrecision, "approximate");
  assert.equal(item.key, "member:u-123");
  assert.equal(item.lat, -6.9932);
  assert.equal(item.lng, 110.4203);
});

test("forwards the full member row as `data` so the popup keeps its richness", () => {
  const member = fakeMember({ id: "abc", book_count: 12 });
  const item = memberToMapItem(member);

  // Same reference — no lossy projection into generic fields.
  assert.equal(item.data, member);
  assert.equal(item.data.book_count, 12);
});

test("derives lat/lng from the member's approximate map coordinates", () => {
  const item = memberToMapItem(fakeMember({ map_lat: 1.5, map_lng: 2.5 }));

  assert.equal(item.lat, 1.5);
  assert.equal(item.lng, 2.5);
});

test("type-prefixes the key so a member id cannot collide with a spot/event id", () => {
  const item = memberToMapItem(fakeMember({ id: "42" }));

  assert.equal(item.key, "member:42");
  assert.notEqual(item.key, "42");
});
