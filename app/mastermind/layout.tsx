import type { Metadata } from "next";
import { requireAdmin } from "@/lib/mastermind/auth";
import { MastermindShell } from "@/components/mastermind/shell";

export const metadata: Metadata = {
  title: "Mastermind",
  robots: { index: false, follow: false },
};

/**
 * Founder cockpit shell — gates access via `profiles.is_admin = true`.
 * Anyone else gets bounced to /shelf. Logged-out users go to /auth/login
 * with `next=/mastermind` so they bounce back here.
 *
 * No FeedbackChip (the chip already skips /admin paths and we extend that
 * to /mastermind). No BottomNav — sidebar carries navigation.
 */
export default async function MastermindLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin("/mastermind");
  return <MastermindShell profile={profile}>{children}</MastermindShell>;
}
