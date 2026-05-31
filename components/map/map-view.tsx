"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Link from "next/link";
import type { MapMember } from "@/lib/profile";
import type { CollectiveMapItem, SpotMapItem } from "@/lib/map";
import { SPOT_TYPE_OPTIONS } from "@/lib/spots-constants";
import type { SpotType } from "@/types";

const SEMARANG_CENTER: [number, number] = [-6.9932, 110.4203];
const DEFAULT_ZOOM = 12;

export function MapView({ items }: { items: CollectiveMapItem[] }) {
  const view = useMemo(() => {
    if (items.length === 0) return { center: SEMARANG_CENTER, zoom: DEFAULT_ZOOM };
    if (items.length === 1) {
      return { center: [items[0].lat, items[0].lng] as [number, number], zoom: 13 };
    }
    // Center = arithmetic mean. Zoom stays at 11 unless we want fitBounds.
    const lat = items.reduce((s, it) => s + it.lat, 0) / items.length;
    const lng = items.reduce((s, it) => s + it.lng, 0) / items.length;
    return { center: [lat, lng] as [number, number], zoom: 11 };
  }, [items]);

  return (
    <div className="rounded-card-lg overflow-hidden border border-hairline-strong shadow-card">
      <style>{popupCss}</style>
      <MapContainer
        center={view.center}
        zoom={view.zoom}
        style={{ height: 480, width: "100%" }}
        scrollWheelZoom
      >
        {/* Carto Positron — soft, light, parchment-friendly */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {items.map((item) => {
          // Members are the only rendered layer in this slice. Spots (Slice 3)
          // and events (Slice 4) are typed in the union but not yet rendered.
          if (item.type === "member") {
            const member = item.data;
            const [lat, lng] = markerPosition(item);
            return (
              <Marker key={item.key} position={[lat, lng]} icon={buildAvatarIcon(member)}>
                <Popup className="cl-popup" closeButton={false}>
                  <MemberPopup member={member} />
                </Popup>
              </Marker>
            );
          }
          if (item.type === "spot") {
            const [lat, lng] = markerPosition(item); // exact — no jitter
            return (
              <Marker key={item.key} position={[lat, lng]} icon={buildSpotIcon(item.data.spotType)}>
                <Popup className="cl-popup" closeButton={false}>
                  <SpotPopup spot={item.data} />
                </Popup>
              </Marker>
            );
          }
          // Events (Slice 4) are typed in the union but not yet rendered.
          return null;
        })}
      </MapContainer>
    </div>
  );
}

// =============================================================================
// Marker position — approximate items (members at a kecamatan centroid) get a
// deterministic per-item jitter so same-area pins don't perfectly overlap. The
// seed stays the member id, so a pin never moves between loads — identical to
// the original members-only behaviour. Exact items (public Spots/events, future
// slices) are placed verbatim and never jittered.
// =============================================================================
function markerPosition(item: CollectiveMapItem): [number, number] {
  if (item.coordPrecision === "exact") return [item.lat, item.lng];
  const seed = item.type === "member" ? item.data.id : item.key;
  const { dlat, dlng } = deterministicJitter(seed);
  return [item.lat + dlat, item.lng + dlng];
}

function MemberPopup({ member }: { member: MapMember }) {
  const place = [member.address_area, member.city].filter(Boolean).join(", ");
  return (
    <div className="w-[260px] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-pill bg-cream border border-hairline-strong shrink-0"
          style={{
            backgroundImage: member.photo_url ? `url(${member.photo_url})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-title-sm text-ink truncate">
            {member.full_name ?? member.username}
          </p>
          <p className="text-caption text-muted truncate">{place || "—"}</p>
        </div>
      </div>

      {member.book_covers.length > 0 && (
        <div className="flex gap-1.5">
          {member.book_covers.slice(0, 4).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="w-12 h-16 object-cover rounded-button border border-hairline shrink-0"
            />
          ))}
          {member.book_count > 4 && (
            <div className="w-12 h-16 rounded-button bg-cream border border-hairline flex items-center justify-center text-caption text-muted shrink-0">
              +{member.book_count - 4}
            </div>
          )}
        </div>
      )}

      <Link
        href={`/profile/${member.username}`}
        className="inline-flex items-center justify-center h-9 px-4 rounded-pill bg-ink text-parchment text-caption font-semibold hover:bg-ink-soft"
      >
        Lihat profil
      </Link>
    </div>
  );
}

function SpotPopup({ spot }: { spot: SpotMapItem["data"] }) {
  const typeLabel = SPOT_TYPE_OPTIONS.find((o) => o.value === spot.spotType)?.label ?? "Spot";
  const meta = [typeLabel, spot.city].filter(Boolean).join(" · ");
  return (
    <div className="w-[240px] flex flex-col gap-2">
      <div className="min-w-0">
        <p className="font-display text-title-sm text-ink">{spot.name}</p>
        <p className="text-caption text-muted">{meta || "Spot"}</p>
      </div>

      {spot.description && <p className="text-caption text-ink-soft">{spot.description}</p>}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/spots/${spot.slug}`}
          className="inline-flex items-center justify-center h-9 px-4 rounded-pill bg-ink text-parchment text-caption font-semibold hover:bg-ink-soft"
        >
          Lihat Spot
        </Link>
        {spot.maps_url && (
          <a
            href={spot.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 px-4 rounded-pill bg-paper border border-hairline text-ink-soft text-caption font-medium hover:bg-cream"
          >
            Buka di Maps
          </a>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Avatar marker — Snapchat-style bubble (photo + ring + book-count badge)
// =============================================================================

function buildAvatarIcon(member: MapMember): L.DivIcon {
  const initial = (member.full_name ?? member.username ?? "?").trim().charAt(0).toUpperCase();
  const photo = member.photo_url
    ? `<div style="width:100%;height:100%;background-image:url('${escapeAttr(
        member.photo_url
      )}');background-size:cover;background-position:center;border-radius:9999px"></div>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#F0E8D8;color:#3D2E1F;font-weight:600;font-size:18px;border-radius:9999px">${escapeHtml(
        initial
      )}</div>`;
  const badge =
    member.book_count > 0
      ? `<div style="position:absolute;bottom:-2px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:9999px;background:#3D2E1F;color:#F0E8D8;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;border:2px solid #F0E8D8;box-shadow:0 1px 2px rgba(0,0,0,0.15)">${member.book_count}</div>`
      : "";
  const html = `
    <div style="position:relative;width:48px;height:48px">
      <div style="position:absolute;inset:0;border-radius:9999px;background:#F0E8D8;box-shadow:0 2px 6px rgba(61,46,31,0.25);padding:3px">
        ${photo}
      </div>
      ${badge}
    </div>
  `;
  return L.divIcon({
    html,
    className: "cl-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

// =============================================================================
// Spot marker — place-based square tile with the Spot's type emoji. Visually
// distinct from the circular member avatar bubble. Exact location (no jitter).
// =============================================================================
function buildSpotIcon(spotType: SpotType): L.DivIcon {
  const emoji = SPOT_TYPE_OPTIONS.find((o) => o.value === spotType)?.emoji ?? "📍";
  const html = `
    <div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:#F8F1DF;border:2px solid #3D2E1F;border-radius:10px;box-shadow:0 2px 6px rgba(61,46,31,0.28);font-size:17px">${escapeHtml(
      emoji
    )}</div>
  `;
  return L.divIcon({
    html,
    className: "cl-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

// =============================================================================
// Deterministic jitter — hash member.id to ±~0.0025° (~250m). Same input →
// same output, so a member's pin doesn't move between page loads.
// =============================================================================
function deterministicJitter(id: string): { dlat: number; dlng: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  const u32 = h >>> 0;
  const dx = ((u32 % 1000) - 500) / 200000;
  const dy = (((u32 >>> 16) % 1000) - 500) / 200000;
  return { dlat: dx, dlng: dy };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return s.replace(/'/g, "%27").replace(/"/g, "%22");
}

// Leaflet popup overrides — match parchment design language.
const popupCss = `
.cl-marker { background: transparent !important; border: none !important; }
.leaflet-popup.cl-popup .leaflet-popup-content-wrapper {
  background: #F8F1DF;
  color: #3D2E1F;
  border: 1px solid rgba(61,46,31,0.18);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(61,46,31,0.18);
  padding: 14px;
}
.leaflet-popup.cl-popup .leaflet-popup-content { margin: 0; line-height: 1.4; }
.leaflet-popup.cl-popup .leaflet-popup-tip { background: #F8F1DF; }
.leaflet-container { font-family: "DM Sans", system-ui, sans-serif; }
`;
