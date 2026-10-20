"use server";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getViewer, safeNext } from "@/lib/auth";
import { fromB64url, relyingParty, saveChallenge, takeChallenge, toB64url } from "@/lib/passkeys";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { supabaseForRequest } from "@/lib/supabase/server";

/*
 * Face ID, Touch ID and fingerprint sign-in, using passkeys (the WebAuthn standard).
 * The phone keeps the private key and only unlocks it after Face ID or a fingerprint;
 * Island Connect stores the public key and checks each sign-in against it.
 */

function admin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Face ID sign-in isn’t switched on yet.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* ---------- Set up on this device (signed in) ---------- */
export async function passkeyRegisterOptions(): Promise<{ options?: PublicKeyCredentialCreationOptionsJSON; error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." };
  const supabase = await supabaseForRequest();
  const { data: existing } = await supabase.from("passkeys").select("credential_id, transports");
  const rp = await relyingParty();
  const options = await generateRegistrationOptions({
    rpName: rp.rpName,
    rpID: rp.rpID,
    userName: viewer.email ?? viewer.id,
    userDisplayName: viewer.name ?? viewer.email ?? "Island Connect",
    userID: new TextEncoder().encode(viewer.id),
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((p) => ({ id: p.credential_id, transports: p.transports as AuthenticatorTransportFuture[] })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  await saveChallenge(options.challenge);
  return { options };
}

export async function passkeyRegisterVerify(response: RegistrationResponseJSON, deviceName: string): Promise<{ ok?: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." };
  const expectedChallenge = await takeChallenge();
  if (!expectedChallenge) return { error: "That took too long. Please try again." };
  const rp = await relyingParty();
  try {
    const v = await verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true });
    if (!v.verified || !v.registrationInfo) return { error: "Your device couldn’t be set up. Please try again." };
    const { credential } = v.registrationInfo;
    const supabase = await supabaseForRequest();
    const { error } = await supabase.from("passkeys").insert({
      user_id: viewer.id,
      credential_id: credential.id,
      public_key: toB64url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      device_name: (deviceName || "This device").slice(0, 80),
    });
    if (error) return { error: "This device is already set up." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { error: "Your device couldn’t be set up. Please try again." };
  }
}

export async function removePasskeyAction(form: FormData) {
  const viewer = await getViewer();
  if (!viewer) return;
  const supabase = await supabaseForRequest();
  await supabase.from("passkeys").delete().eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

/* ---------- Sign in (signed out) ---------- */
export async function passkeyLoginOptions(): Promise<{ options?: PublicKeyCredentialRequestOptionsJSON; error?: string }> {
  const rp = await relyingParty();
  // No list of allowed keys: the phone offers whichever Island Connect passkey it holds.
  const options = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: "required" });
  await saveChallenge(options.challenge);
  return { options };
}

export async function passkeyLoginVerify(response: AuthenticationResponseJSON, next: string): Promise<{ url?: string; error?: string }> {
  const expectedChallenge = await takeChallenge();
  if (!expectedChallenge) return { error: "That took too long. Please try again." };
  let db;
  try {
    db = admin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { data: key } = await db.from("passkeys").select("id, user_id, credential_id, public_key, counter, transports").eq("credential_id", response.id).maybeSingle();
  if (!key) return { error: "This device isn’t set up for Island Connect yet. Sign in with your password, then turn on Face ID sign-in in Your account." };
  const rp = await relyingParty();
  try {
    const v = await verifyAuthenticationResponse({
      response, expectedChallenge, expectedOrigin: rp.origin, expectedRPID: rp.rpID, requireUserVerification: true,
      credential: { id: key.credential_id, publicKey: fromB64url(key.public_key), counter: Number(key.counter), transports: key.transports as AuthenticatorTransportFuture[] },
    });
    if (!v.verified) return { error: "Face ID sign-in didn’t work. Please try again or use your password." };
    await db.from("passkeys").update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date().toISOString() }).eq("id", key.id);
  } catch {
    return { error: "Face ID sign-in didn’t work. Please try again or use your password." };
  }

  // The device has proved who it is: start a normal session for that account.
  const { data: user } = await db.auth.admin.getUserById(key.user_id);
  const email = user?.user?.email;
  if (!email) return { error: "This account can’t be signed in this way. Please use your password." };
  const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token) return { error: "Sign-in failed. Please use your password." };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: link.properties.hashed_token });
  if (error) return { error: "Sign-in failed. Please use your password." };
  return { url: safeNext(next, "/?choose=1") };
}
