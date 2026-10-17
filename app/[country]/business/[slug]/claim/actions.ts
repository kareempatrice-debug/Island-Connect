"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getViewer } from "@/lib/auth";
import { getCountry } from "@/lib/data";
import { toE164 } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

const schema = z.object({
  country: z.string().regex(/^[a-z]{2}$/),
  businessId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  claimantName: z.string().trim().min(2, "Enter your name").max(120),
  role: z.string().trim().min(2, "Say what your role is").max(80),
  phone: z.string().max(30),
  evidence: z.string().trim().min(10, "Tell us how we can confirm you run this business").max(2000),
});

export async function claimListingAction(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const country = await getCountry(d.country);
  let phone: string | null;
  try {
    phone = toE164(d.phone, country?.diallingCode ?? "+1");
  } catch (e) {
    return { error: (e as Error).message };
  }
  const supabase = await supabaseForRequest();
  const { error } = await supabase.from("business_claims").insert({
    business_id: d.businessId,
    user_id: viewer.id,
    claimant_name: d.claimantName,
    role_at_business: d.role,
    phone,
    evidence: d.evidence,
  });
  if (error) {
    return { error: error.code === "23505" ? "You already have a claim waiting for review on this listing." : "This listing can’t be claimed." };
  }
  redirect(`/${d.country}/account?claimed=${encodeURIComponent(d.slug)}`);
}
