"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "@/app/push-actions";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "loading" | "unsupported" | "ios-install" | "off" | "on" | "blocked";

/* Lets someone get phone notifications for new requests, quotes and messages on this device. */
export function PushSetup({ what }: { what: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return setState(ios && !installed ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const existing = await reg?.pushManager.getSubscription();
      setState(existing ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "blocked" : "off");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) });
      const res = await savePushSubscriptionAction(s.toJSON());
      if (res.error) throw new Error(res.error);
      setState("on");
    } catch (e) {
      setError((e as Error).message || "Notifications couldn’t be switched on.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/");
    const s = await reg?.pushManager.getSubscription();
    if (s) {
      await removePushSubscriptionAction(s.endpoint);
      await s.unsubscribe();
    }
    setState("off");
    setBusy(false);
  }

  if (state === "loading" || state === "unsupported") return null;
  const box = "flex flex-wrap items-center gap-3 rounded-2xl bg-raised p-4 ring-1 ring-line/60";
  if (state === "ios-install") {
    return (
      <div className={box}>
        <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm">To get {what} as notifications on your iPhone, add Island Connect to your Home Screen: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, and open it from there.</p>
      </div>
    );
  }
  if (state === "blocked") {
    return (
      <div className={box}>
        <BellOff className="h-5 w-5 text-muted" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm">Notifications are blocked for Island Connect on this device. Allow them in your phone or browser settings to get {what} instantly.</p>
      </div>
    );
  }
  return (
    <div className={box}>
      <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm">{state === "on" ? `Notifications are on: ${what} arrive on this device.` : `Get ${what} as notifications on this device, as well as by email.`}</p>
      {state === "on" ? (
        <button type="button" onClick={turnOff} disabled={busy} className="h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink">Turn off</button>
      ) : (
        <button type="button" onClick={turnOn} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Turn on notifications
        </button>
      )}
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}
