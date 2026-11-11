import { createClient } from "@supabase/supabase-js";
import { buildNotice } from "./email";
import { pushToUsers } from "./push";
import { SUPABASE_URL } from "./supabase/env";
import { serviceBySlug } from "@/data/gateway";

/*
 * Gateway alerts. New requests go to the agency's staff on Island Connect and its contact email;
 * if the agency has neither, to Island Connect's administrators, who pass it on. Replies and
 * status changes go back to the person, by email and phone notification.
 */
const FROM = process.env.EMAIL_FROM ?? "Island Connect <noreply@islandconnect.cc>";
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://islandconnect.cc").replace(/\/$/, "");
const ready = () => Boolean(process.env.SUPABASE_SECRET_KEY && SUPABASE_URL);
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

async function mail(to: string[], n: Parameters<typeof buildNotice>[0]) {
  if (!to.length || !process.env.RESEND_API_KEY) return;
  const m = buildNotice(n);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: to.slice(0, 1), bcc: to.length > 1 ? to.slice(1, 25) : undefined, subject: m.subject, html: m.html, text: m.text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) console.error("Gateway alert failed:", res.status, await res.text().catch(() => ""));
}

async function emails(db: ReturnType<typeof admin>, ids: string[]) {
  const out: string[] = [];
  for (const id of ids.slice(0, 20)) { const { data } = await db.auth.admin.getUserById(id); if (data.user?.email) out.push(data.user.email); }
  return out;
}

export const STATUS_LABEL: Record<string, string> = {
  submitted: "Sent", received: "Received by the agency", in_review: "Being reviewed", needs_info: "More information needed",
  approved: "Approved", declined: "Declined", closed: "Closed",
};

/* A new request: tell the agency (or Island Connect's team). */
export async function notifyAgencyOfRequest(requestId: string) {
  if (!ready()) return;
  const db = admin();
  const { data: r } = await db.from("gateway_requests").select("id, reference, service_slug, kind, details, agency_id, agencies ( name, email )").eq("id", requestId).maybeSingle();
  if (!r) return;
  const ag = (Array.isArray(r.agencies) ? r.agencies[0] : r.agencies) as { name: string; email: string | null } | null;
  const { data: members } = await db.from("agency_members").select("user_id").eq("agency_id", r.agency_id);
  let to = await emails(db, (members ?? []).map((m) => m.user_id));
  if (ag?.email) to.push(ag.email);
  let forTeam = false;
  if (!to.length) {
    const { data: admins } = await db.from("profiles").select("id").eq("role", "admin");
    to = await emails(db, (admins ?? []).map((a) => a.id));
    forTeam = true;
  }
  const svc = serviceBySlug(r.service_slug);
  const d = (r.details ?? {}) as Record<string, string>;
  await mail([...new Set(to)], {
    subject: `${forTeam ? "[Pass to agency] " : ""}${svc?.title ?? "New request"} · ${r.reference}`,
    heading: svc?.title ?? "New request through Island Connect",
    lead: forTeam
      ? `${ag?.name ?? "An agency"} isn’t on Island Connect yet. Please pass this request on, or reply on the agency’s behalf.`
      : `A new ${r.kind} has been sent to ${ag?.name ?? "your agency"} through Island Connect. Open it to see the details and documents, and reply.`,
    lines: [["Reference", r.reference], ["From", d.full_name ?? ""], ["Lives in", d.country_now ?? ""], ["Type", r.kind]],
    link: `${site()}/agency/requests/${r.id}`, cta: "Open the request",
  });
}

/* A reply or a status change: tell the other side. */
export async function notifyRequestUpdate(requestId: string, fromAgency: boolean, text: string) {
  if (!ready()) return;
  const db = admin();
  const { data: r } = await db.from("gateway_requests").select("id, reference, user_id, status, country_code, service_slug, agency_id, agencies ( name, email )").eq("id", requestId).maybeSingle();
  if (!r) return;
  const ag = (Array.isArray(r.agencies) ? r.agencies[0] : r.agencies) as { name: string; email: string | null } | null;
  const svc = serviceBySlug(r.service_slug);
  if (fromAgency) {
    const link = `${site()}/${r.country_code}/gateway/requests/${r.id}`;
    await pushToUsers([r.user_id], { title: `${ag?.name ?? "The agency"} replied`, body: text.slice(0, 120), url: link, tag: `gw-${r.id}` });
    await mail(await emails(db, [r.user_id]), {
      subject: `Update on your request ${r.reference}`, heading: `${ag?.name ?? "The agency"} has updated your request`,
      lead: text.slice(0, 300), lines: [["Request", svc?.title ?? ""], ["Reference", r.reference], ["Status", STATUS_LABEL[r.status] ?? r.status]],
      link, cta: "Open your request",
    });
  } else {
    const { data: members } = await db.from("agency_members").select("user_id").eq("agency_id", r.agency_id);
    let to = await emails(db, (members ?? []).map((m) => m.user_id));
    if (!to.length) { const { data: admins } = await db.from("profiles").select("id").eq("role", "admin"); to = await emails(db, (admins ?? []).map((a) => a.id)); }
    await mail(to, {
      subject: `New message on ${r.reference}`, heading: "The applicant has replied", lead: text.slice(0, 300),
      lines: [["Request", svc?.title ?? ""], ["Reference", r.reference]], link: `${site()}/agency/requests/${r.id}`, cta: "Open the request",
    });
  }
}
