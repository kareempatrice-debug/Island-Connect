import { confirmPickupAction } from "@/app/family-actions";
import { setWhatsAppAlertsAction } from "@/app/trip-actions";
import { acceptFixedFareAction, completeTripAction, sendQuoteAction } from "@/app/trip-actions";
import { OperatorApply } from "@/components/forms/operator-apply";
import { OperatorTrips } from "@/components/trips/operator-trips";
import { supabaseForRequest } from "@/lib/supabase/server";

export async function TripsTab({ ids, isOwner, sp }: { ids: { businessId: string; country: string; slug: string }; isOwner: boolean; sp: Record<string, string | undefined> }) {
  const supabase = await supabaseForRequest();
  const { data: op } = await supabase.from("operator_profiles").select("*").eq("business_id", ids.businessId).maybeSingle();
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  const notice = sp.error ? <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{sp.error}</p>
    : sp.quoted ? <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">Quote sent. The customer has been emailed.</p>
    : sp.pickedup ? <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">Pick-up confirmed. Have a safe trip.</p>
    : sp.accepted ? <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">Trip accepted. The customer has been told; message them below to confirm the pickup.</p>
    : sp.completed ? <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">Trip marked as completed.</p> : null;

  if (!op || op.status === "declined") {
    return (
      <div className="space-y-4">
        <div className={card}>
          <h2 className="text-lg font-semibold">Take ride, boat and freight requests</h2>
          <p className="mt-1">Approved operators receive customers’ trip requests by email and in this tab, and reply with their own price. Free while Island Connect launches.</p>
          {op?.status === "declined" && <p className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">Your last application wasn’t approved{op.review_note ? `: ${op.review_note}` : "."} You can update it and apply again.</p>}
        </div>
        {isOwner ? <OperatorApply ids={ids} current={op ? { kinds: op.kinds, licence: op.licence_details, vehicles: op.vehicle_details, insurance: op.insurance_details ?? "" } : undefined} />
          : <p className="rounded-xl bg-sunken px-4 py-3">Only the business’s owner can apply.</p>}
      </div>
    );
  }
  if (op.status === "pending") {
    return (
      <div className="space-y-4">
        {sp.applied && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 font-medium text-success">Application sent. We’ll check your documents and email you, usually within two working days. Meanwhile, add photos of your vehicle in the Photos tab.</p>}
        <p className="rounded-xl bg-gold/15 px-4 py-3 text-ink">Your application is being reviewed. We’ll email you once you’re approved.</p>
        {isOwner && <OperatorApply ids={ids} current={{ kinds: op.kinds, licence: op.licence_details, vehicles: op.vehicle_details, insurance: op.insurance_details ?? "" }} />}
      </div>
    );
  }
  if (op.status === "suspended") return <p className="rounded-xl bg-danger/10 px-4 py-3 text-danger">Trip requests are paused for this business. Contact hello@islandconnect.cc.</p>;

  // Approved: open requests this business can take (Row Level Security does the matching), plus its own quotes and trips.
  const [{ data: open }, { data: mine }, { data: ledger }] = await Promise.all([
    supabase.from("trip_requests").select("*, trip_quotes!trip_quotes_request_id_fkey ( business_id, amount_xcd, status )").eq("status", "open").order("created_at", { ascending: false }).limit(50),
    supabase.from("trip_quotes").select("id, amount_xcd, status, includes, trip_requests!trip_quotes_request_id_fkey ( id, kind, pickup, dropoff, from_place, to_place, travel_at, passengers, details, status, rider_name, rider_kind, picked_up_at, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance_km, duration_min, trip_contacts ( phone_e164, rider_phone_e164 ) )").eq("business_id", ids.businessId).in("status", ["accepted"]).order("created_at", { ascending: false }).limit(50),
    supabase.from("commission_ledger").select("fare_xcd, commission_xcd").eq("business_id", ids.businessId),
  ]);
  const totals = (ledger ?? []).reduce((a, r) => ({ n: a.n + 1, fares: a.fares + Number(r.fare_xcd), commission: a.commission + Number(r.commission_xcd) }), { n: 0, fares: 0, commission: 0 });
  const input = "h-11 rounded-xl border border-line bg-raised px-3 text-ink";
  return (
    <OperatorTrips
      kinds={op.kinds as string[]} open={open ?? []} mine={mine ?? []} totals={totals} businessId={ids.businessId} notice={notice}
      quoteForm={(r, my) => (
        <form action={sendQuoteAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="request" value={r.id} /><input type="hidden" name="businessId" value={ids.businessId} />
          <input type="hidden" name="country" value={ids.country} /><input type="hidden" name="slug" value={ids.slug} />
          <label className="block"><span className="mb-1 block text-xs font-semibold text-ink">Price (EC$)</span>
            <input name="amount" type="number" min="1" step="0.01" required defaultValue={my?.amount_xcd ?? (r.estimate_low_xcd ? Math.round((Number(r.estimate_low_xcd) + Number(r.estimate_high_xcd)) / 2 / 5) * 5 : "")} className={`${input} w-32`} /></label>
          <label className="block min-w-0 flex-1"><span className="mb-1 block text-xs font-semibold text-ink">What’s included</span>
            <input name="includes" maxLength={500} placeholder="Optional, e.g. luggage and waiting time" className={`${input} w-full`} /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-ink">Valid for</span>
            <select name="hours" defaultValue="24" className={input}><option value="2">2 hours</option><option value="12">12 hours</option><option value="24">1 day</option><option value="72">3 days</option><option value="168">1 week</option></select></label>
          <button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-ink">{my ? "Update price" : "Send price"}</button>
        </form>
      )}
      chatHref={(r) => `/${ids.country}/trips/${r.id}/chat`}
      alertsSetting={
        <form action={setWhatsAppAlertsAction} className="flex flex-wrap items-center gap-3 rounded-2xl bg-raised p-4 ring-1 ring-line/60">
          <input type="hidden" name="businessId" value={ids.businessId} /><input type="hidden" name="country" value={ids.country} /><input type="hidden" name="slug" value={ids.slug} />
          <input type="hidden" name="on" value={op.whatsapp_alerts ? "off" : "on"} />
          <p className="min-w-0 flex-1 text-sm"><strong className="text-ink">WhatsApp alerts {op.whatsapp_alerts ? "on" : "off"}.</strong> {op.whatsapp_alerts ? "New trip requests also arrive on your listing’s WhatsApp number." : "Get new trip requests on your listing’s WhatsApp number as well."}</p>
          <button className={`h-10 rounded-full px-4 text-sm font-semibold ${op.whatsapp_alerts ? "border border-line text-ink" : "bg-[#25D366] text-[#0B2E1B]"}`}>{op.whatsapp_alerts ? "Turn off" : "Turn on"}</button>
        </form>
      }
      confirmPickup={(r) => (
        <form action={confirmPickupAction} className="mt-3 flex items-center gap-2">
          <input type="hidden" name="request" value={r.id} /><input type="hidden" name="country" value={ids.country} /><input type="hidden" name="slug" value={ids.slug} />
          <label className="sr-only" htmlFor={`pin-${r.id}`}>Passenger’s PIN</label>
          <input id={`pin-${r.id}`} name="pin" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required placeholder="PIN" className="h-10 w-24 rounded-lg border border-line bg-raised px-3 text-center tracking-[0.3em]" />
          <button className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink">Confirm pick-up</button>
        </form>
      )}
      acceptFixed={(r) => (
        <form action={acceptFixedFareAction}>
          <input type="hidden" name="request" value={r.id} /><input type="hidden" name="businessId" value={ids.businessId} />
          <input type="hidden" name="country" value={ids.country} /><input type="hidden" name="slug" value={ids.slug} />
          <button className="h-12 rounded-full bg-primary px-6 text-base font-bold text-primary-ink">Accept trip</button>
        </form>
      )}
      complete={(r) => (
        <form action={completeTripAction} className="mt-3">
          <input type="hidden" name="id" value={r.id} /><input type="hidden" name="country" value={ids.country} /><input type="hidden" name="slug" value={ids.slug} />
          <button className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink">Mark as completed</button>
        </form>
      )}
    />
  );
}
