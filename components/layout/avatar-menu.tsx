"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";

export function AvatarMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const profileHref = profile.username ? `/profile/${profile.username}` : "/profile/edit";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Menu akun"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <Avatar
          src={profile.photo_url}
          name={profile.full_name}
          size={36}
          isAdmin={profile.is_admin}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-2 w-56 rounded-card-lg bg-paper border border-hairline shadow-modal overflow-hidden z-50",
          )}
        >
          <div className="px-4 py-3 border-b border-hairline-soft">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-body-sm font-semibold text-ink truncate">{profile.full_name ?? profile.username}</p>
              {profile.is_admin && (
                <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-pill bg-ink text-parchment text-[10px] font-semibold tracking-wide">
                  <span aria-hidden>✦</span>
                  ADMIN
                </span>
              )}
            </div>
            {profile.username && (
              <p className="text-caption text-muted truncate">@{profile.username}</p>
            )}
          </div>
          <ul className="py-1">
            <MenuItem href={profileHref} onClick={() => setOpen(false)}>
              Lihat profil
            </MenuItem>
            <MenuItem href="/profile/edit" onClick={() => setOpen(false)}>
              Edit profil
            </MenuItem>
            <MenuItem href="/aktivitas" onClick={() => setOpen(false)}>
              Aktivitas komunitas
            </MenuItem>
            <MenuItem href="/anggota" onClick={() => setOpen(false)}>
              Anggota komunitas
            </MenuItem>
            <MenuItem href="/book/add" onClick={() => setOpen(false)}>
              Tambah buku
            </MenuItem>
            <MenuItem href="/book/add/bulk" onClick={() => setOpen(false)}>
              Tambah cepat (banyak)
            </MenuItem>
            <MenuItem href="/book/import" onClick={() => setOpen(false)}>
              Import dari Goodreads
            </MenuItem>
          </ul>
          {profile.is_admin && (
            <div className="border-t border-hairline-soft py-1.5 px-1.5 flex flex-col gap-1">
              <Link
                href="/mastermind"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-button bg-ink text-parchment hover:bg-ink-soft transition-colors"
              >
                <span aria-hidden className="text-base leading-none">✦</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-sm font-semibold leading-tight">Mastermind cockpit</span>
                  <span className="block text-[11px] leading-tight opacity-70 mt-0.5">Live OKRs · founder pulse</span>
                </span>
                <span className="text-parchment/60 group-hover:text-parchment transition-colors" aria-hidden>→</span>
              </Link>
              <Link
                href="/admin/feedback"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-button text-body-sm text-ink-soft hover:bg-cream transition-colors"
              >
                <span aria-hidden className="text-base leading-none">📥</span>
                <span>Feedback inbox</span>
              </Link>
            </div>
          )}
          <div className="border-t border-hairline-soft py-1">
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                role="menuitem"
                className="w-full text-left px-4 py-2.5 text-body-sm text-(--color-error) hover:bg-cream transition-colors"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        role="menuitem"
        onClick={onClick}
        className="block px-4 py-2.5 text-body-sm text-ink hover:bg-cream transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
