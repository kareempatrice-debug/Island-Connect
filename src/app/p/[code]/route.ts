import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/*
 * Partner links and QR codes: islandconnect.cc/p/<code>
 * Counts the scan, remembers the partner for 30 days (so bookings are credited to them),
 * and sends the visitor to the right screen, such as booking a ride from the airport.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const site = new URL(request.url).origin;
  if (!/^[a-zA-Z0-9-]{3,40}$/.test(code) || !SUPABASE_URL) return NextResponse.redirect(`${site}/`);
  const db = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false } });
  const { data } = await db.rpc("partner_landing", { p_code: code });
  if (!data) return NextResponse.redirect(`${site}/`);
  const p = data as { code: string; country: string; landing: string };
  const to = p.landing === "airport" ? `/${p.country}/ride/taxi?from=airport` : p.landing === "home" ? `/${p.country}` : `/${p.country}/ride/taxi`;
  const res = NextResponse.redirect(`${site}${to}`);
  res.cookies.set("ic_partner", p.code, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true, secure: site.startsWith("https") });
  return res;
}
