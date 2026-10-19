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
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, name: profile?.full_name ?? null, role: profile?.role ?? "customer" };
}

/** The signed-in person, if any. Gives up after 4 seconds so a slow moment never stops a page loading. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    return await Promise.race([loadViewer(), new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))]);
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
