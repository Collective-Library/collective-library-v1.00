import type { Profile } from "@/types";

/**
 * Top-of-page greeting for /home. Short, warm, founder-voice.
 * Falls back to a generic salutation if the profile has neither name
 * nor username (shouldn't happen post-onboarding but defensive).
 */
export function HomeGreeting({ profile }: { profile: Profile }) {
  const first = (profile.full_name ?? profile.username ?? "").trim().split(/\s+/)[0];
  return (
    <header className="space-y-1.5 pt-1">
      <h1 className="font-display text-display-lg text-ink leading-tight">
        {first ? `Halo, ${first}.` : "Halo."}
      </h1>
      <p className="text-body text-ink-soft">Lagi rame apa di knowledge network lo?</p>
    </header>
  );
}
