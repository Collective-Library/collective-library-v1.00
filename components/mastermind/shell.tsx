"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { AvatarMenu } from "@/components/layout/avatar-menu";
import { MastermindSidebar } from "./sidebar";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";

/**
 * Founder-cockpit shell. Desktop: persistent left sidebar (240px) + main.
 * Mobile (<md): hamburger trigger reveals a slide-in drawer.
 *
 * Reuses Logo + AvatarMenu from existing layout components — keeps brand
 * consistent with /admin/feedback, /shelf, etc., even though the structure
 * is different (no BottomNav, no FeedbackChip — see app/layout.tsx).
 */
export function MastermindShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-hairline-soft">
        <div className="mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-button text-ink-soft hover:bg-cream"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/mastermind" className="flex items-center gap-2 text-ink-soft hover:text-ink">
              <Logo size={26} />
              <span className="font-display text-title-md leading-none">Mastermind</span>
              <span className="ml-1 inline-flex items-center h-5 px-1.5 rounded-pill bg-ink text-parchment text-[10px] font-semibold tracking-wide">
                <span aria-hidden>✦</span>&nbsp;ADMIN
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-body-sm">
            <Link href="/shelf" className="hidden md:inline text-muted hover:text-ink-soft">
              ← Balik ke app
            </Link>
            <AvatarMenu profile={profile} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex md:flex-col md:shrink-0 md:w-[240px] border-r border-hairline-soft bg-paper/40 sticky top-14 self-start"
          style={{ height: "calc(100vh - 56px)", overflowY: "auto" }}
        >
          <MastermindSidebar />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mastermind menu"
            className="md:hidden fixed inset-0 z-50"
          >
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <div className="relative w-72 max-w-[85vw] h-full bg-paper border-r border-hairline shadow-modal flex flex-col">
              <div className="h-14 px-4 flex items-center justify-between border-b border-hairline-soft">
                <Logo size={24} />
                <button
                  type="button"
                  aria-label="Tutup menu"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-button text-ink-soft hover:bg-cream"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MastermindSidebar onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <main
          className={cn(
            "flex-1 min-w-0 mx-auto w-full px-4 md:px-8 py-6 md:py-8",
            "max-w-6xl",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
