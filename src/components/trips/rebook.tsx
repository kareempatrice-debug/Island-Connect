import { RotateCw } from "lucide-react";
import Link from "next/link";

/* "Rebook": opens the ride screen with the same pick-up and destination filled in. */
export function RebookLink({ country, trip }: { country: string; trip: { pickup: string; dropoff: string; pickup_lat?: number | null; pickup_lng?: number | null; dropoff_lat?: number | null; dropoff_lng?: number | null; kind?: string } }) {
  if (trip.kind && !["taxi", "airport", "group"].includes(trip.kind)) return null;
  const q = new URLSearchParams({ from: trip.pickup, to: trip.dropoff });
  if (trip.pickup_lat != null && trip.pickup_lng != null) q.set("fromll", `${trip.pickup_lat},${trip.pickup_lng}`);
  if (trip.dropoff_lat != null && trip.dropoff_lng != null) q.set("toll", `${trip.dropoff_lat},${trip.dropoff_lng}`);
  return (
    <Link href={`/${country}/ride/taxi?${q}`} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-sunken px-4 text-sm font-semibold text-ink">
      <RotateCw className="h-4 w-4" aria-hidden="true" />Rebook
    </Link>
  );
}
