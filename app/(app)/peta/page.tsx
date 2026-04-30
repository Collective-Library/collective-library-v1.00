import Link from "next/link";
import type { Metadata } from "next";
import { listMembersForMap } from "@/lib/profile";
import { getCurrentProfile } from "@/lib/auth";
import { PetaClient } from "@/components/map/peta-client";
import { INTENTS } from "@/lib/interests";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Peta komunitas",
  description:
    "Sebaran anggota Collective Library di kecamatan masing-masing. Klik bubble buat lihat siapa & rak buku mereka.",
};

type SP = {
  intent?: string;
  open?: "lending" | "selling" | "trade";
};

export default async function PetaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { intent, open } = await searchParams;
  const [allMembers, me] = await Promise.all([
    listMembersForMap(),
    getCurrentProfile(),
  ]);

  // Apply filter client-side over the already-fetched set. /peta caps at
  // ~all opt-in users (small), so filtering in-memory is fine.
  const filteredMembers = allMembers.filter((m) => {
    if (intent && !(m.intents ?? []).includes(intent)) return false;
    if (open === "lending" && !m.open_for_lending) return false;
    if (open === "selling" && !m.open_for_selling) return false;
    if (open === "trade" && !m.open_for_trade) return false;
    return true;
  });

  const meOnMap = me?.show_on_map === true && me.map_lat != null && me.map_lng != null;
  const hasFilter = Boolean(intent || open);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Peta komunitas
          </p>
          <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
            Sebaran anggota
          </h1>
          <p className="mt-2 text-body text-ink-soft max-w-xl">
            {filteredMembers.length === 0
              ? hasFilter
                ? "Gak ada anggota cocok di filter ini. Coba reset atau ganti pilihan."
                : "Belum ada anggota yang opt-in. Lo bisa jadi yang pertama."
              : `${filteredMembers.length} anggota visible${hasFilter ? ` (filter aktif)` : ""}. Pin di kecamatan, bukan alamat persis.`}
          </p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium bg-paper border border-hairline-strong text-ink-soft hover:bg-cream"
        >
          {meOnMap ? "Edit lokasi" : "Tampilin gue"}
        </Link>
      </div>

      {/* Filter rows */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">
            Filter
          </p>
          {hasFilter && (
            <Link
              href="/peta"
              className="text-caption text-muted hover:text-ink underline underline-offset-4"
            >
              Reset
            </Link>
          )}
        </div>

        <FilterRow label="Available untuk">
          <FilterPill
            href={buildHref({ open })}
            active={!intent}
            label="Apa aja"
          />
          {INTENTS.map((i) => (
            <FilterPill
              key={i.slug}
              href={buildHref({ intent: i.slug, open })}
              active={intent === i.slug}
              label={`${i.emoji} ${i.label}`}
            />
          ))}
        </FilterRow>

        <FilterRow label="Mode">
          <FilterPill
            href={buildHref({ intent })}
            active={!open}
            label="Semua mode"
          />
          <FilterPill
            href={buildHref({ intent, open: "lending" })}
            active={open === "lending"}
            label="Buka pinjam"
          />
          <FilterPill
            href={buildHref({ intent, open: "selling" })}
            active={open === "selling"}
            label="Buka jual"
          />
          <FilterPill
            href={buildHref({ intent, open: "trade" })}
            active={open === "trade"}
            label="Buka tukar"
          />
        </FilterRow>
      </div>

      <PetaClient members={filteredMembers} />

      <div className="rounded-card-lg border border-hairline bg-cream/40 p-4 text-caption text-muted">
        <p className="font-medium text-ink-soft mb-1">Tentang visibilitas</p>
        Pin di-tempatin di tengah <span className="text-ink-soft">kecamatan</span>, bukan alamat persis lo. Toggle yang sama juga nampilin lo di{" "}
        <span className="text-ink-soft">landing publik</span> sebagai member card. Default mati — atur di{" "}
        <Link href="/profile/edit" className="text-ink-soft underline underline-offset-4">
          profile lo
        </Link>
        .
      </div>
    </div>
  );
}

function buildHref(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.intent) params.set("intent", opts.intent);
  if (opts.open) params.set("open", opts.open);
  const qs = params.toString();
  return qs ? `/peta?${qs}` : "/peta";
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
