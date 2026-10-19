import { createClient } from "@supabase/supabase-js";
import { buildAlert, buildNotice, type AlertKind } from "./email";
import { SUPABASE_URL } from "./supabase/env";
import { pushConfigured, pushToUsers } from "./push";

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
  // Requires SUPABASE_SECRET_KEY (checked by alertsConfigured / pushConfigured).
  return createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function emailOf(db: ReturnType<typeof admin>, userId: string) {
  const { data } = await db.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function send(to: string[], kind: AlertKind, businessName: string, subject: string, preview: string, link: string) {
  if (!to.length || !process.env.RESEND_API_KEY) return;
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
  if (!alertsConfigured() && !pushConfigured()) return;
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
      await pushToUsers((members ?? []).map((m) => m.user_id), { title: isNew ? `New enquiry: ${e.subject}` : `New message: ${e.subject}`, body: body.slice(0, 140), url: link, tag: `enquiry-${e.id}` });
    } else {
      // Business wrote: tell the customer.
      const to = await emailOf(db, e.customer_id);
      if (to) await send([to], "reply_to_customer", biz?.name ?? "The business", e.subject, body, link);
      await pushToUsers([e.customer_id], { title: `${biz?.name ?? "The business"} replied`, body: body.slice(0, 140), url: link, tag: `enquiry-${e.id}` });
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
  if (!to.length || !process.env.RESEND_API_KEY) return;
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
  if (!alertsConfigured() && !pushConfigured()) return;
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
    const tripsLink = slug ? `${site()}/${r.country_code}/dashboard/${slug}?tab=trips` : `${site()}/${r.country_code}/account`;
    const fixed = r.fixed_fare_xcd ? ` · EC$${Number(r.fixed_fare_xcd).toFixed(0)} official fare, first to accept` : "";
    await pushToUsers((members ?? []).filter((m) => m.user_id !== r.customer_id).map((m) => m.user_id), {
      title: r.fixed_fare_xcd ? `Ride available: EC$${Number(r.fixed_fare_xcd).toFixed(0)}` : `New ${TRIP_LABEL[r.kind].toLowerCase()} request`,
      body: `${r.pickup} to ${r.dropoff} · ${when(r.travel_at)}${fixed}`, url: tripsLink, tag: `trip-${r.id}`,
    });
    await mail([...new Set(to)], {
      subject: `New ${TRIP_LABEL[r.kind].toLowerCase()} request: ${r.pickup} to ${r.dropoff}`,
      heading: `New ${TRIP_LABEL[r.kind].toLowerCase()} request`,
      lead: r.fixed_fare_xcd
        ? `This trip has an official fare of EC$${Number(r.fixed_fare_xcd).toFixed(2)}. The first approved driver to accept gets it.`
        : "A customer is asking for a price. The first good quote usually wins, so reply from your dashboard.",
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
  if (!alertsConfigured() && !pushConfigured()) return;
  try {
    const db = admin();
    const { data: q } = await db.from("trip_quotes").select("amount_xcd, includes, trip_requests!trip_quotes_request_id_fkey ( id, customer_id, country_code, kind, pickup, dropoff ), businesses ( name )").eq("id", quoteId).maybeSingle();
    const r = q?.trip_requests as any;
    if (!q || !r) return;
    const biz = (q.businesses as any)?.name ?? "An operator";
    await pushToUsers([r.customer_id], { title: `New quote: EC$${Number(q.amount_xcd).toFixed(2)}`, body: `${biz} for ${r.pickup} to ${r.dropoff}`, url: `${site()}/${r.country_code}/trips/${r.id}`, tag: `trip-${r.id}` });
    const to = await emailOf(db, r.customer_id);
    if (!to) return;
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
  if (!alertsConfigured() && !pushConfigured()) return;
  try {
    const db = admin();
    const { data: q } = await db.from("trip_quotes").select("business_id, amount_xcd, businesses ( slug ), trip_requests!trip_quotes_request_id_fkey ( id, country_code, kind, pickup, dropoff, from_place, to_place, travel_at, passengers )").eq("id", quoteId).maybeSingle();
    const r = q?.trip_requests as any;
    if (!q || !r) return;
    const { data: members } = await db.from("business_members").select("user_id").eq("business_id", q.business_id);
    const to = (await Promise.all((members ?? []).map((m) => emailOf(db, m.user_id)))).filter((x): x is string => Boolean(x));
    await pushToUsers((members ?? []).map((m) => m.user_id), { title: "Your quote was accepted", body: `${r.pickup} to ${r.dropoff} · ${when(r.travel_at)}`, url: `${site()}/${r.country_code}/dashboard/${(q.businesses as any)?.slug}?tab=trips`, tag: `trip-${r.id}` });
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


/** A driver accepted a fixed-fare trip: tell the customer. */
export async function notifyCustomerOfAcceptance(quoteId: string) {
  if (!alertsConfigured() && !pushConfigured()) return;
  try {
    const db = admin();
    const { data: q } = await db.from("trip_quotes").select("amount_xcd, businesses ( name ), trip_requests!trip_quotes_request_id_fkey ( id, customer_id, country_code, pickup, dropoff )").eq("id", quoteId).maybeSingle();
    const r = q?.trip_requests as any;
    if (!q || !r) return;
    const biz = (q.businesses as any)?.name ?? "A driver";
    const url = `${site()}/${r.country_code}/trips/${r.id}`;
    await pushToUsers([r.customer_id], { title: `${biz} is taking your trip`, body: `${r.pickup} to ${r.dropoff} · EC$${Number(q.amount_xcd).toFixed(2)}`, url, tag: `trip-${r.id}` });
    const to = await emailOf(db, r.customer_id);
    if (to) await mail([to], { subject: `${biz} accepted your trip`, heading: `${biz} is taking your trip`, lead: "Your driver has accepted at the official fare. They’ll contact you to confirm the pickup; you can also message them in the app.",
      lines: [["Fare", `EC$${Number(q.amount_xcd).toFixed(2)}`], ["Trip", `${r.pickup} to ${r.dropoff}`]], link: url, cta: "See your trip" });
  } catch (e) {
    console.error("Trip alert error:", e);
  }
}

/** New chat message on a booked trip: tell the other side. */
export async function notifyTripMessage(requestId: string, senderId: string, body: string) {
  if (!alertsConfigured() && !pushConfigured()) return;
  try {
    const db = admin();
    const { data: r } = await db.from("trip_requests").select("id, customer_id, country_code, pickup, dropoff, accepted_quote_id").eq("id", requestId).maybeSingle();
    if (!r?.accepted_quote_id) return;
    const { data: q } = await db.from("trip_quotes").select("business_id, businesses ( name )").eq("id", r.accepted_quote_id).maybeSingle();
    const { data: members } = await db.from("business_members").select("user_id").eq("business_id", q?.business_id ?? "");
    const fromCustomer = senderId === r.customer_id;
    const to = fromCustomer ? (members ?? []).map((m) => m.user_id) : [r.customer_id];
    const url = `${site()}/${r.country_code}/trips/${r.id}/chat`;
    const who = fromCustomer ? "Your customer" : ((q?.businesses as any)?.name ?? "Your driver");
    await pushToUsers(to, { title: `${who}: ${r.pickup} to ${r.dropoff}`, body: body.slice(0, 140), url, tag: `chat-${r.id}` });
    const emails = (await Promise.all(to.map((u) => emailOf(db, u)))).filter((x): x is string => Boolean(x));
    await mail(emails, { subject: `New message about your trip: ${r.pickup} to ${r.dropoff}`, heading: `New message from ${who.toLowerCase().startsWith("your") ? who.toLowerCase() : who}`,
      lead: body.length > 280 ? `${body.slice(0, 277)}…` : body, lines: [["Trip", `${r.pickup} to ${r.dropoff}`]], link: url, cta: "Reply in the app" });
  } catch (e) {
    console.error("Trip alert error:", e);
  }
}
