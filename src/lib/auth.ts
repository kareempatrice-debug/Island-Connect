import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./data";
import { supabaseForRequest } from "./supabase/server";

export interface Viewer {
  id: string;
  email: string | null;
  name: string | null;
  role: "customer" | "content_editor" | "admin";
}

/** The signed-in person, or null. Always null in demo mode. */
async function loadViewer(): Promise<Viewer | null> {
  const supabase = await supabaseForRequest();
  // getClaims checks the sign-in token's signature locally (fast) where the project uses signing keys,
  // and falls back to asking Supabase otherwise. Either way it's verified, not just read from a cookie.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: string; email?: string } | undefined;
  if (!claims?.sub) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", claims.sub).maybeSingle();
  return { id: claims.sub, email: claims.email ?? null, name: profile?.full_name ?? null, role: profile?.role ?? "customer" };
}

/** The signed-in person, if any. Gives up after 8 seconds so a slow moment never stops a page loading. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    return await Promise.race([loadViewer(), new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))]);
  } catch {
    return null;
  }
});

export async function requireViewer(returnTo: string, _country = "gd"): Promise<Viewer> {
  void _country;
  const viewer = await getViewer();
  if (!viewer) redirect(`/join?mode=sign-in&next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer("/admin");
  if (viewer.role !== "admin") redirect("/");
  return viewer;
}

/** Only allow redirects back into this site after signing in. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
