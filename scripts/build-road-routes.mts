/*
 * Builds src/data/road-routes.json: the road route between every pair of ride
 * landmarks on the same island, from OpenStreetMap via the OSRM routing service.
 * Run again whenever landmarks change:  npx tsx scripts/build-road-routes.mts
 * Route geometry © OpenStreetMap contributors (ODbL).
 */
import { writeFileSync } from "node:fs";
import { landmarks } from "../src/data/landmarks";

type Pt = [number, number];
function simplify(points: Pt[], tol: number): Pt[] {
  if (points.length < 3) return points;
  const [a, b] = [points[0], points[points.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const num = Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]);
    const den = Math.hypot(b[1] - a[1], b[0] - a[0]) || 1e-12;
    if (num / den > max) { max = num / den; idx = i; }
  }
  if (max <= tol) return [a, b];
  return [...simplify(points.slice(0, idx + 1), tol).slice(0, -1), ...simplify(points.slice(idx), tol)];
}

const out: Record<string, { km: number; min: number; path: Pt[] }> = {};
const byIsland = new Map<string, typeof landmarks>();
for (const l of landmarks) byIsland.set(l.island, [...(byIsland.get(l.island) ?? []), l]);
for (const [island, pts] of byIsland) {
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const [p, q] = [pts[i], pts[j]];
    const url = `https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${q.lng},${q.lat}?overview=full&geometries=geojson`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(url).then((x) => x.json());
        if (r.code !== "Ok") throw new Error(r.code);
        const route = r.routes[0];
        const path = simplify(route.geometry.coordinates as Pt[], 0.0003).map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))] as Pt);
        // Store every path running from the alphabetically first point, so the app can reverse it reliably.
        out[[p.id, q.id].sort().join("|")] = { km: Math.round(route.distance / 100) / 10, min: Math.max(1, Math.round(route.duration / 60)), path: p.id < q.id ? path : path.reverse() };
        break;
      } catch (e) {
        if (attempt === 2) console.error("failed", island, p.id, q.id, (e as Error).message);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}
writeFileSync("src/data/road-routes.json", JSON.stringify(out));
console.log(Object.keys(out).length, "routes");
