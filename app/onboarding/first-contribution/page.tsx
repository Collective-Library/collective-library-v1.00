import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth";
import { isProfileComplete } from "@/types";
import { Logo } from "@/components/layout/logo";
import { FirstContributionPrompt } from "@/components/onboarding/FirstContributionPrompt";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mulai dari sinyal pertama — Collective Library",
  description: "Pilih kontribusi pertama lo di Collective Library.",
};

/**
 * /onboarding/first-contribution — shown immediately after a new user
 * completes profile onboarding. Skippable.
 *
 * Auth: this route lives under `/onboarding/*`, which `proxy.ts:isAppRoute`
 * already gates via `pathname.startsWith("/onboarding")`. Anon visits
 * therefore get bounced by proxy to `/auth/login?next=/onboarding/...`
 * before reaching this server component.
 *
 * Profile-completeness: enforced here. If a user lands on this page with
 * an incomplete profile (e.g. typed the URL directly), we bounce them to
 * `/onboarding` to finish the form first. Already-onboarded users hitting
 * `/onboarding` itself are sent to `/home` (handled in
 * `app/onboarding/page.tsx`) so returning users never see this prompt.
 *
 * Outside the `(app)/` route group on purpose — slim header without
 * TopBar / BottomNav, matching the look of `/onboarding`.
 */
export default async function FirstContributionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/onboarding/first-contribution");
  if (!isProfileComplete(profile)) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-parchment">
      <header className="px-6 py-5 border-b border-hairline-soft">
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-title-md text-ink leading-none">
            Collective Library
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <FirstContributionPrompt />
      </main>
    </div>
  );
}
