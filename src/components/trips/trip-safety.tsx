"use client";

import { MessageCircle, Share2, ShieldCheck } from "lucide-react";
import { useState } from "react";

/* Shown on a customer's booked trip: the pick-up PIN and one-tap sharing with trusted contacts. */
export function TripSafety({ pin, shareUrl, contacts, riderName, booked, pickedUp }: {
  pin: string | null; shareUrl: string | null; contacts: { name: string; phone_e164: string }[]; riderName: string | null; booked: boolean; pickedUp: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = `Follow ${riderName ? `${riderName.split(" ")[0]}’s` : "my"} Island Connect trip: ${shareUrl}`;
  async function share() {
    if (!shareUrl) return;
    if (navigator.share) { await navigator.share({ title: "Island Connect trip", text, url: shareUrl }).catch(() => undefined); return; }
    await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
  }
  return (
    <section className="mt-6 space-y-3" aria-label="Trip safety">
      {booked && pin && !pickedUp && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-deep p-4 text-white">
          <span><span className="block font-semibold">Your pick-up PIN</span><span className="block text-sm text-white/80">{riderName ? `Give this to ${riderName.split(" ")[0]}. ` : ""}The driver asks for it before setting off.</span></span>
          <span className="font-display text-3xl font-bold tracking-[0.3em]" aria-label={`PIN ${pin.split("").join(" ")}`}>{pin}</span>
        </div>
      )}
      {shareUrl && (
        <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
          <p className="flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />Share trip location</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {contacts.map((c) => (
              <a key={c.phone_e164} href={`https://wa.me/${c.phone_e164.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-[#0B2E1B]">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />{c.name.split(" ")[0]}
              </a>
            ))}
            <button type="button" onClick={share} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sunken px-4 text-sm font-semibold text-ink">
              <Share2 className="h-4 w-4" aria-hidden="true" />{copied ? "Link copied" : "Share"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
