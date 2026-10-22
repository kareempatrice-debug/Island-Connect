import { placeWithIsland } from "@/lib/place-text";
import Link from "next/link";
import { directionsLink } from "@/lib/geo";
import type { ReactNode } from "react";
import { PushSetup } from "@/components/push-setup";
import { AutoRefresh } from "./auto-refresh";
import { TRIP_KIND_LABEL, TRIP_STATUS_LABEL, fmtWhen, fmtXcd } from "@/lib/trips";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* An approved operator's Trips tab: open requests to price, bookings, and completed-trip totals. */
export function OperatorTrips({ kinds, open, mine, totals, businessId, notice, quoteForm, complete, acceptFixed, chatHref, confirmPickup, alertsSetting }: {
  kinds: string[]; open: any[]; mine: any[]; totals: { n: number; fares: number; commission: number }; businessId: string;
  notice?: ReactNode; quoteForm: (r: any, my: any) => ReactNode; complete: (r: any) => ReactNode;
  acceptFixed: (r: any) => ReactNode; chatHref: (r: any) => string;
  confirmPickup?: (r: any) => ReactNode;
  alertsSetting?: ReactNode;
}) {
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  return (
    <div className="space-y-8">
      {notice}
      <AutoRefresh seconds={15} />
      {kinds.some((k) => ["taxi", "airport", "group"].includes(k)) && (
        <p className="rounded-2xl bg-sunken px-4 py-3 text-sm">Tap <strong className="text-ink">Go online</strong> at the top of the screen to appear on customers’ maps and receive ride offers. It stays on as you move around the app.</p>
      )}
      <section aria-labelledby="open-h">
        <h2 id="open-h" className="flex items-center gap-2 text-xl font-semibold">
          New ride requests
          {open?.length ? <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gold px-2 text-sm font-bold text-[#172B32]">{open.length}</span> : null}
        </h2>
        <p className="mt-1 text-sm">You receive: {[...new Set(kinds.map((k) => (k === "airport" ? "taxi" : k)))].map((k) => (k === "taxi" ? "Taxi and airport" : TRIP_KIND_LABEL[k])).join(", ")}. This page updates by itself.</p>
        {!open?.length ? <p className="mt-3 rounded-2xl border border-dashed border-line p-5">No new requests right now. They appear here, and on your phone if notifications are on.</p> : (
          <ul className="mt-3 space-y-3">
            {open.map((r: any) => {
              const my = (r.trip_quotes ?? []).find((q: any) => q.business_id === businessId);
              return (
                <li key={r.id} className={card}>
                  <p className="font-semibold text-ink">{placeWithIsland(r.pickup, r.from_place)} → {placeWithIsland(r.dropoff, r.to_place)}</p>
                  <p className="text-sm">{TRIP_KIND_LABEL[r.kind]} · {fmtWhen(r.travel_at)}{r.passengers ? ` · ${r.passengers} passengers` : ""}{r.distance_km ? ` · ${r.distance_km} km, about ${r.duration_min} min` : ""}{r.cross_border ? " · crosses the border" : ""}</p>
                  {r.rider_name && <p className="mt-1 text-sm text-ink">Booked for <strong>{r.rider_name}</strong></p>}
                  {!r.fixed_fare_xcd && r.estimate_low_xcd && <p className="mt-1 text-sm">Customer was shown an estimate of <strong className="text-ink">EC${Number(r.estimate_low_xcd).toFixed(0)} to {Number(r.estimate_high_xcd).toFixed(0)}</strong></p>}
                  {r.details && <p className="mt-1 text-sm text-ink">{r.details}</p>}
                  <a href={directionsLink({ lat: r.pickup_lat ?? undefined, lng: r.pickup_lng ?? undefined, label: r.pickup }, { lat: r.dropoff_lat ?? undefined, lng: r.dropoff_lng ?? undefined, label: r.dropoff })}
                    target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-link underline">See the route in Google Maps</a>
                  {r.fixed_fare_xcd ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-gold/15 p-3">
                      <p className="min-w-0 flex-1 text-sm text-ink"><strong>Official fare {fmtXcd(r.fixed_fare_xcd)}.</strong> First driver to accept gets the trip.</p>
                      {acceptFixed(r)}
                    </div>
                  ) : quoteForm(r, my)}
                  {my && <p className="mt-2 text-xs">You quoted {fmtXcd(my.amount_xcd)}.</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="settings-h" className="space-y-3">
        <h2 id="settings-h" className="text-xl font-semibold">How you get requests</h2>
        <PushSetup what="new trip requests" />
        {alertsSetting}
      </section>

      <section aria-labelledby="booked-h">
        <h2 id="booked-h" className="text-xl font-semibold">Booked with you</h2>
        {!mine?.length ? <p className="mt-3 text-sm">No bookings yet.</p> : (
          <ul className="mt-3 space-y-3">
            {mine.map((q: any) => {
              const r = q.trip_requests;
              const contact = Array.isArray(r?.trip_contacts) ? r.trip_contacts[0] : r?.trip_contacts;
              const phone = contact?.phone_e164 ?? null;
              const riderPhone = contact?.rider_phone_e164 ?? null;
              return (
                <li key={q.id} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{r.pickup} → {r.dropoff}</p>
                      <p className="text-sm">{TRIP_KIND_LABEL[r.kind]} · {fmtWhen(r.travel_at)} · {TRIP_STATUS_LABEL[r.status]}</p>
                      {r.details && <p className="mt-1 text-sm text-ink">{r.details}</p>}
                    </div>
                    <p className="shrink-0 font-semibold text-ink">{fmtXcd(q.amount_xcd)}</p>
                  </div>
                  {r.rider_kind && r.rider_kind !== "adult" && (
                    <p className="mt-2 inline-block rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold text-ink">{r.rider_kind === "teen" ? "Teenage passenger: confirm the PIN before setting off" : "Senior passenger: please help with bags and doors"}</p>
                  )}
                  {r.status === "booked" && !r.picked_up_at && confirmPickup?.(r)}
                  {r.picked_up_at && <p className="mt-2 text-sm font-semibold text-success">Pick-up confirmed with PIN</p>}
                  {r.rider_name && r.status === "booked" && (
                    <p className="mt-2 text-sm">Passenger: <strong className="text-ink">{r.rider_name}</strong>{riderPhone && <> · <a href={`https://wa.me/${riderPhone.replace(/^\+/, "")}`} className="font-semibold text-link underline">WhatsApp</a> or <a href={`tel:${riderPhone}`} className="font-semibold text-link underline">call {riderPhone}</a></>}</p>
                  )}
                  {phone && r.status === "booked" && (
                    <p className="mt-2 text-sm">{r.rider_name ? "Booked by" : "Customer"}: <a href={`https://wa.me/${phone.replace(/^\+/, "")}`} className="font-semibold text-link underline">WhatsApp</a> or <a href={`tel:${phone}`} className="font-semibold text-link underline">call {phone}</a></p>
                  )}
                  {r.status === "booked" && (
                    <a href={directionsLink({ lat: r.pickup_lat ?? undefined, lng: r.pickup_lng ?? undefined, label: r.pickup }, { lat: r.dropoff_lat ?? undefined, lng: r.dropoff_lng ?? undefined, label: r.dropoff })}
                      target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-link underline">Directions in Google Maps</a>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link href={chatHref(r)} className="inline-flex h-10 items-center rounded-full bg-deep px-4 text-sm font-semibold text-white">Message the customer</Link>
                    {r.status === "booked" && complete(r)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="ledger-h">
        <h2 id="ledger-h" className="text-lg font-semibold">Completed trips</h2>
        <p className="mt-1">{totals.n} completed · fares {fmtXcd(totals.fares)} · Island Connect commission {fmtXcd(totals.commission)}</p>
        <p className="mt-1 text-xs">Commission is 0% while Island Connect launches. You’ll be told well in advance before that changes.</p>
      </section>
    </div>
  );
}
