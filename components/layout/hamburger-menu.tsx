"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";
import { hamburgerGroups, type HamburgerItem } from "./nav-config";

/**
 * Slide-in product map. Triggered from a hamburger button in the TopBar
 * (rendered next to the Logo). Acts as the scalable navigation surface
 * on md- — the TopBar + BottomNav stay simple and only carry the
 * high-frequency routes; this panel carries everything else.
 *
 * Slice 2: nav items now come from the shared `nav-config.ts` so the
 * drawer stays in sync with DesktopNav / BottomNav / AvatarMenu. The
 * drawer shell, animations, focus management, body-scroll lock, and
 * desktop-resize auto-close all stay intact.
 *
 * Coming-soon items are visually muted + non-clickable so the panel
 * doubles as a soft product roadmap without creating dead links.
 */
export function HamburgerMenu({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() ?? "";

  // Escape closes; body scroll lock while open; focus close button on open
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    queueMicrotask(() => closeButtonRef.current?.focus());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Auto-close when viewport expands to desktop (lg+) — prevents a
  // phantom overlay after the user rotates device or resizes window.
  useEffect(() => {
    if (!open) return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    function onDesktopBreakpoint(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    mediaQuery.addEventListener("change", onDesktopBreakpoint);
    return () => {
      mediaQuery.removeEventListener("change", onDesktopBreakpoint);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  const visibleGroups = hamburgerGroups.filter((g) => !g.adminOnly || profile?.is_admin);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="hamburger-panel"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-pill hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <MenuIcon />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Navigation" className="fixed inset-0 z-50">
          {/* Backdrop — absolutely positioned INSIDE the dialog wrapper.
              Click to close. */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={close}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-overlay-fade-in"
          />

          {/* Panel — relative-positioned so it stacks above the backdrop.
              Slides in from the left via animate-drawer-slide-in-left. */}
          <aside
            id="hamburger-panel"
            className={cn(
              "relative h-dvh max-h-dvh min-h-0 w-[88vw] max-w-sm bg-paper border-r border-hairline shadow-modal",
              "flex flex-col animate-drawer-slide-in-left"
            )}
          >
            {/* Header */}
            <header className="flex items-center justify-between gap-3 h-16 px-4 md:px-5 border-b border-hairline-soft shrink-0">
              <Link
                href={profile ? "/library" : "/"}
                onClick={close}
                className="flex items-center gap-2 text-ink"
              >
                <Logo size={28} />
                <span className="font-display text-title-md leading-none">Collective Library</span>
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="inline-flex items-center justify-center w-9 h-9 rounded-pill hover:bg-cream"
              >
                <CloseIcon />
              </button>
            </header>

            {/* Body — scrollable */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 md:px-5 py-5">
              <div className="flex flex-col gap-6">
                {visibleGroups.map((group) => (
                  <section key={group.id}>
                    <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2.5">
                      {group.label}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <NavRow item={item} pathname={pathname} onNavigate={close} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                {/* Bottom links */}
                <div className="pt-4 pb-15 border-t border-hairline-soft flex flex-col gap-0.5 text-body-sm">
                  <Link
                    href="/about"
                    onClick={close}
                    className="text-ink-soft hover:text-ink px-3 py-2 rounded-button hover:bg-cream"
                  >
                    About
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={close}
                    className="text-ink-soft hover:text-ink px-3 py-2 rounded-button hover:bg-cream"
                  >
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

// ────────────────────────────── NAV ROW ──────────────────────────────
function NavRow({
  item,
  pathname,
  onNavigate,
}: {
  item: HamburgerItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = item.match(pathname);
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <div
        aria-disabled="true"
        className="flex items-start gap-3 px-3 py-2.5 rounded-button cursor-not-allowed select-none opacity-50"
      >
        <span className="text-muted">
          <Icon size={18} className="shrink-0 mt-0.5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-ink-soft leading-tight">
            {item.label}{" "}
            <span className="ml-1 text-[10px] uppercase tracking-wider font-semibold bg-cream text-muted px-1.5 py-0.5 rounded-pill align-middle">
              Soon
            </span>
          </p>
          {item.description && (
            <p className="text-caption text-muted leading-tight mt-0.5">{item.description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 rounded-button transition-colors",
        active ? "bg-cream text-ink" : "text-ink-soft hover:bg-cream hover:text-ink"
      )}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium leading-tight">{item.label}</p>
        {item.description && (
          <p
            className={cn(
              "text-caption leading-tight mt-0.5",
              active ? "text-ink-soft" : "text-muted"
            )}
          >
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// ────────────────────────── SHELL ICONS ──────────────────────────
// MenuIcon + CloseIcon stay local — they're shell chrome, not nav
// surfaces, and live nowhere else.
function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
