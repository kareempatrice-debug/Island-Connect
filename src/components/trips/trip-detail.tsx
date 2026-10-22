import Link from "next/link";
import { MessageCircle, MessagesSquare, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { TRIP_KIND_LABEL, TRIP_STATUS_LABEL, fmtWhen, fmtXcd } from "@/lib/trips";

export interface TripView {
  id: string; kind: string; status: string; pickup: string; dropoff: string; from_place: string; to_place: string;
  travel_at: string | null; passengers: number | null; details: string | null; cross_border: boolean;
  fixed_fare_xcd?: number | string | null;
}
export interface QuoteView {
  id: string; amount_xcd: number | string; includes: string | null; valid_until: string; status: string;
  businesses: { name: string; slug: string; phone_e164: string | null; whatsapp_e164: string | null; founder_owned?: boolean } | null;
}

/* The customer's view of one trip request: details, quotes to compare, and the booking. */
export function TripDetail({ country, t, quotes, notice, accept, cancel, now, backHref, chatHref }: {
  country: string; backHref?: string; chatHref?: string; t: TripView; quotes: QuoteView[]; notice?: ReactNode; accept: (q: QuoteView) => ReactNode; cancel: ReactNode; now: number;
}) {
  const sorted = [...quotes].sort((a, b) => Number(a.amount_xcd) - Number(b.amount_xcd));
  const accepted = sorted.find((q) => q.status === "accepted");
  return (
    <>
      <Link href={backHref ?? `/${country}/trips`} className="text-sm font-semibold text-link hover:underline">Your trips</Link>
      <h1 className="mt-2 text-3xl font-semibold">{t.pickup} to {t.dropoff}</h1>
      <p className="mt-1">{TRIP_KIND_LABEL[t.kind]} · {fmtWhen(t.travel_at)}{t.passengers ? ` · ${t.passengers} passenger${t.passengers > 1 ? "s" : ""}` : ""}</p>
      <p className="mt-3 inline-block rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink">{TRIP_STATUS_LABEL[t.status]}</p>
      {notice}

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl bg-raised p-4 text-[0.95rem] ring-1 ring-line/60">
        <dt>From</dt><dd className="font-semibold text-ink">{t.pickup}, {t.from_place}</dd>
        <dt>To</dt><dd className="font-semibold text-ink">{t.dropoff}, {t.to_place}</dd>
        {t.details && <><dt>Details</dt><dd className="text-ink">{t.details}</dd></>}
        {t.cross_border && <><dt>Border</dt><dd className="text-ink">Crosses between SVG and Grenada: customs apply</dd></>}
      </dl>

      {accepted && (
        <section className="mt-6 rounded-2xl bg-success/10 p-5" aria-labelledby="booked-h">
          <h2 id="booked-h" className="text-lg font-semibold">Booked with {accepted.businesses?.name}</h2>
          <p className="mt-1">Agreed price {fmtXcd(accepted.amount_xcd)}{accepted.includes ? `, ${accepted.includes}` : ""}. Pay the operator directly.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chatHref && <Link href={chatHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-deep px-5 font-semibold text-white"><MessagesSquare className="h-5 w-5" aria-hidden="true" />Message in the app</Link>}
            {accepted.businesses?.whatsapp_e164 && <a href={`https://wa.me/${accepted.businesses.whatsapp_e164.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-ink"><MessageCircle className="h-5 w-5" aria-hidden="true" />WhatsApp</a>}
            {accepted.businesses?.phone_e164 && <a href={`tel:${accepted.businesses.phone_e164}`} className="inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold text-ink ring-1 ring-line"><Phone className="h-5 w-5" aria-hidden="true" />Call</a>}
          </div>
        </section>
      )}

      {t.status === "open" && t.fixed_fare_xcd ? (
        <section className="mt-6 rounded-2xl bg-raised p-5 ring-1 ring-line/60" aria-labelledby="wait-h">
          <h2 id="wait-h" className="text-xl font-semibold">Waiting for a driver</h2>
          <p className="mt-1">Your trip has gone to approved drivers at the official fare of <strong className="text-ink">{fmtXcd(t.fixed_fare_xcd)}</strong>. The first to accept takes it, and we’ll tell you straight away.</p>
        </section>
      ) : t.status === "open" && (
        <section className="mt-6" aria-labelledby="quotes-h">
          <h2 id="quotes-h" className="text-xl font-semibold">Quotes</h2>
          {!sorted.length ? (
            <p className="mt-2 rounded-2xl border border-dashed border-line p-5">Your request has gone to approved operators. Quotes appear here, and we’ll email you as each one arrives.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sorted.map((q) => {
                const expired = new Date(q.valid_until).getTime() < now || q.status !== "offered";
                return (
                  <li key={q.id} className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/${country}/business/${q.businesses?.slug}`} className="font-semibold text-ink hover:underline">{q.businesses?.name}</Link>
                        {q.businesses?.founder_owned && <p className="text-xs font-semibold text-muted">Founder’s business</p>}
                        {q.includes && <p className="mt-1 text-sm">{q.includes}</p>}
                        <p className="mt-1 text-xs">Valid until {fmtWhen(q.valid_until)}</p>
                      </div>
                      <p className="shrink-0 text-xl font-semibold text-ink">{fmtXcd(q.amount_xcd)}</p>
                    </div>
                    {expired ? <p className="mt-2 text-sm">This quote has expired.</p> : <div className="mt-3">{accept(q)}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
      {(t.status === "open" || t.status === "booked") && <div className="mt-8">{cancel}</div>}
    </>
  );
}
