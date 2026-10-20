/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Loads Google Maps in the browser, once. Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, a browser key
 * restricted to islandconnect.cc in Google Cloud (it is meant to be public, like all map keys).
 * APIs used: Maps JavaScript, Places (New), Routes and Geocoding.
 */
let loading: Promise<any> | null = null;

export function loadGoogleMaps(key: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No browser"));
  const w = window as any;
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    w.__icMapsReady = () => resolve(w.google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=places,geometry&callback=__icMapsReady`;
    s.async = true;
    s.onerror = () => { loading = null; reject(new Error("Google Maps couldn’t load")); };
    document.head.appendChild(s);
  });
  return loading;
}

export interface RouteResult { km: number; min: number; path: { lat: number; lng: number }[] }

/** Driving route from Google's Routes API. */
export async function googleRoute(key: string, a: { lat: number; lng: number }, b: { lat: number; lng: number }): Promise<RouteResult | null> {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline" },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: a.lat, longitude: a.lng } } },
      destination: { location: { latLng: { latitude: b.lat, longitude: b.lng } } },
      travelMode: "DRIVE",
    }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  const r = j.routes?.[0];
  if (!r) return null;
  const { decodePolyline } = await import("@/lib/geo");
  return { km: Math.round((r.distanceMeters / 1000) * 10) / 10, min: Math.max(1, Math.round(parseInt(String(r.duration), 10) / 60)), path: decodePolyline(r.polyline.encodedPolyline) };
}
