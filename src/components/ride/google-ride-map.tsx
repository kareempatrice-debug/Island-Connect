"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "./google-maps";

type P = { lat: number; lng: number } | null;

/* The ride map, drawn by Google: pickup and destination pins, the driving route, and tap-to-pick. */
export function GoogleRideMap({ apiKey, center, pickup, dropoff, path, pinMode, onTap, onFail, vehicles = [] }: {
  vehicles?: { lat: number; lng: number; heading: number | null; van: boolean }[];
  apiKey: string; center: { lat: number; lng: number }; pickup: P; dropoff: P; path: { lat: number; lng: number }[] | null;
  pinMode: boolean; onTap: (p: { lat: number; lng: number }) => void; onFail: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layers = useRef<any[]>([]);
  const carLayer = useRef<any[]>([]);
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const pinRef = useRef(pinMode);
  pinRef.current = pinMode;

  useEffect(() => {
    let alive = true;
    loadGoogleMaps(apiKey).then(async (g) => {
      if (!alive || !el.current) return;
      const { Map } = await g.maps.importLibrary("maps");
      map.current = new Map(el.current, {
        center, zoom: 12, disableDefaultUI: true, zoomControl: true, clickableIcons: false, gestureHandling: "greedy",
        styles: [{ featureType: "poi.business", stylers: [{ visibility: "off" }] }],
      });
      map.current.addListener("click", (e: any) => {
        if (pinRef.current && e.latLng) tapRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }).catch(onFail);
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const g = (window as any).google;
    if (!map.current || !g) return;
    layers.current.forEach((l) => l.setMap(null));
    layers.current = [];
    const dot = (p: { lat: number; lng: number }, fill: string, square = false) =>
      new g.maps.Marker({ map: map.current, position: p, clickable: false,
        icon: square
          ? { path: "M -6 -6 L 6 -6 L 6 6 L -6 6 Z", fillColor: fill, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 1 }
          : { path: g.maps.SymbolPath.CIRCLE, fillColor: fill, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3, scale: 8 } });
    if (path?.length) {
      layers.current.push(new g.maps.Polyline({ map: map.current, path, strokeColor: "#ffffff", strokeWeight: 8, strokeOpacity: 1 }));
      layers.current.push(new g.maps.Polyline({ map: map.current, path, strokeColor: "#07565A", strokeWeight: 5, strokeOpacity: 1 }));
    }
    if (pickup) layers.current.push(dot(pickup, "#07565A"));
    if (dropoff) layers.current.push(dot(dropoff, "#172B32", true));
    const pts = [...(path ?? []), ...(pickup ? [pickup] : []), ...(dropoff ? [dropoff] : [])];
    if (pts.length > 1) {
      const b = new g.maps.LatLngBounds();
      pts.forEach((p) => b.extend(p));
      map.current.fitBounds(b, { top: 40, bottom: 40, left: 40, right: 40 });
    } else if (pts.length === 1) {
      map.current.panTo(pts[0]);
      map.current.setZoom(14);
    }
  }, [pickup, dropoff, path]);

  // Cars nearby, drawn as small top-down car shapes pointing the way they are heading.
  useEffect(() => {
    const g = (window as any).google;
    if (!map.current || !g) return;
    carLayer.current.forEach((m) => m.setMap(null));
    carLayer.current = vehicles.map((v) => new g.maps.Marker({
      map: map.current, position: { lat: v.lat, lng: v.lng }, clickable: false, zIndex: 1,
      icon: { path: "M -5 -9 Q -5 -11 -3 -11 L 3 -11 Q 5 -11 5 -9 L 5 9 Q 5 11 3 11 L -3 11 Q -5 11 -5 9 Z M -4 -7 L 4 -7 L 3 -3 L -3 -3 Z",
        fillColor: v.van ? "#F4B846" : "#172B32", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 1.5, scale: 1.1, rotation: v.heading ?? 0 },
    }));
  }, [vehicles]);

  return <div ref={el} className={`h-full w-full ${pinMode ? "cursor-crosshair" : ""}`} role="application" aria-label="Map" />;
}
