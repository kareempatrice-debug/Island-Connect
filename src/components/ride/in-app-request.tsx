"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import type { TripPayload } from "@/app/trip-actions";
import { CALLING_CODES } from "@/lib/phone";

export type RequestInApp = (p: TripPayload) => Promise<{ url?: string; error?: string; signIn?: string }>;

/* Sends the trip to every approved operator at once; quotes then come back in the app. */
export function InAppRequest({ action, payload, note }: { action: RequestInApp; payload: TripPayload; note: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string>(payload.country === "vc" ? "+1784" : "+1473");
  async function go() {
    if (phone.replace(/\D/g, "").length < 6) return setError("Add a phone or WhatsApp number so the operator you choose can reach you.");
    setBusy(true);
    setError(null);
    const res = await action({ ...payload, contact_phone: phone, contact_code: code }).catch(() => ({ error: "Something went wrong. Please try again." }) as { error: string; url?: string; signIn?: string });
    if (res.url || res.signIn) window.location.href = (res.url ?? res.signIn)!;
    else {
      setError(res.error ?? "Something went wrong. Please try again.");
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 rounded-2xl bg-deep p-4 text-white">
      <p className="font-semibold">Ask all approved operators at once</p>
      <p className="mt-1 text-sm text-white/80">{note}</p>
      <fieldset className="mt-3">
        <legend className="mb-1 block text-sm font-semibold">Your phone or WhatsApp number</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="contact-code">Country code</label>
          <select id="contact-code" value={code} onChange={(e) => setCode(e.target.value)}
            className="h-12 w-full min-w-0 max-w-full rounded-xl border-0 bg-white px-3 text-[#172B32] sm:w-56">
            {CALLING_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="contact-phone">Number</label>
          <input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 24))} inputMode="tel" autoComplete="tel"
            placeholder={code === "+44" ? "e.g. 07835 028032" : code === "other" ? "e.g. +49 151 2345 6789" : code.length === 5 ? "e.g. 444 1234" : "Your number"}
            className="h-12 min-w-0 flex-1 rounded-xl border-0 bg-white px-3.5 text-[#172B32] placeholder:text-[#56666B]" />
        </div>
        <span className="mt-1 block text-xs text-white/75">Visiting? Use your own number from home: WhatsApp works on Wi-Fi. Shared only with the operator whose quote you accept.</span>
      </fieldset>
      {error && <p role="alert" className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium">{error}</p>}
      <button type="button" onClick={go} disabled={busy} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-[#172B32] disabled:opacity-70">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
        {busy ? "Sending…" : "Send request through Island Connect"}
      </button>
    </div>
  );
}
