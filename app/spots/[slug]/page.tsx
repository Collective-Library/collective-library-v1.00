import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";
import {
  SPOT_TYPE_OPTIONS,
  getSpotBySlug,
  listUpcomingEventsForSpot,
} from "@/lib/spots";
import { formatEventWhen } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CopyToClipboardButton } from "@/components/spots/copy-to-clipboard-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spot = await getSpotBySlug(slug);
  if (!spot) return { title: "Spot tidak ditemukan" };
  const typeOpt = SPOT_TYPE_OPTIONS.find((t) => t.value === spot.type);
  const description =
    spot.description?.slice(0, 160) ??
    `${typeOpt?.label ?? "Reading spot"} di ${spot.city}. Salah satu titik baca Collective Library.`;
  return {
    title: `${spot.name} — Spot`,
    description,
    openGraph: {
      title: spot.name,
      description,
      type: "article",
      images: spot.image_url ? [{ url: spot.image_url }] : undefined,
    },
  };
}

export default async function PublicSpotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spot = await getSpotBySlug(slug);
  if (!spot) notFound();

  const [events, user] = await Promise.all([
    listUpcomingEventsForSpot(spot.id, 8),
    getCurrentUser(),
  ]);

  const typeOpt = SPOT_TYPE_OPTIONS.find((t) => t.value === spot.type);
  const mapsHref =
    spot.maps_url ??
    (spot.latitude != null && spot.longitude != null
      ? `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`
      : null);

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      {/* Public slim header */}
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
        <article className="max-w-4xl mx-auto flex flex-col gap-6">
          <Link
            href="/spots"
            className="text-body-sm text-ink-soft hover:text-ink underline underline-offset-4 decoration-hairline-strong"
          >
            ← Balik ke list Spots
          </Link>

          {/* Hero */}
          <section className="rounded-card-lg overflow-hidden border border-hairline bg-paper shadow-card">
            <div className="aspect-[16/7] bg-cream relative">
              {spot.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spot.image_url}
                  alt={spot.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl md:text-8xl opacity-70">
                  {typeOpt?.emoji ?? "📍"}
                </div>
              )}
            </div>
            <div className="p-5 md:p-7 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center h-7 px-2.5 rounded-pill bg-cream text-ink-soft text-caption font-semibold border border-hairline">
                  {typeOpt?.emoji ?? "📍"} {typeOpt?.label ?? spot.type}
                </span>
                <span className="inline-flex items-center h-7 px-2.5 rounded-pill bg-paper text-ink-soft text-caption font-medium border border-hairline">
                  {spot.city}
                </span>
              </div>
              <h1 className="font-display text-display-xl md:text-display-md text-ink leading-tight">
                {spot.name}
              </h1>
              {spot.address && (
                <p className="text-body text-ink-soft leading-relaxed">{spot.address}</p>
              )}
              {mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start inline-flex items-center gap-2 h-11 px-5 rounded-pill bg-ink text-parchment text-body-sm font-semibold hover:bg-ink-soft"
                >
                  <MapPinIcon />
                  Open in Maps
                </a>
              )}
            </div>
          </section>

          {/* Description */}
          {spot.description && (
            <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-7">
              <h2 className="font-display text-title-lg text-ink mb-2">
                Tentang tempat ini
              </h2>
              <p className="text-body text-ink-soft leading-relaxed whitespace-pre-wrap">
                {spot.description}
              </p>
            </section>
          )}

          {/* Operating hours */}
          {spot.operating_hours && (
            <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-7">
              <h2 className="font-display text-title-lg text-ink mb-2">Jam buka</h2>
              <p className="text-body text-ink-soft leading-relaxed whitespace-pre-wrap">
                {spot.operating_hours}
              </p>
            </section>
          )}

          {/* Upcoming events */}
          <section className="bg-paper border border-hairline rounded-card-lg shadow-card p-5 md:p-7">
            <h2 className="font-display text-title-lg text-ink mb-3">
              Event mendatang di sini
            </h2>
            {events.length === 0 ? (
              <div className="text-body-sm text-muted">
                Belum ada event yang dijadwalkan di Spot ini.{" "}
                {user ? (
                  <Link
                    href="/event/new"
                    className="text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    Mau bikin event di sini?
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className="text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    Daftar dulu kalau mau nge-host
                  </Link>
                )}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/event/${ev.id}`}
                      className="flex items-center gap-3 p-3 rounded-card border border-hairline bg-paper hover:bg-cream/40 hover:shadow-card transition-colors"
                    >
                      <div
                        aria-hidden
                        className="shrink-0 w-12 h-12 rounded-button overflow-hidden bg-cream flex items-center justify-center"
                      >
                        {ev.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">🎪</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-ink truncate">
                          {ev.title}
                        </p>
                        <p className="text-caption text-muted truncate">
                          {formatEventWhen(ev.starts_at, ev.ends_at, ev.timezone)}
                          {ev.host?.full_name || ev.host?.username
                            ? ` · oleh ${ev.host.full_name ?? ev.host.username}`
                            : ""}
                          {ev.is_online ? " · Online" : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Books at this Spot — reserved, deferred (Slice X) */}
          <section className="bg-cream/40 border border-hairline rounded-card-lg p-5 md:p-7">
            <h2 className="font-display text-title-md text-ink mb-1">
              Buku & aktivitas di Spot ini
            </h2>
            <p className="text-body-sm text-muted leading-relaxed">
              Belum kebuka. Slice berikutnya: list buku yang tersedia di Spot ini
              + activity feed (visit, donate, check-in). Untuk sekarang, fokusnya
              di event yang ke-host di tempat ini.
            </p>
          </section>

          {/* Share / QR-ready URL (Slice 5 — public stable URL) */}
          <section className="rounded-card-lg border border-hairline bg-paper p-5 md:p-7 flex flex-col gap-3">
            <h2 className="font-display text-title-md text-ink">
              Punya tempat ini atau lagi di sana?
            </h2>
            <p className="text-body-sm text-ink-soft leading-relaxed">
              URL Spot ini stabil dan QR-ready — copy aja kalau mau tempelin di
              meja kafe atau di rak buku publik. Pengunjung scan, langsung
              mendarat di halaman ini.
            </p>
            <CopyLinkRow slug={spot.slug} />
            <p className="text-caption text-muted">
              Mau report info Spot ini gak akurat?{" "}
              <Link href="/feedback" className="text-ink-soft underline underline-offset-4 hover:text-ink">
                Kirim via feedback
              </Link>
              .
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}

// Server component renders a slim public URL display + a client-side copy
// button. Keeping the URL static-rendered server-side so QR scanning works
// even before JS hydration.
function CopyLinkRow({ slug }: { slug: string }) {
  const path = `/spots/${slug}`;
  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-button border border-hairline-strong bg-cream/60 overflow-hidden",
      )}
    >
      <span className="flex-1 min-w-0 px-3.5 py-2.5 font-mono text-body-sm text-ink-soft truncate">
        {path}
      </span>
      <CopyButton path={path} />
    </div>
  );
}

function CopyButton({ path }: { path: string }) {
  return <CopyToClipboardButton path={path} />;
}

function MapPinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
