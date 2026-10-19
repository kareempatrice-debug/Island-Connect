import { createTripRequestAction } from "@/app/trip-actions";
import { isSupabaseConfigured } from "@/lib/data";
import type { Metadata } from "next";
import { RideBooker, type RideOperator } from "@/components/ride/ride-booker";
import { coastlines } from "@/data/coastlines";
import { landmarks } from "@/data/landmarks";
import roadRoutes from "@/data/road-routes.json";
import { data, getCountry } from "@/lib/data";

export const metadata: Metadata = { title: "Book a taxi" };

export default async function RidePage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ vehicle?: string; from?: string }>;
}) {
  const { country: code } = await params;
  const sp = await searchParams;
  const country = (await getCountry(code))!;
  const [islands, taxis, transfers] = await Promise.all([
    data.getIslands(code),
    data.searchBusinesses(code, { category: "taxis" }, 100),
    data.searchBusinesses(code, { category: "airport-transfers" }, 100),
  ]);

  const seen = new Set<string>();
  const operators: RideOperator[] = [...taxis, ...transfers]
    .filter((b) => (seen.has(b.slug) ? false : (seen.add(b.slug), true)))
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      tagline: b.tagline,
      islands: [
        ...b.locations.filter((l) => l.countryCode === code).map((l) => l.islandSlug),
        ...b.serviceAreas.filter((a) => a.countryCode === code).map((a) => a.islandSlug),
      ],
      whatsapp: b.whatsapp,
      phone: b.phone,
      isDemo: b.isDemo,
          canMessage: isSupabaseConfigured && !b.isDemo && b.claimStatus === "claimed",
      verified: b.verificationStatus === "verified" && !b.isDemo,
    }))
    .sort((a, b) => Number(a.isDemo) - Number(b.isDemo) || Number(b.verified) - Number(a.verified));

  const points = landmarks.filter((l) => l.countryCode === code);
  const rideIslands = islands
    .filter((i) => points.some((p) => p.island === i.slug) && coastlines[i.slug])
    .map((i) => ({ slug: i.slug, name: i.name }));

  return (
    <main>
      <RideBooker
        countryCode={code}
        countryName={country.name}
        islands={rideIslands}
        landmarks={points}
        coastlines={Object.fromEntries(rideIslands.map((i) => [i.slug, coastlines[i.slug]]))}
        routes={Object.fromEntries(Object.entries(roadRoutes as unknown as Record<string, { km: number; min: number; path: [number, number][] }>).filter(([k]) => points.some((p) => p.id === k.split("|")[0])))}
        operators={operators}
        initialVehicle={sp.vehicle === "van" ? "van" : "car"}
        startAtAirport={sp.from === "airport"}
        requestInApp={isSupabaseConfigured ? createTripRequestAction : undefined}
      />
    </main>
  );
}
