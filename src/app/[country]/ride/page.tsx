import { cleanPlace } from "@/lib/place-text";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CarFront, ChevronRight, Search, Ship, ShieldCheck, Truck, Users } from "lucide-react";
import { RebookLink } from "@/components/trips/rebook";
import { Container } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getCountry, isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";
import { fmtWhen } from "@/lib/trips";

export const metadata: Metadata = { title: "Ride and transport" };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function RideHub({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  const viewer = isSupabaseConfigured ? await getViewer() : null;
  let trips: any[] = [];
  if (viewer) {
    const supabase = await supabaseForRequest();
    const { data } = await supabase.from("trip_requests")
      .select("id, kind, pickup, dropoff, travel_at, status, created_at, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng")
      .eq("customer_id", viewer.id).eq("country_code", code).order("created_at", { ascending: false }).limit(12);
    trips = data ?? [];
  }
  const now = Date.now();
  const upcoming = trips.find((t) => ["open", "booked"].includes(t.status) && (!t.travel_at || new Date(t.travel_at).getTime() > now - 3600_000));
  const past = trips.filter((t) => t !== upcoming && ["completed", "booked", "cancelled", "expired"].includes(t.status)).slice(0, 2);

  const tiles = [
    { href: `/${code}/ride/taxi`, label: "Ride", Icon: CarFront },
    { href: `/${code}/ride/reserve`, label: "Reserve", Icon: CalendarClock },
    { href: `/${code}/ride/quote?type=boat`, label: "Boat", Icon: Ship },
    { href: `/${code}/ride/quote?type=haulage`, label: "Trucking", Icon: Truck },
  ];
  const row = "flex items-center gap-3 rounded-2xl px-4 py-3.5 hover:bg-sunken";

  return (
    <main>
      <Container className="max-w-2xl pb-10 pt-6">
        <h1 className="text-3xl font-bold">Ride</h1>
        <p className="mt-1 text-sm">{country.name}: taxis, boats and trucking.</p>

        {upcoming && ["open", "booked"].includes(upcoming.status) && (
          <Link href={`/${code}/trips/${upcoming.id}`} className="mt-5 block rounded-2xl bg-deep p-4 text-white">
            <span className="flex items-center gap-2 font-semibold">
              {upcoming.status === "open" && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-gold" aria-hidden="true" />}
              {upcoming.status === "open" ? "Your ride request is waiting for a driver" : "Your driver is confirmed"}
            </span>
            <span className="mt-0.5 block truncate text-sm text-white/80">{cleanPlace(upcoming.pickup)} to {cleanPlace(upcoming.dropoff)} · {fmtWhen(upcoming.travel_at)}</span>
            <span className="mt-2 inline-block text-sm font-semibold text-gold">View request →</span>
          </Link>
        )}
        <Link href={`/${code}/ride/taxi`} className="mt-5 flex h-14 items-center gap-3 rounded-full bg-sunken px-5 text-lg font-semibold text-ink">
          <Search className="h-5 w-5" aria-hidden="true" /> Where to?
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-sm shadow-card"><CalendarClock className="h-4 w-4" aria-hidden="true" />Now</span>
        </Link>

        <ul className="mt-6 grid grid-cols-4 gap-3">
          {tiles.map(({ href, label, Icon }) => (
            <li key={label}>
              <Link href={href} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-sunken text-sm font-semibold text-ink transition hover:bg-line/60">
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.6} aria-hidden="true" />{label}
              </Link>
            </li>
          ))}
        </ul>

        {viewer && (
          <section className="mt-8" aria-labelledby="trips-h">
            <div className="flex items-baseline justify-between">
              <h2 id="trips-h" className="text-xl font-bold">Your trips</h2>
              <Link href={`/${code}/trips`} className="text-sm font-semibold text-link">See all</Link>
            </div>
            {upcoming ? (
              <Link href={`/${code}/trips/${upcoming.id}`} className="mt-3 block rounded-2xl bg-raised p-4 ring-1 ring-line/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{upcoming.status === "booked" ? "Booked" : "Waiting for a driver"}</span>
                <span className="mt-1 block font-semibold text-ink">{cleanPlace(upcoming.pickup)} to {cleanPlace(upcoming.dropoff)}</span>
                <span className="block text-sm">{fmtWhen(upcoming.travel_at)}</span>
              </Link>
            ) : (
              <Link href={`/${code}/ride/reserve`} className="mt-3 flex items-center justify-between rounded-2xl bg-raised p-4 ring-1 ring-line/60">
                <span><span className="block font-semibold text-ink">No upcoming trips</span><span className="text-sm">Reserve your trip →</span></span>
                <CalendarClock className="h-8 w-8 text-muted" strokeWidth={1.4} aria-hidden="true" />
              </Link>
            )}
            {past.length > 0 && (
              <ul className="mt-2 divide-y divide-line">
                {past.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{t.dropoff}</span><span className="block text-sm">{new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></span>
                    <RebookLink country={code} trip={t} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="mt-8" aria-label="More">
          <Link href={`/${code}/account/family`} className={row}>
            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="flex-1"><span className="block font-semibold text-ink">Family profile</span><span className="block text-sm">Book rides for family members and seniors</span></span>
            <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
          </Link>
          <Link href={`/${code}/account/family#trusted`} className={row}>
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="flex-1"><span className="block font-semibold text-ink">Share trip location</span><span className="block text-sm">Send your trip to people you trust</span></span>
            <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
          </Link>
          <Link href={`/${code}/ride/fares`} className={row}>
            <CarFront className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="flex-1"><span className="block font-semibold text-ink">Official taxi fares</span><span className="block text-sm">Published rates for popular routes</span></span>
            <ChevronRight className="h-5 w-5 text-muted" aria-hidden="true" />
          </Link>
        </section>

        <Link href={`/${code}/ride/operate/apply`} className="mt-8 flex items-center justify-between gap-4 rounded-2xl bg-gold/15 p-4">
          <span><span className="block font-semibold text-ink">Drive with Island Connect</span><span className="block text-sm">Have a car, van, boat or truck? Start getting trips.</span></span>
          <span className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">Apply</span>
        </Link>
      </Container>
    </main>
  );
}
