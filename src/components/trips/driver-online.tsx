"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/*
 * The driver's Online switch, in the header on every page (like Uber's "Go online").
 * While online, the phone sends its position every 20 seconds, including when the driver is
 * standing still, so customers see the car on the map and the nearest-driver dispatch can find it.
 * It stays on as the driver moves around the app. (On the website it pauses when the screen
 * locks; the App Store version will keep going in the background.)
 */
export function DriverOnline({ businessId }: { businessId: string }) {
  const key = `ic_online_${businessId}`;
  const [online, setOnline] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const watch = useRef<number | null>(null);
  const beat = useRef<ReturnType<typeof setInterval> | null>(null);
  const last = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const sent = useRef(0);
  const lock = useRef<{ release: () => Promise<void> } | null>(null);

  const send = useCallback(async (force = false) => {
    if (!last.current || (!force && Date.now() - sent.current < 20000)) return;
    sent.current = Date.now();
    const { error } = await supabaseBrowser().rpc("set_presence", { p_business: businessId, p_lat: last.current.lat, p_lng: last.current.lng, p_heading: last.current.heading });
    if (error) { setMsg(error.message); stop(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const stop = useCallback((silent = false) => {
    if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
    if (beat.current) clearInterval(beat.current);
    watch.current = null; beat.current = null;
    lock.current?.release().catch(() => undefined); lock.current = null;
    try { localStorage.removeItem(key); } catch { /* private mode */ }
    setOnline(false);
    if (!silent) supabaseBrowser().rpc("go_offline", { p_business: businessId });
  }, [businessId, key]);

  const start = useCallback(async () => {
    if (!navigator.geolocation) { setMsg("This phone can’t share its location."); return; }
    setMsg(null);
    try { lock.current = (await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen")) ?? null; } catch { /* not supported */ }
    watch.current = navigator.geolocation.watchPosition((pos) => {
      const first = !last.current;
      last.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading != null && !Number.isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) % 360 : null };
      setOnline(true);
      try { localStorage.setItem(key, "1"); } catch { /* private mode */ }
      send(first);
    }, () => { setMsg("Allow location for Island Connect in your phone’s settings to go online."); stop(true); },
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
    // Heartbeat: phones don't report a new position while parked, so re-send the last one.
    beat.current = setInterval(() => { send(true); }, 30000);
  }, [key, send, stop]);

  // Stay online when moving between pages.
  useEffect(() => {
    try { if (localStorage.getItem(key) === "1") start(); } catch { /* private mode */ }
    return () => {
      if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
      if (beat.current) clearInterval(beat.current);
    };
  }, [key, start]);

  return (
    <div className="relative">
      <button type="button" onClick={() => (online ? stop() : start())} aria-pressed={online}
        className={`inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${online ? "bg-success text-white" : "border border-white/25 text-white"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${online ? "animate-pulse bg-white" : "bg-white/40"}`} aria-hidden="true" />
        {online ? "Online" : "Go online"}
      </button>
      {msg && <p role="alert" className="absolute right-0 top-12 z-50 w-64 rounded-xl bg-raised p-3 text-sm text-danger shadow-card">{msg}</p>}
    </div>
  );
}
