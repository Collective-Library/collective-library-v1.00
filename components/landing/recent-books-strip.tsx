import { listShelfBooks } from "@/lib/books";
import { StatusBadge } from "@/components/ui/status-badge";
import { GatedLink } from "./gated-link";

/**
 * Horizontal-scroll strip of the most recent public books — landing intro
 * social proof. Pulls top 12 by created_at desc; reuses existing RLS so only
 * non-hidden, public-visibility books appear.
 *
 * Click → /book/[id] for authed visitors. Anon visitors get the login-nudge
 * modal via <GatedLink> (Seth-Godin-flavored invitation, not a hard wall).
 */
export async function RecentBooksStrip() {
  const { books } = await listShelfBooks({ pageSize: 12 });
  if (books.length === 0) return null;

  return (
    <section
      className="px-6 md:px-10 py-12"
      aria-label="Buku-buku terbaru di rak komunitas"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Eksplorasi
            </p>
            <h2 className="mt-1 font-display text-display-md md:text-display-lg text-ink leading-tight">
              Yang baru di rak komunitas
            </h2>
          </div>
          <GatedLink
            href="/shelf"
            className="shrink-0 text-body-sm font-medium text-ink hover:underline underline-offset-4"
          >
            Lihat semua →
          </GatedLink>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-6 px-6 md:-mx-10 md:px-10 pb-2"
          aria-label="Daftar buku — geser ke samping"
        >
          {books.map((b) => (
            <GatedLink
              key={b.id}
              href={`/book/${b.id}`}
              className="group shrink-0 snap-start w-[160px] flex flex-col gap-2"
            >
              <div className="relative w-[160px] h-[224px] rounded-card overflow-hidden bg-cream border border-hairline shadow-card group-hover:shadow-card-hover transition-shadow">
                {b.cover_url ? (
                  <img
                    src={b.cover_url}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-caption text-muted px-3 text-center">
                    {b.title}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={b.status} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink truncate leading-snug">
                  {b.title}
                </p>
                <p className="text-caption text-muted truncate">{b.author}</p>
                {b.owner?.full_name && (
                  <p className="text-caption text-muted truncate mt-0.5">
                    @{b.owner.username ?? "anggota"}
                  </p>
                )}
              </div>
            </GatedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
