"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";

/**
 * Slide-in product map. Triggered from a hamburger button in the TopBar
 * (rendered next to the Logo). Acts as the scalable navigation surface —
 * the existing TopBar + BottomNav stay simple and only carry the
 * high-frequency routes; this panel carries everything else and grows
 * with the product.
 *
 * Grouping mirrors BMC mental model:
 *   - Library  → things related to books + their commerce
 *   - Activity → things that surface life (events, manifestos, the feed)
 *   - Community → people + feedback
 *   - Explore  → spatial / topical discovery
 *   - Builder  → admin / moderation (admin only)
 *
 * Routes are English-first via next.config rewrites; old Indonesian
 * URLs still resolve directly. See `next.config.ts` for the alias map.
 *
 * Coming-soon items are visually muted + non-clickable so the panel
 * doubles as a soft product roadmap without creating dead links.
 *
 * Implementation: mirrors the proven AnggotaFilterSheet dialog pattern.
 * Backdrop + panel are siblings inside one fixed wrapper that mounts only
 * when open — the panel sits `relative` above the backdrop's `absolute
 * inset-0`. No translate-x trick (which had ordering quirks). Animations
 * via the project's existing `animate-overlay-fade-in` + new
 * `animate-drawer-slide-in-left` keyframes in globals.css.
 */

interface NavItem {
  label: string;
  href?: string;
  description?: string;
  icon: React.ComponentType<{ size?: number }>;
  comingSoon?: boolean;
  /** Match function for active highlight — supports old + new path. */
  match?: (pathname: string) => boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  /** Only show when viewer is admin */
  adminOnly?: boolean;
}

// ────────────────────────────────── ICONS ──────────────────────────────────
// Declared FIRST so the GROUPS const below can reference them safely.
function IconBox({ size = 18, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 mt-0.5"
    >
      {children}
    </svg>
  );
}
const ShelfIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <path d="M4 4v16M4 8h16M4 16h16M20 4v16M8 8v8M11 8v8M14 8v8M17 8v8" />
  </IconBox>
);
const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBox>
);
const WantedIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2.5 3v.5" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </IconBox>
);
const ActivityIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </IconBox>
);
const EventIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
  </IconBox>
);
const ManifestIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <path d="M3 21V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M16 3v5h5" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </IconBox>
);
const MembersIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
    <circle cx="17" cy="8" r="3" />
    <path d="M21 21v-1a5 5 0 0 0-3-4.6" />
  </IconBox>
);
const FeedbackIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </IconBox>
);
const MapIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </IconBox>
);
const PlacesIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <path d="M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z" />
    <circle cx="12" cy="10" r="3" />
  </IconBox>
);
const MarketIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <path d="M3 6h18l-1.5 11a2 2 0 0 1-2 1.7H6.5A2 2 0 0 1 4.5 17z" />
    <path d="M8 6V4a4 4 0 0 1 8 0v2" />
  </IconBox>
);
const MastermindIcon = ({ size = 18 }: { size?: number }) => (
  <IconBox size={size}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <path d="M3 12c2-3 7-4 9-2 2-2 7-1 9 2" />
  </IconBox>
);

// ────────────────────────────────── DATA ──────────────────────────────────
const GROUPS: NavGroup[] = [
  {
    label: "Library",
    items: [
      {
        label: "My Library",
        href: "/library",
        description: "Buku-buku komunitas",
        icon: ShelfIcon,
        match: (p) =>
          p === "/" || p.startsWith("/library") || p.startsWith("/shelf") || p.startsWith("/book"),
      },
      {
        label: "Discover",
        href: "/discover",
        description: "Cari judul, author, atau owner",
        icon: SearchIcon,
        match: (p) => p.startsWith("/discover") || p.startsWith("/search"),
      },
      {
        label: "Wanted",
        href: "/wanted",
        description: "Lagi nyari buku tertentu?",
        icon: WantedIcon,
        match: (p) => p.startsWith("/wanted"),
      },
      {
        label: "Marketplace",
        description: "Jual · sewa · titip · tukar",
        icon: MarketIcon,
        comingSoon: true,
      },
    ],
  },
  {
    label: "Activity",
    items: [
      {
        label: "Activity Feed",
        href: "/activity",
        description: "Yang lagi terjadi di komunitas",
        icon: ActivityIcon,
        match: (p) => p.startsWith("/activity") || p.startsWith("/aktivitas"),
      },
      {
        label: "Events",
        href: "/event",
        description: "Diskusi · kopdar · workshop",
        icon: EventIcon,
        match: (p) => p.startsWith("/event"),
      },
      {
        label: "Manifest",
        href: "/manifest",
        description: "Pemikiran pendek dari pembaca",
        icon: ManifestIcon,
        match: (p) => p.startsWith("/manifest") && !p.startsWith("/admin/manifests"),
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        label: "Members",
        href: "/members",
        description: "Orang-orang yang baca bareng",
        icon: MembersIcon,
        match: (p) => p.startsWith("/members") || p.startsWith("/anggota"),
      },
      {
        label: "Feedback",
        href: "/feedback",
        description: "Cerita ke kita",
        icon: FeedbackIcon,
        match: (p) => p === "/feedback" || p.startsWith("/feedback/"),
      },
    ],
  },
  {
    label: "Explore",
    items: [
      {
        label: "Map",
        href: "/map",
        description: "Anggota komunitas di peta",
        icon: MapIcon,
        match: (p) => p.startsWith("/map") || p.startsWith("/peta"),
      },
      {
        label: "Spots",
        href: "/spots",
        description: "Cafe · rak buku publik · ruang komunitas",
        icon: PlacesIcon,
        match: (p) => p === "/spots" || p.startsWith("/spots/"),
      },
    ],
  },
  {
    label: "Builder",
    adminOnly: true,
    items: [
      {
        label: "Mastermind cockpit",
        href: "/mastermind",
        description: "OKR · pulse · intelligence",
        icon: MastermindIcon,
        match: (p) => p.startsWith("/mastermind"),
      },
      {
        label: "Feedback inbox",
        href: "/admin/feedback",
        description: "Triage user feedback",
        icon: FeedbackIcon,
        match: (p) => p.startsWith("/admin/feedback"),
      },
      {
        label: "Manifest moderation",
        href: "/admin/manifests",
        description: "Review pending manifestos",
        icon: ManifestIcon,
        match: (p) => p.startsWith("/admin/manifests"),
      },
    ],
  },
];

// ────────────────────────────────── COMPONENT ──────────────────────────────
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

  function close() {
    setOpen(false);
  }

  const visibleGroups = GROUPS.filter((g) => !g.adminOnly || profile?.is_admin);

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
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-50"
        >
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
              "relative h-full w-[88vw] max-w-sm bg-paper border-r border-hairline shadow-modal",
              "flex flex-col animate-drawer-slide-in-left",
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-5 py-5">
              <div className="flex flex-col gap-6">
                {visibleGroups.map((group) => (
                  <section key={group.label}>
                    <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-2.5">
                      {group.label}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {group.items.map((item) => (
                        <li key={item.label}>
                          <NavRow item={item} pathname={pathname} onNavigate={close} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                {/* Bottom links */}
                <div className="pt-4 border-t border-hairline-soft flex flex-col gap-0.5 text-body-sm">
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
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = item.match ? item.match(pathname) : false;
  const Icon = item.icon;

  if (item.comingSoon || !item.href) {
    return (
      <div
        aria-disabled="true"
        className="flex items-start gap-3 px-3 py-2.5 rounded-button cursor-not-allowed select-none opacity-50"
      >
        <span className="text-muted">
          <Icon size={18} />
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
        active
          ? "bg-cream text-ink"
          : "text-ink-soft hover:bg-cream hover:text-ink",
      )}
    >
      <Icon size={18} />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium leading-tight">{item.label}</p>
        {item.description && (
          <p
            className={cn(
              "text-caption leading-tight mt-0.5",
              active ? "text-ink-soft" : "text-muted",
            )}
          >
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// ────────────────────────────── BUTTONS ──────────────────────────────
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
