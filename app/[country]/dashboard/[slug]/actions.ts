"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/app/auth-actions";
import { getCountry } from "@/lib/data";
import { toE164 } from "@/lib/phone";
import { supabaseForRequest } from "@/lib/supabase/server";

/* All writes run as the signed-in user; Row Level Security decides what they may change. */

const base = z.object({ country: z.string().regex(/^[a-z]{2}$/), businessId: z.string().uuid(), slug: z.string() });
const done = (country: string, slug: string) => revalidatePath(`/${country}/dashboard/${slug}`);

const profile = base.extend({
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(4000),
  phone: z.string().max(30),
  whatsapp: z.string().max(30),
  email: z.union([z.string().trim().email("Enter a valid email address"), z.literal("")]),
  website: z.union([z.string().trim().url().startsWith("https://", "Website must start with https://"), z.literal("")]),
  cancellationPolicy: z.string().trim().max(500),
  contactPreference: z.enum(["platform", "whatsapp", "phone", "website", "external_booking"]),
  externalBookingUrl: z.union([z.string().trim().url().startsWith("https://", "Booking link must start with https://"), z.literal("")]),
  paymentMethods: z.array(z.enum(["cash", "card", "bank_transfer", "cheque", "mobile_money"])),
});

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = profile.safeParse({ ...Object.fromEntries(form), paymentMethods: form.getAll("paymentMethods") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.contactPreference === "external_booking" && !d.externalBookingUrl) return { error: "Add the link to your booking page." };
  const country = await getCountry(d.country);
  let phone: string | null, whatsapp: string | null;
  try {
    phone = toE164(d.phone, country?.diallingCode ?? "+1");
    whatsapp = toE164(d.whatsapp, country?.diallingCode ?? "+1");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (d.contactPreference === "whatsapp" && !whatsapp) return { error: "Add a WhatsApp number, or choose another way to be contacted." };
  if (d.contactPreference === "phone" && !phone) return { error: "Add a phone number, or choose another way to be contacted." };
  if (d.contactPreference === "website" && !d.website) return { error: "Add your website, or choose another way to be contacted." };
  const supabase = await supabaseForRequest();
  const { error, count } = await supabase
    .from("businesses")
    .update(
      {
        tagline: d.tagline || null, description: d.description || null, phone_e164: phone, whatsapp_e164: whatsapp,
        email: d.email || null, website: d.website || null, cancellation_policy: d.cancellationPolicy || null,
        contact_preference: d.contactPreference, external_booking_url: d.externalBookingUrl || null, payment_methods: d.paymentMethods,
      },
      { count: "exact" },
    )
    .eq("id", d.businessId);
  if (error) return { error: "Your changes couldn’t be saved." };
  if (count === 0) return { error: "Only the owner can change these details." };
  done(d.country, d.slug);
  return { message: "Saved." };
}

const service = base.extend({
  name: z.string().trim().min(2, "Name the service").max(120),
  description: z.string().trim().max(500),
  priceMin: z.union([z.coerce.number().min(0).max(1_000_000), z.literal("")]),
  priceMax: z.union([z.coerce.number().min(0).max(1_000_000), z.literal("")]),
  priceUnit: z.string().trim().max(30),
  duration: z.union([z.coerce.number().int().min(5).max(10_000), z.literal("")]),
});

export async function addServiceAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = service.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const min = d.priceMin === "" ? null : d.priceMin;
  const max = d.priceMax === "" ? null : d.priceMax;
  if (min != null && max != null && max < min) return { error: "The highest price can’t be lower than the starting price." };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.from("services").insert({
    business_id: d.businessId, name: d.name, description: d.description || null, price_min: min, price_max: max,
    price_unit: d.priceUnit || null, duration_minutes: d.duration === "" ? null : d.duration, booking_models: ["enquiry"],
  });
  if (error) return { error: "The service couldn’t be added." };
  done(d.country, d.slug);
  return { message: "Added." };
}

export async function deleteServiceAction(form: FormData) {
  const d = base.extend({ serviceId: z.string().uuid() }).parse(Object.fromEntries(form));
  const supabase = await supabaseForRequest();
  await supabase.from("services").delete().eq("id", d.serviceId).eq("business_id", d.businessId);
  done(d.country, d.slug);
}

const time = z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal("")]);

export async function saveHoursAction(_: FormState, form: FormData): Promise<FormState> {
  const d = base.parse(Object.fromEntries(form));
  const rows: { business_id: string; weekday: number; opens: string; closes: string }[] = [];
  for (let day = 0; day < 7; day++) {
    if (form.get(`closed-${day}`) === "on") continue;
    const opens = time.parse(form.get(`opens-${day}`) ?? "");
    const closes = time.parse(form.get(`closes-${day}`) ?? "");
    if (!opens || !closes) continue;
    if (closes <= opens) return { error: "Closing time must be after opening time." };
    rows.push({ business_id: d.businessId, weekday: day, opens, closes });
  }
  const supabase = await supabaseForRequest();
  const del = await supabase.from("opening_hours").delete().eq("business_id", d.businessId);
  if (del.error) return { error: "Your hours couldn’t be saved." };
  if (rows.length) {
    const ins = await supabase.from("opening_hours").insert(rows);
    if (ins.error) return { error: "Your hours couldn’t be saved." };
  }
  done(d.country, d.slug);
  return { message: "Hours saved." };
}
