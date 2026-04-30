import Link from "next/link";
import { Logo } from "./logo";
import { AvatarMenu } from "./avatar-menu";
import { DesktopNav } from "./desktop-nav";
import type { Profile } from "@/types";

export function TopBar({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-hairline-soft">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/shelf" aria-label="Collective Library — Beranda" className="flex items-center gap-2 shrink-0">
          <Logo size={32} />
          <span className="hidden sm:inline md:hidden lg:inline font-display text-title-md text-ink leading-none">
            Collective Library
          </span>
        </Link>

        {/* Desktop / tablet primary nav (md+) — labeled home affordance.
            BottomNav still owns mobile. */}
        <DesktopNav />

        {/* Search trigger — pill that opens /search */}
        <Link
          href="/search"
          className="hidden md:flex flex-1 max-w-md mx-2 items-center gap-3 h-11 px-5 rounded-pill bg-paper border border-hairline-strong text-muted hover:shadow-card transition-shadow"
        >
          <SearchIcon />
          <span className="text-body-sm">Cari judul, author, atau owner…</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Cari"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-pill hover:bg-cream"
          >
            <SearchIcon />
          </Link>
          {profile ? (
            <AvatarMenu profile={profile} />
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center h-10 px-4 rounded-pill bg-ink text-parchment text-body-sm font-medium hover:bg-ink-soft"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
