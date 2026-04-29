import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      {/* Top bar */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" aria-label="Beranda" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-display text-title-md text-ink leading-none">Collective Library</span>
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

      {/* Hero */}
      <main className="flex-1 px-6 md:px-10 py-12 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Berbasis di Semarang · Untuk komunitas Journey Perintis
          </p>
          <h1 className="mt-4 font-display text-ink leading-[1.05] text-[44px] md:text-[68px]" style={{ letterSpacing: "-1.2px" }}>
            Where books connect people, and ideas turn into movement.
          </h1>
          <p className="mt-6 text-body-lg md:text-[20px] text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Sebuah katalog buku kolektif + jaringan pembaca yang saling berbagi, berdiskusi, dan berkembang bareng.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ButtonLink href="/shelf" size="md">
              Explore Rak Kolektif →
            </ButtonLink>
            <ButtonLink href="/auth/register" size="md" variant="secondary">
              Daftarkan Rak Bukumu
            </ButtonLink>
          </div>
        </div>

        {/* Feature strip */}
        <section className="mt-24 max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          <Feature
            label="Dijual"
            title="Lepas buku yang udah dibaca"
            body="List buku-buku lo dengan harga, kondisi, dan area pickup. Pembeli langsung chat WhatsApp."
          />
          <Feature
            label="Dipinjamkan"
            title="Bagi buku ke anggota terpercaya"
            body="Available to lend ke anggota komunitas — atur durasi pinjam dan area kopdar."
          />
          <Feature
            label="Dicari"
            title="Cari judul yang gak ada di rak"
            body="Posting WTB request — biar yang punya buku bisa langsung nawarin ke lo."
          />
        </section>
      </main>

      <footer className="px-6 md:px-10 py-8 border-t border-hairline">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-caption text-muted">
          <p>© 2026 Collective Library · Semarang</p>
          <p>Dibangun bareng komunitas Journey Perintis.</p>
        </div>
      </footer>
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
