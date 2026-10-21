import { StripLink } from "./strip-link";
import { getViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

/*
 * A slim strip under the header, on every page, when something needs attention:
 * customers see their ride's progress; drivers see new requests waiting for them.
 */
export async function RideStatusStrip({ country }: { country: string }) {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await supabaseForRequest();
  const since = new Date(Date.now() - 2 * 86400_000).toISOString();
  const [{ data: mine }, { data: ops }] = await Promise.all([
    supabase.from("trip_requests").select("id, status, picked_up_at, country_code").eq("customer_id", viewer.id).in("status", ["open", "booked"]).gte("created_at", since).order("created_at", { ascending: false }).limit(1),
    supabase.from("business_members").select("business_id, businesses ( slug, operator_profiles ( status ) )").eq("user_id", viewer.id),
  ]);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const trip = mine?.[0];
  const op = (ops ?? []).find((m: any) => {
    const p = m.businesses?.operator_profiles;
    return (Array.isArray(p) ? p[0]?.status : p?.status) === "approved";
  }) as any;
  let waiting = 0;
  // A ride offered to this driver right now beats everything else.
  const { data: offers } = op ? await supabase.from("trip_offers").select("id, price_xcd, distance_km, expires_at").eq("status", "offered").gt("expires_at", new Date().toISOString()).limit(1) : { data: null };
  const offer = offers?.[0];
  if (op) {
    const { data: open } = await supabase.from("trip_requests").select("id, trip_quotes!trip_quotes_request_id_fkey ( business_id )").eq("status", "open").neq("customer_id", viewer.id).gte("created_at", since).limit(50);
    waiting = (open ?? []).filter((r: any) => !(r.trip_quotes ?? []).some((q: any) => q.business_id === op.business_id)).length;
  }
  if (!trip && !waiting && !offer) return null;
  const base = "flex items-center justify-between gap-3 px-5 py-2.5 text-sm font-semibold";
  return (
    <div>
      {offer && (
        <StripLink href={`/${country}/offers/${offer.id}`} className={`${base} animate-pulse bg-gold text-[#172B32]`}>
          <span>Ride offer: EC${Number(offer.price_xcd).toFixed(0)}{offer.distance_km != null ? `, ${Number(offer.distance_km).toFixed(1)} km away` : ""}</span>
          <span>Accept →</span>
        </StripLink>
      )}
      {trip && (
        <StripLink href={`/${trip.country_code}/trips/${trip.id}`} className={`${base} bg-gold text-[#172B32]`}>
          <span className="flex items-center gap-2">
            {trip.status === "open" && <span className="h-2 w-2 animate-pulse rounded-full bg-[#172B32]" aria-hidden="true" />}
            {trip.status === "open" ? "Ride requested: waiting for a driver" : trip.picked_up_at ? "You’re on your way" : "Your driver is confirmed"}
          </span>
          <span>View →</span>
        </StripLink>
      )}
      {waiting > 0 && op?.businesses?.slug && (
        <StripLink href={`/${country}/dashboard/${op.businesses.slug}?tab=trips`} className={`${base} bg-primary text-primary-ink`}>
          <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-gold" aria-hidden="true" />{waiting} new ride request{waiting === 1 ? "" : "s"} for you</span>
          <span>Respond →</span>
        </StripLink>
      )}
    </div>
  );
}
