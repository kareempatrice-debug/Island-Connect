"use client";

import { ArrowLeft, BadgeCheck, FlaskConical, Info, MessageCircle, Minus, Phone, Plus, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QUOTE_TITLES as TITLES } from "@/lib/transport";
import { InAppRequest, type RequestInApp } from "./in-app-request";

/*
 * Custom-quote requests for boats, haulage and freight. The customer describes
 * the job; it goes to operators covering that route, who reply with their own
 * price. Until in-app quotes launch, the request is sent by WhatsApp or phone
 * with every detail written out, and nothing is booked until a price is agreed.
 */

export interface QuotePlace {
  key: string; // "vc:st-vincent"
  name: string;
  countryCode: string;
  countryName: string;
  isMain: boolean;
}

export interface QuoteOperator {
  slug: string;
  countryCode: string;
  name: string;
  tagline: string | null;
  areas: string[]; // place keys
  whatsapp: string | null;
  phone: string | null;
  isDemo: boolean;
  verified: boolean;
  /** Claimed by its owner, so it can receive messages in the app. */
  canMessage?: boolean;
}

type Kind = "boat" | "haulage" | "freight";


const CARGO = ["Building materials", "Household move", "Vehicle", "Container", "Shop or farm goods", "Something else"];

const field =
  "h-12 w-full rounded-xl border border-line bg-raised px-3.5 text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";
const label = "mb-1.5 block text-sm font-semibold text-ink";
const panel = "rounded-card bg-raised p-4 shadow-card ring-1 ring-line/60 sm:p-5";

export function QuoteRequest({
  kind,
  countryCode,
  places,
  operators,
  defaultFrom,
  defaultTo,
  requestInApp,
}: {
  kind: Kind;
  countryCode: string;
  places: QuotePlace[];
  operators: QuoteOperator[];
  defaultFrom: string;
  defaultTo: string;
  requestInApp?: RequestInApp;
}) {
  const domestic = kind === "haulage"; // trucking stays within the country, on one island or between its islands
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(domestic ? defaultFrom : defaultTo);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [cargo, setCargo] = useState(CARGO[0]);
  const [load, setLoad] = useState("");
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [passengers, setPassengers] = useState(2);
  const [date, setDate] = useState("");
  const [flexible, setFlexible] = useState(true);
  const [step, setStep] = useState<"details" | "send">("details");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const place = (k: string) => places.find((p) => p.key === k);
  const fromPlace = place(from);
  const toPlace = place(to);
  const crossBorder = !domestic && fromPlace && toPlace && fromPlace.countryCode !== toPlace.countryCode;
  const homePlaces = places.filter((p) => p.countryCode === countryCode);

  const matching = useMemo(
    () =>
      operators
        .filter((o) => o.areas.includes(from) || o.areas.includes(to))
        .sort((a, b) => Number(a.isDemo) - Number(b.isDemo) || Number(b.verified) - Number(a.verified)),
    [operators, from, to],
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!domestic && from === to) e.to = "Choose a different destination.";
    if (!pickup.trim()) e.pickup = kind === "boat" ? "Say where you’ll board." : "Say where to collect from.";
    if (!dropoff.trim()) e.dropoff = kind === "boat" ? "Say where you’re going." : "Say where to deliver to.";
    if (kind !== "boat" && load.trim().length < 5) e.load = "Describe the load so operators can price it.";
    if (!date) e.date = "Choose a date.";
    else if (date < new Date().toISOString().slice(0, 10)) e.date = "Choose today or a later date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const dateText = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + (flexible ? " (flexible)" : "")
    : "";

  const message = [
    `Hello, I’d like a quote via Island Connect: ${TITLES[kind].title.toLowerCase()}.`,
    from === to ? `Island: ${fromPlace?.name}` : `Route: ${fromPlace?.name} to ${toPlace?.name}`,
    `${kind === "boat" ? "Boarding" : "Collect from"}: ${pickup}`,
    `${kind === "boat" ? "Going to" : "Deliver to"}: ${dropoff}`,
    kind === "boat" ? `Passengers: ${passengers}` : `Load: ${cargo}. ${load}`,
    kind !== "boat" && loadingHelp ? "Needs help loading and unloading." : "",
    `Date: ${dateText}`,
    crossBorder ? "This crosses between Grenada and St Vincent and the Grenadines, so please include customs requirements." : "",
    "Please send your price and what it includes.",
  ]
    .filter(Boolean)
    .join("\n");

  const err = (k: string) =>
    errors[k] ? <span role="alert" className="mt-1 block text-sm font-medium text-danger">{errors[k]}</span> : null;

  if (step === "send") {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setStep("details")} className="-ml-2 inline-flex h-10 items-center gap-1 rounded-full px-2 font-semibold text-ink hover:bg-sunken">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Edit request
        </button>
        <div>
          <h2 className="text-2xl font-bold">Send your request</h2>
          <p className="mt-1">Operators covering this route. Your request is written out for you; each operator replies with their own price.</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-card bg-sunken p-4 text-[0.95rem]">
          <dt>{from === to ? "Island" : "Route"}</dt>
          <dd className="font-semibold text-ink">{from === to ? fromPlace?.name : `${fromPlace?.name} to ${toPlace?.name}`}</dd>
          <dt>{kind === "boat" ? "Trip" : "Load"}</dt>
          <dd className="font-semibold text-ink">{kind === "boat" ? `${passengers} passenger${passengers > 1 ? "s" : ""}` : `${cargo}${loadingHelp ? ", with loading help" : ""}`}</dd>
          <dt>Date</dt>
          <dd className="font-semibold text-ink">{dateText}</dd>
        </dl>
        {crossBorder && (
          <p className="flex gap-3 rounded-card bg-gold/20 p-4 text-[0.95rem] text-ink">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Goods and passengers crossing between the two countries clear customs and immigration on arrival. Ask operators to include the paperwork and any duties in their reply.</span>
          </p>
        )}
        {requestInApp && fromPlace && toPlace && (
          <InAppRequest
            action={requestInApp}
            note="Approved operators get your request and reply with their price. You compare and accept one in the app; nothing is booked until you do."
            payload={{
              country: countryCode, kind,
              from: fromPlace.name + (fromPlace.countryCode !== countryCode ? ` (${fromPlace.countryName})` : ""),
              to: toPlace.name + (toPlace.countryCode !== countryCode ? ` (${toPlace.countryName})` : ""),
              pickup, dropoff,
              travel_at: date ? new Date(`${date}T12:00:00`).toISOString() : null,
              passengers: kind === "boat" ? passengers : null,
              details: kind === "boat" ? (flexible ? "Dates flexible" : null) : `${cargo}. ${load}${loadingHelp ? " Needs help loading and unloading." : ""}${flexible ? " Dates flexible." : ""}`,
              cross_border: Boolean(crossBorder),
            }}
          />
        )}
        {requestInApp && matching.length > 0 && <p className="font-semibold text-ink">Or contact an operator directly</p>}
        {matching.length ? (
          <ul className="space-y-3">
            {matching.map((o) => (
              <li key={o.slug} className="rounded-card bg-raised p-4 ring-1 ring-line/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/${o.countryCode}/business/${o.slug}`} className="font-semibold text-ink hover:underline">{o.name}</Link>
                    {o.tagline && <p className="text-sm">{o.tagline}</p>}
                  </div>
                  {o.isDemo ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs font-semibold text-ink"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />Demo</span>
                  ) : o.verified ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />Verified</span>
                  ) : null}
                </div>
                {o.canMessage && (
                  <Link href={`/${countryCode}/business/${o.slug}/enquire?subject=${encodeURIComponent("Quote request")}&message=${encodeURIComponent(message)}`}
                    className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-deep font-semibold text-white">
                    <MessagesSquare className="h-5 w-5" aria-hidden="true" /> Message in the app
                  </Link>
                )}
                {o.whatsapp || o.phone ? (
                  <div className="mt-3 flex gap-2">
                    {o.whatsapp && (
                      <a href={`https://wa.me/${o.whatsapp.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-ink">
                        <MessageCircle className="h-5 w-5" aria-hidden="true" /> Ask for a quote
                      </a>
                    )}
                    {o.phone && (
                      <a href={`tel:${o.phone}`} aria-label={`Call ${o.name}`} className={`flex h-11 items-center justify-center gap-2 rounded-full font-semibold text-ink ring-1 ring-line ${o.whatsapp ? "w-11" : "flex-1"}`}>
                        <Phone className="h-5 w-5" aria-hidden="true" />{!o.whatsapp && " Call for a quote"}
                      </a>
                    )}
                  </div>
                ) : !o.canMessage && (
                  <p className="mt-3 text-sm">{o.isDemo ? "Demonstration listing: it can’t receive requests." : "This operator hasn’t added contact details yet."}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-card border border-dashed border-line p-5 text-center">
            <p className="font-semibold text-ink">No operators listed for this route yet</p>
            <p className="mt-1 text-sm">Operators are being added. Browse transport listings in the meantime.</p>
            <Link href={`/${countryCode}/services/transport`} className="mt-3 inline-block font-semibold text-link underline">Browse transport</Link>
          </div>
        )}
        <p className="text-sm">Agree the price and what it includes with the operator before the job goes ahead. In-app quotes, where operators reply here and you accept with one tap, are coming next.</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) setStep("send");
      }}
      className="space-y-4"
    >
      <section className={panel} aria-labelledby="route-heading">
        <h2 id="route-heading" className="text-lg font-bold">Route</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={label}>From</span>
            <select value={from} onChange={(e) => { setFrom(e.target.value); if (!domestic && e.target.value === to) setTo(places.find((p) => p.key !== e.target.value)!.key); }} className={field}>
              {(domestic ? homePlaces : places).map((p) => <option key={p.key} value={p.key}>{p.name}{p.countryCode !== countryCode ? ` (${p.countryName})` : ""}</option>)}
            </select></label>
          <label className="block"><span className={label}>To</span>
            <select value={to} onChange={(e) => { setTo(e.target.value); setErrors((x) => ({ ...x, to: "" })); }} className={field} aria-invalid={Boolean(errors.to)}>
              {(domestic ? homePlaces : places.filter((p) => p.key !== from)).map((p) => <option key={p.key} value={p.key}>{p.name}{p.countryCode !== countryCode ? ` (${p.countryName})` : ""}{domestic && p.key === from ? " (same island)" : ""}</option>)}
            </select>{err("to")}</label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={label}>{kind === "boat" ? "Boarding point" : "Collect from"}</span>
            <input value={pickup} onChange={(e) => { setPickup(e.target.value.slice(0, 120)); setErrors((x) => ({ ...x, pickup: "" })); }} aria-invalid={Boolean(errors.pickup)}
              placeholder={kind === "boat" ? "e.g. Clifton harbour" : "e.g. Hardware store in town"} className={field} />{err("pickup")}</label>
          <label className="block"><span className={label}>{kind === "boat" ? "Going to" : "Deliver to"}</span>
            <input value={dropoff} onChange={(e) => { setDropoff(e.target.value.slice(0, 120)); setErrors((x) => ({ ...x, dropoff: "" })); }} aria-invalid={Boolean(errors.dropoff)}
              placeholder={kind === "boat" ? "e.g. Hillsborough jetty" : "e.g. Building site above the bay"} className={field} />{err("dropoff")}</label>
        </div>
        {crossBorder && (
          <p className="mt-3 flex gap-3 rounded-xl bg-gold/20 p-3 text-sm text-ink">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>This crosses from {fromPlace?.countryName} into {toPlace?.countryName}. Customs and immigration apply on arrival; operators will tell you what’s needed.</span>
          </p>
        )}
      </section>

      {kind === "boat" ? (
        <section className={panel} aria-labelledby="who-heading">
          <h2 id="who-heading" className="text-lg font-bold">Passengers</h2>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-sunken px-4 py-2.5">
            <span className="font-semibold text-ink">How many people?</span>
            <span className="flex items-center gap-3">
              <button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))} disabled={passengers <= 1} aria-label="Fewer passengers" className="flex h-9 w-9 items-center justify-center rounded-full bg-raised ring-1 ring-line disabled:opacity-40"><Minus className="h-4 w-4" aria-hidden="true" /></button>
              <span className="w-6 text-center font-semibold text-ink" aria-live="polite">{passengers}</span>
              <button type="button" onClick={() => setPassengers(Math.min(30, passengers + 1))} disabled={passengers >= 30} aria-label="More passengers" className="flex h-9 w-9 items-center justify-center rounded-full bg-raised ring-1 ring-line disabled:opacity-40"><Plus className="h-4 w-4" aria-hidden="true" /></button>
            </span>
          </div>
        </section>
      ) : (
        <section className={panel} aria-labelledby="load-heading">
          <h2 id="load-heading" className="text-lg font-bold">What are you sending?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CARGO.map((c) => (
              <button key={c} type="button" aria-pressed={cargo === c} onClick={() => setCargo(c)}
                className={`min-h-12 rounded-xl px-3 py-2 text-sm font-semibold transition ${cargo === c ? "border-2 border-primary bg-primary/10 text-ink" : "border border-line bg-raised text-ink"}`}>{c}</button>
            ))}
          </div>
          <label className="mt-3 block"><span className={label}>Describe the load</span>
            <textarea value={load} onChange={(e) => { setLoad(e.target.value.slice(0, 600)); setErrors((x) => ({ ...x, load: "" })); }} rows={3} aria-invalid={Boolean(errors.load)}
              placeholder="e.g. 40 bags of cement and 20 lengths of rebar, about 2 tonnes" className={`${field} h-auto py-3`} />{err("load")}</label>
          <label className="mt-3 flex items-center gap-3">
            <input type="checkbox" checked={loadingHelp} onChange={(e) => setLoadingHelp(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--primary))]" />
            <span className="text-ink">I need help loading and unloading</span>
          </label>
        </section>
      )}

      <section className={panel} aria-labelledby="when-heading">
        <h2 id="when-heading" className="text-lg font-bold">When</h2>
        <label className="mt-3 block"><span className={label}>{kind === "boat" ? "Travel date" : "Ready to collect from"}</span>
          <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: "" })); }} aria-invalid={Boolean(errors.date)} className={field} />{err("date")}</label>
        <label className="mt-3 flex items-center gap-3">
          <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--primary))]" />
          <span className="text-ink">My dates are flexible{kind === "freight" ? " (often cheaper on scheduled sailings)" : ""}</span>
        </label>
      </section>

      <button className="h-14 w-full rounded-full bg-primary text-[1.0625rem] font-semibold text-primary-ink transition hover:brightness-110">Find operators</button>
      <p className="text-center text-sm">Nothing is booked until you agree a price with an operator.</p>
    </form>
  );
}

