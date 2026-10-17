import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
 * A Supabase client that acts as the signed-in visitor, using their session
 * cookie. Everything it can read or write is limited by Row Level Security.
 * Only the public anon key is used; no secret keys exist in this app.
 */
export async function supabaseForRequest() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware refreshes sessions instead.
        }
      },
    },
  });
}
