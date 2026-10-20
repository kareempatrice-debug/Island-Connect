import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OperatorTrips } from "@/components/trips/operator-trips";
import { InsightsPanel } from "@/components/admin/insights";
import { TripChat } from "@/components/trips/trip-chat";
import { TripDetail, type QuoteView, type TripView } from "@/components/trips/trip-detail";
import { Container } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/data";
import { TRIP_KIND_LABEL, TRIP_STATUS_LABEL, fmtWhen, fmtXcd } from "@/lib/trips";

/*
 * Sample-data versions of the Stage 3 trip screens, for the clickable preview only.
 * They use the same components as the real pages. On the live site (with a database)
 * these addresses don't exist.
 */
export const metadata: Metadata = { title: "Trips preview", robots: { index: false } };

const SCREENS = ["trips", "trip", "trip-booked", "operator", "operator-sent", "operator-accepted", "operator-completed", "chat", "admin", "admin-approved", "dashboard"] as const;
export function generateStaticParams() {
  return ["gd", "vc"].flatMap((country) => SCREENS.map((screen) => ({ country, screen })));
}

const inDays = (d: number, h = 10) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0); return t.toISOString(); };

function sample(country: string) {
  const vc = country === "vc";
  const trip: TripView = vc
    ? { id: "sample", kind: "haulage", status: "open", pickup: "Hardware store, Kingstown", dropoff: "Building site, Lower Bay", from_place: "St Vincent", to_place: "Bequia", travel_at: inDays(5, 12), passengers: null, details: "Building materials. 40 bags of cement and 20 lengths of rebar, about 2 tonnes. Needs help loading and unloading. Dates flexible.", cross_border: false }
    : { id: "sample", kind: "airport", status: "open", pickup: "Maurice Bishop International Airport", dropoff: "Grand Anse Beach", from_place: "Grenada", to_place: "Grenada", travel_at: inDays(2, 15), passengers: 3, details: "Flight lands 2:40pm. Two large suitcases.", cross_border: false, fixed_fare_xcd: 40 };
  const quotes: QuoteView[] = vc
    ? [
        { id: "q1", amount_xcd: 1450, includes: "Truck collection, Thursday’s cargo boat to Port Elizabeth, delivery to site", valid_until: inDays(3), status: "offered", businesses: { name: "Kingstown Island Freight", slug: "kingstown-island-freight", phone_e164: null, whatsapp_e164: null } },
        { id: "q2", amount_xcd: 1290, includes: "Port to port only, loading included", valid_until: inDays(1), status: "offered", businesses: { name: "Grenadines Link Water Taxi", slug: "grenadines-link-water-taxi", phone_e164: null, whatsapp_e164: null } },
      ]
    : [
        { id: "q1", amount_xcd: 40, includes: "Official fare", valid_until: inDays(1), status: "offered", businesses: { name: "Point Salines Transfers", slug: "point-salines-transfers", phone_e164: null, whatsapp_e164: null } },
      ];
  return { trip, quotes, operatorName: vc ? "Kingstown Island Freight" : "Point Salines Transfers", kinds: vc ? ["haulage"] : ["taxi", "airport", "group"] };
}

const banner = <p className="mb-6 rounded-xl bg-gold/20 px-4 py-3 text-sm text-ink">Preview with sample data. On the live site these screens show real requests, quotes and bookings.</p>;
const ok = (text: string) => <p role="status" className="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{text}</p>;

export default async function TripsPreview({ params }: { params: Promise<{ country: string; screen: string }> }) {
  const { country, screen } = await params;
  if (isSupabaseConfigured || !(SCREENS as readonly string[]).includes(screen)) notFound();
  const s = sample(country);
  const base = `/${country}/preview`;
  const btn = "inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 font-semibold text-primary-ink";

  if (screen === "trips") {
    return (
      <Container className="max-w-3xl py-8 sm:py-12">
        {banner}
        <h1 className="text-3xl font-semibold">Your trips</h1>
        <ul className="mt-6 space-y-3">
          <li>
            <Link href={`${base}/trip`} className="flex items-center justify-between gap-4 rounded-2xl bg-raised p-4 ring-1 ring-line/60 hover:ring-primary/40">
              <span className="min-w-0"><span className="block font-semibold text-ink">{s.trip.pickup} to {s.trip.dropoff}</span>
                <span className="block text-sm">{TRIP_KIND_LABEL[s.trip.kind]} · {fmtWhen(s.trip.travel_at)}</span></span>
              <span className="shrink-0 text-right text-sm font-semibold">{TRIP_STATUS_LABEL.open}<span className="mt-1 block rounded-full bg-gold/25 px-2 py-0.5 text-ink">2 quotes</span></span>
            </Link>
          </li>
        </ul>
      </Container>
    );
  }

  if (screen === "trip" || screen === "trip-booked") {
    const booked = screen === "trip-booked";
    const trip = { ...s.trip, status: booked ? "booked" : "open" };
    const quotes = booked ? s.quotes.map((q, i) => ({ ...q, status: i === 0 ? "accepted" : "declined" })) : s.trip.fixed_fare_xcd ? [] : s.quotes;
    return (
      <Container className="max-w-3xl py-8 sm:py-12">
        {banner}
        <TripDetail
          country={country} t={trip} quotes={quotes} now={Date.now()} backHref={`${base}/trips`} chatHref={`${base}/chat`}
          notice={booked ? ok(s.trip.fixed_fare_xcd ? "Point Salines Transfers accepted your trip at the official fare." : "Booked. The operator has been told and will be in touch to confirm the details.") : null}
          accept={() => <Link href={`${base}/trip-booked`} className={`${btn} w-full`}>Accept this quote</Link>}
          cancel={<span className="text-sm font-semibold text-danger underline">Cancel this request</span>}
        />
        <p className="mt-10 rounded-xl bg-sunken px-4 py-3 text-sm">See the other side: <Link href={`${base}/operator`} className="font-semibold text-link underline">the operator’s Trips tab</Link> · <Link href={`${base}/admin`} className="font-semibold text-link underline">your admin Operators page</Link></p>
      </Container>
    );
  }

  if (screen.startsWith("operator")) {
    const sent = screen === "operator-sent";
    const acceptedNow = screen === "operator-accepted";
    const completed = screen === "operator-completed";
    const input = "h-11 rounded-xl border border-line bg-raised px-3 text-ink";
    const other = country === "vc"
      ? { id: "r2", kind: "haulage", pickup: "Arnos Vale", dropoff: "Calliaqua", from_place: "St Vincent", to_place: "St Vincent", travel_at: inDays(1, 8), passengers: null, details: "Household move. Two-bedroom flat, needs two helpers.", cross_border: false, status: "booked" }
      : { id: "r2", kind: "taxi", pickup: "Grand Anse Beach", dropoff: "St George’s market", from_place: "Grenada", to_place: "Grenada", travel_at: null, passengers: 2, details: null, cross_border: false, status: "booked" };
    return (
      <Container className="max-w-4xl py-8 sm:py-12">
        {banner}
        <h1 className="text-3xl font-semibold sm:text-4xl">{s.operatorName}</h1>
        <nav aria-label="Dashboard" className="-mx-5 mt-6 flex gap-1 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0">
          {["Overview", "Messages", "Profile", "Photos", "Trips", "Services", "Hours"].map((l) => (
            <span key={l} className={`shrink-0 border-b-2 px-3 py-3 text-[0.95rem] font-medium ${l === "Trips" ? "border-gold text-ink" : "border-transparent text-muted"}`}>{l}</span>
          ))}
        </nav>
        <div className="mt-8">
          <OperatorTrips
            kinds={s.kinds} businessId="me"
            notice={sent ? ok("Quote sent. The customer has been emailed.") : acceptedNow ? ok("Trip accepted. The customer has been told; message them below to confirm the pickup.") : completed ? ok("Trip marked as completed.") : null}
            open={acceptedNow ? [] : [{ ...s.trip, trip_quotes: sent ? [{ business_id: "me", amount_xcd: s.quotes[0].amount_xcd, status: "offered" }] : [] }]}
            chatHref={() => `${base}/chat`}
            acceptFixed={() => <Link href={`${base}/operator-accepted`} className={btn}>Accept trip</Link>}
            mine={completed ? [] : [...(acceptedNow ? [{ id: "m0", amount_xcd: 40, status: "accepted", includes: "Official fare", trip_requests: { ...s.trip, status: "booked", trip_contacts: { phone_e164: "+447835028032" } } }] : []), { id: "m1", amount_xcd: country === "vc" ? 380 : 45, status: "accepted", includes: null, trip_requests: { ...other, trip_contacts: { phone_e164: country === "vc" ? "+17844551234" : "+14734441234" } } }]}
            totals={completed ? { n: 7, fares: country === "vc" ? 3840 : 520, commission: 0 } : { n: 6, fares: country === "vc" ? 3460 : 475, commission: 0 }}
            quoteForm={(r, my) => (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="block"><span className="mb-1 block text-xs font-semibold text-ink">Price (EC$)</span>
                  <input type="number" defaultValue={my?.amount_xcd ?? s.quotes[0].amount_xcd} className={`${input} w-32`} /></label>
                <label className="block min-w-0 flex-1"><span className="mb-1 block text-xs font-semibold text-ink">What’s included</span>
                  <input defaultValue={s.quotes[0].includes ?? ""} className={`${input} w-full`} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold text-ink">Valid for</span>
                  <select defaultValue="24" className={input}><option value="24">1 day</option><option value="72">3 days</option></select></label>
                <Link href={`${base}/operator-sent`} className={btn}>{my ? "Update quote" : "Send quote"}</Link>
              </div>
            )}
            complete={() => <Link href={`${base}/operator-completed`} className="mt-3 inline-flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-ink">Mark as completed</Link>}
          />
        </div>
      </Container>
    );
  }

  if (screen === "dashboard") {
    // Invented numbers, only to show what the dashboard looks like once people use the site.
    const days = 30, today = new Date();
    const wave = (i: number, base: number, amp: number) => Math.max(0, Math.round(base + amp * Math.sin(i / 3) + i * base * 0.02));
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i));
      return { day: d.toISOString().slice(0, 10), views: wave(i, 140, 40), signups: wave(i, 3, 2), requests: wave(i, 4, 2), booked: wave(i, 3, 1), completed: wave(i, 2, 1),
        fares: wave(i, 2, 1) * 65, conversations: wave(i, 5, 2), messages: wave(i, 18, 6), clicks: wave(i, 22, 8) };
    });
    const data = { series, previous: { views: 3100, signups: 60, requests: 70, booked: 52, conversations: 110, clicks: 520 },
      trip_kinds: { airport: 61, taxi: 42, haulage: 18, boat: 9 }, trip_countries: { gd: 83, vc: 47 }, trip_status: { open: 3 },
      click_channels: { whatsapp: 410, phone: 160, website: 55, maps: 40 },
      top_pages: [{ path: "/gd", views: 1320 }, { path: "/gd/ride/taxi", views: 640 }, { path: "/vc", views: 610 }, { path: "/gd/services/taxis", views: 330 }, { path: "/vc/ride", views: 290 }],
      top_businesses: [{ name: "Point Salines Transfers", clicks: 88, conversations: 12 }, { name: "Spice Isle Taxi", clicks: 61, conversations: 8 }, { name: "Bequia Water Taxi", clicks: 40, conversations: 5 }],
      totals: { accounts: 412, listings: 385, claimed: 37, verified: 21, operators: 14, notification_devices: 26 } };
    return (
      <Container className="py-8">
        {banner}
        <InsightsPanel data={data} range={30} />
      </Container>
    );
  }

  if (screen === "chat") {
    const t0 = new Date(); t0.setMinutes(t0.getMinutes() - 20);
    const at = (m: number) => new Date(t0.getTime() + m * 60000).toISOString();
    return (
      <Container className="max-w-2xl py-8 sm:py-12">
        {banner}
        <TripChat
          title={`Messages with ${s.quotes[0].businesses?.name}`}
          subtitle={`${s.trip.pickup} to ${s.trip.dropoff}. Only you and the operator can see these messages.`}
          back={<Link href={`${base}/trip-booked`} className="text-sm font-semibold text-link hover:underline">Your trip</Link>}
          messages={[
            { id: 1, mine: false, body: "Good afternoon, this is Marcus from Point Salines Transfers. I’ll be at arrivals with a sign for your 2:40 flight.", at: at(0) },
            { id: 2, mine: true, body: "Great, thank you. We’re three people with two big suitcases.", at: at(4) },
            { id: 3, mine: false, body: "No problem, the car has plenty of room. See you soon.", at: at(6) },
          ]}
          form={
            <div className="flex items-end gap-2 rounded-2xl bg-raised p-2 shadow-card ring-1 ring-line/60">
              <textarea rows={2} placeholder="Write a message" className="min-h-12 flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-ink focus:outline-none" />
              <span className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-ink">Send</span>
            </div>
          }
        />
      </Container>
    );
  }

  // Admin operators page.
  const approvedNow = screen === "admin-approved";
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      {banner}
      <h1 className="text-2xl font-semibold">Operators and trips</h1>
      {approvedNow && ok("Saved. The operator can now see and price requests.")}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-sm">Approved operators</p><p className="text-2xl font-semibold text-ink">{approvedNow ? 4 : 3}</p></div>
        <div className={card}><p className="text-sm">Requests waiting for quotes</p><p className="text-2xl font-semibold text-ink">2</p></div>
        <div className={card}><p className="text-sm">Completed this month</p><p className="text-2xl font-semibold text-ink">11</p><p className="text-xs">Fares {fmtXcd(4180)} · commission {fmtXcd(0)}</p></div>
      </div>
      {!approvedNow && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Applications to review (1)</h2>
          <div className={`${card} mt-3`}>
            <p className="font-semibold text-ink">{country === "vc" ? "Bequia Island Taxis" : "Carriacou Island Hauling"} <span className="text-sm font-normal">({country.toUpperCase()})</span></p>
            <p className="text-sm">{country === "vc" ? "Taxi, Airport transfer" : "Trucking and haulage, Freight"}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt>Licence</dt><dd className="text-ink">{country === "vc" ? "Hire licence H-2231, Licensing Authority" : "Goods vehicle permit G-118"}</dd>
              <dt>Vehicles</dt><dd className="text-ink">{country === "vc" ? "Toyota Hiace, 14 seats" : "Isuzu NPR 5-tonne truck"}</dd>
              <dt>Insurance</dt><dd className="text-ink">Commercial vehicle cover</dd>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <input placeholder="Note (e.g. licence seen)" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-sm" />
              <Link href={`${base}/admin-approved`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink">Approve</Link>
              <span className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold text-ink">Decline</span>
            </div>
          </div>
        </section>
      )}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Approved operators</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl bg-raised ring-1 ring-line/60">
          {[s.operatorName, country === "vc" ? "Grenadines Link Water Taxi" : "Windward Transfers", "Trans Island Logistics · Founder’s business", ...(approvedNow ? [country === "vc" ? "Bequia Island Taxis" : "Carriacou Island Hauling"] : [])].map((n) => (
            <li key={n} className="px-4 py-3 font-semibold text-ink">{n}</li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
