import Link from "next/link";
import { overviewCoastlines } from "@/data/coastlines-overview";
import type { Country, Island } from "@/lib/types";

/*
 * The island chain as it really looks: every island drawn from its coastline,
 * at true relative size and position, St. Vincent in the north to Grenada in
 * the south. Labels sit in a column to the right with leader lines, so the small
 * southern Grenadines stay legible. Each island links to its listings.
 */

const COLOUR: Record<string, { fill: string; hover: string }> = {
  vc: { fill: "#0B6FB8", hover: "#095A96" },
  gd: { fill: "#E85B43", hover: "#C9452E" },
};

export function IslandChain({ countries, islands }: { countries: Country[]; islands: Island[] }) {
  const shapes = islands
    .map((i) => ({ island: i, ring: overviewCoastlines[i.slug] }))
    .filter((s): s is { island: Island; ring: [number, number][] } => Boolean(s.ring));

  const all = shapes.flatMap((s) => s.ring);
  const lngs = all.map((p) => p[0]);
  const lats = all.map((p) => p[1]);
  const [minLng, maxLng, minLat, maxLat] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);

  const mapH = 760;
  const scale = mapH / (maxLat - minLat);
  const mapW = (maxLng - minLng) * k * scale;
  const pad = 24;
  const labelX = pad + mapW + 46;
  const W = labelX + 200;
  const H = mapH + pad * 2;
  const x = (lng: number) => pad + (lng - minLng) * k * scale;
  const y = (lat: number) => pad + (maxLat - lat) * scale;

  const path = (ring: [number, number][]) =>
    "M" + ring.map(([lng, lat]) => `${x(lng).toFixed(1)},${y(lat).toFixed(1)}`).join("L") + "Z";

  // Anchor each label at the island's easternmost point, then space labels out vertically.
  const anchors = shapes
    .map((s) => {
      const east = s.ring.reduce((a, b) => (b[0] > a[0] ? b : a));
      const cy = s.ring.reduce((sum, p) => sum + p[1], 0) / s.ring.length;
      return { ...s, ax: x(east[0]), ay: y(cy) };
    })
    .sort((a, b) => a.ay - b.ay);
  const gap = 38;
  let last = -Infinity;
  const placed = anchors.map((a) => {
    const ly = Math.max(a.ay, last + gap);
    last = ly;
    return { ...a, ly };
  });
  const name = (code: string) => countries.find((c) => c.code === code)?.name ?? code;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby="chain-title chain-desc">
      <title id="chain-title">Map of St. Vincent and the Grenadines and Grenada</title>
      <desc id="chain-desc">Each island is a link to the businesses listed there.</desc>
      {placed.map(({ island, ring, ax, ay, ly }) => {
        const c = COLOUR[island.countryCode] ?? COLOUR.vc;
        const main = island.isMain;
        return (
          <Link
            key={`${island.countryCode}-${island.slug}`}
            href={`/${island.countryCode}/explore?island=${island.slug}`}
            aria-label={`${island.name}, ${name(island.countryCode)}`}
            className="group outline-none"
          >
            <path d={path(ring)} fill={c.fill} className="transition-[fill] duration-200 group-hover:fill-[var(--hover)] group-focus-visible:fill-[var(--hover)]" style={{ ["--hover" as string]: c.hover }} />
            {/* A generous invisible target so tiny islands are easy to tap. */}
            <circle cx={ax - 4} cy={ay} r="20" fill="transparent" />
            <polyline
              points={`${ax + 6},${ay} ${labelX - 26},${ay} ${labelX - 8},${ly}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.28"
              strokeWidth="1.25"
            />
            <text
              x={labelX}
              y={ly + 7}
              className="fill-current font-sans transition-opacity group-hover:opacity-70"
              fontSize={main ? 28 : 22}
              fontWeight={main ? 600 : 400}
            >
              {island.name}
            </text>
          </Link>
        );
      })}
    </svg>
  );
}
