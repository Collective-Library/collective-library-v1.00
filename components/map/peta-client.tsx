"use client";

import dynamic from "next/dynamic";
import type { MapMember } from "@/lib/profile";

// Leaflet uses window/document — must be client-only. Wrapped in a Client
// Component because Next 16 disallows ssr:false in Server Components.
const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="rounded-card-lg border border-hairline bg-paper h-[480px] flex items-center justify-center text-caption text-muted">
      Memuat peta…
    </div>
  ),
});

export function PetaClient({ members }: { members: MapMember[] }) {
  return <MapView members={members} />;
}
