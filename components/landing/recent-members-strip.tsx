import Image from "next/image";
import Link from "next/link";
import { listLandingMembers } from "@/lib/profile";
import { Avatar } from "@/components/ui/avatar";
import { GatedLink } from "./gated-link";

/**
 * Horizontal-scroll strip of opt-in members on the landing page.
 *
 * Privacy gate: only members whose `show_on_map=true` are surfaced — the
 * same toggle that puts them on /peta. One consent flag, two surfaces.
 *
 * Layout: avatar + name + kecamatan, with up to 3 small book covers below
 * (Snap-style social proof). Click → /profile/[username] (auth-gated; the
 * proxy bounces unauthed visitors to /auth/login → growth funnel).
 */
export async function RecentMembersStrip() {
  const members = await listLandingMembers(12);
  if (members.length === 0) return null;

  return (
    <section
      className="px-6 md:px-10 py-12 bg-paper/50"
      aria-label="Anggota komunitas"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Anggota
            </p>
            <h2 className="mt-1 font-display text-display-md md:text-display-lg text-ink leading-tight">
              Pembaca yang udah join
            </h2>
            <p className="mt-1 text-body-sm text-muted">
              Yang opt-in publik. Klik buat lihat rak mereka.
            </p>
          </div>
          {/* /anggota is still auth-gated; route anon clicks through nudge */}
          <GatedLink
            href="/anggota"
            className="shrink-0 text-body-sm font-medium text-ink hover:underline underline-offset-4"
          >
            Lihat semua →
          </GatedLink>
        </div>

        <div
          className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-6 px-6 md:-mx-10 md:px-10 pb-2"
          aria-label="Daftar anggota — geser ke samping"
        >
          {members.map((m) => {
            const place =
              [m.address_area, m.city].filter(Boolean).join(" · ") || "Semarang";
            return (
              {/* /profile/[username] is public — plain Link, no nudge. */}
              <Link
                key={m.id}
                href={`/profile/${m.username}`}
                className="group shrink-0 snap-start w-[180px] flex flex-col gap-3 p-4 rounded-card-lg bg-paper border border-hairline shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={m.photo_url} name={m.full_name} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-ink truncate leading-tight">
                      {m.full_name ?? m.username}
                    </p>
                    <p className="text-caption text-muted truncate">
                      @{m.username}
                    </p>
                  </div>
                </div>

                <p className="text-caption text-muted truncate">{place}</p>

                {m.profession && (
                  <p className="text-caption text-ink-soft line-clamp-1 -mt-1.5">
                    {m.profession}
                  </p>
                )}

                {m.book_covers.length > 0 ? (
                  <div className="flex gap-1 mt-auto">
                    {m.book_covers.slice(0, 3).map((url, i) => (
                      <Image
                        key={i}
                        src={url}
                        alt=""
                        width={36}
                        height={48}
                        className="object-cover rounded-[4px] border border-hairline"
                      />
                    ))}
                    {m.book_count > 3 && (
                      <div className="w-9 h-12 rounded-[4px] bg-cream border border-hairline flex items-center justify-center text-[10px] text-muted font-medium">
                        +{m.book_count - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-auto text-caption text-muted">
                    Belum ada buku
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
