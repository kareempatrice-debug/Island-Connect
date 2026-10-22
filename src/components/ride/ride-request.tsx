"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ArrowLeft, CalendarClock, Car, ChevronDown, Crosshair, LocateFixed, MapPin, MessageCircle, MessagesSquare, Phone, Search, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { TripPayload } from "@/app/trip-actions";
import { fareAmount, officialFare, officialFareForText } from "@/data/fares";
import type { Landmark } from "@/data/landmarks";
import { estimateFare } from "@/lib/estimate";
import { cleanPlace } from "@/lib/place-text";
import { haversineKm } from "@/lib/geo";
import { CALLING_CODES } from "@/lib/phone";
import { googleRoute, loadGoogleMaps, type RouteResult } from "./google-maps";
import { GoogleRideMap } from "./google-ride-map";
import { RideMap } from "./ride-map";

export interface RideOperator {
  slug: string;
  name: string;
  tagline: string | null;
  islands: string[];
  whatsapp: string | null;
  phone: string | null;
  isDemo: boolean;
  verified: boolean;
  /** Claimed by its owner, so it can receive messages in the app. */
  canMessage?: boolean;
}

interface Place { label: string; address?: string; lat?: number; lng?: number; landmarkId?: string }
export interface Vehicle2 { lat: number; lng: number; heading: number | null; van: boolean }
type Field = "pickup" | "dropoff";
type Vehicle = "car" | "van";

// An airport trip means a real airport: a place we know is an airport, or "airport" in its name.
// (Not "Argyle" or "Point Salines" alone: Argyle is also a village on Carriacou.)
const AIRPORT = /\bairport\b|maurice bishop/i;
const sheet = "rounded-t-[1.75rem] bg-raised shadow-lift ring-1 ring-line/60 lg:rounded-[1.75rem]";
const chip = "inline-flex h-10 items-center gap-2 rounded-full bg-sunken px-4 text-sm font-semibold text-ink";
const field = "h-12 w-full min-w-0 rounded-xl border border-line bg-raised px-3.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

export function RideRequest({
  countryCode, countryName, islands, landmarks, coastlines, routes, operators, googleKey, signedIn, startAtAirport, initialVehicle = "car", requestInApp,
  liveVehicles = false, sampleVehicles, family = [], initialWhen = "now", prefill, savedPhone, activeTrip,
}: {
  /** A ride the customer has already requested, so it stays one tap away until it's answered or cancelled. */
  activeTrip?: { id: string; status: string; pickup: string; dropoff: string; cancel: ReactNode } | null;
  /** The number used on the customer's last trip, so they don't retype it every time. */
  savedPhone?: string | null;
  family?: { name: string; phone_e164: string | null; kind: "adult" | "senior" | "teen" }[];
  initialWhen?: "now" | "later";
  prefill?: { from?: { label: string; lat?: number; lng?: number }; to?: { label: string; lat?: number; lng?: number } };
  /** Show approved drivers who are online as cars on the map. */
  liveVehicles?: boolean;
  /** Fixed sample cars, for the preview only. */
  sampleVehicles?: Vehicle2[];
  countryCode: string; countryName: string;
  islands: { slug: string; name: string }[];
  landmarks: Landmark[];
  coastlines: Record<string, [number, number][]>;
  routes: Record<string, { km: number; min: number; path: [number, number][] }>;
  operators: RideOperator[];
  googleKey?: string;
  signedIn: boolean;
  startAtAirport?: boolean;
  initialVehicle?: Vehicle;
  requestInApp?: (p: TripPayload) => Promise<{ url?: string; error?: string; signIn?: string }>;
}) {
  const router = useRouter();
  const main = islands[0];
  const airport = landmarks.find((l) => l.kind === "airport" && l.island === main?.slug);
  const asPlace = (l: Landmark): Place => ({ label: l.name, lat: l.lat, lng: l.lng, landmarkId: l.id });

  const [useGoogle, setUseGoogle] = useState(Boolean(googleKey));
  const [pickup, setPickup] = useState<Place | null>(prefill?.from ?? (startAtAirport && airport ? asPlace(airport) : null));
  const [dropoff, setDropoff] = useState<Place | null>(prefill?.to ?? null);
  const [searching, setSearching] = useState<Field | null>(null);
  const [pinFor, setPinFor] = useState<Field | null>(null);
  const [route, setRoute] = useState<(RouteResult & { estimate?: boolean }) | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [passengers, setPassengers] = useState(initialVehicle === "van" ? 5 : 1);
  const [when, setWhen] = useState<"now" | "later">(initialWhen);
  const [at, setAt] = useState("");
  const [forOther, setForOther] = useState(false);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderCode, setRiderCode] = useState(countryCode === "vc" ? "+1784" : "+1473");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(savedPhone ?? "");
  const [code, setCode] = useState(savedPhone ? "other" : countryCode === "vc" ? "+1784" : "+1473");
  const [panel, setPanel] = useState<"when" | "who" | null>(initialWhen === "later" ? "when" : null);
  const [riderKind, setRiderKind] = useState<"adult" | "senior" | "teen">("adult");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirect, setShowDirect] = useState(false);
  const [cars, setCars] = useState<Vehicle2[]>(sampleVehicles ?? []);
  // Belt and braces: if the page thought you were signed out but this phone has a session, trust it
  // (the booking itself is still checked on the server).
  const [hasSession, setHasSession] = useState(signedIn);
  useEffect(() => {
    if (signedIn || !liveVehicles) return;
    import("@/lib/supabase/browser").then(({ supabaseBrowser }) => supabaseBrowser().auth.getSession())
      .then(({ data }) => { if (data.session) setHasSession(true); }).catch(() => undefined);
  }, [signedIn, liveVehicles]);

  // ---------- Cars nearby (approximate positions of drivers who are online) ----------
  useEffect(() => {
    if (!liveVehicles) return;
    let alive = true;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      const { supabaseBrowser } = await import("@/lib/supabase/browser");
      const { data } = await supabaseBrowser().rpc("nearby_vehicles", { p_country: countryCode });
      if (alive && Array.isArray(data)) setCars(data as Vehicle2[]);
    };
    load();
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [liveVehicles, countryCode]);

  // ---------- Route ----------
  useEffect(() => {
    let alive = true;
    setRoute(null);
    if (!pickup || !dropoff) return;
    const both = pickup.landmarkId && dropoff.landmarkId ? routes[[pickup.landmarkId, dropoff.landmarkId].sort().join("|")] : null;
    const fallback = () => {
      if (both) {
        const forward = pickup.landmarkId! < dropoff.landmarkId!;
        const pts = both.path.map(([lng, lat]) => ({ lat, lng }));
        return { km: both.km, min: both.min, path: forward ? pts : pts.reverse() };
      }
      if (pickup.lat != null && dropoff.lat != null) {
        const km = Math.round(haversineKm(pickup as any, dropoff as any) * 1.35 * 10) / 10;
        return { km, min: Math.max(3, Math.round(km * 1.8)), path: [], estimate: true };
      }
      return null;
    };
    if (useGoogle && googleKey && pickup.lat != null && dropoff.lat != null) {
      googleRoute(googleKey, pickup as any, dropoff as any).then((r) => alive && setRoute(r ?? fallback())).catch(() => alive && setRoute(fallback()));
    } else setRoute(fallback());
    return () => { alive = false; };
  }, [pickup, dropoff, useGoogle, googleKey, routes]);

  // ---------- Price ----------
  const fare = useMemo(() => {
    if (!pickup || !dropoff || vehicle === "van") return null;
    const a = landmarks.find((l) => l.id === pickup.landmarkId);
    const b = landmarks.find((l) => l.id === dropoff.landmarkId);
    return (a && b ? officialFare(a, b) : null)
      ?? officialFareForText(countryCode, [pickup.label, pickup.address].filter(Boolean).join(", "), [dropoff.label, dropoff.address].filter(Boolean).join(", "));
  }, [pickup, dropoff, vehicle, landmarks, countryCode]);
  const price = fare ? fareAmount(fare, passengers) : null;
  // No published fare: show a range from the distance, so customers know roughly what to expect.
  const estimate = !fare && vehicle === "car" ? estimateFare(countryCode, route?.km, passengers) : null;
  // Like Uber: how far away the nearest available car is, at about 30 km/h on island roads.
  const pickupPt = pickup?.lat != null && pickup?.lng != null ? { lat: pickup.lat, lng: pickup.lng } : null;
  const nearestMin = pickupPt && cars.length
    ? Math.max(1, Math.round(Math.min(...cars.filter((c) => !c.van).map((c) => haversineKm(pickupPt, c) * 1.3)) / 30 * 60) + 1)
    : null;

  // ---------- Places on the map ----------
  const islandOf = (p: Place | null) => {
    if (!p) return main?.name ?? countryName;
    const l = landmarks.find((x) => x.id === p.landmarkId);
    if (l) return islands.find((i) => i.slug === l.island)?.name ?? countryName;
    if (p.lat != null) {
      const near = [...landmarks].sort((x, y) => haversineKm(p as any, x) - haversineKm(p as any, y))[0];
      if (near) return islands.find((i) => i.slug === near.island)?.name ?? countryName;
    }
    return main?.name ?? countryName;
  };
  // Which island the trip is on: the chosen place's island, or the island of the nearest known place
  // to its coordinates (so "Use my location" on Carriacou or Bequia shows that island), or the
  // island picked with the chips, or the main island.
  const islandSlugOf = (pl: Place | null): string | null => {
    if (!pl) return null;
    const lm = pl.landmarkId ? landmarks.find((l) => l.id === pl.landmarkId) : null;
    if (lm) return lm.island;
    if (pl.lat == null || pl.lng == null) return null;
    let best: Landmark | null = null, d = Infinity;
    for (const l of landmarks) { const k = haversineKm({ lat: pl.lat, lng: pl.lng }, l); if (k < d) { d = k; best = l; } }
    return best && d < 15 ? best.island : null;
  };
  const [islandPick, setIslandPick] = useState<string>(main?.slug ?? "");
  const activeIsland = islandSlugOf(pickup) ?? islandSlugOf(dropoff) ?? islandPick ?? main?.slug ?? "";
  const islandLandmarks = landmarks.filter((l) => l.island === activeIsland);
  const rideIslands = islands.filter((i) => landmarks.some((l) => l.island === i.slug) && coastlines[i.slug]);
  // Cars on this island only (so Carriacou doesn't show Grenada's drivers as "nearby").
  const carsHere = cars.filter((c) => islandLandmarks.some((l) => haversineKm(c, l) < 15));
  const centre = (activeIsland === main?.slug ? airport : null) ?? islandLandmarks[0] ?? airport ?? landmarks[0] ?? { lat: 12.05, lng: -61.75 };

  async function placeFromTap(pt: { lat: number; lng: number }) {
    const field = pinFor;
    setPinFor(null);
    let label = "Pinned location", address: string | undefined;
    try {
      const g = (window as any).google;
      const { Geocoder } = await g.maps.importLibrary("geocoding");
      const res = await new Geocoder().geocode({ location: pt });
      const best = res.results?.[0];
      if (best) {
        const parts = best.formatted_address.split(",").map((s: string) => s.trim());
        label = parts[0].match(/^[A-Z0-9]{4}\+/) ? `Near ${parts[1] ?? countryName}` : parts[0];
        address = cleanPlace(best.formatted_address);
      }
    } catch { /* keep "Pinned location" */ }
    const p = { label, address, ...pt };
    if (field === "pickup") setPickup(p); else setDropoff(p);
  }

  // ---------- Request ----------
  const isAirport = (p: Place | null) => Boolean(p && (landmarks.find((l) => l.id === p.landmarkId)?.kind === "airport" || AIRPORT.test(p.label)));
  const kind = vehicle === "van" ? "group" : [pickup, dropoff].some(isAirport) ? "airport" : "taxi";
  async function send() {
    if (!pickup || !dropoff || !requestInApp) return;
    if (when === "later" && !at) return setError("Choose the date and time for your pick-up.");
    if (forOther && riderName.trim().length < 2) return setError("Add the name of the person travelling.");
    if (phone.replace(/\D/g, "").length < 6) return setError("Add your phone or WhatsApp number so your driver can reach you.");
    setBusy(true);
    setError(null);
    const res = await requestInApp({
      country: countryCode, kind, from: islandOf(pickup), to: islandOf(dropoff),
      pickup: [pickup.label, pickup.address && !pickup.address.startsWith(pickup.label) ? pickup.address : ""].filter(Boolean).join(", ").slice(0, 160),
      dropoff: [dropoff.label, dropoff.address && !dropoff.address.startsWith(dropoff.label) ? dropoff.address : ""].filter(Boolean).join(", ").slice(0, 160),
      travel_at: when === "later" && at ? new Date(at).toISOString() : null,
      passengers, details: note.trim() || null,
      pickup_id: pickup.landmarkId, dropoff_id: dropoff.landmarkId,
      pickup_lat: pickup.lat ?? null, pickup_lng: pickup.lng ?? null, dropoff_lat: dropoff.lat ?? null, dropoff_lng: dropoff.lng ?? null,
      distance_km: route?.km ?? null, duration_min: route?.min ?? null,
      rider_name: forOther ? riderName.trim() : null, rider_phone: forOther ? riderPhone : null, rider_code: riderCode,
      rider_kind: forOther ? (family.find((m) => m.name === riderName.trim())?.kind ?? riderKind) : null,
      contact_phone: phone, contact_code: code,
    });
    setBusy(false);
    if (res.signIn) return router.push(res.signIn);
    if (res.error) return setError(res.error);
    if (res.url) router.push(res.url);
  }

  const ready = Boolean(pickup && dropoff && (pickup.label !== dropoff.label || pickup.lat !== dropoff.lat));
  const nearby = operators.filter((o) => !o.islands.length || o.islands.includes(landmarks.find((l) => l.id === pickup?.landmarkId)?.island ?? main?.slug ?? ""));
  const whenLabel = when === "now" ? "Now" : at ? new Date(at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Schedule";

  return (
    <div className="lg:grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-6 lg:p-6">
      {/* Map */}
      <div className={`relative ${ready ? "h-[44vh]" : "h-[32vh]"} min-h-56 bg-sunken transition-[height] duration-300 lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100dvh-7rem)] lg:overflow-hidden lg:rounded-[1.75rem]`}>
        {useGoogle && googleKey ? (
          <GoogleRideMap apiKey={googleKey} center={centre} pickup={pickup?.lat != null ? (pickup as any) : null} dropoff={dropoff?.lat != null ? (dropoff as any) : null}
            path={route?.path?.length ? route.path : null} pinMode={Boolean(pinFor)} onTap={placeFromTap} onFail={() => setUseGoogle(false)} vehicles={cars} />
        ) : main && coastlines[main.slug] ? (
          <RideMap key={activeIsland} coastline={coastlines[activeIsland] ?? coastlines[main.slug]}
            landmarks={islandLandmarks.length ? islandLandmarks : landmarks.filter((l) => l.island === main.slug)}
            pickup={landmarks.find((l) => l.id === pickup?.landmarkId) ?? null} destination={landmarks.find((l) => l.id === dropoff?.landmarkId) ?? null}
            road={route?.path?.length ? route.path.map((p) => [p.lng, p.lat] as [number, number]) : null}
            vehicles={cars}
            onPick={(l: Landmark) => (pickup ? setDropoff(asPlace(l)) : setPickup(asPlace(l)))} />
        ) : null}
        {carsHere.length > 0 && !pinFor && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-raised/95 px-3 py-1.5 text-sm font-semibold text-ink shadow-card">
            <Car className="h-4 w-4 text-primary" aria-hidden="true" />{carsHere.length} {carsHere.length === 1 ? "car" : "cars"} nearby
          </div>
        )}
        {pinFor && (
          <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-deep px-4 py-3 text-white shadow-lift">
            <span className="text-sm font-semibold">Tap the map to set your {pinFor === "pickup" ? "pick-up" : "destination"}</span>
            <button type="button" onClick={() => setPinFor(null)} className="text-sm font-semibold underline">Cancel</button>
          </div>
        )}
      </div>

      {/* Sheet */}
      <div className={`relative z-10 -mt-6 lg:order-1 lg:mt-0 ${sheet}`}>
        <div className="mx-auto h-1.5 w-10 rounded-full bg-line pt-0 lg:hidden" style={{ marginTop: 10 }} aria-hidden="true" />
        <div className="space-y-4 p-5">
          {activeTrip && (
            <div className="rounded-2xl bg-deep p-4 text-white">
              <p className="flex items-center gap-2 font-semibold">
                {activeTrip.status === "open" && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-gold" aria-hidden="true" />}
                {activeTrip.status === "open" ? "Your ride request is waiting for a driver" : "Your driver is confirmed"}
              </p>
              <p className="mt-0.5 truncate text-sm text-white/80">{cleanPlace(activeTrip.pickup)} to {cleanPlace(activeTrip.dropoff)}</p>
              <div className="mt-3 flex items-center gap-3">
                <a href={`/${countryCode}/trips/${activeTrip.id}`} className="inline-flex h-10 items-center rounded-full bg-gold px-4 text-sm font-semibold text-[#172B32]">View request</a>
                {activeTrip.status === "open" && activeTrip.cancel}
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold">{ready ? "Choose a trip" : activeTrip ? "Book another ride" : "Where to?"}</h1>

          {/* Pickup and destination */}
          <div className="relative rounded-2xl bg-sunken p-1.5">
            <span className="absolute bottom-[1.6rem] left-[1.3rem] top-[1.6rem] w-px bg-line" aria-hidden="true" />
            {(["pickup", "dropoff"] as const).map((f) => {
              const p = f === "pickup" ? pickup : dropoff;
              return (
                <button key={f} type="button" onClick={() => setSearching(f)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-raised">
                  <span className={`relative z-[1] h-3 w-3 shrink-0 ring-4 ring-sunken ${f === "pickup" ? "rounded-full bg-primary" : "bg-ink"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted">{f === "pickup" ? "Pick-up" : "Destination"}</span>
                    <span className={`block truncate font-semibold ${p ? "text-ink" : "text-muted"}`}>{p?.label ?? (f === "pickup" ? "Where should we pick you up?" : "Where are you going?")}</span>
                  </span>
                  {f === "dropoff" && !p && <Search className="h-5 w-5 text-muted" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* When and who */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPanel(panel === "when" ? null : "when")} className={chip} aria-expanded={panel === "when"}>
              <CalendarClock className="h-4 w-4" aria-hidden="true" />{whenLabel}<ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setPanel(panel === "who" ? null : "who")} className={chip} aria-expanded={panel === "who"}>
              <UserRound className="h-4 w-4" aria-hidden="true" />{forOther ? (riderName.trim() ? `For ${riderName.trim().split(" ")[0]}` : "For someone else") : "For me"}<ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {panel === "when" && (
            <div className="space-y-3 rounded-2xl border border-line p-4">
              <div className="grid grid-cols-2 gap-2">
                {(["now", "later"] as const).map((w) => (
                  <button key={w} type="button" onClick={() => { setWhen(w); if (w === "now") setPanel(null); }} aria-pressed={when === w}
                    className={`h-11 rounded-xl font-semibold ${when === w ? "bg-deep text-white" : "bg-sunken text-ink"}`}>{w === "now" ? "Now" : "Schedule"}</button>
                ))}
              </div>
              {when === "later" && (
                <label className="block"><span className="mb-1 block text-sm font-semibold text-ink">Pick-up date and time</span>
                  <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={`${field} block appearance-none`} /></label>
              )}
            </div>
          )}
          {panel === "who" && (
            <div className="space-y-3 rounded-2xl border border-line p-4">
              <div className="grid grid-cols-2 gap-2">
                {[false, true].map((o) => (
                  <button key={String(o)} type="button" onClick={() => { setForOther(o); if (!o) setPanel(null); }} aria-pressed={forOther === o}
                    className={`h-11 rounded-xl font-semibold ${forOther === o ? "bg-deep text-white" : "bg-sunken text-ink"}`}>{o ? "Someone else" : "Me"}</button>
                ))}
              </div>
              {forOther && family.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {family.map((m) => (
                    <button key={m.name} type="button" aria-pressed={riderName === m.name}
                      onClick={() => { setRiderName(m.name); setRiderKind(m.kind); if (m.phone_e164) { setRiderCode("other"); setRiderPhone(m.phone_e164); } }}
                      className={`h-9 rounded-full px-3.5 text-sm font-semibold ${riderName === m.name ? "bg-deep text-white" : "bg-sunken text-ink"}`}>
                      {m.name}{m.kind !== "adult" ? ` · ${m.kind === "teen" ? "Teen" : "Senior"}` : ""}
                    </button>
                  ))}
                </div>
              )}
              {forOther && (
                <>
                  <label className="block"><span className="mb-1 block text-sm font-semibold text-ink">Their name</span>
                    <input value={riderName} onChange={(e) => setRiderName(e.target.value.slice(0, 80))} className={field} placeholder="e.g. Joan Charles" /></label>
                  <div><span className="mb-1 block text-sm font-semibold text-ink">Their phone</span>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select value={riderCode} onChange={(e) => setRiderCode(e.target.value)} className={`${field} sm:w-44`} aria-label="Their country code">
                        {CALLING_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                      <input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value.slice(0, 24))} inputMode="tel" className={field} placeholder="Their number" aria-label="Their number" />
                    </div>
                  </div>
                  <p className="text-xs">The driver gets their name and number once your trip is booked. You’ll get the updates{riderKind === "teen" ? ", and the driver must confirm pick-up with your trip’s PIN" : ""}. <Link href={`/${countryCode}/account/family`} className="font-semibold text-link underline">Family profile</Link></p>
                </>
              )}
            </div>
          )}

          {/* Popular places: one tidy row that scrolls sideways */}
          {!ready && (
            <div>
              {rideIslands.length > 1 && !pickup && !dropoff && (
                <div className="mb-3 flex gap-2" role="group" aria-label="Island">
                  {rideIslands.map((i) => (
                    <button key={i.slug} type="button" onClick={() => setIslandPick(i.slug)} aria-pressed={activeIsland === i.slug}
                      className={`h-9 rounded-full px-4 text-sm font-semibold ${activeIsland === i.slug ? "bg-deep text-white" : "bg-sunken text-ink"}`}>{i.name}</button>
                  ))}
                </div>
              )}
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Popular places</p>
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {islandLandmarks.slice(0, 8).map((l) => (
                  <button key={l.id} type="button" onClick={() => (pickup ? setDropoff(asPlace(l)) : setPickup(asPlace(l)))}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-sunken px-3.5 text-sm font-medium text-ink hover:bg-line/60">
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />{l.kind === "airport" ? "Airport" : l.name.replace(/ town centre$/i, "").replace(/ Beach$/i, "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ride options with price */}
          {ready && (
            <div className="space-y-2">
              {route && <p className="text-sm">{route.estimate ? "About " : ""}{route.km} km · about {route.min} min by road</p>}
              {([["car", "Car", "1 to 4 people", Car], ["van", "Minivan", "5 to 8 people", Users]] as const).map(([v, name, sub, Icon]) => {
                const on = vehicle === v;
                const p = v === "car" ? price : null;
                return (
                  <button key={v} type="button" onClick={() => { setVehicle(v); setPassengers(v === "van" ? Math.max(5, passengers) : Math.min(4, passengers)); }} aria-pressed={on}
                    className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left ${on ? "bg-primary/10 ring-2 ring-primary" : "bg-sunken"}`}>
                    <Icon className="h-8 w-8 shrink-0 text-ink" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold text-ink">{name}</span><span className="block text-sm">{sub}{v === "car" && nearestMin != null && Number.isFinite(nearestMin) ? ` · ${nearestMin} min away` : ""}</span></span>
                    <span className="text-right">
                      {p != null ? <><span className="block text-lg font-bold text-ink">EC${p}</span><span className="block text-xs text-success">Official fare</span></>
                        : v === "car" && estimate ? <><span className="block text-lg font-bold text-ink">EC${estimate.low}–{estimate.high}</span><span className="block text-xs">Estimate</span></>
                        : <span className="block text-sm font-semibold text-ink">Driver quotes</span>}
                    </span>
                  </button>
                );
              })}
              <div className="flex items-center justify-between rounded-2xl bg-sunken px-4 py-2">
                <span className="text-sm font-semibold text-ink">Passengers</span>
                <span className="flex items-center gap-3">
                  <button type="button" onClick={() => setPassengers(Math.max(vehicle === "van" ? 5 : 1, passengers - 1))} className="h-9 w-9 rounded-full bg-raised text-lg font-bold text-ink ring-1 ring-line" aria-label="One fewer passenger">−</button>
                  <span className="w-5 text-center font-semibold text-ink" aria-live="polite">{passengers}</span>
                  <button type="button" onClick={() => setPassengers(Math.min(vehicle === "van" ? 8 : 4, passengers + 1))} className="h-9 w-9 rounded-full bg-raised text-lg font-bold text-ink ring-1 ring-line" aria-label="One more passenger">+</button>
                </span>
              </div>
              {fare && vehicle === "car" && <p className="text-xs">{fare.table.basis}. Source: {fare.table.source}, {fare.table.sourceDate}. After-hours rates can apply.</p>}
              {estimate && <p className="text-xs">No official fare for this route. Drivers send their price, usually around EC${estimate.low}–{estimate.high}, and you choose. Estimated from official fares for similar distances.</p>}

              <label className="block"><span className="sr-only">Note for the driver</span>
                <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} className={field} placeholder="Note for the driver (optional): gate colour, luggage, flight number" /></label>

              {requestInApp ? (
                !hasSession ? (
                  <div className="rounded-2xl bg-deep p-4 text-white">
                    <p className="font-semibold">Sign in to request this ride</p>
                    <p className="mt-1 text-sm text-white/80">It takes a minute, and your trip details stay here.</p>
                    <Link href={`/join?next=${encodeURIComponent(`/${countryCode}/ride/taxi`)}`} className="mt-3 inline-flex h-11 items-center rounded-full bg-gold px-5 font-semibold text-[#172B32]">Sign in or join free</Link>
                  </div>
                ) : (
                  <>
                    <div><span className="mb-1 block text-sm font-semibold text-ink">Your phone or WhatsApp</span>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select value={code} onChange={(e) => setCode(e.target.value)} className={`${field} sm:w-44`} aria-label="Your country code">
                          {CALLING_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                        <input value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 24))} inputMode="tel" autoComplete="tel" className={field} placeholder={code === "+44" ? "e.g. 07835 028032" : "e.g. 444 1234"} aria-label="Your number" />
                      </div>
                      <span className="mt-1 block text-xs">Visiting? Use your own number from home. Only your driver sees it.</span>
                    </div>
                    {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
                    <button type="button" onClick={send} disabled={busy} className="h-14 w-full rounded-full bg-deep text-[1.0625rem] font-semibold text-white disabled:opacity-60">
                      {busy ? "Booking…" : price != null && vehicle === "car" ? `Book now · EC$${price}` : "Ask drivers for prices"}
                    </button>
                    <p className="text-center text-xs">
                      {price != null && vehicle === "car" ? "Your ride goes to the nearest available driver at the official fare." : "Approved drivers reply with their price. Nothing is booked until you accept one."}
                    </p>
                  </>
                )
              ) : null}

              <button type="button" onClick={() => setShowDirect(!showDirect)} className="w-full text-center text-sm font-semibold text-link underline">
                {showDirect ? "Hide drivers" : "Or contact a driver directly"}
              </button>
              {showDirect && (
                <ul className="space-y-2">
                  {nearby.slice(0, 12).map((o) => (
                    <li key={o.slug} className="rounded-2xl bg-sunken p-3">
                      <p className="font-semibold text-ink">{o.name}{o.verified ? <span className="ml-2 text-xs text-success">Verified</span> : null}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {o.canMessage && <Link href={`/${countryCode}/business/${o.slug}/enquire?subject=${encodeURIComponent("Ride request")}&message=${encodeURIComponent(`Hello, I’d like a ride from ${pickup?.label} to ${dropoff?.label}${when === "later" && at ? ` on ${whenLabel}` : " now"}, ${passengers} passenger${passengers > 1 ? "s" : ""}.`)}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-deep px-4 text-sm font-semibold text-white"><MessagesSquare className="h-4 w-4" aria-hidden="true" />Message</Link>}
                        {o.whatsapp && <a href={`https://wa.me/${o.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I found you on Island Connect. I’d like a ride from ${pickup?.label} to ${dropoff?.label}, ${passengers} passenger${passengers > 1 ? "s" : ""}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-[#0B2E1B]"><MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp</a>}
                        {o.phone && <a href={`tel:${o.phone}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-raised px-4 text-sm font-semibold text-ink"><Phone className="h-4 w-4" aria-hidden="true" />Call</a>}
                      </div>
                    </li>
                  ))}
                  {!nearby.length && <li className="text-sm">No drivers listed here yet.</li>}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search screen */}
      {searching && (
        <PlaceSearch
          field={searching} countryCode={countryCode} googleKey={useGoogle ? googleKey : undefined} landmarks={landmarks} centre={centre}
          pickup={pickup} dropoff={dropoff}
          onClose={() => setSearching(null)}
          onPick={(p) => { if (searching === "pickup") setPickup(p); else setDropoff(p); setSearching(searching === "pickup" && !dropoff ? "dropoff" : null); }}
          onPinOnMap={() => { setPinFor(searching); setSearching(null); }}
          onSwitch={(f) => setSearching(f)}
        />
      )}
    </div>
  );
}

/* Full-screen place search: current location, Google suggestions, popular places, or pin on the map. */
function PlaceSearch({ field, countryCode, googleKey, landmarks, centre, pickup, dropoff, onClose, onPick, onPinOnMap, onSwitch }: {
  field: Field; countryCode: string; googleKey?: string; landmarks: Landmark[]; centre: { lat: number; lng: number };
  pickup: Place | null; dropoff: Place | null;
  onClose: () => void; onPick: (p: Place) => void; onPinOnMap: () => void; onSwitch: (f: Field) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ main: string; secondary: string; pred: any }[]>([]);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const token = useRef<any>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { input.current?.focus(); setQ(""); setResults([]); }, [field]);

  useEffect(() => {
    if (!googleKey || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const g = await loadGoogleMaps(googleKey);
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await g.maps.importLibrary("places");
        token.current ??= new AutocompleteSessionToken();
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q, sessionToken: token.current, includedRegionCodes: [countryCode], locationBias: { center: centre, radius: 50000 },
        });
        setResults((suggestions ?? []).filter((s: any) => s.placePrediction).slice(0, 6).map((s: any) => ({
          main: s.placePrediction.mainText?.toString() ?? s.placePrediction.text.toString(),
          secondary: s.placePrediction.secondaryText?.toString() ?? "", pred: s.placePrediction,
        })));
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, googleKey, countryCode, centre]);

  async function chooseGoogle(r: { main: string; secondary: string; pred: any }) {
    try {
      const place = r.pred.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
      token.current = null;
      onPick({ label: cleanPlace(place.displayName ?? r.main), address: cleanPlace(place.formattedAddress ?? r.secondary), lat: place.location.lat(), lng: place.location.lng() });
    } catch {
      onPick({ label: r.main, address: r.secondary });
    }
  }

  function here() {
    if (!navigator.geolocation) return setMsg("Your phone didn’t share its location. Type the address instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      let label = "Current location", address: string | undefined;
      try {
        if (googleKey) {
          const g = await loadGoogleMaps(googleKey);
          const { Geocoder } = await g.maps.importLibrary("geocoding");
          const res = await new Geocoder().geocode({ location: pt });
          const found: string | undefined = res.results?.[0]?.formatted_address;
          if (found) { address = cleanPlace(found); label = `Current location (${address.split(",")[0] || "here"})`; }
        } else {
          const near = [...landmarks].sort((x, y) => haversineKm(pt, x) - haversineKm(pt, y))[0];
          if (near && haversineKm(pt, near) < 5) label = `Current location, near ${near.name}`;
        }
      } catch { /* keep the plain label */ }
      setLocating(false);
      onPick({ label, address, ...pt });
    }, () => { setLocating(false); setMsg("Location is switched off for this site. Type the address or pick it on the map."); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  const words = q.trim().toLowerCase();
  const popular = landmarks.filter((l) => !words || l.name.toLowerCase().includes(words)).slice(0, words ? 6 : 10);
  const row = "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-sunken";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-surface" role="dialog" aria-modal="true" aria-label={field === "pickup" ? "Choose pick-up" : "Choose destination"}>
      <div className="border-b border-line bg-raised px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sunken" aria-label="Back"><ArrowLeft className="h-6 w-6" aria-hidden="true" /></button>
          <p className="font-semibold text-ink">{field === "pickup" ? "Pick-up" : "Where to?"}</p>
        </div>
        <div className="mt-2 space-y-2">
          {(["pickup", "dropoff"] as const).map((f) => (
            f === field ? (
              <div key={f} className="flex items-center gap-2 rounded-xl bg-sunken px-3">
                <span className={`h-3 w-3 shrink-0 ${f === "pickup" ? "rounded-full bg-primary" : "bg-ink"}`} aria-hidden="true" />
                <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={f === "pickup" ? "Pick-up address or place" : "Destination address or place"}
                  className="h-12 min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted focus:outline-none" enterKeyHint="search" />
                {q && <button type="button" onClick={() => setQ("")} aria-label="Clear"><X className="h-5 w-5 text-muted" aria-hidden="true" /></button>}
              </div>
            ) : (
              <button key={f} type="button" onClick={() => onSwitch(f)} className="flex h-12 w-full items-center gap-2 rounded-xl px-3 text-left">
                <span className={`h-3 w-3 shrink-0 ${f === "pickup" ? "rounded-full bg-primary" : "bg-ink"}`} aria-hidden="true" />
                <span className="truncate text-ink">{(f === "pickup" ? pickup : dropoff)?.label ?? (f === "pickup" ? "Pick-up" : "Destination")}</span>
              </button>
            )
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {field === "pickup" && (
          <button type="button" onClick={here} className={row}><LocateFixed className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-ink">{locating ? "Finding you…" : "Use my current location"}</span></button>
        )}
        <button type="button" onClick={onPinOnMap} className={row}><Crosshair className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-semibold text-ink">Choose on the map</span></button>
        {msg && <p className="px-3 py-2 text-sm text-danger">{msg}</p>}
        {results.length > 0 && <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">Results</p>}
        {results.map((r, i) => (
          <button key={i} type="button" onClick={() => chooseGoogle(r)} className={row}>
            <MapPin className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <span className="min-w-0"><span className="block truncate font-semibold text-ink">{r.main}</span><span className="block truncate text-sm">{r.secondary}</span></span>
          </button>
        ))}
        {!googleKey && words.length >= 3 && (
          <button type="button" onClick={() => onPick({ label: q.trim() })} className={row}>
            <MapPin className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <span className="min-w-0"><span className="block truncate font-semibold text-ink">Use “{q.trim()}”</span><span className="block text-sm">Your driver will confirm the exact spot</span></span>
          </button>
        )}
        {popular.length > 0 && <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">Popular places</p>}
        {popular.map((l) => (
          <button key={l.id} type="button" onClick={() => onPick({ label: l.name, lat: l.lat, lng: l.lng, landmarkId: l.id })} className={row}>
            <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold text-ink">{l.name}</span>
          </button>
        ))}
        {googleKey && <p className="px-3 pt-4 text-[0.7rem] text-muted">Search powered by Google</p>}
      </div>
    </div>
  );
}
