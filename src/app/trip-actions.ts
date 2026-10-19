"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getViewer, requireAdmin } from "@/lib/auth";
import { toE164International } from "@/lib/phone";
import { fareAmount, officialFare } from "@/data/fares";
import { landmarks } from "@/data/landmarks";
import { notifyCustomerOfAcceptance, notifyCustomerOfQuote, notifyOperatorOfBooking, notifyOperatorsOfRequest, notifyTripMessage } from "@/lib/notify";
import { supabaseForRequest } from "@/lib/supabase/server";

const KINDS = ["taxi", "airport", "group", "boat", "haulage", "freight"] as const;

/* ---------- Customers ---------- */

export interface TripPayload {
  country: string; kind: (typeof KINDS)[number]; from: string; to: string; pickup: string; dropoff: string;
  travel_at?: string | null; passengers?: number | null; details?: string | null; cross_border?: boolean; contact_phone?: string; contact_code?: string; pickup_id?: string; dropoff_id?: string;
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
  const supabase = await supabaseForRequest();
  // Official fare, worked out here on the server from the published tables (never taken from the browser).
  let fixed: { fixed_fare_xcd: number; fare_source: string } | null = null;
  if ((d.kind === "taxi" || d.kind === "airport") && d.pickup_id && d.dropoff_id) {
    const a = landmarks.find((l) => l.id === d.pickup_id && l.countryCode === d.country);
    const b = landmarks.find((l) => l.id === d.dropoff_id && l.countryCode === d.country);
    const f = a && b ? officialFare(a, b) : null;
    if (f) fixed = { fixed_fare_xcd: fareAmount(f, d.passengers ?? 1), fare_source: `${f.table.source}, ${f.table.sourceDate}` };
  }
  const { contact_code: _code, pickup_id: _a, dropoff_id: _b, ...trip } = d;
  void _code; void _a; void _b;
  const { data, error } = await supabase.rpc("create_trip_request", { p: { ...trip, travel_at: d.travel_at || null, contact_phone: phone, ...(fixed ?? {}) } });
  if (error) return { error: error.message };
  await notifyOperatorsOfRequest(String(data));
  return { url: `/${d.country}/trips/${data}` };
}

const idForm = z.object({ id: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/) });

export async function acceptQuoteAction(form: FormData) {
  const d = idForm.extend({ trip: z.string().uuid() }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("accept_trip_quote", { p_quote: d.id });
  if (!error) await notifyOperatorOfBooking(d.id);
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
  if (!error) await notifyCustomerOfQuote(String(data));
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
  if (!error) await notifyCustomerOfAcceptance(String(data));
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
  if (!error) await notifyTripMessage(d.data.id, viewer.id, d.data.body);
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
    licence: z.string().trim().min(3, "Add your licence or permit numbers").max(500), vehicles: z.string().trim().min(3, "Describe your vehicle or boat").max(500),
    insurance: z.string().trim().max(500).optional(),
  }).safeParse(Object.fromEntries(form));
  if (!d.success) return { error: d.error.issues[0].message };
  const kinds = form.getAll("kinds").map(String).filter((k) => (KINDS as readonly string[]).includes(k));
  if (!kinds.length) return { error: "Choose at least one kind of trip" };
  const documents = form.getAll("documents").map(String).filter((p) => p.startsWith(`${viewer.id}/`)).slice(0, 5);
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
    licence: d.data.licence, vehicles: d.data.vehicles, insurance: d.data.insurance ?? "", documents,
  } });
  if (error) return { error: error.message };
  revalidatePath("/admin/operators");
  redirect(`/${d.data.country}/dashboard/${(data as { slug: string }).slug}?tab=trips&applied=1`);
}
