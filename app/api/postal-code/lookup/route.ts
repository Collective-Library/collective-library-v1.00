// =============================================================================
// /api/postal-code/lookup — Indonesian kode pos resolver
//
// Hits kodepos.vercel.app (community API) and returns the matched location
// records. Each record includes village, district (kecamatan), regency
// (kota/kabupaten), province, AND lat/lng — so we can skip the separate
// Nominatim geocoding step for users who provide a postal code.
//
// Auth-gated to keep abuse to our own user base. CDN-cached 30 days since
// kode pos centroids don't move.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface KodeposResult {
  code: string | number;
  village?: string;
  district?: string;
  regency?: string;
  province?: string;
  latitude?: number | string;
  longitude?: number | string;
}

interface KodeposResponse {
  statusCode: number;
  code: string;
  data?: KodeposResult[];
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
  if (!q || q.length < 3) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }

  const url = `https://kodepos.vercel.app/search?q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CollectiveLibrary/0.1",
        Accept: "application/json",
      },
      // upstream is short-lived; we cache our own response below
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `upstream ${res.status}` },
        { status: 502 },
      );
    }

    const json = (await res.json()) as KodeposResponse;
    const records = json.data ?? [];

    // Normalise the rows into a stable shape; drop ones without a numeric
    // lat/lng so the map flow can rely on coords being present.
    const items = records
      .map((r) => {
        const lat =
          typeof r.latitude === "number" ? r.latitude : parseFloat(r.latitude ?? "");
        const lng =
          typeof r.longitude === "number" ? r.longitude : parseFloat(r.longitude ?? "");
        return {
          postal_code: String(r.code),
          village: r.village ?? "",
          district: r.district ?? "",
          regency: r.regency ?? "",
          province: r.province ?? "",
          lat: Number.isFinite(lat) ? lat : null,
          lng: Number.isFinite(lng) ? lng : null,
        };
      })
      .filter((r) => r.district && r.regency);

    return NextResponse.json(
      { found: items.length > 0, items },
      {
        headers: {
          // 30-day CDN cache; kode pos centroids don't move
          "Cache-Control":
            "public, s-maxage=2592000, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    console.error("[postal-code lookup] fetch failed", err);
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }
}
