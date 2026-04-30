import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { getCurrentProfile } from "@/lib/auth";

/**
 * Admin shell — gates access via `profiles.is_admin = true`. Anyone else
 * gets bounced to /shelf. Slim header, no BottomNav, no FeedbackChip
 * (handled by FeedbackChip's own /admin path-skip).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/admin/feedback");
  if (!profile.is_admin) redirect("/shelf");

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-hairline-soft">
        <div className="mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/shelf" className="flex items-center gap-2 text-ink-soft hover:text-ink">
            <Logo size={26} />
            <span className="font-display text-title-md leading-none">Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-body-sm">
            <Link href="/admin/feedback" className="text-ink-soft hover:text-ink underline-offset-4 hover:underline">
              Feedback
            </Link>
            <span className="text-muted-soft">·</span>
            <Link href="/shelf" className="text-muted hover:text-ink-soft">
              ← Balik ke app
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 md:px-6 py-6 md:py-8">{children}</main>
    </div>
  );
}
