"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { requireAdmin } from "@/lib/auth";
import { getCountry } from "@/lib/data";
import { toE164 } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

const review = z.object({ id: z.string().uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(1000) });

export async function reviewBusinessAction(form: FormData) {
  await requireAdmin();
  const d = review.parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_business", { p_business: d.id, p_approve: d.decision === "approve", p_note: d.note || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function reviewClaimAction(form: FormData) {
  await requireAdmin();
  const d = review.parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("admin_review_claim", { p_claim: d.id, p_approve: d.decision === "approve", p_note: d.note || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
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
