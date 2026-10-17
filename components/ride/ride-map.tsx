"use client";

import type { Landmark } from "@/data/landmarks";

/*
 * Schematic island map drawn from simplified coastlines. It shows where the
 * pickup and destination are relative to each other; it is not a road map and
 * draws no route along roads.
 */

type Pt = [number, number];

function smoothPath(points: Pt[]): string {
  // Closed Catmull–Rom spline converted to cubic Béziers, for softer coastlines.
  const n = points.length;
  if (n < 3) return "";
  const p = (i: number) => points[(i + n) % n];
  let d = `M${p(0)[0].toFixed(1)},${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

export function RideMap({
  coastline,
  landmarks,
  pickup,
  destination,
  onPick,
}: {
  coastline: [number, number][];
  landmarks: Landmark[];
  pickup: Landmark | null;
  destination: Landmark | null;
  onPick: (l: Landmark) => void;
}) {
  const lngs = [...coastline.map((c) => c[0]), ...landmarks.map((l) => l.lng)];
  const lats = [...coastline.map((c) => c[1]), ...landmarks.map((l) => l.lat)];
  const [minLng, maxLng, minLat, maxLat] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const W = 1000;
  const scale = W / ((maxLng - minLng) * k);
  const H = (maxLat - minLat) * scale;
  const pad = 90;
  const x = (lng: number) => pad + (lng - minLng) * k * scale;
  const y = (lat: number) => pad + (maxLat - lat) * scale;
  const land = smoothPath(coastline.map(([lng, lat]) => [x(lng), y(lat)]));

  // Frame the whole island, or zoom to the trip once both ends are chosen (as ride apps do).
  let box = { x0: 0, y0: 0, x1: W + pad * 2, y1: H + pad * 2 };
  if (pickup && destination && pickup.id !== destination.id) {
    const xs = [x(pickup.lng), x(destination.lng)];
    const ys = [y(pickup.lat), y(destination.lat)];
    const cx = (xs[0] + xs[1]) / 2;
    const cy = (ys[0] + ys[1]) / 2;
    const span = Math.max(Math.abs(xs[1] - xs[0]), Math.abs(ys[1] - ys[0])) * 1.5 + 260;
    box = { x0: cx - span / 2, y0: cy - span / 2, x1: cx + span / 2, y1: cy + span / 2 };
  }
  const vbW = box.x1 - box.x0;
  const vb = `${box.x0} ${box.y0} ${vbW} ${box.y1 - box.y0}`;
  const u = Math.max(vbW, box.y1 - box.y0) / 100; // one hundredth of the view, so markers keep their size when zoomed

  let route: string | null = null;
  if (pickup && destination && pickup.id !== destination.id) {
    const [x1, y1, x2, y2] = [x(pickup.lng), y(pickup.lat), x(destination.lng), y(destination.lat)];
    const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
    const [dx, dy] = [x2 - x1, y2 - y1];
    const bend = 0.18;
    route = `M${x1},${y1} Q${mx - dy * bend},${my + dx * bend} ${x2},${y2}`;
  }

  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="Map of the island showing pickup and destination">
      <defs>
        <pattern id="ride-water" width={u * 3.2} height={u * 3.2} patternUnits="userSpaceOnUse">
          <circle cx={u * 0.3} cy={u * 0.3} r={u * 0.22} className="fill-deep/10 dark:fill-white/5" />
        </pattern>
      </defs>
      <rect x={-20000} y={-20000} width={40000} height={40000} fill="url(#ride-water)" />
      <path d={land} className="fill-[#E4EDE6] stroke-[#C9D9CE] dark:fill-[#1D3A3B] dark:stroke-[#2A4F4F]" strokeWidth={u * 0.35} />
      {route && <path d={route} fill="none" className="stroke-ink" strokeWidth={u * 0.9} strokeLinecap="round" strokeDasharray={`0.1 ${u * 2.2}`} />}
      {landmarks.map((l) => {
        const isPick = pickup?.id === l.id;
        const isDest = destination?.id === l.id;
        if (isPick || isDest) return null;
        return (
          <g key={l.id} role="button" tabIndex={0} aria-label={`Choose ${l.name}`} className="cursor-pointer outline-none"
            onClick={() => onPick(l)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(l)}>
            <circle cx={x(l.lng)} cy={y(l.lat)} r={u * 3.5} fill="transparent" />
            <circle cx={x(l.lng)} cy={y(l.lat)} r={u * 1.2} className="fill-raised stroke-muted" strokeWidth={u * 0.5} />
            <title>{l.name}</title>
          </g>
        );
      })}
      {destination && (
        <g>
          <rect x={x(destination.lng) - u * 2.2} y={y(destination.lat) - u * 2.2} width={u * 4.4} height={u * 4.4} rx={u * 0.6} className="fill-ink" />
          <rect x={x(destination.lng) - u * 0.8} y={y(destination.lat) - u * 0.8} width={u * 1.6} height={u * 1.6} className="fill-gold" />
        </g>
      )}
      {pickup && (
        <g>
          <circle cx={x(pickup.lng)} cy={y(pickup.lat)} r={u * 2.4} className="fill-primary" />
          <circle cx={x(pickup.lng)} cy={y(pickup.lat)} r={u * 0.9} fill="#fff" />
        </g>
      )}
    </svg>
  );
}
