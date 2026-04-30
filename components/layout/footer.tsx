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
              href="https://discord.gg/2nCu5p9Hsd"
              label="Discord komunitas"
              icon={<DiscordIcon />}
            />
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

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/>
    </svg>
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
