import { createClient } from "@supabase/supabase-js";
import { buildAlert, buildNotice, type AlertKind } from "./email";
import { SUPABASE_URL } from "./supabase/env";

/*
 * Enquiry alerts by email, sent through Resend.
 *
 * Server-only. Finding who to email needs the Supabase secret key, because
 * account email addresses are never readable by other users. Both keys live
 * only in Netlify's secret settings and never reach the browser:
 *   RESEND_API_KEY        Resend > API Keys (Sending access)
 *   SUPABASE_SECRET_KEY   Supabase > Settings > API Keys > Secret key
 * If either is missing, alerts are skipped and everything else works as before.
 * A failed alert never stops a message from being sent.
 */
const FROM = process.env.EMAIL_FROM ?? "Island Connect <noreply@islandconnect.cc>";

export function alertsConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.SUPABASE_SECRET_KEY && SUPABASE_URL);
}

function admin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function emailOf(db: ReturnType<typeof admin>, userId: string) {
  const { data } = await db.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function send(to: string[], kind: AlertKind, businessName: string, subject: string, preview: string, link: string) {
  if (!to.length) return;
  const mail = buildAlert({ kind, businessName, subject, preview, link });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject: mail.subject, html: mail.html, text: mail.text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) console.error("Enquiry alert failed:", res.status, await res.text().catch(() => ""));
}

/** Email the right people after a message is posted in an enquiry. */
export async function notifyEnquiryMessage(enquiryId: string, senderId: string, body: string, isNew: boolean) {
  if (!alertsConfigured()) return;
  try {
    const db = admin();
    const { data: e } = await db
      .from("enquiries")
      .select("id, subject, customer_id, business_id, businesses ( name, business_locations ( country_code, is_primary ) )")
      .eq("id", enquiryId)
      .maybeSingle();
    if (!e) return;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const biz = e.businesses as any;
    const country = (biz?.business_locations?.find((l: any) => l.is_primary) ?? biz?.business_locations?.[0])?.country_code ?? "gd";
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://islandconnect.cc").replace(/\/$/, "");
    const link = `${site}/${country}/messages/${e.id}`;

    if (senderId === e.customer_id) {
      // Customer wrote: tell the business's team.
      const { data: members } = await db.from("business_members").select("user_id").eq("business_id", e.business_id);
      const to = (await Promise.all((members ?? []).map((m) => emailOf(db, m.user_id)))).filter((x): x is string => Boolean(x));
      await send(to, isNew ? "new_enquiry" : "reply_to_business", biz?.name ?? "your business", e.subject, body, link);
    } else {
      // Business wrote: tell the customer.
      const to = await emailOf(db, e.customer_id);
      if (to) await send([to], "reply_to_customer", biz?.name ?? "The business", e.subject, body, link);
    }
  } catch (err) {
    console.error("Enquiry alert error:", err);
  }
}

/* ---------- Trip alerts ---------- */

export const TRIP_LABEL: Record<string, string> = {
  taxi: "Taxi", airport: "Airport transfer", group: "Minivan or group", boat: "Boat or water taxi", haulage: "Trucking and haulage", freight: "Freight",
};

async function mail(to: string[], n: Parameters<typeof buildNotice>[0]) {
  if (!to.length) return;
  const m = buildNotice(n);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: to.slice(0, 1), bcc: to.length > 1 ? to.slice(1, 25) : undefined, subject: m.subject, html: m.html, text: m.text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) console.error("Trip alert failed:", res.status, await res.text().catch(() => ""));
}

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://islandconnect.cc").replace(/\/$/, "");
const when = (t: string | null) => (t ? new Date(t).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Grenada" }) : "As soon as possible");

/** A new request: tell approved operators who can take it (their emails are bcc'd, never shown to each other). */
export async function notifyOperatorsOfRequest(requestId: string) {
  if (!alertsConfigured()) return;
  try {
    const db = admin();
    const { data: r } = await db.from("trip_requests").select("*").eq("id", requestId).maybeSingle();
    if (!r) return;
    const { data: ops } = await db.from("operator_profiles").select("business_id, kinds, businesses ( slug, listing_status )").eq("status", "approved").contains("kinds", [r.kind]);
    const ids: string[] = [];
    for (const o of ops ?? []) {
      const { data: ok } = await db.rpc("operator_can_serve", { p_business: o.business_id, p_country: r.country_code, p_kind: r.kind });
      if (ok) ids.push(o.business_id);
    }
    if (!ids.length) return;
    const { data: members } = await db.from("business_members").select("user_id, business_id, businesses ( slug )").in("business_id", ids);
    const to = (await Promise.all((members ?? []).filter((m) => m.user_id !== r.customer_id).map((m) => emailOf(db, m.user_id)))).filter((x): x is string => Boolean(x));
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const slug = (members?.[0] as any)?.businesses?.slug;
    await mail([...new Set(to)], {
      subject: `New ${TRIP_LABEL[r.kind].toLowerCase()} request: ${r.pickup} to ${r.dropoff}`,
      heading: `New ${TRIP_LABEL[r.kind].toLowerCase()} request`,
      lead: "A customer is asking for a price. The first good quote usually wins, so reply from your dashboard.",
      lines: [["From", `${r.pickup}, ${r.from_place}`], ["To", `${r.dropoff}, ${r.to_place}`], ["When", when(r.travel_at)], ...(r.passengers ? [["Passengers", String(r.passengers)] as [string, string]] : [])],
      link: slug ? `${site()}/${r.country_code}/dashboard/${slug}?tab=trips` : `${site()}/${r.country_code}/account`,
      cta: "Send a quote",
    });
  } catch (e) {
    console.error("Trip alert error:", e);
  }
}

/** A quote arrived: tell the customer. */
export async function notifyCustomerOfQuote(quoteId: string) {
  if (!alertsConfigured()) return;
  try {
    const db = admin();
    const { data: q } = await db.from("trip_quotes").select("amount_xcd, includes, trip_requests!trip_quotes_request_id_fkey ( id, customer_id, country_code, kind, pickup, dropoff ), businesses ( name )").eq("id", quoteId).maybeSingle();
    const r = q?.trip_requests as any;
    if (!q || !r) return;
    const to = await emailOf(db, r.customer_id);
    if (!to) return;
    const biz = (q.businesses as any)?.name ?? "An operator";
    await mail([to], {
      subject: `${biz} quoted EC$${Number(q.amount_xcd).toFixed(2)} for your ${TRIP_LABEL[r.kind].toLowerCase()}`,
      heading: `You have a quote from ${biz}`,
      lead: "Compare it with any other quotes, then accept the one you want. Nothing is booked until you do.",
      lines: [["Price", `EC$${Number(q.amount_xcd).toFixed(2)}`], ...(q.includes ? [["Includes", q.includes] as [string, string]] : []), ["Trip", `${r.pickup} to ${r.dropoff}`]],
      link: `${site()}/${r.country_code}/trips/${r.id}`,
      cta: "See your quotes",
    });
  } catch (e) {
    console.error("Trip alert error:", e);
  }
}

/** The customer accepted: tell the operator's team. */
export async function notifyOperatorOfBooking(quoteId: string) {
  if (!alertsConfigured()) return;
  try {
    const db = admin();
    const { data: q } = await db.from("trip_quotes").select("business_id, amount_xcd, businesses ( slug ), trip_requests!trip_quotes_request_id_fkey ( id, country_code, kind, pickup, dropoff, from_place, to_place, travel_at, passengers )").eq("id", quoteId).maybeSingle();
    const r = q?.trip_requests as any;
    if (!q || !r) return;
    const { data: members } = await db.from("business_members").select("user_id").eq("business_id", q.business_id);
    const to = (await Promise.all((members ?? []).map((m) => emailOf(db, m.user_id)))).filter((x): x is string => Boolean(x));
    await mail(to, {
      subject: `Booked: ${r.pickup} to ${r.dropoff}`,
      heading: "Your quote was accepted",
      lead: "The trip is booked with you. Contact the customer through your dashboard to confirm the details.",
      lines: [["Price", `EC$${Number(q.amount_xcd).toFixed(2)}`], ["From", `${r.pickup}, ${r.from_place}`], ["To", `${r.dropoff}, ${r.to_place}`], ["When", when(r.travel_at)]],
      link: `${site()}/${r.country_code}/dashboard/${(q.businesses as any)?.slug}?tab=trips`,
      cta: "Open your trips",
    });
  } catch (e) {
    console.error("Trip alert error:", e);
  }
}
