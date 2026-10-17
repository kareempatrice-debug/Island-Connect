import Link from "next/link";
import type { Country, Island } from "@/lib/types";

/*
 * The two launch countries drawn as the island chain they actually are, from
 * St. Vincent in the north to Grenada in the south, plotted from real
 * coordinates. Each island links to listings on that island.
 */
export function IslandChain({ countries, islands }: { countries: Country[]; islands: Island[] }) {
  const W = 320;
  const H = 520;
  const pad = 30;
  const labelRoom = 130; // labels sit to the right of each island
  const lats = islands.map((i) => i.lat);
  const lngs = islands.map((i) => i.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  // Same scale on both axes so the chain keeps its real shape.
  const scale = Math.min((W - pad - labelRoom) / (maxLng - minLng || 1), (H - pad * 2) / (maxLat - minLat || 1));
  const x = (lng: number) => pad + (lng - minLng) * scale;
  const y = (lat: number) => pad + (maxLat - lat) * scale;
  const colour: Record<string, string> = { gd: "#E85B43", vc: "#0B6FB8" };
  const name = (code: string) => countries.find((c) => c.code === code)?.name ?? code;
  const ordered = [...islands].sort((a, b) => b.lat - a.lat);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[320px]" role="img" aria-labelledby="chain-title">
      <title id="chain-title">Map of the islands of St. Vincent and the Grenadines and Grenada</title>
      <polyline
        points={ordered.map((i) => `${x(i.lng)},${y(i.lat)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      {ordered.map((i) => {
        const r = i.isMain ? 15 : 6;
        return (
          <Link key={`${i.countryCode}-${i.slug}`} href={`/${i.countryCode}/explore?island=${i.slug}`} aria-label={`${i.name}, ${name(i.countryCode)}`}>
            <circle cx={x(i.lng)} cy={y(i.lat)} r={r} fill={colour[i.countryCode] ?? "#025F70"} />
            <circle cx={x(i.lng)} cy={y(i.lat)} r={r + 6} fill="transparent" />
            <text
              x={x(i.lng) + r + 8}
              y={y(i.lat) + 4}
              className="fill-current font-sans"
              fontSize={i.isMain ? 15 : 12}
              fontWeight={i.isMain ? 700 : 400}
            >
              {i.name}
            </text>
          </Link>
        );
      })}
    </svg>
  );
}
