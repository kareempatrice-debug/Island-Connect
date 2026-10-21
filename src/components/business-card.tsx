import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Business } from "@/lib/types";
import { ListingBadges } from "./badges";
import { BusinessCover, BusinessLogo } from "./business-cover";
import { OpenStatus } from "./open-status";

/** Location as seen from the country being browsed: "St. George, Grenada" or "Serves Carriacou from Union Island". */
export function locationLine(b: Business, country: string): string {
  const here = b.locations.find((l) => l.countryCode === country);
  if (here) return [here.districtName, here.islandName].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
  const home = b.locations[0];
  const served = b.serviceAreas.filter((a) => a.countryCode === country).map((a) => a.islandName);
  return `Serves ${served.join(" and ")} from ${home?.islandName ?? "nearby"}`;
}

/** Lowest advertised starting price, from the business's own service list. */
function fromPrice(b: Business): string | null {
  const priced = b.services.filter((s) => s.priceMin != null);
  if (!priced.length) return null;
  const cheapest = priced.reduce((a, s) => (s.priceMin! < a.priceMin! ? s : a));
  return `From ${formatMoney(cheapest.priceMin!, cheapest.currency)}${cheapest.priceUnit ? ` / ${cheapest.priceUnit}` : ""}`;
}

export function BusinessCard({
  business,
  country,
  timeZone,
  priority,
  browsing,
}: {
  business: Business;
  country: string;
  timeZone: string;
  priority?: boolean;
  /** The category page being viewed, so the picture matches what the person is looking for. */
  browsing?: string;
}) {
  const primary = business.categories.find((c) => c.isPrimary) ?? business.categories[0];
  const price = fromPrice(business);
  const rating = business.ratingCount > 0 && business.ratingAvg != null ? business.ratingAvg : null;

  return (
    <Link
      href={`/${country}/business/${business.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-raised shadow-card ring-1 ring-line/60 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift"
    >
      {/* The logo sits outside the clipped cover so it overlaps the edge without being cut off. */}
      <div className="relative">
        <div className="relative aspect-[16/10] overflow-hidden">
          <BusinessCover business={business} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 90vw" priority={priority} browsing={browsing} />
          <div className="absolute left-3 top-3">
            <ListingBadges business={business} onImage />
          </div>
        </div>
        <BusinessLogo business={business} className="absolute -bottom-7 left-4 z-10 h-14 w-14 rounded-2xl text-lg shadow-card ring-4 ring-raised" />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <p className="text-[0.8rem] font-semibold text-link">{primary?.name}</p>
        <h3 className="mt-0.5 text-[1.15rem] font-semibold leading-snug group-hover:text-primary">{business.name}</h3>
        <p className="mt-1 flex items-start gap-1 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {locationLine(business, country)}
        </p>
        {business.tagline && <p className="mt-2 line-clamp-2 text-[0.95rem]">{business.tagline}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-4">
          <OpenStatus hours={business.hours} timeZone={timeZone} />
          {rating != null ? (
            <span className="text-sm font-semibold text-ink">
              {rating.toFixed(1)} <span className="font-normal text-muted">({business.ratingCount})</span>
            </span>
          ) : price ? (
            <span className="text-sm font-semibold text-ink">{price}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function BusinessGrid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>;
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-raised ring-1 ring-line/60" aria-hidden="true">
      <div className="skeleton aspect-[16/10]" />
      <div className="space-y-2 p-4 pt-8">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    </div>
  );
}
