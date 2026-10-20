"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Loader2, ScanFace } from "lucide-react";
import { useEffect, useState } from "react";
import { passkeyLoginOptions, passkeyLoginVerify, passkeyRegisterOptions, passkeyRegisterVerify } from "@/app/passkey-actions";

const isApple = () => /iPhone|iPad|Macintosh/i.test(navigator.userAgent);
const label = () => (isApple() ? "Face ID or Touch ID" : "fingerprint or face unlock");
function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android phone";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows computer";
  return "This device";
}
const cancelled = (e: unknown) => /NotAllowedError|AbortError|cancel/i.test(String((e as Error)?.name ?? "") + String((e as Error)?.message ?? ""));

/* "Sign in with Face ID": shown on the sign-in screen when the device supports passkeys. */
export function PasskeySignIn({ next }: { next: string }) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [what, setWhat] = useState("Face ID or fingerprint");
  useEffect(() => { setSupported(browserSupportsWebAuthn()); setWhat(isApple() ? "Face ID" : "fingerprint"); }, []);
  if (!supported) return null;

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const { options, error: e1 } = await passkeyLoginOptions();
      if (!options) throw new Error(e1 ?? "Please try again.");
      const response = await startAuthentication({ optionsJSON: options });
      const res = await passkeyLoginVerify(response, next);
      if (res.error) throw new Error(res.error);
      window.location.href = res.url ?? "/?choose=1"; // full load so the new session is used everywhere
    } catch (e) {
      if (!cancelled(e)) setError((e as Error).message || "That didn’t work. Please use your password.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={go} disabled={busy}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-raised text-[1.0625rem] font-semibold text-primary disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : what === "Face ID" ? <ScanFace className="h-6 w-6" aria-hidden="true" /> : <Fingerprint className="h-6 w-6" aria-hidden="true" />}
        Sign in with {what}
      </button>
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
      <p className="pt-2 text-center text-sm text-muted">or use your email and password</p>
    </div>
  );
}

/* Account page: turn on Face ID / fingerprint sign-in for this device, and see or remove devices. */
export function PasskeySetup({ devices, remove }: {
  devices: { id: string; device_name: string | null; created_at: string; last_used_at: string | null }[];
  remove: (f: FormData) => Promise<void>;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [what, setWhat] = useState("Face ID or fingerprint");
  useEffect(() => { setSupported(browserSupportsWebAuthn()); setWhat(label()); }, []);

  async function setUp() {
    setBusy(true);
    setMsg(null);
    try {
      const { options, error } = await passkeyRegisterOptions();
      if (!options) throw new Error(error ?? "Please try again.");
      const response = await startRegistration({ optionsJSON: options });
      const res = await passkeyRegisterVerify(response, deviceName());
      if (res.error) throw new Error(res.error);
      setMsg({ ok: true, text: `Done. Next time, tap “Sign in with ${isApple() ? "Face ID" : "fingerprint"}” on the sign-in screen.` });
      window.location.reload();
    } catch (e) {
      if (!cancelled(e)) setMsg({ ok: false, text: (e as Error).message || "That didn’t work. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <p className="font-semibold text-ink">Sign in with Face ID or fingerprint</p>
      <p className="mt-1 text-sm">Skip typing your password: your phone confirms it’s you. Your face or fingerprint never leaves your phone.</p>
      {devices.length > 0 && (
        <ul className="mt-3 divide-y divide-line">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span><span className="font-semibold text-ink">{d.device_name ?? "Device"}</span> · added {new Date(d.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{d.last_used_at ? `, last used ${new Date(d.last_used_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}</span>
              <form action={remove}><input type="hidden" name="id" value={d.id} /><button className="font-semibold text-danger underline">Remove</button></form>
            </li>
          ))}
        </ul>
      )}
      {supported === false ? (
        <p className="mt-3 text-sm">This browser doesn’t support it. On iPhone, use Safari or the Island Connect icon on your home screen.</p>
      ) : supported && (
        <button type="button" onClick={setUp} disabled={busy} className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-ink disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-5 w-5" aria-hidden="true" />}
          {devices.length ? "Add this device" : `Turn on ${what}`}
        </button>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{msg.text}</p>}
    </div>
  );
}
