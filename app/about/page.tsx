import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { Footer } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tentang",
  description: "Apa itu Collective Library, kenapa ada, dan siapa di baliknya.",
};

export default function AboutPage() {
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
            Tentang
          </p>
          <h1 className="mt-2 font-display text-display-xl text-ink leading-tight">
            Apa itu Collective Library?
          </h1>

          <div className="mt-8 flex flex-col gap-5 text-body-lg text-ink-soft leading-relaxed">
            <p>
              Sebuah katalog buku kolektif + jaringan pembaca yang saling
              berbagi, berdiskusi, dan berkembang bareng. Berbasis di Semarang,
              dimulai dari komunitas <strong>Journey Perintis</strong>.
            </p>
            <p>
              Kita bukan platform jual-beli buku. Kita juga bukan Goodreads versi
              Indonesia. Kita lebih mirip <em>infrastruktur</em> untuk komunitas
              pembaca yang sudah saling kenal — biar buku-buku yang sudah ada di
              rak masing-masing bisa keliatan dan dicari.
            </p>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Visi & misi
            </h2>
            <ul className="flex flex-col gap-2 list-disc pl-5">
              <li>Membangun ekosistem berbagi buku yang aman, tertata, dan berbasis kepercayaan.</li>
              <li>Mengumpulkan individu dengan rasa ingin tahu tinggi dan growth mindset.</li>
              <li>Menciptakan ruang diskusi yang jujur, kritis, dan reflektif.</li>
              <li>Mengubah kebiasaan membaca jadi gerakan kolektif yang berdampak.</li>
              <li>Memfasilitasi kolaborasi ide yang bisa berkembang jadi proyek nyata.</li>
            </ul>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Siapa di balik ini?
            </h2>
            <p>
              Dibangun oleh <strong>Cole</strong>, Initiator Journey Perintis
              &amp; Collective Library, bersama anggota komunitas Journey
              Perintis. Reach out di Instagram{" "}
              <a
                href="https://instagram.com/nikolaswidad_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-4 hover:text-ink-soft"
              >
                @nikolaswidad_
              </a>
              . Open-source dalam semangat — fokus untuk komunitas setempat
              sebelum scale.
            </p>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Bagaimana ini didanai?
            </h2>
            <p>
              <strong>Gratis. Selamanya.</strong> Tidak ada iklan, tidak ada
              langganan, tidak ada take-rate dari transaksi. Costs dibayar dari
              kantong founders sebagai kontribusi ke komunitas. Kalau jadi
              terlalu mahal di scale, kita evaluasi lagi — tapi commitment-nya:
              tetap free buat anggota komunitas.
            </p>

            <h2 className="mt-4 font-display text-display-md text-ink">
              Open-source?
            </h2>
            <p>
              Belum, tapi mungkin di masa depan. Kalau lo mau bantu develop,
              hubungi kita lewat profile masing-masing.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <ButtonLink href="/auth/register">Daftar gratis →</ButtonLink>
            <ButtonLink href="/shelf" variant="secondary">
              Lihat rak komunitas
            </ButtonLink>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
