import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/*
 * Setup check: open /api/health to see whether the site's settings are right.
 * Shows no secrets: only whether values are present and well-formed, and the
 * database's own error message if a test query fails.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let siteUrlOk = false;
  try {
    siteUrlOk = new URL(site).protocol === "https:" || site.startsWith("http://localhost");
  } catch {}

  const key = SUPABASE_PUBLIC_KEY.trim();
  const report: Record<string, unknown> = {
    siteUrl: site ? (siteUrlOk ? "ok" : `invalid: must start with https:// (got "${site.slice(0, 40)}")`) : "missing",
    supabaseUrl: !SUPABASE_URL ? "missing" : /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(SUPABASE_URL.trim()) ? "ok" : `unexpected format (got "${SUPABASE_URL.slice(0, 60)}")`,
    supabaseKey: !key ? "missing" : key.startsWith("sb_publishable_") ? `publishable key, ${key.length} characters` : key.startsWith("sb_secret_") ? "WRONG KEY: this is the secret key. Use the publishable key." : key.startsWith("eyJ") ? `legacy anon key, ${key.length} characters` : "unrecognised format",
  };

  if (SUPABASE_URL && key && !key.startsWith("sb_secret_")) {
    const db = createClient(SUPABASE_URL.trim(), key, { auth: { persistSession: false } });
    const { data, error } = await db.from("countries").select("code");
    report.database = error ? `error: ${error.message}` : `ok, ${data?.length ?? 0} countries`;
  }
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
}
