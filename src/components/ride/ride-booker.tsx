"use client";

import { InAppRequest, type RequestInApp } from "./in-app-request";
import { fareAmount, officialFare } from "@/data/fares";
import { ArrowDownUp, ArrowLeft, BadgeCheck, CarFront, Clock, FlaskConical, Info, MessageCircle, Minus, Phone, Plus, Users, Bus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Landmark } from "@/data/landmarks";
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
}

type Step = "where" | "ride" | "send";
type Vehicle = "car" | "van";

const VEHICLES: { id: Vehicle; name: string; seats: string; max: number; Icon: typeof CarFront }[] = [
  { id: "car", name: "Car", seats: "Up to 4 passengers", max: 4, Icon: CarFront },
  { id: "van", name: "Minivan", seats: "Up to 8 passengers, more luggage", max: 8, Icon: Bus },
];

const field =
  "h-12 w-full appearance-none rounded-xl bg-sunken px-4 text-ink focus:bg-raised focus:outline-none focus:ring-2 focus:ring-primary";

export function RideBooker({
  countryCode,
  countryName,
  islands,
  landmarks,
  coastlines,
  operators,
  initialVehicle = "car",
  startAtAirport = false,
  requestInApp,
  routes = {},
}: {
  routes?: Record<string, { km: number; min: number; path: [number, number][] }>;
  countryCode: string;
  countryName: string;
  islands: { slug: string; name: string }[];
  landmarks: Landmark[];
  coastlines: Record<string, [number, number][]>;
  operators: RideOperator[];
  initialVehicle?: Vehicle;
  startAtAirport?: boolean;
  requestInApp?: RequestInApp;
}) {
  const [island, setIsland] = useState(islands[0]?.slug ?? "");
  const [pickupId, setPickupId] = useState(
    startAtAirport ? (landmarks.find((l) => l.island === islands[0]?.slug && l.kind === "airport")?.id ?? "") : "",
  );
  const [destId, setDestId] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [at, setAt] = useState("");
  const [passengers, setPassengers] = useState(initialVehicle === "van" ? 5 : 1);
  const [notes, setNotes] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [step, setStep] = useState<Step>("where");

  // Each step starts at the top, with the map in view.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const here = useMemo(() => landmarks.filter((l) => l.island === island), [landmarks, island]);
  const pickup = here.find((l) => l.id === pickupId) ?? null;
  const destination = here.find((l) => l.id === destId) ?? null;
  const islandName = islands.find((i) => i.slug === island)?.name ?? "";
  const road = pickup && destination && pickup.id !== destination.id ? routes[[pickup.id, destination.id].sort().join("|")] ?? null : null;
  // Stored routes run from the alphabetically first point; reverse when travelling the other way.
  const roadPath = road ? (pickup!.id < destination!.id ? road.path : [...road.path].reverse()) : null;
  const fare = pickup && destination && pickup.id !== destination.id ? officialFare(pickup, destination) : null;
  const available = operators.filter((o) => o.islands.includes(island));
  const ready = pickup && destination && pickup.id !== destination.id && (when === "now" || at);

  function chooseIsland(slug: string) {
    setIsland(slug);
    setPickupId("");
    setDestId("");
    setStep("where");
  }

  function pickFromMap(l: Landmark) {
    if (step !== "where") return;
    if (!pickupId || (pickupId && destId)) {
      setPickupId(l.id);
      if (destId === l.id) setDestId("");
    } else setDestId(l.id);
  }

  function setPassengerCount(n: number) {
    const v = Math.min(8, Math.max(1, n));
    setPassengers(v);
    if (v > 4) setVehicle("van");
  }

  const whenText =
    when === "now"
      ? "As soon as possible"
      : new Date(at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const message = [
    "Hello, I’d like to book a ride (via Island Connect).",
    `Pickup: ${pickup?.name}, ${islandName}`,
    `Destination: ${destination?.name}`,
    `When: ${whenText}`,
    `Passengers: ${passengers}`,
    `Vehicle: ${VEHICLES.find((v) => v.id === vehicle)?.name}`,
    notes ? `Directions: ${notes}` : "",
    "Please confirm the fare and pickup time.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="lg:grid lg:h-[calc(100dvh-4.25rem)] lg:grid-cols-[27rem_1fr]">
      {/* Map */}
      <div className="relative h-[34vh] min-h-[15rem] bg-[#D6E9EC] dark:bg-[#0E2A2E] lg:order-2 lg:h-full">
        {/* Inset at the bottom on phones so no point sits under the overlapping sheet. */}
        <div className="absolute inset-x-0 bottom-8 top-2 lg:bottom-0 lg:top-0">
          {coastlines[island] ? (
            <RideMap coastline={coastlines[island]} landmarks={here} pickup={pickup} destination={destination} onPick={pickFromMap} road={roadPath} />
          ) : null}
        </div>
        <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-raised/90 px-3 py-1 text-[0.72rem] text-muted shadow-sm lg:bottom-3 lg:top-auto">
          Tap a point to choose it. Map and routes © OpenStreetMap contributors
        </p>
      </div>

      {/* Sheet */}
      <div className="relative z-10 -mt-6 rounded-t-[1.75rem] bg-raised px-5 pb-8 pt-3 shadow-[0_-12px_30px_-12px_rgb(0_0_0/0.25)] lg:order-1 lg:mt-0 lg:overflow-y-auto lg:rounded-none lg:px-7 lg:pt-7 lg:shadow-none">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line lg:hidden" aria-hidden="true" />

        {step === "where" && (
          <section aria-labelledby="where-heading">
            <h1 id="where-heading" className="text-[1.75rem] font-semibold leading-tight">Where to?</h1>
            {islands.length > 1 && (
              <div className="mt-4 flex gap-1 rounded-full bg-sunken p-1" role="tablist" aria-label="Island">
                {islands.map((i) => (
                  <button key={i.slug} type="button" role="tab" aria-selected={island === i.slug} onClick={() => chooseIsland(i.slug)}
                    className={`h-10 flex-1 rounded-full text-sm font-semibold transition ${island === i.slug ? "bg-raised text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                    {i.name}
                  </button>
                ))}
              </div>
            )}

            <div className="relative mt-4 grid gap-2">
              <span className="absolute left-4 top-[1.4rem] h-[calc(100%-2.8rem)] w-px border-l-2 border-dotted border-muted/40" aria-hidden="true" />
              <label className="relative block">
                <span className="sr-only">Pickup</span>
                <span className="absolute left-[0.7rem] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/20" aria-hidden="true" />
                <select value={pickupId} onChange={(e) => setPickupId(e.target.value)} className={`${field} pl-10`}>
                  <option value="">Pickup point</option>
                  {here.map((l) => (
                    <option key={l.id} value={l.id} disabled={l.id === destId}>{l.name}</option>
                  ))}
                </select>
              </label>
              <label className="relative block">
                <span className="sr-only">Destination</span>
                <span className="absolute left-[0.7rem] top-1/2 h-3 w-3 -translate-y-1/2 bg-ink" aria-hidden="true" />
                <select value={destId} onChange={(e) => setDestId(e.target.value)} className={`${field} pl-10`}>
                  <option value="">Destination</option>
                  {here.map((l) => (
                    <option key={l.id} value={l.id} disabled={l.id === pickupId}>{l.name}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => { setPickupId(destId); setDestId(pickupId); }} disabled={!pickupId && !destId}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-raised text-ink shadow ring-1 ring-line disabled:opacity-40" aria-label="Swap pickup and destination">
                <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <label className="mt-3 block">
              <span className="sr-only">Directions for the driver</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 160))} placeholder="Add directions, e.g. blue gate after the church" className={field} />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="When">
              {(["now", "later"] as const).map((w) => (
                <button key={w} type="button" role="radio" aria-checked={when === w} onClick={() => setWhen(w)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl font-semibold transition ${when === w ? "bg-ink text-surface" : "bg-sunken text-ink"}`}>
                  <Clock className="h-4 w-4" aria-hidden="true" /> {w === "now" ? "Now" : "Schedule"}
                </button>
              ))}
            </div>
            {when === "later" && (
              <label className="mt-2 block">
                <span className="mb-1 block text-sm font-semibold text-ink">Pickup date and time ({countryName} time)</span>
                <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={field} />
              </label>
            )}

            <div className="mt-5 flex items-center justify-between rounded-xl bg-sunken px-4 py-2.5">
              <span className="flex items-center gap-2 font-semibold text-ink"><Users className="h-5 w-5" aria-hidden="true" /> Passengers</span>
              <span className="flex items-center gap-3">
                <button type="button" onClick={() => setPassengerCount(passengers - 1)} disabled={passengers <= 1} aria-label="Fewer passengers" className="flex h-9 w-9 items-center justify-center rounded-full bg-raised ring-1 ring-line disabled:opacity-40"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                <span className="w-5 text-center font-semibold text-ink" aria-live="polite">{passengers}</span>
                <button type="button" onClick={() => setPassengerCount(passengers + 1)} disabled={passengers >= 8} aria-label="More passengers" className="flex h-9 w-9 items-center justify-center rounded-full bg-raised ring-1 ring-line disabled:opacity-40"><Plus className="h-4 w-4" aria-hidden="true" /></button>
              </span>
            </div>

            <button type="button" disabled={!ready} onClick={() => setStep("ride")}
              className="mt-6 h-14 w-full rounded-full bg-primary text-[1.0625rem] font-semibold text-primary-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
              {ready ? "Choose a ride" : pickup && destination ? "Pick a time" : "Choose pickup and destination"}
            </button>
          </section>
        )}

        {step === "ride" && pickup && destination && (
          <section aria-labelledby="ride-heading">
            <button type="button" onClick={() => setStep("where")} className="-ml-2 flex h-10 items-center gap-1 rounded-full px-2 font-semibold text-ink hover:bg-sunken">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
            </button>
            <h1 id="ride-heading" className="mt-2 text-[1.75rem] font-semibold leading-tight">Choose a ride</h1>
            <p className="mt-1 text-sm">{pickup.name} to {destination.name}. {whenText}.</p>
            <div className="mt-5 grid gap-2" role="radiogroup" aria-label="Vehicle">
              {VEHICLES.map((v) => {
                const fits = passengers <= v.max;
                const on = vehicle === v.id;
                return (
                  <button key={v.id} type="button" role="radio" aria-checked={on} disabled={!fits} onClick={() => setVehicle(v.id)}
                    className={`flex items-center gap-4 rounded-2xl p-4 text-left ring-2 transition disabled:opacity-40 ${on ? "bg-raised ring-ink" : "bg-sunken ring-transparent hover:ring-line"}`}>
                    <v.Icon className="h-10 w-10 shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
                    <span className="flex-1">
                      <span className="block font-semibold text-ink">{v.name}</span>
                      <span className="block text-sm">{fits ? v.seats : `Not enough seats for ${passengers}`}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 flex gap-3 rounded-2xl bg-gold/15 p-4 text-sm text-ink">
              <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                Island Connect doesn’t set or estimate fares. Licensed taxis in {countryName} charge set rates on many routes; your
                driver confirms the fare before you travel. Always agree the price before setting off.
              </span>
            </p>
            <button type="button" onClick={() => setStep("send")} className="mt-6 h-14 w-full rounded-full bg-primary text-[1.0625rem] font-semibold text-primary-ink transition hover:brightness-110">
              Find a driver
            </button>
          </section>
        )}

        {step === "send" && pickup && destination && (
          <section aria-labelledby="send-heading">
            <button type="button" onClick={() => setStep("ride")} className="-ml-2 flex h-10 items-center gap-1 rounded-full px-2 font-semibold text-ink hover:bg-sunken">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back
            </button>
            <h1 id="send-heading" className="mt-2 text-[1.75rem] font-semibold leading-tight">Send your request</h1>
            <p className="mt-1 text-sm">
              Choose an operator on {islandName}. Your trip details are written for you; the driver replies to confirm the fare and pickup.
            </p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl bg-sunken p-4 text-sm">
              <dt className="text-muted">From</dt><dd className="font-semibold text-ink">{pickup.name}</dd>
              <dt className="text-muted">To</dt><dd className="font-semibold text-ink">{destination.name}</dd>
              <dt className="text-muted">When</dt><dd className="font-semibold text-ink">{whenText}</dd>
              <dt className="text-muted">Ride</dt><dd className="font-semibold text-ink">{VEHICLES.find((v) => v.id === vehicle)?.name}, {passengers} passenger{passengers > 1 ? "s" : ""}</dd>
              {road && <><dt className="text-muted">Distance</dt><dd className="font-semibold text-ink">About {road.km} km by road, roughly {road.min} min</dd></>}
              {fare && (
                <>
                  <dt className="text-muted">Official fare</dt>
                  <dd className="text-ink">
                    <span className="font-semibold">EC${fare.row.xcd}{fare.row.afterXcd ? ` (EC$${fare.row.afterXcd} after hours)` : ""}</span>
                    <span className="block text-xs text-muted">{fare.table.basis}. Source: {fare.table.source}, {fare.table.sourceDate}.</span>
                  </dd>
                </>
              )}
            </dl>

            {requestInApp && (
              <InAppRequest
                action={requestInApp}
                note={fare && vehicle !== "van"
                  ? `This route has an official fare of EC$${fareAmount(fare, passengers)}. The first approved driver to accept takes your trip at that fare; you’ll be told straight away.`
                  : "Approved drivers get your request and reply with a fare. You choose one in the app; nothing is booked until you accept."}
                payload={{
                  country: countryCode,
                  kind: vehicle === "van" ? "group" : pickup.kind === "airport" || destination.kind === "airport" ? "airport" : "taxi",
                  from: islandName, to: islandName, pickup: pickup.name, dropoff: destination.name,
                  travel_at: when === "later" && at ? new Date(at).toISOString() : null,
                  passengers, details: notes || null,
                  pickup_id: pickup.id, dropoff_id: destination.id,
                }}
              />
            )}
            {requestInApp && available.length > 0 && <p className="mt-5 text-sm font-semibold text-ink">Or contact an operator directly</p>}
            {available.length ? (
              <ul className="mt-5 grid gap-3">
                {available.map((o) => (
                  <li key={o.slug} className="rounded-2xl p-4 ring-1 ring-line">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/${countryCode}/business/${o.slug}`} className="font-semibold text-ink hover:underline">{o.name}</Link>
                        {o.tagline && <p className="text-sm">{o.tagline}</p>}
                      </div>
                      {o.isDemo ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-[0.72rem] font-semibold text-ink"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />Demo</span>
                      ) : o.verified ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[0.72rem] font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />Verified</span>
                      ) : null}
                    </div>
                    {o.whatsapp || o.phone ? (
                      <div className="mt-3 flex gap-2">
                        {o.whatsapp && (
                          <a href={`https://wa.me/${o.whatsapp.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-ink">
                            <MessageCircle className="h-5 w-5" aria-hidden="true" /> Request on WhatsApp
                          </a>
                        )}
                        {o.phone && (
                          <a href={`tel:${o.phone}`} aria-label={`Call ${o.name}`} className={`flex h-11 items-center justify-center gap-2 rounded-full ring-1 ring-line font-semibold text-ink ${o.whatsapp ? "w-11" : "flex-1"}`}>
                            <Phone className="h-5 w-5" aria-hidden="true" />{!o.whatsapp && " Call"}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm">{o.isDemo ? "Demonstration listing: it can’t receive requests." : "This operator hasn’t added contact details yet."}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-line p-5 text-center">
                <p className="font-semibold text-ink">No taxi operators listed on {islandName} yet</p>
                <p className="mt-1 text-sm">Operators are being added. In the meantime, see all transport listed in {countryName}.</p>
                <Link href={`/${countryCode}/services/transport`} className="mt-3 inline-block font-semibold text-link underline">Browse transport</Link>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
