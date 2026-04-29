import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { isProfileComplete } from "@/types";
import { PageShell } from "@/components/layout/page-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // No session at all — proxy.ts already redirected to /auth/login.
  // This is just a defensive fallback if proxy is bypassed.
  if (!profile) redirect("/auth/login");

  // Authed but profile incomplete (missing username or any contact) → finish onboarding.
  if (!isProfileComplete(profile)) redirect("/onboarding");

  return <PageShell profile={profile}>{children}</PageShell>;
}
