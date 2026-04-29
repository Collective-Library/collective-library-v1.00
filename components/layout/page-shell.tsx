import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import type { Profile } from "@/types";

/** Wraps app pages with the TopBar + BottomNav and the parchment canvas. */
export function PageShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <TopBar profile={profile} />
      <main className="pb-24 md:pb-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6">{children}</div>
      </main>
      <BottomNav profile={profile} />
    </div>
  );
}
