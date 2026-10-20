/* Small map helpers shared by the ride screens. */
export interface LatLng { lat: number; lng: number }

/** Decodes a Google encoded polyline into points. */
export function decodePolyline(encoded: string): LatLng[] {
  const pts: LatLng[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    for (const which of [0, 1]) {
      let result = 0, shift = 0, b: number;
      do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lng += d;
    }
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}

/** Straight-line distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371, toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** A Google Maps link drivers can open for turn-by-turn directions (no key needed). */
export function directionsLink(from: Partial<LatLng> & { label?: string }, to: Partial<LatLng> & { label?: string }): string {
  const q = (p: Partial<LatLng> & { label?: string }) => (p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : encodeURIComponent(p.label ?? ""));
  return `https://www.google.com/maps/dir/?api=1&origin=${q(from)}&destination=${q(to)}&travelmode=driving`;
}
