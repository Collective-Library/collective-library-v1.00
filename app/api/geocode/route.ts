// =============================================================================
// /api/geocode — kecamatan-level forward geocoding via Nominatim (OSM)
//
// Auth-gated: only authenticated users can hit this, to keep abuse contained
// to our own user base (Nominatim ToS: max 1 req/sec, no bulk geocoding).
//
// Cached aggressively (Cache-Control: 30 days) since kecamatan centroids
// don't move — repeat queries hit the CDN, not Nominatim.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }

  // Bias to Indonesia. Nominatim respects countrycodes filter.
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "id");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a real User-Agent identifying the app + contact
        "User-Agent": `CollectiveLibrary/0.1 (${getAppUrl()})`,
        Accept: "application/json",
        "Accept-Language": "id,en",
      },
      // Don't cache the upstream call here; we'll cache our own response
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `geocode upstream ${res.status}` },
        { status: 502 },
      );
    }

    const json = (await res.json()) as NominatimResult[];
    const hit = json[0];
    if (!hit) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        found: true,
        lat,
        lng,
        display_name: hit.display_name,
      },
      {
        headers: {
          // 30-day CDN cache; kecamatan centroids don't move
          "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    console.error("[geocode] fetch failed", err);
    return NextResponse.json({ error: "geocode failed" }, { status: 502 });
  }
}
