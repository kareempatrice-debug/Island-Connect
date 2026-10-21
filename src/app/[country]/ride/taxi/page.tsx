import { createTripRequestAction } from "@/app/trip-actions";
import { isSupabaseConfigured } from "@/lib/data";
import type { Metadata } from "next";
import { RideRequest, type RideOperator } from "@/components/ride/ride-request";
import { getViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";
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
  searchParams: Promise<{ vehicle?: string; from?: string; to?: string; fromll?: string; toll?: string; when?: string }>;
}) {
  const { country: code } = await params;
  const sp = await searchParams;
  const country = (await getCountry(code))!;
  const [viewer, islands, taxis, transfers] = await Promise.all([
    isSupabaseConfigured ? getViewer() : Promise.resolve(null),
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

  let family: { name: string; phone_e164: string | null; kind: "adult" | "senior" | "teen" }[] = [];
  if (viewer) {
    const supabase = await supabaseForRequest();
    family = ((await supabase.from("family_members").select("name, phone_e164, kind").order("created_at")).data ?? []) as typeof family;
  }
  // Rebook: the previous trip's places, passed in the link.
  const ll = (v?: string) => { const m = /^(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)$/.exec(v ?? ""); return m ? { lat: Number(m[1]), lng: Number(m[2]) } : {}; };
  const text = (v?: string) => (v ?? "").trim().slice(0, 160);
  const prefill = sp.from && sp.from !== "airport" && sp.to ? { from: { label: text(sp.from), ...ll(sp.fromll) }, to: { label: text(sp.to), ...ll(sp.toll) } } : undefined;
  const points = landmarks.filter((l) => l.countryCode === code);
  const rideIslands = islands
    .filter((i) => points.some((p) => p.island === i.slug) && coastlines[i.slug])
    .map((i) => ({ slug: i.slug, name: i.name }))
    .sort((a, b) => Number(b.slug === (code === "vc" ? "st-vincent" : "grenada")) - Number(a.slug === (code === "vc" ? "st-vincent" : "grenada")));

  return (
    <main>
      <RideRequest
        countryCode={code}
        countryName={country.name}
        islands={rideIslands}
        landmarks={points}
        coastlines={Object.fromEntries(rideIslands.map((i) => [i.slug, coastlines[i.slug]]))}
        routes={Object.fromEntries(Object.entries(roadRoutes as unknown as Record<string, { km: number; min: number; path: [number, number][] }>).filter(([k]) => points.some((p) => p.id === k.split("|")[0])))}
        operators={operators}
        initialVehicle={sp.vehicle === "van" ? "van" : "car"}
        startAtAirport={sp.from === "airport"}
        googleKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || undefined}
        signedIn={Boolean(viewer) || !isSupabaseConfigured}
        liveVehicles={isSupabaseConfigured}
        family={family}
        initialWhen={sp.when === "later" ? "later" : "now"}
        prefill={prefill}
        requestInApp={isSupabaseConfigured ? createTripRequestAction : undefined}
      />
    </main>
  );
}
