import Link from "next/link";
import { listMembers } from "@/lib/profile";
import { BROAD_INTERESTS } from "@/lib/interests";
import { MemberCard } from "@/components/profile/member-card";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type SP = {
  interest?: string;
  city?: string;
  open?: "lending" | "selling" | "trade";
};

export default async function AnggotaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { interest, city, open } = await searchParams;
  const members = await listMembers({ interest, city, openFor: open });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Anggota
        </p>
        <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
          Anggota komunitas
        </h1>
        <p className="mt-2 text-body text-ink-soft max-w-xl">
          {members.length} anggota udah daftarin rak buku-nya. Filter sesuai minat lo, atau cari orang yang buka untuk pinjam-meminjam.
        </p>
      </div>

      {/* Interest filter row — horizontally scrollable on mobile */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-caption font-semibold text-ink-soft uppercase tracking-wide">
            Filter
          </p>
          {(interest || city || open) && (
            <Link href="/anggota" className="text-caption text-muted hover:text-ink underline underline-offset-4">
              Reset
            </Link>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          <FilterPill
            href={buildHref({ city, open })}
            active={!interest}
            label="Semua interest"
          />
          {BROAD_INTERESTS.map((i) => (
            <FilterPill
              key={i.slug}
              href={buildHref({ interest: i.slug, city, open })}
              active={interest === i.slug}
              label={`${i.emoji} ${i.label}`}
            />
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          <FilterPill
            href={buildHref({ interest, city })}
            active={!open}
            label="Semua mode"
          />
          <FilterPill
            href={buildHref({ interest, city, open: "lending" })}
            active={open === "lending"}
            label="Buka pinjam"
          />
          <FilterPill
            href={buildHref({ interest, city, open: "selling" })}
            active={open === "selling"}
            label="Buka jual"
          />
          <FilterPill
            href={buildHref({ interest, city, open: "trade" })}
            active={open === "trade"}
            label="Buka tukar"
          />
        </div>
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

function buildHref(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.interest) params.set("interest", opts.interest);
  if (opts.city) params.set("city", opts.city);
  if (opts.open) params.set("open", opts.open);
  const qs = params.toString();
  return qs ? `/anggota?${qs}` : "/anggota";
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
