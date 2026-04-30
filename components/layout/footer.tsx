import Link from "next/link";

/**
 * Public-facing footer with transparency line + utility links + socials.
 * Used on landing, /about, /privacy.
 */
export function Footer() {
  return (
    <footer className="px-6 md:px-10 py-10 border-t border-hairline bg-paper">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="flex-1">
          <p className="font-display text-title-md text-ink">
            Gratis. Selamanya.
          </p>
          <p className="mt-2 text-body-sm text-ink-soft max-w-md">
            Dibangun bareng komunitas Journey Perintis di Semarang. Bukan startup,
            bukan platform iklan — cuma infra biar rak kolektif kita keliatan.
          </p>

          {/* Social pills — sambungin ke ekosistem komunitas di luar app */}
          <div className="mt-5 flex flex-wrap gap-2">
            <SocialPill
              href="https://www.instagram.com/collectivelibrary.id"
              label="@collectivelibrary.id"
              icon={<InstagramIcon />}
            />
            <SocialPill
              href="https://linktr.ee/collectivelibrary.id"
              label="Linktree"
              icon={<LinktreeIcon />}
            />
          </div>
        </div>

        <nav className="flex flex-col gap-2 text-body-sm shrink-0">
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

function SocialPill({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-pill bg-cream text-ink-soft text-body-sm font-medium border border-hairline hover:bg-parchment hover:text-ink transition-colors"
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinktreeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
