import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferCard } from "@/components/trips/offer-card";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { handleDispatchEvent } from "@/lib/notify";
import { supabaseForRequest } from "@/lib/supabase/server";
import { fmtWhen } from "@/lib/trips";

export const metadata: Metadata = { title: "Ride offer", robots: { index: false } };
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Offer({ params }: { params: Promise<{ country: string; id: string }> }) {
  const { country, id } = await params;
  await requireViewer(`/${country}/offers/${id}`, country);
  const supabase = await supabaseForRequest();
  const { data: o } = await supabase.from("trip_offers")
    .select("id, status, expires_at, distance_km, price_xcd, request_id, businesses ( slug ), trip_requests ( pickup, dropoff, travel_at, passengers, rider_kind, fare_source, fixed_fare_xcd, distance_km, details )")
    .eq("id", id).maybeSingle();
  if (!o) notFound();
  const offer = o as any;
  // If this offer has timed out, move the ride on to the next driver.
  if (offer.status === "offered" && new Date(offer.expires_at).getTime() <= Date.now()) {
    const { data: ev } = await supabase.rpc("dispatch_tick", { p_request: offer.request_id });
    await handleDispatchEvent(ev, offer.request_id);
  }
  const r = offer.trip_requests ?? {};
  return (
    <Container className="max-w-md py-6">
      <OfferCard
        offerId={offer.id}
        status={offer.status}
        expiresAt={offer.expires_at}
        price={Number(offer.price_xcd)}
        official={Boolean(r.fixed_fare_xcd) && !String(r.fare_source ?? "").startsWith("Island Connect estimate")}
        pickupKm={offer.distance_km != null ? Number(offer.distance_km) : null}
        pickup={r.pickup ?? ""}
        dropoff={r.dropoff ?? ""}
        when={fmtWhen(r.travel_at)}
        tripKm={r.distance_km != null ? Number(r.distance_km) : null}
        passengers={r.passengers ?? null}
        riderKind={r.rider_kind ?? null}
        note={r.details ?? null}
        tripsHref={`/${country}/dashboard/${offer.businesses?.slug}?tab=trips`}
      />
    </Container>
  );
}
