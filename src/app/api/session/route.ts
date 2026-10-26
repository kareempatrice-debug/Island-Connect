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
  const [{ data: mine }, { data: ops }, { data: rate }] = await Promise.all([
    supabase.from("trip_requests").select("id, status, picked_up_at, country_code").eq("customer_id", viewer.id).in("status", ["open", "booked"]).gte("created_at", since).order("created_at", { ascending: false }).limit(1),
    supabase.from("business_members").select("business_id, businesses ( slug, operator_profiles ( status, kinds ) )").eq("user_id", viewer.id),
    supabase.rpc("pending_rating"),
  ]);
  const opOf = (m: any) => { const p = m.businesses?.operator_profiles; return Array.isArray(p) ? p[0] : p; };
  const op = (ops ?? []).find((m: any) => opOf(m)?.status === "approved") as any;
  const driver = (ops ?? []).find((m: any) => opOf(m)?.status === "approved" && (opOf(m)?.kinds ?? []).some((k: string) => ["taxi", "airport", "group"].includes(k))) as any;
  let waiting = 0;
  let offer: any = null;
  let docsAlert: { level: "offline" | "soon"; text: string } | null = null;
  if (op) {
    // Remind drivers before documents expire; tell them plainly when they're offline.
    const { data: c } = await supabase.rpc("operator_compliance", { p_business: op.business_id });
    if (c) {
      const comp = c as any;
      if (!comp.good_standing) docsAlert = { level: "offline", text: "You’re offline: documents need updating" };
      else if ((comp.expiring ?? []).length) {
        const soonest = [...comp.expiring].sort((a: any, b: any) => a.expires_on.localeCompare(b.expires_on))[0];
        const days = Math.ceil((new Date(`${soonest.expires_on}T23:59:59`).getTime() - Date.now()) / 86400_000);
        docsAlert = { level: "soon", text: `A document expires in ${days} day${days === 1 ? "" : "s"}: upload the renewal` };
      } else if (comp.grace_until && (comp.missing ?? []).length) {
        const days = Math.ceil((new Date(`${comp.grace_until}T23:59:59`).getTime() - Date.now()) / 86400_000);
        docsAlert = { level: "soon", text: `Add your documents within ${days} day${days === 1 ? "" : "s"} to keep getting rides` };
      }
    }
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
    rate: rate ?? null,
    docsAlert,
  }, { headers: { "cache-control": "private, no-store" } });
}
