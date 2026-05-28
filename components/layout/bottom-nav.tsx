"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Profile } from "@/types";
import { bottomNavItems } from "./nav-config";
import { ProfileIcon } from "./nav-icons";

/**
 * BottomNav — mobile/tablet only (md-). Five tabs total.
 *
 * Slice 2 interim layout (Library / Activity / Add / Events / Profile)
 *   — Wanted moves to the hamburger Library group + Discover.
 *   — Events surfaces here as a primary tap to start exposing the
 *     activation spine on mobile before `/home` lands.
 *
 * Slice 3A will swap Events out and add Home as tab 1; Library shifts
 * to tab 2; Add stays prominent center; Activity moves to tab 4;
 * Profile stays tab 5.
 *
 * Profile is rendered inline because its href is dynamic (depends on
 * `profile.username`). All other items come from `nav-config.ts`.
 */
export function BottomNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname() ?? "";
  const profileHref = profile?.username ? `/profile/${profile.username}` : "/profile/edit";
  const profileActive = pathname.startsWith("/profile");

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-hairline"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto h-16">
        {bottomNavItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-full text-caption",
                  item.prominent ? "text-ink" : active ? "text-ink" : "text-muted"
                )}
              >
                {item.prominent ? (
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-pill bg-ink text-parchment -mt-2 shadow-card">
                    <Icon size={22} />
                  </span>
                ) : (
                  <Icon size={22} />
                )}
                <span className={cn("text-[11px] font-medium", item.prominent && "mt-0.5")}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        {/* Profile — dynamic href; handled inline. */}
        <li className="flex">
          <Link
            href={profileHref}
            aria-current={profileActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-full text-caption",
              profileActive ? "text-ink" : "text-muted"
            )}
          >
            <ProfileIcon size={22} />
            <span className="text-[11px] font-medium">Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
