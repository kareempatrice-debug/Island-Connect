"use client";

import { Loader2, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { respondToOfferAction } from "@/app/trip-actions";

/* The driver's ride offer: a big countdown, the fare, where to, and one-tap Accept. */
export function OfferCard(p: {
  offerId: string; status: string; expiresAt: string; price: number; official: boolean; pickupKm: number | null;
  pickup: string; dropoff: string; when: string; tripKm: number | null; passengers: number | null;
  riderKind: string | null; note: string | null; tripsHref: string;
}) {
  const router = useRouter();
  const total = 20;
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / 1000)));
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = p.status === "offered" && left > 0;

  useEffect(() => {
    if (p.status !== "offered") return;
    // A short buzz on phones that support it, so the offer isn't missed.
    try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ }
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) { clearInterval(t); setTimeout(() => router.refresh(), 800); }
    }, 250);
    return () => clearInterval(t);
  }, [p.expiresAt, p.status, router]);

  async function answer(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    setError(null);
    const res = await respondToOfferAction(p.offerId, accept);
    if (res.error) { setError(res.error); setBusy(null); router.refresh(); return; }
    window.location.href = res.url ?? p.tripsHref;
  }

  if (!live) {
    const msg = p.status === "accepted" ? "You accepted this ride." : p.status === "declined" ? "You passed on this ride." : "This offer has expired. It has gone to another driver.";
    return (
      <div className="rounded-3xl bg-raised p-6 text-center ring-1 ring-line/60">
        <p className="text-xl font-bold text-ink">{msg}</p>
        <Link href={p.tripsHref} className="mt-5 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-ink">Go to my trips</Link>
      </div>
    );
  }

  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="overflow-hidden rounded-3xl bg-deep text-white shadow-card">
      <div className="flex items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">Ride offer</p>
          <p className="mt-1 text-4xl font-bold">EC${p.price.toFixed(0)}</p>
          <p className="text-sm text-white/80">{p.official ? "Official fare" : "Agreed fare, from the estimate"}</p>
        </div>
        <div className="relative h-24 w-24 shrink-0" role="timer" aria-label={`${left} seconds left`}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#F4B846" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} style={{ transition: "stroke-dashoffset .25s linear" }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{left}</span>
        </div>
      </div>
      <div className="space-y-3 bg-raised p-6 text-ink">
        {p.pickupKm != null && <p className="flex items-center gap-2 text-lg font-bold"><Navigation className="h-5 w-5 text-primary" aria-hidden="true" />{p.pickupKm.toFixed(1)} km to pick-up</p>}
        <p className="flex items-start gap-2"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span><span className="block text-xs text-muted">Pick-up</span><span className="font-semibold">{p.pickup}</span></span></p>
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden="true" /><span><span className="block text-xs text-muted">Destination</span><span className="font-semibold">{p.dropoff}</span></span></p>
        <p className="text-sm text-muted">{p.when}{p.tripKm ? ` · ${p.tripKm.toFixed(1)} km trip` : ""}{p.passengers ? ` · ${p.passengers} passenger${p.passengers > 1 ? "s" : ""}` : ""}</p>
        {p.riderKind === "teen" && <p className="rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold">Teenage passenger: confirm the PIN before setting off</p>}
        {p.riderKind === "senior" && <p className="rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold">Senior passenger: please help with bags and doors</p>}
        {p.note && <p className="rounded-xl bg-sunken px-3 py-2 text-sm">“{p.note}”</p>}
        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
        <button type="button" onClick={() => answer(true)} disabled={busy !== null}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-bold text-primary-ink disabled:opacity-60">
          {busy === "accept" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}Accept ride
        </button>
        <button type="button" onClick={() => answer(false)} disabled={busy !== null} className="h-11 w-full rounded-2xl text-sm font-semibold text-muted">
          {busy === "decline" ? "Passing…" : "Pass"}
        </button>
      </div>
    </div>
  );
}
