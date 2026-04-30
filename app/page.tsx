import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Footer } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { RecentBooksStrip } from "@/components/landing/recent-books-strip";
import { RecentMembersStrip } from "@/components/landing/recent-members-strip";
import { RecentInstagramStrip } from "@/components/landing/recent-instagram-strip";
import { LoginNudgeProvider } from "@/components/landing/login-nudge";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityStats } from "@/lib/stats";
import { listActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, stats, activity] = await Promise.all([
    getCurrentUser(),
    getCommunityStats(),
    listActivity(4),
  ]);

  return (
    <LoginNudgeProvider isAnon={!user}>
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      {/* Skip to content for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:text-parchment focus:px-4 focus:py-2 focus:rounded-button"
      >
        Skip ke konten utama
      </a>

      {/* Top bar */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" aria-label="Beranda" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-display text-title-md text-ink leading-none">
            Collective Library
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <ButtonLink href="/shelf" size="sm" variant="secondary">
              Buka Rak
            </ButtonLink>
          ) : (
            <>
              <Link href="/auth/login" className="text-body-sm font-medium text-ink-soft hover:text-ink">
                Masuk
              </Link>
              <ButtonLink href="/auth/register" size="sm" pill>
                Daftar
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="px-6 md:px-10 pt-12 md:pt-20 pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold">
              Berbasis di Semarang · Untuk Journey Perintis & sekitar
            </p>
            <h1
              className="mt-4 font-display text-ink leading-[1.05] text-[44px] md:text-[68px]"
              style={{ letterSpacing: "-1.2px" }}
            >
              Where books connect people, and ideas turn into movement.
            </h1>
            <p className="mt-6 text-body-lg md:text-[20px] text-ink-soft max-w-2xl mx-auto leading-relaxed">
              Bukan platform jual-beli buku. Ini infra untuk komunitas pembaca
              yang udah saling kenal — biar rak kolektif kita keliatan, dan ide
              berpindah tangan tanpa hilang di chat.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ButtonLink href="/shelf" size="md">
                Lihat {stats.total_books} buku komunitas →
              </ButtonLink>
              <ButtonLink href="/auth/register" size="md" variant="secondary">
                Daftarkan Rak Bukumu
              </ButtonLink>
            </div>

            {/* Live social proof stats */}
            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <Stat number={stats.total_books} label="buku di rak" />
              <Stat number={stats.total_members} label="anggota" />
              <Stat number={stats.active_wanted} label="lagi dicari" />
              <Stat number={stats.joined_this_week} label="join minggu ini" />
            </dl>
          </div>
        </section>

        {/* Recent books — horizontal scroll strip */}
        <RecentBooksStrip />

        {/* Recent activity — peek at what's happening */}
        {activity.length > 0 && (
          <section className="px-6 md:px-10 pb-12" aria-label="Aktivitas terbaru">
            <div className="max-w-3xl mx-auto">
              <ActivityFeed items={activity} />
            </div>
          </section>
        )}

        {/* Members strip — opt-in public via show_on_map */}
        <RecentMembersStrip />

        {/* Instagram feed — auto-synced via Behold.so */}
        <RecentInstagramStrip />

        {/* Why this exists — founder voice */}
        <section className="px-6 md:px-10 py-16 bg-cream">
          <div className="max-w-2xl mx-auto">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold text-center">
              Kenapa ini ada
            </p>
            <h2 className="mt-3 font-display text-display-lg md:text-display-xl text-ink leading-tight text-center">
              Awalnya kita capek scroll WhatsApp grup pembaca.
            </h2>
            <div className="mt-8 flex flex-col gap-4 text-body-lg text-ink-soft leading-relaxed">
              <p>
                &ldquo;Bro, ada yang punya Sapiens? Mau pinjem.&rdquo; Pesan begitu
                lewat di grup WA, terus ke-bury sama 200 chat lain dalam sehari.
                Reset chat. Mulai dari nol lagi bulan depan.
              </p>
              <p>
                Padahal buku-bukunya <em>ada</em> — tersebar di rak personal kita
                masing-masing. Trust antar anggota juga udah ada — kita udah
                saling kenal di Journey Perintis. Tapi gak ada satu tempat yang
                bikin itu semua kelihatan dan bisa dicari.
              </p>
              <p>
                Collective Library bikin yang gak keliatan jadi keliatan.
                Bukan&nbsp;Goodreads versi Indo. Bukan Tokopedia buat buku. Ini
                infra untuk komunitas yang sudah ada.
              </p>
            </div>
            <p className="mt-6 text-body-sm text-muted text-center italic">
              — Cole, Initiator Journey Perintis &amp; Collective Library ·{" "}
              <a
                href="https://instagram.com/nikolaswidad_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-soft underline underline-offset-4 hover:text-ink not-italic"
              >
                @nikolaswidad_
              </a>
            </p>
          </div>
        </section>

        {/* Feature strip */}
        <section className="px-6 md:px-10 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-caption text-muted uppercase tracking-wide font-semibold text-center">
              Cara kerja
            </p>
            <h2 className="mt-3 font-display text-display-lg text-ink leading-tight text-center">
              Tiga gerakan, satu loop.
            </h2>
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              <Feature
                label="Dijual"
                title="Lepas buku yang udah dibaca"
                body="List buku-buku lo dengan harga, kondisi, dan area pickup. Pembeli langsung tap chat — gak perlu register lagi."
              />
              <Feature
                label="Dipinjamkan"
                title="Bagi buku ke anggota terpercaya"
                body="Available to lend ke anggota komunitas. Atur durasi pinjam, area kopdar, dan ajak diskusi setelah selesai."
              />
              <Feature
                label="Dicari"
                title="Cari judul yang gak ada di rak"
                body="Posting WTB request — anggota lain yang punya buku itu langsung dapat notif, tinggal nawarin."
              />
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="px-6 md:px-10 py-16 bg-cream">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-display-lg text-ink leading-tight">
              Rak buku lo sebagian dari rak komunitas.
            </h2>
            <p className="mt-3 text-body-lg text-ink-soft">
              Daftar gratis, list 5 buku dalam ~2 menit, dan jadi bagian dari
              jaringan pembaca yang lagi tumbuh.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <ButtonLink href="/auth/register" size="md" pill>
                Mulai daftar →
              </ButtonLink>
              <ButtonLink href="/shelf" size="md" variant="secondary">
                Lihat rak dulu
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </LoginNudgeProvider>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-display-md text-ink leading-none">
        {number}
      </span>
      <span className="mt-1 text-caption text-muted text-center">{label}</span>
    </div>
  );
}

function Feature({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="p-6 rounded-card-lg border border-hairline bg-paper">
      <p className="text-caption uppercase tracking-wide font-semibold text-muted">{label}</p>
      <h3 className="mt-2 font-display text-title-lg text-ink leading-tight">{title}</h3>
      <p className="mt-2 text-body-sm text-ink-soft leading-relaxed">{body}</p>
    </div>
  );
}
