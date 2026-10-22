import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";

/*
 * Who's signed in, and anything that needs their attention (their ride, a ride offer, new requests).
 * Pages are served ready-made and fast; the header asks this once the page has appeared.
 */
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const none = NextResponse.json({ signedIn: false }, { headers: { "cache-control": "private, no-store" } });
  if (!isSupabaseConfigured) {
    return process.env.PREVIEW_SAMPLE_ACCOUNT
      ? NextResponse.json({ signedIn: true, name: "Sample admin", isAdmin: true })
      : none;
  }
  const viewer = await getViewer();
  if (!viewer) return none;
  const supabase = await supabaseForRequest();
  const since = new Date(Date.now() - 2 * 86400_000).toISOString();
  const [{ data: mine }, { data: ops }] = await Promise.all([
    supabase.from("trip_requests").select("id, status, picked_up_at, country_code").eq("customer_id", viewer.id).in("status", ["open", "booked"]).gte("created_at", since).order("created_at", { ascending: false }).limit(1),
    supabase.from("business_members").select("business_id, businesses ( slug, operator_profiles ( status, kinds ) )").eq("user_id", viewer.id),
  ]);
  const opOf = (m: any) => { const p = m.businesses?.operator_profiles; return Array.isArray(p) ? p[0] : p; };
  const op = (ops ?? []).find((m: any) => opOf(m)?.status === "approved") as any;
  const driver = (ops ?? []).find((m: any) => opOf(m)?.status === "approved" && (opOf(m)?.kinds ?? []).some((k: string) => ["taxi", "airport", "group"].includes(k))) as any;
  let waiting = 0;
  let offer: any = null;
  if (op) {
    const [{ data: offers }, { data: open }] = await Promise.all([
      supabase.from("trip_offers").select("id, price_xcd, distance_km").eq("status", "offered").gt("expires_at", new Date().toISOString()).limit(1),
      supabase.from("trip_requests").select("id, trip_quotes!trip_quotes_request_id_fkey ( business_id )").eq("status", "open").neq("customer_id", viewer.id).gte("created_at", since).limit(50),
    ]);
    offer = offers?.[0] ?? null;
    waiting = (open ?? []).filter((r: any) => !(r.trip_quotes ?? []).some((q: any) => q.business_id === op.business_id)).length;
  }
  return NextResponse.json({
    signedIn: true, name: viewer.name, isAdmin: viewer.role === "admin",
    driverBusinessId: driver?.business_id ?? null,
    trip: mine?.[0] ?? null,
    offer: offer ? { id: offer.id, price: Number(offer.price_xcd), km: offer.distance_km != null ? Number(offer.distance_km) : null } : null,
    waiting, opSlug: op?.businesses?.slug ?? null,
  }, { headers: { "cache-control": "private, no-store" } });
}
