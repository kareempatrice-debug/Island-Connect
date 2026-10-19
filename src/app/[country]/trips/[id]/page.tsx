import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { acceptQuoteAction, cancelTripAction } from "@/app/trip-actions";
import { NeedsDatabase } from "@/components/demo-notice";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";
import { PushSetup } from "@/components/push-setup";
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
  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      {t.status === "open" && <div className="mb-6"><PushSetup what="new quotes" /></div>}
      <TripDetail
        country={country}
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
