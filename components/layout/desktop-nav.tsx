"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { desktopPrimaryNav } from "./nav-config";
import { ExploreDropdown } from "./explore-dropdown";

/**
 * Desktop primary nav. Lives in TopBar between Logo and search,
 * visible on lg+ only so narrower layouts can use the product-map
 * drawer instead.
 *
 * Slice 2: expanded from 3 pills to 5 surfaces. Items come from the
 * shared `nav-config.ts` so DesktopNav / HamburgerMenu / BottomNav /
 * AvatarMenu stay in sync.
 *
 * Order: Library, Activity, Events, Members, Explore (dropdown).
 * Explore exposes the secondary surfaces (Discover, Wanted, Manifest,
 * Map, Spots, Feedback) that previously had no desktop entry point.
 */
export function DesktopNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
      {desktopPrimaryNav.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-body-sm font-medium transition-colors",
              active ? "bg-cream text-ink" : "text-ink-soft hover:bg-cream hover:text-ink"
            )}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <ExploreDropdown />
    </nav>
  );
}
