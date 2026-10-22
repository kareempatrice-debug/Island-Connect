"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CountrySwitcher } from "@/components/country-switcher";
import { DriverOnline } from "@/components/trips/driver-online";
import { StripLink } from "@/components/trips/strip-link";

export interface Session {
  signedIn: boolean; name?: string | null; isAdmin?: boolean; driverBusinessId?: string | null;
  trip?: { id: string; status: string; picked_up_at: string | null; country_code: string } | null;
  offer?: { id: string; price: number; km: number | null } | null; waiting?: number; opSlug?: string | null;
}
const Ctx = createContext<Session | null>(null);

/*
 * Loads "who's signed in" after the page has appeared, so pages themselves can be served
 * ready-made (fast). Refreshes when you move between pages (so signing in or out shows straight
 * away), and every 30 seconds while a page is open.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Session | null>(null);
  const path = usePathname();
  const last = useRef(0);
  useEffect(() => {
    const load = async (force = false) => {
      if (!force && Date.now() - last.current < 10000) return;
      last.current = Date.now();
      try { const r = await fetch("/api/session", { cache: "no-store" }); if (r.ok) setS(await r.json()); } catch { /* offline */ }
    };
    load(true);
    const t = setInterval(() => { if (document.visibilityState === "visible") load(true); }, 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!last.current) return;
    if (Date.now() - last.current < 1500) return;
    last.current = Date.now();
    fetch("/api/session", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => j && setS(j)).catch(() => undefined);
  }, [path]);
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);

type Option = { code: string; name: string; shortName: string };
export function HeaderSwitcher({ current, countries, enabled }: { current: Option; countries: Option[]; enabled: boolean }) {
  const s = useSession();
  return <CountrySwitcher current={current} countries={countries} account={enabled ? { signedIn: Boolean(s?.signedIn), name: s?.name ?? null, isAdmin: Boolean(s?.isAdmin) } : undefined} />;
}

export function HeaderOnline() {
  const s = useSession();
  return s?.driverBusinessId ? <DriverOnline businessId={s.driverBusinessId} /> : null;
}

export function HeaderStrip({ country }: { country: string }) {
  const s = useSession();
  if (!s?.signedIn) return null;
  const base = "flex items-center justify-between gap-3 px-5 py-2.5 text-sm font-semibold";
  const { trip, offer, waiting, opSlug } = s;
  if (!trip && !offer && !waiting) return null;
  return (
    <div>
      {offer && (
        <Link href={`/${country}/offers/${offer.id}`} className={`${base} animate-pulse bg-gold text-[#172B32]`}>
          <span>Ride offer: EC${offer.price.toFixed(0)}{offer.km != null ? `, ${offer.km.toFixed(1)} km away` : ""}</span>
          <span>Accept →</span>
        </Link>
      )}
      {trip && (
        <StripLink href={`/${trip.country_code}/trips/${trip.id}`} className={`${base} bg-gold text-[#172B32]`}>
          <span className="flex items-center gap-2">
            {trip.status === "open" && <span className="h-2 w-2 animate-pulse rounded-full bg-[#172B32]" aria-hidden="true" />}
            {trip.status === "open" ? "Ride requested: waiting for a driver" : trip.picked_up_at ? "You’re on your way" : "Your driver is confirmed"}
          </span>
          <span>View →</span>
        </StripLink>
      )}
      {!!waiting && opSlug && (
        <StripLink href={`/${country}/dashboard/${opSlug}?tab=trips`} className={`${base} bg-primary text-primary-ink`}>
          <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-gold" aria-hidden="true" />{waiting} new ride request{waiting === 1 ? "" : "s"} for you</span>
          <span>Respond →</span>
        </StripLink>
      )}
    </div>
  );
}
