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
        ? `/${country}/ride/operate/apply`
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

/* ---------- Forgotten password ---------- */
export async function requestPasswordResetAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await supabaseForRequest();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${site()}/auth/callback?next=${encodeURIComponent("/reset-password")}` });
  // Same answer whether or not the address has an account, so nobody can test which emails are registered.
  return { message: "If that email has an account, we’ve sent a link to choose a new password. It works for one hour." };
}

export async function updatePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z.object({ password, confirm: z.string() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.password !== parsed.data.confirm) return { error: "The two passwords don’t match." };
  const supabase = await supabaseForRequest();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "This link has expired. Ask for a new one from the sign-in page." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { message: "Your password has been changed. You’re signed in." };
}

/* ---------- Delete my account ---------- */
export async function deleteAccountAction(_: FormState, form: FormData): Promise<FormState> {
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") return { error: "Type DELETE to confirm." };
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return { error: "Account deletion isn’t switched on yet. Email hello@islandconnect.cc and we’ll delete it for you." };
  const supabase = await supabaseForRequest();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Please sign in again." };
  // 1. Erase the person's listings and scrub the admin log (database), getting back the listings removed.
  const { data: erased, error: prepError } = await supabase.rpc("prepare_account_deletion");
  if (prepError) return { error: prepError.message };
  const { createClient } = await import("@supabase/supabase-js");
  const { SUPABASE_URL } = await import("@/lib/supabase/env");
  const admin = createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  // 2. Delete their files: licence and insurance documents, and photos of the listings that were erased.
  const removeFolder = async (bucket: string, folder: string) => {
    for (let round = 0; round < 10; round++) {
      const { data: files } = await admin.storage.from(bucket).list(folder, { limit: 100 });
      if (!files?.length) return;
      await admin.storage.from(bucket).remove(files.map((f) => `${folder}/${f.name}`));
      if (files.length < 100) return;
    }
  };
  await removeFolder("operator-documents", data.user.id).catch(() => undefined);
  for (const id of ((erased as string[] | null) ?? [])) await removeFolder("business-media", id).catch(() => undefined);

  // 3. Delete the account itself; everything else linked to it is removed by the database.
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return { error: "Your account couldn’t be deleted. Please try again, or email hello@islandconnect.cc." };
  await supabase.auth.signOut();
  redirect("/?choose=1&deleted=1");
}
