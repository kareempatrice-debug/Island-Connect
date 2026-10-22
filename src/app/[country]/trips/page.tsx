import { cleanPlace } from "@/lib/place-text";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CarFront, Ship, Truck } from "lucide-react";
import { NeedsDatabase } from "@/components/demo-notice";
import { RebookLink } from "@/components/trips/rebook";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";
import { TRIP_STATUS_LABEL, fmtWhen } from "@/lib/trips";

export const metadata: Metadata = { title: "Activity", robots: { index: false } };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Trips({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Trips" /></Container>;
  const viewer = await requireViewer(`/${country}/trips`, country);
  const supabase = await supabaseForRequest();
  const { data } = await supabase
    .from("trip_requests")
    .select("id, country_code, kind, pickup, dropoff, travel_at, status, created_at, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, trip_quotes!trip_quotes_request_id_fkey ( id, status, amount_xcd )")
    .eq("customer_id", viewer.id).order("created_at", { ascending: false }).limit(60);
  const trips = (data ?? []) as any[];
  const now = Date.now();
  const isUpcoming = (t: any) => ["open", "booked"].includes(t.status) && (!t.travel_at || new Date(t.travel_at).getTime() > now - 3 * 3600_000);
  const upcoming = trips.filter(isUpcoming);
  const past = trips.filter((t) => !isUpcoming(t));
  const icon = (k: string) => (k === "boat" ? Ship : k === "haulage" || k === "freight" ? Truck : CarFront);

  return (
    <Container className="max-w-2xl py-8">
      <h1 className="text-4xl font-bold">Activity</h1>

      <h2 className="mt-8 text-xl font-bold">Upcoming</h2>
      {!upcoming.length ? (
        <Link href={`/${country}/ride/reserve`} className="mt-3 flex items-center justify-between rounded-2xl p-4 ring-1 ring-line">
          <span><span className="block text-lg font-semibold text-ink">You have no upcoming trips</span><span className="text-sm">Reserve your trip →</span></span>
          <CalendarClock className="h-10 w-10 text-muted" strokeWidth={1.3} aria-hidden="true" />
        </Link>
      ) : (
        <ul className="mt-3 space-y-2">
          {upcoming.map((t) => {
            const offers = (t.trip_quotes ?? []).filter((q: any) => q.status === "offered").length;
            return (
              <li key={t.id}>
                <Link href={`/${t.country_code}/trips/${t.id}`} className="block rounded-2xl bg-raised p-4 ring-1 ring-line/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">{TRIP_STATUS_LABEL[t.status]}{t.status === "open" && offers ? ` · ${offers} quote${offers > 1 ? "s" : ""}` : ""}</span>
                  <span className="mt-1 block font-semibold text-ink">{cleanPlace(t.pickup)} to {cleanPlace(t.dropoff)}</span>
                  <span className="block text-sm">{fmtWhen(t.travel_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-xl font-bold">Past</h2>
      {!past.length ? <p className="mt-2 text-sm">Your past trips will appear here.</p> : (
        <ul className="mt-2 divide-y divide-line">
          {past.map((t) => {
            const Icon = icon(t.kind);
            const fare = (t.trip_quotes ?? []).find((q: any) => q.status === "accepted")?.amount_xcd;
            return (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <Link href={`/${t.country_code}/trips/${t.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sunken"><Icon className="h-7 w-7 text-ink" strokeWidth={1.5} aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{t.dropoff}</span>
                    <span className="block text-sm">{new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {fare ? `EC$${Number(fare).toFixed(2)}` : TRIP_STATUS_LABEL[t.status]}</span>
                  </span>
                </Link>
                <RebookLink country={t.country_code} trip={t} />
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
