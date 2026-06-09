"use client";

import type { CollectiveMapItem } from "@/lib/map";
import { CollectiveMapCanvas } from "./collective-map-canvas";

/**
 * Card-wrapped map for /peta. Renders the shared CollectiveMapCanvas at the
 * standard 480px card height with parchment border and shadow styling.
 *
 * Must be loaded via dynamic import with ssr:false because CollectiveMapCanvas
 * imports Leaflet which requires window/document. peta-client.tsx already does
 * this — no change there.
 */
export function MapView({ items }: { items: CollectiveMapItem[] }) {
  return (
    <div className="rounded-card-lg overflow-hidden border border-hairline-strong shadow-card">
      <CollectiveMapCanvas items={items} height={480} />
    </div>
  );
}
