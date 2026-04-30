import Link from "next/link";
import type { Metadata } from "next";
import { listMembers, listAreas } from "@/lib/profile";
import { MemberCard } from "@/components/profile/member-card";
import { AnggotaFilterSheet } from "@/components/profile/anggota-filter-sheet";
import { MapTeaserWidget } from "@/components/profile/map-teaser-widget";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Anggota komunitas",
  description:
    "Direktori anggota Collective Library. Cari pembaca sefrekuensi by area, interest, atau mode (pinjam / jual / tukar).",
};

type SP = {
  interest?: string;
  intent?: string;
  city?: string;
  area?: string;
  open?: "lending" | "selling" | "trade";
};

export default async function AnggotaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const filters = await searchParams;
  const { interest, intent, city, area, open } = filters;

  const [members, areas] = await Promise.all([
    listMembers({ interest, intent, city, area, openFor: open }),
    listAreas(),
  ]);

  // Aggregate to city-level for the filter sheet, keeping per-city total
  const cityCountsMap = areas.reduce<Record<string, number>>((acc, a) => {
    acc[a.city] = (acc[a.city] ?? 0) + a.member_count;
    return acc;
  }, {});
  const cityOptions = Object.entries(cityCountsMap)
    .map(([cityName, count]) => ({ city: cityName, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));

  // Areas that have a kecamatan-level entry
  const areaOptions = areas
    .filter((a) => a.area)
    .map((a) => ({ city: a.city, area: a.area as string, count: a.member_count }));

  const hasAnyFilter = Boolean(interest || intent || city || area || open);
  const activeFilterLabels = activeFilterDescription({ interest, intent, city, area, open });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Anggota
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Anggota komunitas
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          {members.length} anggota{hasAnyFilter ? ` cocok dengan ${activeFilterLabels}` : ""}.
          Filter buat nemu temen di area lo, atau yang baca-buku-mirip.
        </p>
      </div>

      {/* Map teaser — server-rendered, no leaflet bundle here */}
      <MapTeaserWidget />

      {/* Filter trigger row + map link */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <AnggotaFilterSheet
          initialFilters={{ interest, intent, city, area, open }}
          cityOptions={cityOptions}
          areaOptions={areaOptions}
        />
        {hasAnyFilter && (
          <Link
            href="/anggota"
            className="text-caption text-muted hover:text-ink underline underline-offset-4 decoration-hairline-strong"
          >
            Reset semua
          </Link>
        )}
      </div>

      {/* Grid */}
      {members.length === 0 ? (
        <div className="rounded-card-lg border border-hairline bg-paper p-10 text-center">
          <p className="font-display text-title-lg text-ink">Belum ada yang cocok.</p>
          <p className="mt-2 text-body text-muted max-w-md mx-auto">
            Coba reset filter, atau ajak teman lo daftar.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Builds a human-friendly summary like "filter Semarang · psikologi · pinjam"
 *  for the page subtitle when filters are active. */
function activeFilterDescription(f: SP): string {
  const parts: string[] = [];
  if (f.city) parts.push(f.city);
  if (f.area) parts.push(f.area);
  if (f.interest) parts.push(f.interest);
  if (f.intent) parts.push(f.intent);
  if (f.open) parts.push(`buka ${f.open === "lending" ? "pinjam" : f.open === "selling" ? "jual" : "tukar"}`);
  return parts.join(" · ");
}
