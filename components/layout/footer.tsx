import Link from "next/link";

/**
 * Public-facing footer with transparency line + utility links.
 * Used on landing, /about, /privacy.
 */
export function Footer() {
  return (
    <footer className="px-6 md:px-10 py-10 border-t border-hairline bg-paper">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-6">
        <div>
          <p className="font-display text-title-md text-ink">
            Gratis. Selamanya.
          </p>
          <p className="mt-2 text-body-sm text-ink-soft max-w-md">
            Dibangun bareng komunitas Journey Perintis di Semarang. Bukan startup,
            bukan platform iklan — cuma infra biar rak kolektif kita keliatan.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-body-sm">
          <Link href="/about" className="text-ink-soft hover:text-ink">
            Tentang
          </Link>
          <Link href="/privacy" className="text-ink-soft hover:text-ink">
            Privacy
          </Link>
          <Link href="/feed.xml" className="text-ink-soft hover:text-ink">
            RSS
          </Link>
        </nav>
      </div>
      <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-hairline-soft text-caption text-muted">
        © 2026 Collective Library
      </div>
    </footer>
  );
}
