"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
  message?: string;
}

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Use at least 8 characters for your password").max(72);

export async function signInAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "That email and password don’t match an account." };
  redirect(safeNext(String(form.get("next") ?? ""), "/"));
}

export async function signUpAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your name").max(80),
      email,
      password,
      role: z.enum(["customer", "business", "operator"]).catch("customer"),
      country: z.string().regex(/^[a-z]{2}$/).catch("gd"),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { role, country } = parsed.data;
  // Where a new account goes next depends on why the person joined.
  const next =
    role === "business"
      ? `/${country}/for-business/register`
      : role === "operator"
        ? `/${country}/ride/operate`
        : safeNext(String(form.get("next") ?? ""), `/${country}`);
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.name, joined_as: role }, emailRedirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(next);
  return { message: `We’ve sent a confirmation link to ${parsed.data.email}. Open it on this device to finish creating your account.` };
}

export async function emailLinkAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const next = safeNext(String(form.get("next") ?? ""), "/");
  const supabase = await supabaseForRequest();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: "We couldn’t send a link to that address. Check it, or create an account." };
  return { message: `Check ${parsed.data} for a sign-in link.` };
}

export async function signOutAction(form: FormData) {
  const supabase = await supabaseForRequest();
  await supabase.auth.signOut();
  redirect(safeNext(String(form.get("next") ?? ""), "/"));
}
