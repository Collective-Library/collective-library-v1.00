import { Suspense } from "react";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { NavigationProgress } from "./navigation-progress";
import type { Profile } from "@/types";

/** Wraps app pages with the TopBar + BottomNav and the parchment canvas. */
export function PageShell({
  profile,
  unreadCount = 0,
  children,
}: {
  profile: Profile | null;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      {/* Global navigation progress bar — fires on every same-origin link click */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-ink focus:text-parchment focus:px-4 focus:py-2 focus:rounded-button"
      >
        Skip to main content
      </a>
      <TopBar profile={profile} unreadCount={unreadCount} />
      <main id="main" className="pb-24 md:pb-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6">{children}</div>
      </main>
      <BottomNav profile={profile} />
    </div>
  );
}
