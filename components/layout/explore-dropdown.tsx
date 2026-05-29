"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { exploreDropdownItems, isExploreActive } from "./nav-config";
import { ExploreIcon, ChevronDownIcon } from "./nav-icons";

/**
 * Desktop-only secondary nav for surfaces that don't earn a top-level
 * pill but need discoverability — Discover, Wanted, Manifest, Map,
 * Spots, Feedback.
 *
 * Rendered inside DesktopNav (lg+ only). Mirrors the proven AvatarMenu
 * dropdown pattern: click to open/close, Escape closes, outside click
 * closes, route change closes. Keyboard-accessible via Tab/Enter.
 *
 * Lightweight by design — no headless-ui, no portal, no focus trap.
 * The audit-prompt for Slice 2 explicitly warned against
 * overengineering this.
 */
export function ExploreDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "";
  const triggerActive = isExploreActive(pathname);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close when the user navigates (after a link click). Tracks pathname.
  const lastPathnameRef = useRef(pathname);
  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-current={triggerActive ? "page" : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-body-sm font-medium transition-colors",
          triggerActive || open
            ? "bg-cream text-ink"
            : "text-ink-soft hover:bg-cream hover:text-ink"
        )}
      >
        <ExploreIcon size={16} />
        <span>Explore</span>
        <ChevronDownIcon size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Explore navigation"
          className="absolute right-0 mt-2 w-72 rounded-card-lg bg-paper border border-hairline shadow-modal overflow-hidden z-50 animate-pop-fade-down"
        >
          <ul className="py-1">
            {exploreDropdownItems.map((item) => {
              const Icon = item.icon;
              const itemActive = item.match(pathname);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    aria-current={itemActive ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-2.5 transition-colors",
                      itemActive
                        ? "bg-cream text-ink"
                        : "text-ink-soft hover:bg-cream hover:text-ink"
                    )}
                  >
                    <Icon size={18} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium leading-tight">{item.label}</p>
                      {item.description && (
                        <p
                          className={cn(
                            "text-caption leading-tight mt-0.5",
                            itemActive ? "text-ink-soft" : "text-muted"
                          )}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
