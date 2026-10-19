import type { Metadata } from "next";
import Link from "next/link";
import { NeedsDatabase } from "@/components/demo-notice";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";
import { TRIP_KIND_LABEL, TRIP_STATUS_LABEL, fmtWhen } from "@/lib/trips";

export const metadata: Metadata = { title: "Your trips", robots: { index: false } };

export default async function Trips({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Trips" /></Container>;
  const viewer = await requireViewer(`/${country}/trips`, country);
  const supabase = await supabaseForRequest();
  const { data } = await supabase
    .from("trip_requests")
    .select("id, country_code, kind, pickup, dropoff, travel_at, status, created_at, trip_quotes!trip_quotes_request_id_fkey ( id, status )")
    .eq("customer_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <Link href={`/${country}/account`} className="text-sm font-semibold text-link hover:underline">Your account</Link>
      <h1 className="mt-2 text-3xl font-semibold">Your trips</h1>
      {!data?.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="font-semibold text-ink">No trip requests yet</p>
          <Link href={`/${country}/ride`} className="mt-2 inline-block font-semibold text-link underline">Request a ride, boat or freight</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((t) => {
            const offers = (t.trip_quotes ?? []).filter((q: { status: string }) => q.status === "offered").length;
            return (
              <li key={t.id}>
                <Link href={`/${t.country_code}/trips/${t.id}`} className="flex items-center justify-between gap-4 rounded-2xl bg-raised p-4 ring-1 ring-line/60 hover:ring-primary/40">
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{t.pickup} to {t.dropoff}</span>
                    <span className="block text-sm">{TRIP_KIND_LABEL[t.kind]} · {fmtWhen(t.travel_at)}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold">
                    {TRIP_STATUS_LABEL[t.status]}
                    {t.status === "open" && offers > 0 && <span className="mt-1 block rounded-full bg-gold/25 px-2 py-0.5 text-ink">{offers} quote{offers > 1 ? "s" : ""}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
