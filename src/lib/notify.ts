import { createClient } from "@supabase/supabase-js";
import { buildAlert, type AlertKind } from "./email";
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
