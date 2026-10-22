"use client";

import { createClient } from "@supabase/supabase-js";
import { useCallback, useMemo } from "react";
import { LiveTrip, type SharedTrip } from "./live-trip";

/* The shared-link page's live view: fetches the trip with the share token, no sign-in needed. */
export function SharedTripLive({ token, initial, url, publicKey, googleKey, mapId }: {
  token: string; initial: SharedTrip; url: string; publicKey: string; googleKey: string | null; mapId: string | null;
}) {
  const db = useMemo(() => createClient(url, publicKey, { auth: { persistSession: false } }), [url, publicKey]);
  const fetchTrip = useCallback(async () => ((await db.rpc("shared_trip", { p_token: token })).data as SharedTrip | null), [db, token]);
  return <LiveTrip initial={initial} fetchTrip={fetchTrip} googleKey={googleKey} mapId={mapId} />;
}
