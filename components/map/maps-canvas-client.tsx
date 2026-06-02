"use client";

import dynamic from "next/dynamic";
import type { CollectiveMapItem } from "@/lib/map";

/**
 * Client boundary for the fullscreen `/maps` canvas.
 *
 * Leaflet needs window/document, so the canvas is dynamically imported with
 * `ssr: false` (Next 16 disallows `ssr: false` in Server Components). The
 * canvas fills its parent — the `/maps` page wraps this in a `100dvh`
 * container — and hides Leaflet's default zoom control so the page's floating
 * chrome owns the corners.
 */
const CollectiveMapCanvas = dynamic(
  () => import("./collective-map-canvas").then((m) => m.CollectiveMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-paper text-caption text-muted">
        Memuat peta…
      </div>
    ),
  }
);

export function MapsCanvasClient({ items }: { items: CollectiveMapItem[] }) {
  return <CollectiveMapCanvas items={items} height="100%" zoomControl={false} />;
}
