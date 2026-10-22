"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Car, Clock, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { googleRoute, loadGoogleMaps } from "@/components/ride/google-maps";
import { haversineKm } from "@/lib/geo";
import { cleanPlace } from "@/lib/place-text";

type Pt = { lat: number; lng: number };
export interface SharedTrip {
  pickup: string; dropoff: string; travel_at: string | null; status: string; rider: string; operator: string | null;
  picked_up_at: string | null; country: string; driver_position: (Pt & { heading: number | null; at: string }) | null;
  pickup_point: Pt | null; dropoff_point: Pt | null; driver: string; vehicle: string | null; plate: string | null;
}

const CAR_PATH = "M -5 -9 Q -5 -11 -3 -11 L 3 -11 Q 5 -11 5 -9 L 5 9 Q 5 11 3 11 L -3 11 Q -5 11 -5 9 Z M -4 -7 L 4 -7 L 3 -3 L -3 -3 Z";

/*
 * Like Uber's "Share my trip": a live map with the car moving (refreshed every 10 seconds), the
 * pick-up and destination, the route, the expected arrival time, and the driver and car to look for.
 * Used on the shared link (fetch = the share token) and can be reused elsewhere.
 */
export function LiveTrip({ initial, fetchTrip, googleKey, mapId }: {
  initial: SharedTrip; fetchTrip: () => Promise<SharedTrip | null>; googleKey: string | null; mapId: string | null;
}) {
  const [t, setT] = useState(initial);
  const [eta, setEta] = useState<{ min: number; km: number } | null>(null);
  const [updated, setUpdated] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const el = useRef<HTMLDivElement>(null);
  const g = useRef<{ maps: any; map: any; car: any; line: any; fitted: boolean; lastRoute: number } | null>(null);

  // Refresh every 10 seconds while the trip is live.
  useEffect(() => {
    if (!["open", "booked"].includes(t.status)) return;
    const tick = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const fresh = await fetchTrip().catch(() => null);
      if (fresh) { setT(fresh); setUpdated(Date.now()); }
    }, 10000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(tick); clearInterval(clock); };
  }, [t.status, fetchTrip]);

  const pos = t.driver_position;
  const target = t.picked_up_at ? t.dropoff_point : t.pickup_point;

  // Expected arrival: Google's drive time when available, otherwise distance at about 30 km/h.
  useEffect(() => {
    if (!pos || !target) { setEta(null); return; }
    const km = haversineKm(pos, target) * 1.3;
    setEta({ km: Math.round(km * 10) / 10, min: Math.max(1, Math.round((km / 30) * 60)) });
  }, [pos, target]);

  // The map.
  useEffect(() => {
    if (!googleKey || !el.current) return;
    let alive = true;
    (async () => {
      const maps = (await loadGoogleMaps(googleKey)).maps;
      if (!alive || !el.current) return;
      if (!g.current) {
        const { Map } = await maps.importLibrary("maps");
        const map = new Map(el.current, {
          center: pos ?? t.pickup_point ?? { lat: 12.05, lng: -61.75 }, zoom: 13, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
          ...(mapId ? { mapId, colorScheme: maps.ColorScheme?.FOLLOW_SYSTEM ?? "FOLLOW_SYSTEM" } : {}),
        });
        const dot = (p: Pt | null, fill: string, shape: "circle" | "square") => p && new maps.Marker({
          map, position: p, clickable: false,
          icon: shape === "circle"
            ? { path: maps.SymbolPath.CIRCLE, scale: 7, fillColor: fill, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }
            : { path: "M -6 -6 L 6 -6 L 6 6 L -6 6 Z", scale: 1, fillColor: fill, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        });
        dot(t.pickup_point, "#07565A", "circle");
        dot(t.dropoff_point, "#172B32", "square");
        g.current = { maps, map, car: null, line: null, fitted: false, lastRoute: 0 };
      }
      const s = g.current;
      if (pos) {
        if (!s.car) s.car = new maps.Marker({ map: s.map, clickable: false, zIndex: 9, icon: { path: CAR_PATH, fillColor: "#172B32", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 1.5, scale: 1.4, rotation: pos.heading ?? 0 } });
        s.car.setPosition(pos);
        s.car.setIcon({ ...s.car.getIcon(), rotation: pos.heading ?? 0 });
      }
      // Route from the car to where it's heading (refreshed at most every 60 seconds).
      if (pos && target && Date.now() - s.lastRoute > 60000) {
        s.lastRoute = Date.now();
        const r = await googleRoute(googleKey, pos, target).catch(() => null);
        if (r && alive) {
          s.line?.setMap(null);
          s.line = new maps.Polyline({ map: s.map, path: r.path, strokeColor: "#07565A", strokeOpacity: 0.9, strokeWeight: 5 });
          setEta({ km: r.km, min: r.min });
        }
      }
      if (!s.fitted) {
        const b = new maps.LatLngBounds();
        [pos, t.pickup_point, t.dropoff_point].forEach((p) => p && b.extend(p));
        if (!b.isEmpty()) { s.map.fitBounds(b, 60); s.fitted = true; }
      }
    })().catch(() => undefined);
    return () => { alive = false; };
  }, [googleKey, mapId, pos, target, t.pickup_point, t.dropoff_point]);

  const status = t.status === "completed" ? "Arrived" : t.picked_up_at ? "On the way" : t.status === "booked" ? "Driver on the way to pick-up" : t.status === "open" ? "Finding a driver" : "No longer active";
  const live = t.status === "booked";
  const age = pos ? Math.round((now - new Date(pos.at).getTime()) / 1000) : null;
  const when = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "America/Grenada" });

  return (
    <div className="overflow-hidden rounded-2xl bg-raised ring-1 ring-line/60">
      {live && googleKey && (t.pickup_point || pos) && <div ref={el} className="h-[46vh] min-h-64 w-full bg-sunken" aria-label="Live map of the trip" role="img" />}
      <div className="space-y-4 p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
            {live && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" aria-hidden="true" />}{status}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{t.rider ? `${t.rider}’s trip` : "A shared trip"}</h1>
        </div>

        {live && eta && (
          <p className="flex items-center gap-2 rounded-xl bg-deep px-4 py-3 text-white">
            <Clock className="h-5 w-5 text-gold" aria-hidden="true" />
            <span><strong className="text-lg">{t.picked_up_at ? `Arriving about ${when(Date.now() + eta.min * 60000)}` : `Pick-up in about ${eta.min} min`}</strong>
              <span className="block text-sm text-white/80">{eta.min} min · {eta.km} km {t.picked_up_at ? "to go" : "away"}</span></span>
          </p>
        )}

        {(t.driver || t.vehicle || t.plate || t.operator) && t.status !== "open" && (
          <div className="flex items-center gap-3 rounded-xl bg-sunken p-3">
            <Car className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{t.driver || t.operator}{t.driver && t.operator ? <span className="font-normal text-muted"> · {t.operator}</span> : null}</p>
              {t.vehicle && <p className="text-sm">{t.vehicle}</p>}
            </div>
            {t.plate && <span className="shrink-0 rounded-lg border-2 border-ink bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[#172B32]">{t.plate}</span>}
          </div>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex gap-3"><dt className="w-5"><span className="mt-1 block h-2.5 w-2.5 rounded-full bg-primary" aria-label="From" /></dt><dd className="font-semibold text-ink">{cleanPlace(t.pickup)}</dd></div>
          <div className="flex gap-3"><dt className="w-5"><MapPin className="h-4 w-4 text-ink" aria-label="To" /></dt><dd className="font-semibold text-ink">{cleanPlace(t.dropoff)}</dd></div>
        </dl>

        {live && !pos && <p className="rounded-xl bg-sunken px-4 py-3 text-sm">The driver’s location will appear here when their Island Connect app is open and online.</p>}
        {live && age != null && age > 90 && <p className="text-sm text-danger">Location last updated {Math.round(age / 60)} min ago. The driver’s phone may have lost signal.</p>}
        {live && pos && !googleKey && (
          <a href={`https://www.google.com/maps?q=${pos.lat},${pos.lng}`} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-full bg-deep font-semibold text-white">See the driver on a map</a>
        )}
        <p className="text-xs">{live ? `Live: updates every 10 seconds, last at ${when(updated)}. ` : ""}Shared with you by someone using Island Connect. Phone numbers are never shown.</p>
      </div>
    </div>
  );
}
