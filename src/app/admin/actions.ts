"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { requireAdmin } from "@/lib/auth";
import { getCountry } from "@/lib/data";
import { toE164 } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

const review = z.object({ id: z.string().uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(1000).optional().default("") });

export async function reviewBusinessAction(form: FormData) {
  await requireAdmin();
  const parsed = review.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/admin?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const d = parsed.data;
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_business", { p_business: d.id, p_approve: d.decision === "approve", p_note: d.note || null });
  revalidatePath("/admin");
  revalidateTag("listings");
  revalidatePath("/", "layout");
  revalidateTag("listings");
  // Never crash the page: show what happened instead.
  redirect(`/admin?${error ? `error=${encodeURIComponent(error.message)}` : `done=${d.decision === "approve" ? "approved" : "declined"}`}`);
}

export async function reviewClaimAction(form: FormData) {
  await requireAdmin();
  const parsed = review.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/admin?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const d = parsed.data;
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_claim", { p_claim: d.id, p_approve: d.decision === "approve", p_note: d.note || null });
  revalidatePath("/admin");
  revalidateTag("listings");
  revalidatePath("/", "layout");
  revalidateTag("listings");
  // Never crash the page: show what happened instead.
  redirect(`/admin?${error ? `error=${encodeURIComponent(error.message)}` : `done=${d.decision === "approve" ? "approved" : "declined"}`}`);
}

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/);
const listing = z.object({
  country: z.string().regex(/^[a-z]{2}$/),
  name: z.string().trim().min(2, "Enter the business name").max(120),
  categories: z.array(slug).min(1, "Choose at least one category").max(3, "Choose up to three categories"),
  island: slug,
  district: z.union([slug, z.literal("")]),
  landmark: z.string().trim().max(160),
  phone: z.string().max(30),
  whatsapp: z.string().max(30),
  email: z.union([z.string().trim().email("Enter a valid email address"), z.literal("")]),
  website: z.union([z.string().trim().url().startsWith("https://", "Website must start with https://"), z.literal("")]),
  tagline: z.string().trim().max(160),
  sourceUrl: z.string().trim().url("Add the link where you checked these details"),
  sourceNote: z.string().trim().max(500),
  sourceCheckedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Add the date you checked"),
});

export async function addListingAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = listing.safeParse({ ...Object.fromEntries(form), categories: form.getAll("categories") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const country = await getCountry(d.country);
  let phone: string | null, whatsapp: string | null;
  try {
    phone = toE164(d.phone, country?.diallingCode ?? "+1");
    whatsapp = toE164(d.whatsapp, country?.diallingCode ?? "+1");
  } catch (e) {
    return { error: (e as Error).message };
  }
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("admin_add_listing", { p: { ...d, phone, whatsapp } });
  if (error) return { error: error.message };
  redirect(`/admin/add-listing?country=${d.country}&added=${encodeURIComponent((data as { slug: string }).slug)}`);
}

/* ---------- Listing tools: edit, hide, publish, delete (all audited in the database) ---------- */

const editListing = z.object({
  id: z.string().uuid(),
  country: z.string().regex(/^[a-z]{2}$/),
  name: z.string().trim().min(2, "Enter the business name").max(120),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(4000),
  landmark: z.string().trim().max(160),
  phone: z.string().max(30),
  whatsapp: z.string().max(30),
  email: z.union([z.string().trim().email("Enter a valid email address"), z.literal("")]),
  website: z.union([z.string().trim().url("Enter a full web address").startsWith("https://", "Website must start with https://"), z.literal("")]),
});

export async function editListingAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = editListing.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, country: code, ...d } = parsed.data;
  const country = await getCountry(code);
  let phone: string | null, whatsapp: string | null;
  try {
    phone = toE164(d.phone, country?.diallingCode ?? "+1");
    whatsapp = toE164(d.whatsapp, country?.diallingCode ?? "+1");
  } catch (e) {
    return { error: (e as Error).message };
  }
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_edit_business", { p_business: id, p: { ...d, phone: phone ?? "", whatsapp: whatsapp ?? "" } });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidateTag("listings");
  return { message: "Saved. The listing is updated on the site." };
}

const statusChange = z.object({ id: z.string().uuid(), status: z.enum(["published", "suspended", "pending_review"]), back: z.string().startsWith("/admin").max(300) });

export async function setListingStatusAction(form: FormData) {
  await requireAdmin();
  const d = statusChange.parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_set_listing_status", { p_business: d.id, p_status: d.status, p_note: null });
  revalidatePath("/", "layout");
  revalidateTag("listings");
  const sep = d.back.includes("?") ? "&" : "?";
  redirect(`${d.back}${sep}${error ? `error=${encodeURIComponent(error.message)}` : `done=${d.status}`}`);
}

const removal = z.object({ id: z.string().uuid(), confirm: z.literal("DELETE", "Type DELETE to confirm"), reason: z.string().trim().max(300) });

export async function deleteListingAction(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = removal.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_delete_business", { p_business: parsed.data.id, p_reason: parsed.data.reason || null });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidateTag("listings");
  redirect("/admin/listings?done=deleted");
}

/* ---------- Hand a listing to its owner's account ---------- */
export async function assignOwnerAction(form: FormData) {
  await requireAdmin();
  const d = z.object({ id: z.string().uuid(), email: z.string().trim().email("Enter the owner’s email address") }).safeParse(Object.fromEntries(form));
  const id = String(form.get("id"));
  if (!d.success) redirect(`/admin/listings/${id}?error=${encodeURIComponent(d.error.issues[0].message)}#owner`);
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_assign_owner", { p_business: d.data.id, p_email: d.data.email });
  revalidateTag("listings");
  redirect(`/admin/listings/${id}?${error ? `error=${encodeURIComponent(error.message)}` : "done=owner"}#owner`);
}

/* One action per button, so the decision never depends on which button the browser reports. */
export async function approveBusinessAction(form: FormData) { form.set("decision", "approve"); return reviewBusinessAction(form); }
export async function rejectBusinessAction(form: FormData) { form.set("decision", "reject"); return reviewBusinessAction(form); }
export async function approveClaimAction(form: FormData) { form.set("decision", "approve"); return reviewClaimAction(form); }
export async function rejectClaimAction(form: FormData) { form.set("decision", "reject"); return reviewClaimAction(form); }

/* ---------- Verified badge ---------- */
export async function setVerifiedAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const on = form.get("value") === "on";
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_set_verified", { p_business: id, p_verified: on });
  revalidateTag("listings");
  redirect(`/admin/listings/${id}?${error ? `error=${encodeURIComponent(error.message)}` : `done=${on ? "verified" : "unverified"}`}`);
}

/* ---------- Admin team ---------- */
export async function setAdminAction(form: FormData) {
  await requireAdmin();
  const email = String(form.get("email") ?? "").trim().slice(0, 200);
  const on = form.get("value") !== "off";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect(`/admin/team?error=${encodeURIComponent("Enter a valid email address")}`);
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_set_admin", { p_email: email, p_admin: on });
  revalidatePath("/admin/team");
  redirect(`/admin/team?${error ? `error=${encodeURIComponent(error.message)}` : `done=${on ? "added" : "removed"}`}`);
}

/* ---------- Partners (villas, hotels, airport) ---------- */
export async function createPartnerAction(form: FormData) {
  await requireAdmin();
  const d = z.object({
    name: z.string().trim().min(2, "Add the partner’s name").max(120),
    kind: z.enum(["hotel", "villa", "airport", "port", "other"]),
    country: z.enum(["gd", "vc"]),
    landing: z.enum(["ride", "airport", "home"]),
    contact: z.string().trim().max(200).optional(),
  }).safeParse(Object.fromEntries(form));
  if (!d.success) redirect(`/admin/partners?error=${encodeURIComponent(d.error.issues[0].message)}`);
  const base = d.data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "partner";
  const supabase = await supabaseForRequest();
  let code = base, n = 1, error = null as { message: string } | null;
  do {
    ({ error } = await supabase.from("partners").insert({ code, name: d.data.name, kind: d.data.kind, country_code: d.data.country, landing: d.data.landing, contact: d.data.contact || null }));
    if (error && /duplicate|unique/i.test(error.message)) code = `${base}-${++n}`; else break;
  } while (n < 20);
  revalidatePath("/admin/partners");
  redirect(`/admin/partners?${error ? `error=${encodeURIComponent(error.message)}` : `done=${code}`}`);
}

export async function togglePartnerAction(form: FormData) {
  await requireAdmin();
  const supabase = await supabaseForRequest();
  await supabase.from("partners").update({ active: form.get("active") === "on" }).eq("id", String(form.get("id")));
  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}
