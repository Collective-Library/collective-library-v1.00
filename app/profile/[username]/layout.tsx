import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Footer } from "@/components/layout/footer";
import { AvatarMenu } from "@/components/layout/avatar-menu";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";

/**
 * Public-facing layout for /profile/[username]. No BottomNav (this is a
 * public-readable surface), but we DO show the user's AvatarMenu when
 * they're logged in so navigation back to their own app stays one click.
 *
 * Anon visitors see a "Masuk" CTA — encourages signup after they finish
 * peeking at someone's rak.
 */
export default async function PublicProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen bg-parchment text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-hairline-soft">
        <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" aria-label="Collective Library" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="hidden sm:inline font-display text-title-md text-ink leading-none">
              Collective Library
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {profile ? (
              <>
                <Link
                  href="/shelf"
                  className="hidden sm:inline-flex items-center h-9 px-4 rounded-pill text-body-sm font-medium text-ink-soft hover:bg-cream"
                >
                  Buka rak
                </Link>
                <AvatarMenu profile={profile} />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-body-sm font-medium text-ink-soft hover:text-ink"
                >
                  Masuk
                </Link>
                <ButtonLink href="/auth/register" size="sm" pill>
                  Daftar
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
