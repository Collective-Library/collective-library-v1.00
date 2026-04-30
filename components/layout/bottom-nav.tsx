"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";

export function BottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile/edit";

  const items = [
    { href: "/shelf", label: "Rak", icon: ShelfIcon, match: (p: string) => p.startsWith("/shelf") || p === "/" },
    { href: "/aktivitas", label: "Aktivitas", icon: ActivityIcon, match: (p: string) => p.startsWith("/aktivitas") },
    { href: "/book/add", label: "Tambah", icon: AddIcon, match: (p: string) => p.startsWith("/book/add"), prominent: true },
    { href: "/wanted", label: "Dicari", icon: WantedIcon, match: (p: string) => p.startsWith("/wanted") },
    { href: profileHref, label: "Profil", icon: ProfileIcon, match: (p: string) => p.startsWith("/profile") },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-hairline"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto h-16">
        {items.map(({ href, label, icon: Icon, match, prominent }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-full text-caption",
                  prominent ? "text-ink" : active ? "text-ink" : "text-muted",
                )}
              >
                {prominent ? (
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-pill bg-ink text-parchment -mt-2 shadow-card">
                    <Icon size={22} />
                  </span>
                ) : (
                  <Icon size={22} />
                )}
                <span className={cn("text-[11px] font-medium", prominent && "mt-0.5")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ShelfIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4v16M4 8h16M4 16h16M20 4v16" />
      <path d="M8 8v8M11 8v8M14 8v8M17 8v8" />
    </svg>
  );
}
function ActivityIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function WantedIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2.5 3v.5" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  );
}
function AddIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ProfileIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}
