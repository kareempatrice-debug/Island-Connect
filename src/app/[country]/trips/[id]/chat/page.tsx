import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendTripMessageAction } from "@/app/trip-actions";
import { NeedsDatabase } from "@/components/demo-notice";
import { AutoRefresh } from "@/components/trips/auto-refresh";
import { TripChat } from "@/components/trips/trip-chat";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";
import { fmtWhen } from "@/lib/trips";

export const metadata: Metadata = { title: "Trip messages", robots: { index: false } };

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Chat({ params, searchParams }: { params: Promise<{ country: string; id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ country, id }, sp] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Trip messages" /></Container>;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const viewer = await requireViewer(`/${country}/trips/${id}/chat`, country);
  const supabase = await supabaseForRequest();
  const [{ data: t }, { data: messages }] = await Promise.all([
    supabase.from("trip_requests").select("id, customer_id, pickup, dropoff, travel_at, status, accepted_quote_id, trip_quotes!trip_quotes_request_id_fkey ( id, businesses ( name, slug ) )").eq("id", id).maybeSingle(),
    supabase.from("trip_messages").select("id, sender_id, body, created_at").eq("request_id", id).order("created_at").limit(500),
  ]);
  if (!t || !t.accepted_quote_id) notFound(); // chat opens once a trip is booked, for its two sides only
  const isCustomer = t.customer_id === viewer.id;
  const op = ((t as any).trip_quotes ?? []).find((q: any) => q.id === t.accepted_quote_id)?.businesses;
  const back = isCustomer
    ? <Link href={`/${country}/trips/${id}`} className="text-sm font-semibold text-link hover:underline">Your trip</Link>
    : <Link href={`/${country}/dashboard/${op?.slug}?tab=trips`} className="text-sm font-semibold text-link hover:underline">Your trips</Link>;
  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <AutoRefresh seconds={8} />
      <TripChat
        title={isCustomer ? `Messages with ${op?.name ?? "your driver"}` : "Messages with your customer"}
        subtitle={`${t.pickup} to ${t.dropoff} · ${fmtWhen(t.travel_at)}. Only you and the ${isCustomer ? "operator" : "customer"} can see these messages.`}
        back={back}
        notice={sp.error ? <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{sp.error}</p> : null}
        messages={(messages ?? []).map((m) => ({ id: m.id, mine: m.sender_id === viewer.id, body: m.body, at: m.created_at }))}
        form={t.status === "cancelled" ? <p className="rounded-xl bg-sunken px-4 py-3 text-sm">This trip was cancelled, so the conversation is closed.</p> : (
          <form action={sendTripMessageAction} className="flex items-end gap-2 rounded-2xl bg-raised p-2 shadow-card ring-1 ring-line/60">
            <input type="hidden" name="id" value={t.id} /><input type="hidden" name="country" value={country} />
            <label htmlFor="msg" className="sr-only">Message</label>
            <textarea id="msg" name="body" rows={2} maxLength={2000} required placeholder="Write a message" className="min-h-12 flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-ink focus:outline-none" />
            <button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-ink">Send</button>
          </form>
        )}
      />
    </Container>
  );
}
