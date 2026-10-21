"use client";

import { Loader2, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/*
 * "Go online": while this page is open, the driver's phone shares its position every 20 seconds,
 * so customers see a car near them on the map. Customers only see an approximate position and
 * no name. Phones stop sharing when the screen locks, so we ask the screen to stay awake.
 */
export function GoOnline({ businessId }: { businessId: string }) {
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const watch = useRef<number | null>(null);
  const last = useRef(0);
  const lock = useRef<{ release: () => Promise<void> } | null>(null);

  async function stop(silent = false) {
    if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    lock.current?.release().catch(() => undefined);
    lock.current = null;
    setOnline(false);
    if (!silent) await supabaseBrowser().rpc("go_offline", { p_business: businessId });
  }

  async function start() {
    if (!navigator.geolocation) return setMsg("This phone can’t share its location.");
    setBusy(true);
    setMsg(null);
    try {
      lock.current = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen").catch(() => null) ?? null;
    } catch { /* not supported: the driver keeps the screen on */ }
    watch.current = navigator.geolocation.watchPosition(async (pos) => {
      setBusy(false);
      setOnline(true);
      if (Date.now() - last.current < 20000) return;
      last.current = Date.now();
      const { error } = await supabaseBrowser().rpc("set_presence", {
        p_business: businessId, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude,
        p_heading: pos.coords.heading != null && !Number.isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) % 360 : null,
      });
      if (error) { setMsg(error.message); stop(true); }
    }, () => {
      setBusy(false);
      setMsg("Location is switched off for this site. Allow location in your phone’s settings to go online.");
      stop(true);
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }

  // Going offline when the page closes keeps the map honest.
  useEffect(() => () => { if (watch.current != null) { navigator.geolocation.clearWatch(watch.current); supabaseBrowser().rpc("go_offline", { p_business: businessId }); } }, [businessId]);

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-4 ring-1 ${online ? "bg-success/10 ring-success/40" : "bg-raised ring-line/60"}`}>
      <Radio className={`h-6 w-6 ${online ? "text-success" : "text-muted"}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{online ? "You’re online" : "You’re offline"}</p>
        <p className="text-sm">{online ? "Customers can see a car near you on the map. Keep this page open; your phone stops sharing when the screen locks." : "Go online to show customers a car near you on the ride map."}</p>
      </div>
      <button type="button" onClick={() => (online ? stop() : start())} disabled={busy}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold ${online ? "border border-line bg-raised text-ink" : "bg-primary text-primary-ink"}`}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{online ? "Go offline" : "Go online"}
      </button>
      {msg && <p role="alert" className="w-full text-sm text-danger">{msg}</p>}
    </div>
  );
}
