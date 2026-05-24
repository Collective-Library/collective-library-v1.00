import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { Footer } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button";
import {
  SPOT_TYPE_OPTIONS,
  listPublicSpots,
  listSpotCities,
} from "@/lib/spots";
import type { SpotType } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spots — tempat baca komunitas",
  description:
    "Discover physical reading spaces, book corners, cafes, public shelves, and community spots di Collective Library.",
  openGraph: {
    title: "Spots — tempat baca komunitas",
    description:
      "Cafe, rak buku publik, ruang komunitas, dan partner reading point yang ke-map sama Collective Library.",
  },
};

type SP = { q?: string; type?: SpotType | "all"; city?: string };

export default async function PublicSpotsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { q, type = "all", city } = await searchParams;
  const [spots, cities, user] = await Promise.all([
    listPublicSpots({ type, search: q ? q : city }),
    listSpotCities(),
    getCurrentUser(),
  ]);

  // City filter applied in-memory because RLS already capped result set
  // (200 max) and we'd otherwise need a 2nd ilike OR branch.
  const filtered = city
    ? spots.filter((s) => s.city.toLowerCase() === city.toLowerCase())
    : spots;

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      {/* Public slim header — same shape as /about */}
      <header className="px-4 md:px-10 py-5 flex items-center justify-between gap-3">
        <Link href="/" aria-label="Beranda" className="inline-flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-display text-title-md text-ink leading-none">
            Collective Library
          </span>
        </Link>
        {user ? (
          <Link
            href="/library"
            className="text-body-sm text-ink-soft hover:text-ink underline-offset-4 hover:underline"
          >
            ← Balik ke app
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-body-sm">
            <Link href="/auth/login" className="text-ink-soft hover:text-ink">
              Masuk
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center h-9 px-4 rounded-pill bg-ink text-parchment font-semibold hover:bg-ink-soft"
            >
              Daftar
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 md:px-10 pb-16">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {/* Hero — Steve Krug 5-second test */}
          <section className="mt-2 md:mt-6">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Spots
            </p>
            <h1 className="mt-1 font-display text-display-xl text-ink leading-tight">
              Tempat baca, ke-map.
            </h1>
            <p className="mt-3 text-body-lg text-ink-soft max-w-2xl leading-relaxed">
              Cafe, rak buku publik, ruang komunitas, dan partner reading point —
              tempat fisik di mana buku, event, dan komunitas Collective Library
              ketemu di dunia nyata. Klik satu buat lihat lokasinya + event yang
              lagi rame di sana.
            </p>
          </section>

          {/* Search + filters */}
          <section className="flex flex-col gap-3">
            <form action="/spots" method="GET" className="flex gap-2 flex-wrap">
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Cari nama, kota, atau deskripsi…"
                className="flex-1 min-w-[200px] h-11 px-3.5 bg-paper text-ink rounded-button border border-hairline-strong focus:outline-none focus:border-ink focus:border-2 focus:px-[13px]"
              />
              {type !== "all" && <input type="hidden" name="type" value={type} />}
              {city && <input type="hidden" name="city" value={city} />}
              <button
                type="submit"
                className="inline-flex items-center h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft"
              >
                Cari
              </button>
            </form>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                Tipe
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
                <FilterPill
                  href={hrefWith({ q, type: "all", city })}
                  active={type === "all"}
                  label="Semua"
                />
                {SPOT_TYPE_OPTIONS.map((o) => (
                  <FilterPill
                    key={o.value}
                    href={hrefWith({ q, type: o.value, city })}
                    active={type === o.value}
                    label={`${o.emoji} ${o.label}`}
                  />
                ))}
              </div>
            </div>

            {cities.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                  Kota
                </p>
                <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
                  <FilterPill
                    href={hrefWith({ q, type, city: undefined })}
                    active={!city}
                    label="Semua kota"
                  />
                  {cities.map((c) => (
                    <FilterPill
                      key={c}
                      href={hrefWith({ q, type, city: c })}
                      active={city?.toLowerCase() === c.toLowerCase()}
                      label={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Results */}
          {filtered.length === 0 ? (
            <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
              <p className="font-display text-title-lg text-ink">
                {q || city || type !== "all"
                  ? "Gak ada Spot yang cocok di filter ini."
                  : "Spot pertama lagi disiapin."}
              </p>
              <p className="mt-2 text-body text-muted max-w-md mx-auto">
                {q || city || type !== "all"
                  ? "Coba reset filter atau pilih tipe lain."
                  : "Komunitas Journey Perintis lagi memetakan tempat-tempat baca dan cafe favorit dulu. Cek lagi sebentar lagi, atau ikutan komunitasnya biar ngerasain pertama."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {q || city || type !== "all" ? (
                  <ButtonLink href="/spots" variant="secondary">
                    Reset filter
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonLink href="/event">Lihat event yang lagi rame</ButtonLink>
                    <ButtonLink href="/about" variant="secondary">
                      Apa itu Collective Library?
                    </ButtonLink>
                  </>
                )}
              </div>
            </section>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((spot) => {
                const typeOpt = SPOT_TYPE_OPTIONS.find((t) => t.value === spot.type);
                return (
                  <Link
                    key={spot.id}
                    href={`/spots/${spot.slug}`}
                    className="group bg-paper border border-hairline rounded-card-lg shadow-card hover:shadow-card-hover transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-cream overflow-hidden relative">
                      {spot.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={spot.image_url}
                          alt={spot.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl opacity-70">
                          {typeOpt?.emoji ?? "📍"}
                        </div>
                      )}
                      <span className="absolute top-2 left-2 inline-flex items-center h-7 px-2.5 rounded-pill bg-paper/95 backdrop-blur text-caption font-semibold text-ink-soft border border-hairline">
                        {typeOpt?.emoji ?? "📍"} {typeOpt?.label ?? spot.type}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-1.5">
                      <p className="font-display text-title-md text-ink leading-tight line-clamp-2">
                        {spot.name}
                      </p>
                      <p className="text-caption text-muted">{spot.city}</p>
                      {spot.description && (
                        <p className="text-body-sm text-ink-soft line-clamp-3 mt-1">
                          {spot.description}
                        </p>
                      )}
                      <p className="mt-auto pt-2 text-caption text-ink-soft font-medium group-hover:text-ink">
                        Lihat detail →
                      </p>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}

          {/* Footer-y info strip */}
          <section className="mt-4 rounded-card-lg border border-hairline bg-cream/40 p-5 text-body-sm text-ink-soft">
            <p className="font-medium text-ink mb-1">Apa itu Spot?</p>
            Spot adalah <em>tempat baca</em> yang punya identitas digital di Collective
            Library — cafe, rak buku publik, ruang komunitas, kampus, partner
            reading point. Spot bisa nge-host event, terhubung sama komunitas, dan
            (nanti) jadi titik QR check-in. Mau usulin tempat lo?{" "}
            <Link href="/feedback" className="text-ink underline underline-offset-4 hover:text-ink-soft">
              Kirim via feedback
            </Link>
            .
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function hrefWith(opts: { q?: string; type: SpotType | "all"; city?: string }): string {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.type !== "all") params.set("type", opts.type);
  if (opts.city) params.set("city", opts.city);
  const qs = params.toString();
  return "/spots" + (qs ? `?${qs}` : "");
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
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
