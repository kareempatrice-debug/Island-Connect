import { cookies, headers } from "next/headers";

/* Where passkeys are valid: the site's own address (islandconnect.cc), or localhost when testing. */
export async function relyingParty() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost").split(",")[0].trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : null;
  const hostname = host.split(":")[0];
  // Passkeys made on islandconnect.cc also work on www.islandconnect.cc.
  const rpID = site && (hostname === site.hostname || hostname.endsWith(`.${site.hostname}`)) ? site.hostname : hostname;
  const proto = hostname === "localhost" ? "http" : "https";
  return { rpID, origin: `${proto}://${host}`, rpName: "Island Connect" };
}

const CHALLENGE = "ic_passkey_challenge";

export async function saveChallenge(challenge: string) {
  (await cookies()).set(CHALLENGE, challenge, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 300 });
}

export async function takeChallenge(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(CHALLENGE)?.value ?? null;
  jar.delete(CHALLENGE); // one use only
  return v;
}

export const toB64url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
export const fromB64url = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));
