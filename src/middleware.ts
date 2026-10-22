import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/*
 * Keeps a signed-in person's session fresh. This runs before every page, so it must never
 * hold a page up:
 *  - visitors who aren't signed in (most people) skip it entirely, with no network call;
 *  - for signed-in people, the token is checked locally where possible, and refreshed only when it
 *    has expired. A refresh must be allowed to finish: if the page moved on half-way, the browser
 *    would keep a used-up refresh token and the person would appear signed out (the bug where the
 *    ride screen asked a signed-in person to sign in). So it gets up to 8 seconds.
 */
const REFRESH_LIMIT_MS = 8000;

export async function middleware(request: NextRequest) {
  const url = SUPABASE_URL;
  const key = SUPABASE_PUBLIC_KEY;
  if (!url || !key) return NextResponse.next();
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))) return NextResponse.next();

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await Promise.race([
      supabase.auth.getClaims(),
      new Promise((resolve) => setTimeout(resolve, REFRESH_LIMIT_MS)),
    ]);
  } catch {
    // Never block a page over a session refresh.
  }
  return response;
}

export const config = {
  // Pages only: skip static files, images, the service worker, the health check and sign-in callbacks.
  matcher: ["/((?!_next/static|_next/image|images|brand|icon|manifest|favicon|sw\\.js|api/|auth/callback|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)"],
};
