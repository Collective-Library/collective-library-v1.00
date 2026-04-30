"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Desktop / tablet primary nav. Lives in TopBar between Logo and search,
 * visible on md+ only — replaces the BottomNav (mobile-only) for keyboard
 * + mouse users who otherwise had only the Logo as a home affordance.
 *
 * Order mirrors BottomNav (Rak / Aktivitas / Dicari) so muscle memory
 * carries between viewports. "Tambah" is in AvatarMenu on desktop.
 */
export function DesktopNav() {
  const pathname = usePathname();

  const items: { href: string; label: string; match: (p: string) => boolean; icon: () => React.ReactElement }[] = [
    {
      href: "/shelf",
      label: "Rak",
      match: (p) => p === "/shelf" || p.startsWith("/shelf/") || p === "/" || p.startsWith("/book/"),
      icon: ShelfIcon,
    },
    {
      href: "/aktivitas",
      label: "Aktivitas",
      match: (p) => p.startsWith("/aktivitas"),
      icon: ActivityIcon,
    },
    {
      href: "/wanted",
      label: "Dicari",
      match: (p) => p.startsWith("/wanted"),
      icon: WantedIcon,
    },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi utama">
      {items.map(({ href, label, match, icon: Icon }) => {
        const active = match(pathname ?? "");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-body-sm font-medium transition-colors",
              active
                ? "bg-cream text-ink"
                : "text-ink-soft hover:bg-cream hover:text-ink",
            )}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ShelfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4v16M4 8h16M4 16h16M20 4v16" />
      <path d="M8 8v8M11 8v8M14 8v8M17 8v8" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function WantedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2.5 3v.5" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  );
}
