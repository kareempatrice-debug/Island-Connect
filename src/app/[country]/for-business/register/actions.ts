"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getCountry } from "@/lib/data";
import { toE164 } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/);

const schema = z.object({
  country: slug,
  name: z.string().trim().min(2, "Enter the business name").max(120),
  categories: z.array(slug).min(1, "Choose at least one category").max(3, "Choose up to three categories"),
  island: slug,
  district: z.union([slug, z.literal("")]),
  landmark: z.string().trim().max(160),
  phone: z.string().max(30),
  whatsapp: z.string().max(30),
  email: z.union([z.string().trim().email("Enter a valid email address"), z.literal("")]),
  website: z.union([z.string().trim().url("Website must start with https://").startsWith("https://", "Website must start with https://"), z.literal("")]),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(4000),
  paymentMethods: z.array(z.enum(["cash", "card", "bank_transfer", "cheque", "mobile_money"])),
});

export async function registerBusinessAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    ...Object.fromEntries(form),
    categories: form.getAll("categories"),
    paymentMethods: form.getAll("paymentMethods"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const country = await getCountry(d.country);
  if (!country) return { error: "Choose a country" };

  let phone: string | null, whatsapp: string | null;
  try {
    phone = toE164(d.phone, country.diallingCode);
    whatsapp = toE164(d.whatsapp, country.diallingCode);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("register_business", {
    p: { ...d, phone, whatsapp },
  });
  if (error) return { error: error.message.replace(/^.*?:\s*/, "") || "Something went wrong. Please try again." };
  redirect(`/${d.country}/account?registered=${encodeURIComponent((data as { slug: string }).slug)}`);
}
