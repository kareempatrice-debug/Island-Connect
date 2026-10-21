import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { AutoRefresh } from "@/components/trips/auto-refresh";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { fmtWhen } from "@/lib/trips";

export const metadata: Metadata = { title: "Shared trip", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function SharedTrip({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let t: any = null;
  if (SUPABASE_URL && SUPABASE_PUBLIC_KEY && /^[0-9a-f]{32}$/.test(token)) {
    const db = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false } });
    t = (await db.rpc("shared_trip", { p_token: token })).data;
  }
  const status = !t ? null : t.status === "completed" ? "Arrived" : t.picked_up_at ? "On the way" : t.status === "booked" ? "Driver booked" : t.status === "open" ? "Finding a driver" : "No longer active";
  const pos = t?.driver_position;
  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-md px-5 py-8">
        <Image src="/brand/ic-lockup.png" alt="Island Connect" width={150} height={100} className="h-auto w-24" />
        {!t ? (
          <p className="mt-8 rounded-2xl bg-raised p-5 ring-1 ring-line/60">This trip link has expired or isn’t valid. Shared trips can be followed for three days.</p>
        ) : (
          <div className="mt-8 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
            <AutoRefresh seconds={20} />
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{status}</p>
            <h1 className="mt-1 text-2xl font-bold">{t.rider ? `${t.rider}’s trip` : "A shared trip"}</h1>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt>From</dt><dd className="font-semibold text-ink">{t.pickup}</dd>
              <dt>To</dt><dd className="font-semibold text-ink">{t.dropoff}</dd>
              <dt>When</dt><dd className="text-ink">{fmtWhen(t.travel_at)}</dd>
              {t.operator && <><dt>Driver</dt><dd className="text-ink">{t.operator}</dd></>}
              {t.picked_up_at && <><dt>Picked up</dt><dd className="text-ink">{new Date(t.picked_up_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "America/Grenada" })}</dd></>}
            </dl>
            {pos && (
              <a href={`https://www.google.com/maps?q=${pos.lat},${pos.lng}`} target="_blank" rel="noopener noreferrer" className="mt-5 flex h-12 items-center justify-center rounded-full bg-deep font-semibold text-white">
                See the driver’s location on a map
              </a>
            )}
            <p className="mt-4 text-xs">This page updates every 20 seconds. It was shared with you by someone using Island Connect.</p>
          </div>
        )}
      </div>
    </main>
  );
}
