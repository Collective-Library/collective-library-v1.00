import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import type { Profile } from "@/types";

/**
 * Server-side admin gate. Use in /mastermind page server components and
 * /api/mastermind route handlers. Returns the admin Profile or redirects.
 *
 * For pages: omit `nextPath` to default to the calling pathname (caller is
 * encouraged to pass the actual pathname for accurate post-login redirect).
 */
export async function requireAdmin(nextPath = "/mastermind"): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  if (!profile.is_admin) redirect("/shelf");
  return profile;
}

/**
 * For API route handlers — returns null+403 instead of redirect.
 * Caller should: `if (!admin) return Response.json({ error }, { status: 403 })`.
 */
export async function getAdminProfileOrNull(): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_admin) return null;
  return profile;
}
