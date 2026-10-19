import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/*
 * Keeps a signed-in person's session fresh. This runs before every page, so it must never
 * hold a page up:
 *  - visitors who aren't signed in (most people) skip it entirely, with no network call;
 *  - for signed-in people the refresh gets at most 2.5 seconds, then the page loads anyway.
 * A slow moment at the database therefore can't make the whole site fail.
 */
const REFRESH_LIMIT_MS = 2500;

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
      supabase.auth.getUser(),
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
