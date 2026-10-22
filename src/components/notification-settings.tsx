"use client";

import { Bell, BellOff, BellRing, Loader2, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { removePushSubscriptionAction, savePushSubscriptionAction, sendTestPushAction } from "@/app/push-actions";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const keyBytes = (b: string) => Uint8Array.from(atob((b + "=".repeat((4 - (b.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
type State = "loading" | "unsupported" | "ios-install" | "off" | "on" | "blocked";

/*
 * Account settings → Notifications: one clear place to switch phone notifications on, check
 * they work, and fix them if they're blocked, with steps for this exact phone.
 */
export function NotificationSettings({ isDriver }: { isDriver: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    (async () => {
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setIos(isIos);
      const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isIos && !installed) return setState("ios-install");
      if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.getRegistration("/");
      setState((await reg?.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true); setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "blocked" : "off"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) }));
      const res = await savePushSubscriptionAction(sub.toJSON());
      if (res.error) throw new Error(res.error);
      setState("on");
      const t = await sendTestPushAction();
      setMsg(t.error ? { ok: false, text: t.error } : { ok: true, text: "Done. A test notification is on its way." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || "Notifications couldn’t be switched on. Please try again." });
    } finally { setBusy(false); }
  }

  async function turnOff() {
    setBusy(true); setMsg(null);
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await removePushSubscriptionAction(sub.endpoint); await sub.unsubscribe(); }
    setState("off"); setBusy(false);
  }

  async function test() {
    setBusy(true); setMsg(null);
    const t = await sendTestPushAction();
    setMsg(t.error ? { ok: false, text: t.error } : { ok: true, text: "Sent. It should appear in a few seconds." });
    setBusy(false);
  }

  const what = isDriver ? "ride offers, new requests, bookings and messages" : "ride updates, quotes and messages";
  const step = "flex items-start gap-3 text-sm";
  const num = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary";

  return (
    <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <div className="flex items-start gap-3">
        {state === "on" ? <BellRing className="h-6 w-6 shrink-0 text-success" aria-hidden="true" /> : state === "blocked" ? <BellOff className="h-6 w-6 shrink-0 text-muted" aria-hidden="true" /> : <Bell className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">Notifications{state === "on" ? ": on for this phone" : state === "blocked" ? ": blocked" : ""}</p>
          <p className="mt-0.5 text-sm">Get {what} straight away. Important updates are always emailed too.</p>
        </div>
      </div>

      {state === "loading" && <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted" aria-label="Checking" />}

      {state === "ios-install" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-ink">On iPhone, notifications work once Island Connect is on your Home Screen:</p>
          <p className={step}><span className={num}>1</span><span>In Safari, tap <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" /> <strong>Share</strong> at the bottom of the screen.</span></p>
          <p className={step}><span className={num}>2</span><span>Scroll down and tap <SquarePlus className="inline h-4 w-4 align-text-bottom" aria-hidden="true" /> <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</span></p>
          <p className={step}><span className={num}>3</span><span>Open Island Connect from your Home Screen, come back to <strong>Your account</strong>, and tap <strong>Turn on notifications</strong> here.</span></p>
        </div>
      )}

      {state === "blocked" && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="font-semibold text-ink">Notifications were turned off for Island Connect on this phone. To allow them:</p>
          {ios
            ? <p>Open <strong>Settings</strong> → <strong>Notifications</strong> → <strong>Island Connect</strong> → turn on <strong>Allow Notifications</strong>. Then come back here.</p>
            : <p>Press and hold the Island Connect icon → <strong>App info</strong> → <strong>Notifications</strong> → turn them on. In Chrome, tap the icon to the left of the web address → <strong>Permissions</strong> → <strong>Notifications</strong> → <strong>Allow</strong>.</p>}
          <button type="button" onClick={() => location.reload()} className="mt-1 h-10 rounded-full border border-line px-4 font-semibold text-ink">I’ve allowed them</button>
        </div>
      )}

      {state === "unsupported" && <p className="mt-3 text-sm">This browser can’t show notifications. Try Chrome on Android, or on iPhone add Island Connect to your Home Screen from Safari.</p>}

      {(state === "off" || state === "on") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {state === "off" ? (
            <button type="button" onClick={turnOn} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-ink disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}Turn on notifications
            </button>
          ) : (
            <>
              <button type="button" onClick={test} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-ink disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send a test
              </button>
              <button type="button" onClick={turnOff} disabled={busy} className="h-11 rounded-full border border-line px-5 font-semibold text-ink">Turn off</button>
            </>
          )}
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{msg.text}</p>}
      {state === "on" && <p className="mt-3 text-xs">This is set per phone. Turn it on on each phone or tablet you use.</p>}
    </div>
  );
}
