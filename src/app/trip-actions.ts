"use server";

import { after } from "next/server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getViewer, requireAdmin } from "@/lib/auth";
import { toE164International } from "@/lib/phone";
import { estimateFare } from "@/lib/estimate";
import { cleanPlace } from "@/lib/place-text";
import { cookies } from "next/headers";
import { fareAmount, officialFare, officialFareForText } from "@/data/fares";
import { landmarks } from "@/data/landmarks";
import { handleDispatchEvent, notifyCustomerOfAcceptance, notifyCustomerOfQuote, notifyOperatorOfBooking, notifyTripMessage } from "@/lib/notify";
import { supabaseForRequest } from "@/lib/supabase/server";

const KINDS = ["taxi", "airport", "group", "boat", "haulage", "freight"] as const;

/* ---------- Customers ---------- */

export interface TripPayload {
  country: string; kind: (typeof KINDS)[number]; from: string; to: string; pickup: string; dropoff: string;
  travel_at?: string | null; passengers?: number | null; details?: string | null; cross_border?: boolean; contact_phone?: string; contact_code?: string; pickup_id?: string; dropoff_id?: string;
  pickup_lat?: number | null; pickup_lng?: number | null; dropoff_lat?: number | null; dropoff_lng?: number | null;
  distance_km?: number | null; duration_min?: number | null; rider_name?: string | null; rider_phone?: string | null; rider_code?: string; rider_kind?: "adult" | "senior" | "teen" | null; book_mode?: "quotes" | "instant";
}

const payload = z.object({
  country: z.string().regex(/^[a-z]{2}$/),
  kind: z.enum(KINDS),
  from: z.string().trim().min(2).max(120),
  to: z.string().trim().min(2).max(120),
  pickup: z.string().trim().min(2).max(160),
  dropoff: z.string().trim().min(2).max(160),
  travel_at: z.string().max(40).nullish(),
  passengers: z.number().int().min(1).max(60).nullish(),
  details: z.string().max(1000).nullish(),
  cross_border: z.boolean().optional(),
  contact_phone: z.string().max(30).optional(),
  contact_code: z.string().regex(/^(\+\d{1,4}|other)$/).optional(),
  pickup_id: z.string().max(60).optional(),
  dropoff_id: z.string().max(60).optional(),
  pickup_lat: z.number().min(-90).max(90).nullish(), pickup_lng: z.number().min(-180).max(180).nullish(),
  dropoff_lat: z.number().min(-90).max(90).nullish(), dropoff_lng: z.number().min(-180).max(180).nullish(),
  distance_km: z.number().min(0).max(2000).nullish(), duration_min: z.number().int().min(0).max(5000).nullish(),
  rider_name: z.string().trim().max(80).nullish(), rider_phone: z.string().max(30).nullish(),
  rider_code: z.string().regex(/^(\+\d{1,4}|other)$/).optional(),
  rider_kind: z.enum(["adult", "senior", "teen"]).nullish(),
  book_mode: z.enum(["quotes", "instant"]).optional(),
});

/** Sends a trip request to every approved operator who can take it. Returns the trip page to open. */
export async function createTripRequestAction(input: TripPayload): Promise<{ url?: string; error?: string; signIn?: string }> {
  const parsed = payload.safeParse(input);
  if (!parsed.success) return { error: "Some trip details are missing." };
  const d = parsed.data;
  if (!(await getViewer())) return { signIn: `/join?mode=sign-in&next=${encodeURIComponent(`/${d.country}/ride`)}` };
  let phone: string | null = null;
  try {
    // Any country: visitors use the number they brought with them.
    phone = toE164International(d.contact_phone ?? "", d.contact_code ?? (d.country === "vc" ? "+1784" : "+1473"));
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!phone) return { error: "Add a phone or WhatsApp number so the operator you choose can reach you." };
  // Booking for someone else: their name and number go to the driver once the trip is booked.
  let riderPhone: string | null = null;
  if (d.rider_name) {
    try {
      riderPhone = toE164International(d.rider_phone ?? "", d.rider_code ?? (d.country === "vc" ? "+1784" : "+1473"));
    } catch (e) {
      return { error: `Rider’s number: ${(e as Error).message}` };
    }
    if (!riderPhone) return { error: "Add the rider’s phone number so the driver can reach them." };
  }
  const supabase = await supabaseForRequest();
  // Official fare, worked out here on the server from the published tables (never taken from the browser).
  let fixed: { fixed_fare_xcd: number; fare_source: string } | null = null;
  if (d.kind === "taxi" || d.kind === "airport") {
    const a = landmarks.find((l) => l.id === d.pickup_id && l.countryCode === d.country);
    const b = landmarks.find((l) => l.id === d.dropoff_id && l.countryCode === d.country);
    const f = (a && b ? officialFare(a, b) : null) ?? officialFareForText(d.country, d.pickup, d.dropoff);
    if (f) fixed = { fixed_fare_xcd: fareAmount(f, d.passengers ?? 1), fare_source: `${f.table.source}, ${f.table.sourceDate}` };
  }
  const { contact_code: _code, pickup_id: _a, dropoff_id: _b, rider_code: _rc, rider_phone: _rp, rider_kind: riderKind, book_mode: bookMode, ...trip } = d;
  void _code; void _a; void _b; void _rc; void _rp;
  // No official fare: record the estimate the customer saw, so the driver knows what they expect.
  const est = !fixed && (d.kind === "taxi" || d.kind === "airport") ? estimateFare(d.country, d.distance_km, d.passengers ?? 1) : null;
  const partner = (await cookies()).get("ic_partner")?.value ?? null;
  trip.pickup = cleanPlace(trip.pickup) || trip.pickup;
  trip.dropoff = cleanPlace(trip.dropoff) || trip.dropoff;
  const { data, error } = await supabase.rpc("create_trip_request", { p: { ...trip, travel_at: d.travel_at || null, contact_phone: phone, rider_phone: riderPhone, ...(fixed ?? {}),
    ...(est ? { estimate_low_xcd: est.low, estimate_high_xcd: est.high } : {}), partner_code: partner } });
  if (!error && riderKind && d.rider_name) await supabase.rpc("set_rider_kind", { p_request: data, p_kind: riderKind });
  if (error) return { error: error.message };
  // Taxi rides with a price go to the nearest online driver first (see the dispatch migration);
  // anything else, or if nobody is online nearby, alerts every eligible driver.
  // Routes without an official fare only use instant matching if the customer chose it; otherwise drivers send prices.
  const { data: dispatch } = await supabase.rpc("start_dispatch", { p_request: data, p_instant: bookMode === "instant" });
  after(() => handleDispatchEvent(dispatch ?? { event: "broadcast" }, String(data)));
  return { url: `/${d.country}/trips/${data}` };
}

const idForm = z.object({ id: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/) });

export async function acceptQuoteAction(form: FormData) {
  const d = idForm.extend({ trip: z.string().uuid() }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("accept_trip_quote", { p_quote: d.id });
  if (!error) after(() => notifyOperatorOfBooking(d.id));
  revalidatePath(`/${d.country}/trips/${d.trip}`);
  revalidateTag("listings");
  redirect(`/${d.country}/trips/${d.trip}${error ? `?error=${encodeURIComponent(error.message)}` : "?booked=1"}`);
}

export async function cancelTripAction(form: FormData) {
  const d = idForm.parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("cancel_trip_request", { p_request: d.id });
  revalidatePath(`/${d.country}/trips`);
  revalidateTag("listings");
  redirect(`/${d.country}/trips/${d.id}${error ? `?error=${encodeURIComponent(error.message)}` : ""}`);
}

/* ---------- Operators ---------- */

const apply = z.object({
  businessId: z.string().uuid(),
  country: z.string().regex(/^[a-z]{2}$/),
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  licence: z.string().trim().min(3, "Describe your licence or permit").max(500),
  vehicles: z.string().trim().min(3, "Describe your vehicles or vessels").max(500),
  insurance: z.string().trim().max(500),
});

export async function applyOperatorAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = apply.safeParse(Object.fromEntries(form));
  const kinds = form.getAll("kinds").map(String).filter((k) => (KINDS as readonly string[]).includes(k));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!kinds.length) return { error: "Choose at least one kind of trip" };
  const d = parsed.data;
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("apply_operator", { p_business: d.businessId, p: { kinds, licence: d.licence, vehicles: d.vehicles, insurance: d.insurance } });
  if (error) return { error: error.message };
  revalidatePath(`/${d.country}/dashboard/${d.slug}`);
  revalidateTag("listings");
  return { message: "Application sent. We’ll check your details and email you when you’re approved." };
}

const quote = z.object({
  request: z.string().uuid(), businessId: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  amount: z.coerce.number().positive("Enter a price").max(999999), includes: z.string().trim().max(500), hours: z.coerce.number().int().min(1).max(168),
});

export async function sendQuoteAction(form: FormData) {
  const parsed = quote.safeParse(Object.fromEntries(form));
  const back = `/${String(form.get("country"))}/dashboard/${String(form.get("slug"))}?tab=trips`;
  if (!parsed.success) redirect(`${back}&error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const d = parsed.data;
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("send_trip_quote", { p_request: d.request, p_business: d.businessId, p_amount: d.amount, p_includes: d.includes, p_valid_hours: d.hours });
  if (!error) after(() => notifyCustomerOfQuote(String(data)));
  revalidatePath(back);
  revalidateTag("listings");
  redirect(`${back}&${error ? `error=${encodeURIComponent(error.message)}` : "quoted=1"}`);
}

export async function completeTripAction(form: FormData) {
  const d = z.object({ id: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("complete_trip", { p_request: d.id });
  const back = `/${d.country}/dashboard/${d.slug}?tab=trips`;
  revalidatePath(back);
  revalidateTag("listings");
  redirect(`${back}&${error ? `error=${encodeURIComponent(error.message)}` : "completed=1"}`);
}

/* ---------- Admin ---------- */

export async function reviewOperatorAction(form: FormData) {
  await requireAdmin();
  const d = z.object({ id: z.string().uuid(), approve: z.enum(["yes", "no"]), note: z.string().max(300).optional() }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_operator", { p_business: d.id, p_approve: d.approve === "yes", p_note: d.note || null });
  revalidatePath("/admin/operators");
  revalidateTag("listings");
  redirect(`/admin/operators${error ? `?error=${encodeURIComponent(error.message)}` : "?done=1"}`);
}

export async function setFounderAction(form: FormData) {
  await requireAdmin();
  const d = z.object({ id: z.string().uuid(), value: z.enum(["on", "off"]) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  await supabase.from("businesses").update({ founder_owned: d.value === "on" }).eq("id", d.id);
  revalidatePath("/", "layout");
  revalidateTag("listings");
  redirect(`/admin/listings/${d.id}?done=founder`);
}

const setOp = z.object({ id: z.string().uuid(), note: z.string().trim().max(300).optional() });

/** Admin: make a listing a transport operator directly (or change its trip types). */
export async function adminSetOperatorAction(form: FormData) {
  await requireAdmin();
  const d = setOp.parse(Object.fromEntries(form));
  const kinds = form.getAll("kinds").map(String).filter((k) => (KINDS as readonly string[]).includes(k));
  const back = `/admin/listings/${d.id}`;
  if (!kinds.length) redirect(`${back}?error=${encodeURIComponent("Choose at least one kind of trip")}#operator`);
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_set_operator", { p_business: d.id, p_kinds: kinds, p_note: d.note || null });
  revalidatePath("/admin/operators");
  redirect(`${back}?${error ? `error=${encodeURIComponent(error.message)}` : "done=operator"}#operator`);
}

/** Admin: stop a listing receiving trip requests. */
export async function adminRemoveOperatorAction(form: FormData) {
  await requireAdmin();
  const d = setOp.parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_operator", { p_business: d.id, p_approve: false, p_note: "Withdrawn by admin" });
  revalidatePath("/admin/operators");
  redirect(`/admin/listings/${d.id}?${error ? `error=${encodeURIComponent(error.message)}` : "done=operator-removed"}#operator`);
}

export async function approveOperatorAction(form: FormData) { form.set("approve", "yes"); return reviewOperatorAction(form); }
export async function declineOperatorAction(form: FormData) { form.set("approve", "no"); return reviewOperatorAction(form); }


/* ---------- Instant booking at the official fare ---------- */
export async function acceptFixedFareAction(form: FormData) {
  const d = z.object({ request: z.string().uuid(), businessId: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("accept_fixed_fare", { p_request: d.request, p_business: d.businessId });
  if (!error) after(() => notifyCustomerOfAcceptance(String(data)));
  const back = `/${d.country}/dashboard/${d.slug}?tab=trips`;
  revalidatePath(back);
  redirect(`${back}&${error ? `error=${encodeURIComponent(error.message)}` : "accepted=1"}`);
}

/* ---------- Trip chat ---------- */
export async function sendTripMessageAction(form: FormData) {
  const d = z.object({ id: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), body: z.string().trim().min(1, "Type a message").max(2000) }).safeParse(Object.fromEntries(form));
  const id = String(form.get("id")); const country = String(form.get("country"));
  const page = `/${country}/trips/${id}/chat`;
  if (!d.success) redirect(`${page}?error=${encodeURIComponent(d.error.issues[0].message)}`);
  const viewer = await getViewer();
  if (!viewer) redirect(`/join?mode=sign-in&next=${encodeURIComponent(page)}`);
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("send_trip_message", { p_request: d.data.id, p_body: d.data.body });
  if (!error) after(() => notifyTripMessage(d.data.id, viewer.id, d.data.body));
  revalidatePath(page);
  redirect(`${page}${error ? `?error=${encodeURIComponent(error.message)}` : ""}#latest`);
}

/* ---------- One-step driver and operator sign-up ---------- */
export async function applyAsDriverAction(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." };
  const d = z.object({
    country: z.string().regex(/^[a-z]{2}$/), providerType: z.enum(["individual", "business"]),
    name: z.string().trim().min(2, "Enter your name").max(120), island: z.string().regex(/^[a-z0-9-]{2,40}$/), area: z.string().trim().max(120).optional(),
    phone: z.string().max(30), whatsapp: z.string().max(30).optional(), whatsappSame: z.string().optional(),
    licence: z.string().trim().min(3, "Add your licence and permit numbers").max(500), vehicles: z.string().trim().min(3, "Say what you drive or sail, e.g. Toyota Noah, 7 seats").max(500),
    insurance: z.string().trim().min(3, "Add your insurer and type of cover").max(500),
  }).safeParse(Object.fromEntries(form));
  if (!d.success) return { error: d.error.issues[0].message };
  const kinds = form.getAll("kinds").map(String).filter((k) => (KINDS as readonly string[]).includes(k));
  if (!kinds.length) return { error: "Choose at least one kind of trip" };
  // Documents with their expiry dates; the database checks the right set for the work chosen.
  let docs: { type: string; path: string; expires_on: string }[] = [];
  try { docs = JSON.parse(String(form.get("docs") ?? "[]")); } catch { docs = []; }
  docs = docs.filter((x) => typeof x?.path === "string" && x.path.startsWith(`${viewer.id}/`)).slice(0, 12);
  let phone: string | null, whatsapp: string | null;
  try {
    const code = d.data.country === "vc" ? "+1784" : "+1473";
    phone = toE164International(d.data.phone, code);
    whatsapp = d.data.whatsappSame ? phone : toE164International(d.data.whatsapp ?? "", code);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!phone) return { error: "Add a phone number customers can reach you on" };
  const label = kinds.map((k) => ({ taxi: "Taxi", airport: "Airport transfers", group: "Minivan and groups", boat: "Boat and water taxi", haulage: "Trucking and haulage", freight: "Freight" })[k]).join(", ");
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("apply_as_driver", { p: {
    country: d.data.country, island: d.data.island, area: d.data.area ?? "", name: d.data.name, provider_type: d.data.providerType,
    tagline: `${label}${d.data.area ? ` from ${d.data.area}` : ""}`.slice(0, 160), phone, whatsapp, kinds,
    docs, confirm_passenger: form.get("confirmPassenger") === "on", confirm_goods: form.get("confirmGoods") === "on",
    licence: d.data.licence, vehicles: d.data.vehicles, insurance: d.data.insurance,
  } });
  if (error) return { error: error.message };
  if (form.get("whatsappAlerts")) await supabase.rpc("set_whatsapp_alerts", { p_business: (data as { id: string }).id, p_on: true });
  revalidatePath("/admin/operators");
  redirect(`/${d.data.country}/dashboard/${(data as { slug: string }).slug}?tab=trips&applied=1`);
}

/* ---------- Driver account in one step (no waiting for a confirmation email) ---------- */
export async function createDriverAccountAction(_: FormState, form: FormData): Promise<FormState> {
  const d = z.object({
    country: z.string().regex(/^[a-z]{2}$/),
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(8, "Choose a password of at least 8 characters").max(72),
  }).safeParse(Object.fromEntries(form));
  if (!d.success) return { error: d.error.issues[0].message };
  const { country, name, email, password } = d.data;
  const next = `/${country}/ride/operate/apply`;
  const supabase = await supabaseForRequest();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (secret) {
    // Drivers are checked by hand (licence photos) before they can take trips, so we skip the
    // email round-trip and sign them straight in. Their address is still used for alerts.
    const { createClient } = await import("@supabase/supabase-js");
    const { SUPABASE_URL } = await import("@/lib/supabase/env");
    const admin = createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, joined_as: "operator" } });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) return { error: "There’s already an account with that email. Tap “I already have an account” to sign in." };
      return { error: "Your account couldn’t be created. Please try again." };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: "Your account was created. Please sign in to continue." };
    redirect(next);
  }
  // Without the server key, fall back to the normal sign-up with a confirmation email.
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, joined_as: "operator" }, emailRedirectTo: `${site}/auth/callback?next=${encodeURIComponent(next)}` } });
  if (error) return { error: error.message };
  return { message: "Check your email and tap the link to continue your application." };
}


/* Driver chooses whether new trip requests also arrive on WhatsApp. */
export async function setWhatsAppAlertsAction(form: FormData) {
  const d = z.object({ businessId: z.string().uuid(), on: z.enum(["on", "off"]), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  await supabase.rpc("set_whatsapp_alerts", { p_business: d.businessId, p_on: d.on === "on" });
  const back = `/${d.country}/dashboard/${d.slug}?tab=trips`;
  revalidatePath(back);
  redirect(back);
}


/* The driver answers a ride offer (accept or decline). */
export async function respondToOfferAction(offerId: string, accept: boolean): Promise<{ error?: string; url?: string }> {
  const supabase = await supabaseForRequest();
  const { data: offer } = await supabase.from("trip_offers").select("request_id, business_id, businesses ( slug ), trip_requests ( country_code )").eq("id", offerId).maybeSingle();
  if (!offer) return { error: "This offer is no longer available." };
  const { data, error } = await supabase.rpc("respond_to_offer", { p_offer: offerId, p_accept: accept });
  if (error) return { error: error.message };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const o = offer as any;
  const country = o.trip_requests?.country_code ?? "gd";
  if (accept) {
    const { data: req } = await supabase.from("trip_requests").select("accepted_quote_id").eq("id", o.request_id).maybeSingle();
    if (req?.accepted_quote_id) after(() => notifyCustomerOfAcceptance(String(req.accepted_quote_id)));
    return { url: `/${country}/dashboard/${o.businesses?.slug}?tab=trips&accepted=1` };
  }
  after(() => handleDispatchEvent(data, o.request_id));
  return { url: `/${country}/dashboard/${o.businesses?.slug}?tab=trips` };
}


/* The driver's first name and car, shown to their customer and on shared trips. */
export async function setVehicleAction(form: FormData) {
  const d = z.object({ businessId: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
    driver: z.string().max(40), make: z.string().max(40), model: z.string().max(40), colour: z.string().max(30), plate: z.string().max(15) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("set_vehicle_details", { p_business: d.businessId, p_driver: d.driver, p_make: d.make, p_model: d.model, p_colour: d.colour, p_plate: d.plate });
  const back = `/${d.country}/dashboard/${d.slug}?tab=trips`;
  revalidatePath(back);
  redirect(`${back}&${error ? `error=${encodeURIComponent(error.message)}` : "vehicle=1"}`);
}

/* A driver uploads a document or a renewal; Island Connect checks it before it counts. */
export async function addOperatorDocumentAction(input: { businessId: string; type: string; path: string; expires: string | null }): Promise<{ ok?: boolean; error?: string }> {
  const d = z.object({ businessId: z.string().uuid(), type: z.string().regex(/^[a-z_]{3,30}$/), path: z.string().max(300), expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }).safeParse(input);
  if (!d.success) return { error: "Add the expiry date shown on the document." };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("add_operator_document", { p_business: d.data.businessId, p_type: d.data.type, p_path: d.data.path, p_expires: d.data.expires });
  if (error) return { error: error.message };
  revalidatePath("/[country]/dashboard/[slug]", "page");
  revalidatePath("/admin/operators");
  return { ok: true };
}
