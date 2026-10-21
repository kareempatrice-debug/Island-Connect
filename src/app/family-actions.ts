"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { toE164International } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

const back = (country: string, q = "") => `/${country}/account/family${q}`;
const cc = (f: FormData) => (String(f.get("country")) === "vc" ? "vc" : "gd");

export async function addFamilyMemberAction(form: FormData) {
  const country = cc(form);
  if (!(await getViewer())) redirect(`/join?mode=sign-in&next=${encodeURIComponent(back(country))}`);
  const d = z.object({ name: z.string().trim().min(1, "Add their name").max(80), kind: z.enum(["adult", "senior", "teen"]), phone: z.string().max(30).optional(), code: z.string().max(6).optional() }).safeParse(Object.fromEntries(form));
  if (!d.success) redirect(back(country, `?error=${encodeURIComponent(d.error.issues[0].message)}`));
  let phone: string | null = null;
  try { phone = toE164International(d.data.phone ?? "", d.data.code || (country === "vc" ? "+1784" : "+1473")); } catch (e) { redirect(back(country, `?error=${encodeURIComponent((e as Error).message)}`)); }
  const supabase = await supabaseForRequest();
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("family_members").insert({ owner_id: u.user!.id, name: d.data.name, kind: d.data.kind, phone_e164: phone });
  revalidatePath(back(country));
  redirect(back(country, error ? `?error=${encodeURIComponent("They couldn’t be added. Please try again.")}` : "?done=member"));
}

export async function addTrustedContactAction(form: FormData) {
  const country = cc(form);
  if (!(await getViewer())) redirect(`/join?mode=sign-in&next=${encodeURIComponent(back(country))}`);
  const d = z.object({ name: z.string().trim().min(1, "Add their name").max(80), phone: z.string().min(5, "Add their phone number").max(30), code: z.string().max(6).optional() }).safeParse(Object.fromEntries(form));
  if (!d.success) redirect(back(country, `?error=${encodeURIComponent(d.error.issues[0].message)}`));
  let phone: string | null = null;
  try { phone = toE164International(d.data.phone, d.data.code || (country === "vc" ? "+1784" : "+1473")); } catch (e) { redirect(back(country, `?error=${encodeURIComponent((e as Error).message)}`)); }
  const supabase = await supabaseForRequest();
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("trusted_contacts").insert({ owner_id: u.user!.id, name: d.data.name, phone_e164: phone });
  revalidatePath(back(country));
  redirect(back(country, error ? `?error=${encodeURIComponent("That contact couldn’t be added.")}` : "?done=contact"));
}

export async function removeFamilyItemAction(form: FormData) {
  const country = cc(form);
  const table = form.get("table") === "trusted_contacts" ? "trusted_contacts" : "family_members";
  const supabase = await supabaseForRequest();
  await supabase.from(table).delete().eq("id", String(form.get("id")));
  revalidatePath(back(country));
  redirect(back(country));
}

/* Driver confirms pick-up with the passenger's 4-digit PIN. */
export async function confirmPickupAction(form: FormData) {
  const d = z.object({ request: z.string().uuid(), pin: z.string().trim().regex(/^\d{4}$/, "Enter the 4-digit PIN"), country: z.string().regex(/^[a-z]{2}$/), slug: z.string().regex(/^[a-z0-9-]{1,80}$/) }).safeParse(Object.fromEntries(form));
  const backTo = `/${String(form.get("country"))}/dashboard/${String(form.get("slug"))}?tab=trips`;
  if (!d.success) redirect(`${backTo}&error=${encodeURIComponent(d.error.issues[0].message)}`);
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("confirm_pickup", { p_request: d.data.request, p_pin: d.data.pin });
  revalidatePath(backTo);
  redirect(`${backTo}&${error ? `error=${encodeURIComponent(error.message)}` : "pickedup=1"}`);
}
