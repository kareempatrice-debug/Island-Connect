import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase/env";

/*
 * Short-lived links to a request's documents. Only called after the page has confirmed (through
 * the database's own access rules) that the viewer may see the request.
 */
export async function signedDocs(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length || !process.env.SUPABASE_SECRET_KEY || !SUPABASE_URL) return out;
  const db = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await db.storage.from("gateway-documents").createSignedUrls(paths, 3600);
  for (const d of data ?? []) if (d.signedUrl && d.path) out.set(d.path, d.signedUrl);
  return out;
}

export const docName = (p: string) => p.split("/").pop()?.replace(/-\d{10,}-[a-z0-9]{5}/, "") ?? "Document";
