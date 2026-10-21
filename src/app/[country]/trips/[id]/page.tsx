import { after } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { acceptQuoteAction, cancelTripAction } from "@/app/trip-actions";
import { NeedsDatabase } from "@/components/demo-notice";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";
import { PushSetup } from "@/components/push-setup";
import { TripSafety } from "@/components/trips/trip-safety";
import { DriverMap } from "@/components/trips/driver-map";
import { coastlines } from "@/data/coastlines";
import { landmarks } from "@/data/landmarks";
import { handleDispatchEvent } from "@/lib/notify";
import { AutoRefresh } from "@/components/trips/auto-refresh";
import { TripProgress } from "@/components/trips/trip-progress";
import { TripDetail, type QuoteView, type TripView } from "@/components/trips/trip-detail";

export const metadata: Metadata = { title: "Your trip", robots: { index: false } };

export default async function Trip({ params, searchParams }: { params: Promise<{ country: string; id: string }>; searchParams: Promise<{ error?: string; booked?: string }> }) {
  const [{ country, id }, sp] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Trips" /></Container>;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const viewer = await requireViewer(`/${country}/trips/${id}`, country);
  const supabase = await supabaseForRequest();
  const { data: t } = await supabase
    .from("trip_requests")
    .select("*, trip_quotes!trip_quotes_request_id_fkey ( id, amount_xcd, includes, valid_until, status, created_at, businesses ( name, slug, phone_e164, whatsapp_e164, founder_owned ) )")
    .eq("id", id)
    .maybeSingle();
  if (!t || t.customer_id !== viewer.id) notFound();
  const now = Date.now();
  // Keep the ride moving: if a driver's offer timed out, offer the next one (and alert them).
  if (t.status === "open" && t.dispatch_state === "dispatching") {
    const { data: ev } = await supabase.rpc("dispatch_tick", { p_request: t.id });
    after(() => handleDispatchEvent(ev, t.id));
  }
  const [{ data: pinRow }, { data: contacts }, { data: reach }, { data: dispatch }, { data: driverPos }] = await Promise.all([
    supabase.from("trip_pins").select("pin").eq("request_id", t.id).maybeSingle(),
    supabase.from("trusted_contacts").select("name, phone_e164").order("created_at"),
    supabase.rpc("request_reach", { p_request: t.id }),
    supabase.rpc("dispatch_info", { p_request: t.id }),
    t.status === "booked" ? supabase.rpc("my_driver_position", { p_request: t.id }) : Promise.resolve({ data: null }),
  ]);
  // Map for a booked ride: the island the pick-up is on, and the driver's live position.
  const near = t.pickup_lat != null ? landmarks.filter((l) => l.countryCode === t.country_code)
    .map((l) => ({ l, d: Math.hypot(l.lat - t.pickup_lat, l.lng - t.pickup_lng) })).sort((a, b) => a.d - b.d)[0]?.l : null;
  const showMap = t.status === "booked" && !t.picked_up_at && t.pickup_lat != null && near;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const active = ["open", "booked"].includes(t.status);
  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      {active && <AutoRefresh seconds={t.status === "open" ? 5 : 10} />}
      <TripProgress status={t.status} pickedUp={Boolean(t.picked_up_at)} reach={typeof reach === "number" ? reach : null} createdAt={t.created_at} fixed={Boolean(t.fixed_fare_xcd)}
        dispatch={dispatch as { state: string | null; tried: number; current_km: number | null } | null} />
      {showMap && (
        <DriverMap googleKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null} pickup={{ label: t.pickup, lat: t.pickup_lat, lng: t.pickup_lng }}
          driver={driverPos as { lat: number; lng: number; heading: number | null; km: number | null; at: string } | null}
          coastline={coastlines[near!.island] ?? []} landmarks={landmarks.filter((l) => l.island === near!.island)} />
      )}
      {t.status === "open" && <div className="mb-6"><PushSetup what="new quotes" /></div>}
      {active && (
        <TripSafety pin={pinRow?.pin ?? null} shareUrl={t.share_token ? `${site}/share/${t.share_token}` : null} contacts={contacts ?? []}
          riderName={t.rider_name ?? null} booked={t.status === "booked"} pickedUp={Boolean(t.picked_up_at)} />
      )}
      <TripDetail
        country={country}
        chatHref={`/${country}/trips/${t.id}/chat`}
        t={t as TripView}
        quotes={(t["trip_quotes"] ?? []) as QuoteView[]}
        now={now}
        notice={
          sp.error ? <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{sp.error}</p>
          : sp.booked ? <p role="status" className="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">Booked. The operator has been told and will be in touch to confirm the details.</p> : null
        }
        accept={(q) => (
          <form action={acceptQuoteAction}>
            <input type="hidden" name="id" value={q.id} /><input type="hidden" name="trip" value={t.id} /><input type="hidden" name="country" value={country} />
            <button className="h-11 w-full rounded-full bg-primary font-semibold text-primary-ink">Accept this quote</button>
          </form>
        )}
        cancel={
          <form action={cancelTripAction}>
            <input type="hidden" name="id" value={t.id} /><input type="hidden" name="country" value={country} />
            <button className="text-sm font-semibold text-danger underline">Cancel this request</button>
          </form>
        }
      />
    </Container>
  );
}
