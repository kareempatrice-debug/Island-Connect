import Link from "next/link";
import type { ReactNode } from "react";
import { PushSetup } from "@/components/push-setup";
import { TRIP_KIND_LABEL, TRIP_STATUS_LABEL, fmtWhen, fmtXcd } from "@/lib/trips";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* An approved operator's Trips tab: open requests to price, bookings, and completed-trip totals. */
export function OperatorTrips({ kinds, open, mine, totals, businessId, notice, quoteForm, complete, acceptFixed, chatHref }: {
  kinds: string[]; open: any[]; mine: any[]; totals: { n: number; fares: number; commission: number }; businessId: string;
  notice?: ReactNode; quoteForm: (r: any, my: any) => ReactNode; complete: (r: any) => ReactNode;
  acceptFixed: (r: any) => ReactNode; chatHref: (r: any) => string;
}) {
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  return (
    <div className="space-y-8">
      {notice}
      <PushSetup what="new trip requests" />
      <section aria-labelledby="open-h">
        <h2 id="open-h" className="text-xl font-semibold">Requests waiting for a price</h2>
        <p className="mt-1 text-sm">Approved for: {kinds.map((k) => TRIP_KIND_LABEL[k]).join(", ")}.</p>
        {!open?.length ? <p className="mt-3 rounded-2xl border border-dashed border-line p-5">No open requests right now. New ones are emailed to you as they arrive.</p> : (
          <ul className="mt-3 space-y-3">
            {open.map((r: any) => {
              const my = (r.trip_quotes ?? []).find((q: any) => q.business_id === businessId);
              return (
                <li key={r.id} className={card}>
                  <p className="font-semibold text-ink">{r.pickup}, {r.from_place} → {r.dropoff}, {r.to_place}</p>
                  <p className="text-sm">{TRIP_KIND_LABEL[r.kind]} · {fmtWhen(r.travel_at)}{r.passengers ? ` · ${r.passengers} passengers` : ""}{r.cross_border ? " · crosses the border" : ""}</p>
                  {r.details && <p className="mt-1 text-sm text-ink">{r.details}</p>}
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

      <section aria-labelledby="booked-h">
        <h2 id="booked-h" className="text-xl font-semibold">Booked with you</h2>
        {!mine?.length ? <p className="mt-3 text-sm">No bookings yet.</p> : (
          <ul className="mt-3 space-y-3">
            {mine.map((q: any) => {
              const r = q.trip_requests;
              const phone = r?.trip_contacts?.phone_e164 ?? (Array.isArray(r?.trip_contacts) ? r.trip_contacts[0]?.phone_e164 : null);
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
                  {phone && r.status === "booked" && (
                    <p className="mt-2 text-sm">Customer: <a href={`https://wa.me/${phone.replace(/^\+/, "")}`} className="font-semibold text-link underline">WhatsApp</a> or <a href={`tel:${phone}`} className="font-semibold text-link underline">call {phone}</a></p>
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
