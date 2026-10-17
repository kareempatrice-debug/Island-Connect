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
export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await supabaseForRequest();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, name: profile?.full_name ?? null, role: profile?.role ?? "customer" };
}

export async function requireViewer(returnTo: string, country = "gd"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/${country}/sign-in?next=${encodeURIComponent(returnTo)}`);
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
