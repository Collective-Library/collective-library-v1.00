import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on every request and performs
 * cheap optimistic auth gates (only checking presence of session, no DB reads).
 *
 * Per Next.js 16 docs: Proxy runs on every request including prefetches.
 * Database reads here cause stale/contradictory redirects. Keep this thin —
 * profile-completeness checks live in `app/(app)/layout.tsx` instead.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth");
  // /profile/[username] is publicly readable; only /profile/edit requires auth.
  // /book/[id] is also still auth-gated for V1; flip to public if we ever
  // want SEO-discoverable book detail.
  const isAppRoute =
    pathname.startsWith("/shelf") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/wanted") ||
    pathname.startsWith("/profile/edit") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/mastermind") ||
    pathname.startsWith("/admin");

  // Not signed in & trying to access an authed route → login
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in & on a login/register page → shelf
  if (
    user &&
    isAuthPage &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/logout")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/shelf";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
