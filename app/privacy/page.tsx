import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Apa yang Collective Library simpan tentang lo, dan apa yang nggak.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      <header className="px-6 md:px-10 py-5">
        <Link href="/" aria-label="Beranda" className="inline-flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-display text-title-md text-ink leading-none">
            Collective Library
          </span>
        </Link>
      </header>

      <main className="flex-1 px-6 md:px-10 py-12">
        <article className="max-w-2xl mx-auto">
          <p className="text-caption text-muted uppercase tracking-wide font-semibold">
            Privacy
          </p>
          <h1 className="mt-2 font-display text-display-xl text-ink leading-tight">
            Privasi & data lo
          </h1>
          <p className="mt-3 text-body text-muted">
            Versi singkat: kita simpan data minimum, gak jual ke siapa pun, dan
            lo bisa hapus semua kapan aja.
          </p>

          <div className="mt-8 flex flex-col gap-5 text-body-lg text-ink-soft leading-relaxed">
            <h2 className="font-display text-display-md text-ink">
              Apa yang kita simpan
            </h2>
            <ul className="flex flex-col gap-2 list-disc pl-5">
              <li>Email + auth credentials (di-handle oleh Supabase Auth, encrypted at rest).</li>
              <li>Profile yang lo isi sendiri: nama, username, foto, kota, area, bio, kontak (Instagram/WhatsApp/Discord/Goodreads/StoryGraph), profesi, kampus, interests.</li>
              <li>Daftar buku yang lo list — title, author, ISBN, cover, status, harga, catatan.</li>
              <li>WTB request yang lo posting.</li>
              <li>Activity log: kapan lo nambah/edit buku, posting WTB, atau gabung. Public di /aktivitas.</li>
            </ul>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Apa yang publik vs privat
            </h2>
            <ul className="flex flex-col gap-2 list-disc pl-5">
              <li>
                <strong>Publik:</strong> nama, username, foto, kota+area, bio,
                profesi, interests, daftar buku, WTB requests, activity.
              </li>
              <li>
                <strong>Privat by default:</strong> nomor WhatsApp lo. Hanya
                ditampilkan kalau lo opt-in toggle &quot;Tampilkan ke publik&quot;
                di profile edit.
              </li>
              <li>
                <strong>Tidak pernah di-public:</strong> email login lo, password.
              </li>
            </ul>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Tracking & analytics
            </h2>
            <p>
              Kita pakai <strong>Vercel Analytics</strong> untuk page views +
              custom event &quot;contact_click&quot; (track berapa kali tombol
              chat owner ditekan, untuk ngukur apakah platform-nya bener kepake).
              Plus <strong>Sentry</strong> untuk error tracking. Kedua-duanya tidak
              menggunakan cookies tracking, tidak share data ke pihak ketiga, dan
              tidak melakukan profiling untuk iklan.
            </p>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Pihak ketiga
            </h2>
            <ul className="flex flex-col gap-2 list-disc pl-5">
              <li><strong>Supabase</strong> — hosting database & auth.</li>
              <li><strong>Vercel</strong> — hosting app & analytics.</li>
              <li><strong>Sentry</strong> — error tracking.</li>
              <li><strong>Google Books / Open Library</strong> — metadata buku saat lo cari ISBN/title.</li>
              <li><strong>hCaptcha</strong> — anti-bot di registration.</li>
              <li><strong>Resend</strong> — kirim email konfirmasi.</li>
              <li><strong>Discord</strong> — opsional, kalau lo login via Discord OAuth atau kalau komunitas lo subscribe RSS feed kita ke channel mereka.</li>
            </ul>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Hapus data
            </h2>
            <p>
              Lo bisa edit/hapus tiap field di profile lo, dan hapus buku
              individual atau bulk dari Kelola mode. Untuk hapus akun seluruhnya
              (cascade ke semua buku, WTB, dll), email{" "}
              <a
                href="mailto:journey.perintis@gmail.com"
                className="text-ink underline underline-offset-4"
              >
                journey.perintis@gmail.com
              </a>{" "}
              — kita response dalam 7 hari.
            </p>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Pertanyaan
            </h2>
            <p>
              Kalau ada concern privacy, hubungi via WhatsApp/IG yang ada di
              profile founders, atau email di atas. Kita bukan startup beneran —
              jadi gak ada team legal. Cuma ada kita, dan kita pegang janji ini.
            </p>
          </div>

          <p className="mt-10 text-caption text-muted">
            Last updated: 2026-04-30
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
