"use client";

import { Car } from "lucide-react";
import { useState } from "react";
import { GoogleRideMap } from "@/components/ride/google-ride-map";
import { RideMap } from "@/components/ride/ride-map";
import type { Landmark } from "@/data/landmarks";

/* Booked ride: where the customer's driver is now, with the pick-up point. */
export function DriverMap({ googleKey, pickup, driver, coastline, landmarks, car }: {
  car?: { driver: string; vehicle: string | null; plate: string | null } | null;
  googleKey: string | null;
  pickup: { label: string; lat: number; lng: number };
  driver: { lat: number; lng: number; heading: number | null; km: number | null; at: string } | null;
  coastline: [number, number][];
  landmarks: Landmark[];
}) {
  const [google, setGoogle] = useState(Boolean(googleKey));
  const cars = driver ? [{ lat: driver.lat, lng: driver.lng, heading: driver.heading, van: false }] : [];
  const secs = driver ? Math.max(0, Math.round((Date.now() - new Date(driver.at).getTime()) / 1000)) : 0;
  const pin: Landmark = { id: "pickup", name: pickup.label, countryCode: "", island: landmarks[0]?.island ?? "", kind: "area", lat: pickup.lat, lng: pickup.lng };
  return (
    <section className="mb-6 overflow-hidden rounded-2xl ring-1 ring-line/60" aria-label="Your driver on the map">
      <div className="relative h-56 bg-sunken">
        {google && googleKey ? (
          <GoogleRideMap apiKey={googleKey} center={driver ?? pickup} pickup={{ lat: pickup.lat, lng: pickup.lng }} dropoff={null}
            path={null} pinMode={false} onTap={() => undefined} onFail={() => setGoogle(false)} vehicles={cars} />
        ) : (
          <RideMap coastline={coastline} landmarks={[pin]} pickup={pin} destination={null} road={null} vehicles={cars} onPick={() => undefined} />
        )}
      </div>
      {car && (car.driver || car.vehicle || car.plate) && (
        <div className="flex items-center gap-3 border-b border-line bg-raised px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{car.driver ? `${car.driver} is your driver` : "Your driver"}</p>
            {car.vehicle && <p className="text-sm">Look for a {car.vehicle.toLowerCase()}</p>}
          </div>
          {car.plate && <span className="shrink-0 rounded-lg border-2 border-ink bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[#172B32]">{car.plate}</span>}
        </div>
      )}
      <p className="flex items-center gap-2 bg-raised px-4 py-3 text-sm">
        <Car className="h-4 w-4 text-primary" aria-hidden="true" />
        {driver
          ? <span><strong className="text-ink">{driver.km != null ? `About ${Math.max(1, Math.round((Number(driver.km) * 1.3 / 30) * 60))} min away (${Number(driver.km).toFixed(1)} km)` : "Your driver is on the map"}</strong> · updated {secs < 60 ? "just now" : `${Math.round(secs / 60)} min ago`}</span>
          : <span>Your driver’s location appears here when they’re online in the app.</span>}
      </p>
    </section>
  );
}
