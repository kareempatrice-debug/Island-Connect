"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getViewer, requireAdmin } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { notifyCustomerOfQuote, notifyOperatorOfBooking, notifyOperatorsOfRequest } from "@/lib/notify";
import { supabaseForRequest } from "@/lib/supabase/server";

const KINDS = ["taxi", "airport", "group", "boat", "haulage", "freight"] as const;

/* ---------- Customers ---------- */

export interface TripPayload {
  country: string; kind: (typeof KINDS)[number]; from: string; to: string; pickup: string; dropoff: string;
  travel_at?: string | null; passengers?: number | null; details?: string | null; cross_border?: boolean; contact_phone?: string;
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
});

/** Sends a trip request to every approved operator who can take it. Returns the trip page to open. */
export async function createTripRequestAction(input: TripPayload): Promise<{ url?: string; error?: string; signIn?: string }> {
  const parsed = payload.safeParse(input);
  if (!parsed.success) return { error: "Some trip details are missing." };
  const d = parsed.data;
  if (!(await getViewer())) return { signIn: `/join?mode=sign-in&next=${encodeURIComponent(`/${d.country}/ride`)}` };
  let phone: string | null = null;
  try {
    phone = toE164(d.contact_phone ?? "", d.country === "vc" ? "+1784" : "+1473");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!phone) return { error: "Add a phone or WhatsApp number so the operator you choose can reach you." };
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("create_trip_request", { p: { ...d, travel_at: d.travel_at || null, contact_phone: phone } });
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
  redirect(`/${d.country}/trips/${d.trip}${error ? `?error=${encodeURIComponent(error.message)}` : "?booked=1"}`);
}

export async function cancelTripAction(form: FormData) {
  const d = idForm.parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("cancel_trip_request", { p_request: d.id });
  revalidatePath(`/${d.country}/trips`);
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
  redirect(`${back}&${error ? `error=${encodeURIComponent(error.message)}` : "quoted=1"}`);
}

export async function completeTripAction(form: FormData) {
  const d = z.object({ id: z.string().uuid(), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("complete_trip", { p_request: d.id });
  const back = `/${d.country}/dashboard/${d.slug}?tab=trips`;
  revalidatePath(back);
  redirect(`${back}&${error ? `error=${encodeURIComponent(error.message)}` : "completed=1"}`);
}

/* ---------- Admin ---------- */

export async function reviewOperatorAction(form: FormData) {
  await requireAdmin();
  const d = z.object({ id: z.string().uuid(), approve: z.enum(["yes", "no"]), note: z.string().max(300).optional() }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_operator", { p_business: d.id, p_approve: d.approve === "yes", p_note: d.note || null });
  revalidatePath("/admin/operators");
  redirect(`/admin/operators${error ? `?error=${encodeURIComponent(error.message)}` : "?done=1"}`);
}

export async function setFounderAction(form: FormData) {
  await requireAdmin();
  const d = z.object({ id: z.string().uuid(), value: z.enum(["on", "off"]) }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  await supabase.from("businesses").update({ founder_owned: d.value === "on" }).eq("id", d.id);
  revalidatePath("/", "layout");
  redirect(`/admin/listings/${d.id}?done=founder`);
}
