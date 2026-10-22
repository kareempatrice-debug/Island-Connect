import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { SharedTripLive } from "@/components/trips/shared-trip-live";
import type { SharedTrip } from "@/components/trips/live-trip";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Shared trip", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let t: SharedTrip | null = null;
  if (SUPABASE_URL && SUPABASE_PUBLIC_KEY && /^[0-9a-f]{32}$/.test(token)) {
    const db = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false } });
    t = (await db.rpc("shared_trip", { p_token: token })).data as SharedTrip | null;
  }
  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Image src="/brand/ic-lockup.png" alt="Island Connect" width={150} height={100} className="mb-5 h-auto w-24" />
        {!t ? (
          <p className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">This trip link has expired or isn’t valid. Shared trips can be followed for three days.</p>
        ) : (
          <SharedTripLive token={token} initial={t} url={SUPABASE_URL} publicKey={SUPABASE_PUBLIC_KEY}
            googleKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null} mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || null} />
        )}
      </div>
    </main>
  );
}
