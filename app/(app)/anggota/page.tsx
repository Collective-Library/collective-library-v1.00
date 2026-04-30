import Link from "next/link";
import type { Metadata } from "next";
import { listMembers, listAreas, type AreaOption } from "@/lib/profile";
import { BROAD_INTERESTS, INTENTS } from "@/lib/interests";
import { MemberCard } from "@/components/profile/member-card";
import { cn } from "@/lib/cn";

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
  const { interest, intent, city, area, open } = await searchParams;
  const [members, areas] = await Promise.all([
    listMembers({ interest, intent, city, area, openFor: open }),
    listAreas(),
  ]);

  // Aggregate to city-level for the city row, keeping per-city total
  const cityCounts = areas.reduce<Record<string, number>>((acc, a) => {
    acc[a.city] = (acc[a.city] ?? 0) + a.member_count;
    return acc;
  }, {});
  const distinctCities = Object.keys(cityCounts).sort(
    (a, b) => cityCounts[b] - cityCounts[a] || a.localeCompare(b),
  );

  // Areas filtered to the selected city — keeps the kecamatan list scoped
  const areasInCity = city
    ? areas.filter((a) => a.city.toLowerCase() === city.toLowerCase() && a.area)
    : areas.filter((a) => a.area);

  const hasAnyFilter = Boolean(interest || intent || city || area || open);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Anggota
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Anggota komunitas
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">
            {members.length} anggota cocok. Filter buat nemu temen di area lo, atau yang baca-buku-mirip.
          </p>
        </div>
        <Link
          href="/peta"
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-pill text-body-sm font-medium bg-paper border border-hairline-strong text-ink-soft hover:bg-cream"
        >
          <MapPinIcon />
          Peta
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">
            Filter
          </p>
          {hasAnyFilter && (
            <Link
              href="/anggota"
              className="text-caption text-muted hover:text-ink underline underline-offset-4"
            >
              Reset
            </Link>
          )}
        </div>

        {/* City row — only if there are >1 distinct cities */}
        {distinctCities.length > 1 && (
          <FilterRow label="Kota">
            <FilterPill
              href={buildHref({ interest, open })}
              active={!city}
              label="Semua kota"
            />
            {distinctCities.map((c) => (
              <FilterPill
                key={c}
                href={buildHref({ interest, city: c, open })}
                active={city?.toLowerCase() === c.toLowerCase()}
                label={`${c} (${cityCounts[c]})`}
              />
            ))}
          </FilterRow>
        )}

        {/* Area row — only if there are kecamatan-level entries */}
        {areasInCity.length > 0 && (
          <FilterRow label="Area / kecamatan">
            <FilterPill
              href={buildHref({ interest, city, open })}
              active={!area}
              label="Semua area"
            />
            {areasInCity.map((a) => (
              <FilterPill
                key={`${a.city}-${a.area}`}
                href={buildHref({
                  interest,
                  city: a.city,
                  area: a.area ?? undefined,
                  open,
                })}
                active={
                  area?.toLowerCase() === (a.area ?? "").toLowerCase() &&
                  city?.toLowerCase() === a.city.toLowerCase()
                }
                label={`${a.area} (${a.member_count})`}
              />
            ))}
          </FilterRow>
        )}

        {/* Interest row */}
        <FilterRow label="Interest">
          <FilterPill
            href={buildHref({ intent, city, area, open })}
            active={!interest}
            label="Semua interest"
          />
          {BROAD_INTERESTS.map((i) => (
            <FilterPill
              key={i.slug}
              href={buildHref({ interest: i.slug, intent, city, area, open })}
              active={interest === i.slug}
              label={`${i.emoji} ${i.label}`}
            />
          ))}
        </FilterRow>

        {/* Intent row — what they're available for */}
        <FilterRow label="Available untuk">
          <FilterPill
            href={buildHref({ interest, city, area, open })}
            active={!intent}
            label="Apa aja"
          />
          {INTENTS.map((i) => (
            <FilterPill
              key={i.slug}
              href={buildHref({ interest, intent: i.slug, city, area, open })}
              active={intent === i.slug}
              label={`${i.emoji} ${i.label}`}
            />
          ))}
        </FilterRow>

        {/* Mode row */}
        <FilterRow label="Mode">
          <FilterPill
            href={buildHref({ interest, intent, city, area })}
            active={!open}
            label="Semua mode"
          />
          <FilterPill
            href={buildHref({ interest, intent, city, area, open: "lending" })}
            active={open === "lending"}
            label="Buka pinjam"
          />
          <FilterPill
            href={buildHref({ interest, intent, city, area, open: "selling" })}
            active={open === "selling"}
            label="Buka jual"
          />
          <FilterPill
            href={buildHref({ interest, intent, city, area, open: "trade" })}
            active={open === "trade"}
            label="Buka tukar"
          />
        </FilterRow>
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

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide px-4 md:px-0">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {children}
      </div>
    </div>
  );
}

function buildHref(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.interest) params.set("interest", opts.interest);
  if (opts.intent) params.set("intent", opts.intent);
  if (opts.city) params.set("city", opts.city);
  if (opts.area) params.set("area", opts.area);
  if (opts.open) params.set("open", opts.open);
  const qs = params.toString();
  return qs ? `/anggota?${qs}` : "/anggota";
}

function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium transition-colors",
        active
          ? "bg-ink text-parchment"
          : "bg-paper text-ink-soft border border-hairline hover:bg-cream",
      )}
    >
      {label}
    </Link>
  );
}
