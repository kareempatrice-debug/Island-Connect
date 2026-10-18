import { categories as allCategories, disabledIn } from "@/data/categories";
import { demoBusinesses } from "@/data/demo";
import directory from "@/data/directory-2026-10-18.json";
import trades from "@/data/directory-2026-10-18-trades.json";
import { countries, districts, islands } from "@/data/geography";
import { isOpenNow } from "@/lib/format";
import type { Business, SearchFilters } from "@/lib/types";
import { businessCountries, type DataSource } from "./source";

const today = Date.now();

function build(): Business[] {
  return demoBusinesses.map((d, index) => {
    const island = (country: string, slug: string) => islands.find((i) => i.countryCode === country && i.slug === slug)!;
    const district = districts.find((x) => x.countryCode === d.location.country && x.slug === d.location.district) ?? null;
    return {
      id: `demo-${index + 1}`,
      slug: d.slug,
      name: d.name,
      tagline: d.tagline,
      description: d.description,
      verificationStatus: "unverified",
      isDemo: true,
      claimStatus: "claimed",
      contactPreference: "platform",
      externalBookingUrl: null,
      isFeatured: Boolean(d.isFeatured),
      ratingAvg: null,
      ratingCount: 0,
      phone: null,
      whatsapp: null,
      email: null,
      website: null,
      logoUrl: null,
      coverUrl: null,
      gallery: [],
      paymentMethods: d.paymentMethods,
      cancellationPolicy: d.cancellationPolicy,
      categories: d.categories.map((slug, i) => ({
        slug,
        name: allCategories.find((c) => c.slug === slug)?.name ?? slug,
        isPrimary: i === 0,
      })),
      locations: [
        {
          countryCode: d.location.country,
          islandSlug: d.location.island,
          islandName: island(d.location.country, d.location.island).name,
          districtSlug: district?.slug ?? null,
          districtName: district?.name ?? null,
          landmark: d.location.landmark,
          lat: d.location.lat,
          lng: d.location.lng,
          isPrimary: true,
        },
      ],
      serviceAreas: d.serves.map((s) => ({ countryCode: s.country, islandSlug: s.island, islandName: island(s.country, s.island).name })),
      services: d.services.map((s, i) => ({
        id: `${d.slug}-${i}`,
        name: s.name,
        description: s.description ?? null,
        priceMin: s.min ?? null,
        priceMax: s.max ?? null,
        currency: "XCD",
        priceUnit: s.unit ?? null,
        durationMinutes: s.minutes ?? null,
        bookingModels: s.models,
      })),
      hours: d.hours,
      createdAt: new Date(today - d.daysAgo * 86_400_000).toISOString(),
    };
  });
}

/*
 * Researched directory listings (public sources, not yet confirmed by the businesses).
 * Shown in demo mode as unclaimed listings so the preview reflects the real directory.
 * On the live site the same records arrive through supabase/research/ and the admin queue.
 */
interface DirectoryRecord {
  slug: string; name: string; country: string; island: string; district: string; landmark: string;
  categories: string[]; tagline: string; description: string; phone: string; whatsapp: string; website: string;
}

function buildDirectory(): Business[] {
  return ([...directory, ...trades] as DirectoryRecord[]).map((r, index) => {
    const island = islands.find((i) => i.countryCode === r.country && i.slug === r.island)!;
    const district = districts.find((d) => d.countryCode === r.country && d.slug === r.district) ?? null;
    return {
      id: `dir-${index + 1}`,
      slug: r.slug,
      name: r.name,
      tagline: r.tagline,
      description: r.description || null,
      verificationStatus: "unverified",
      isDemo: false,
      isFeatured: false,
      claimStatus: "unclaimed",
      contactPreference: "platform",
      externalBookingUrl: null,
      ratingAvg: null,
      ratingCount: 0,
      phone: r.phone || null,
      whatsapp: r.whatsapp || null,
      email: null,
      website: r.website || null,
      logoUrl: null,
      coverUrl: null,
      gallery: [],
      paymentMethods: [],
      cancellationPolicy: null,
      categories: r.categories.map((slug, i) => ({ slug, name: allCategories.find((c) => c.slug === slug)?.name ?? slug, isPrimary: i === 0 })),
      locations: [{ countryCode: r.country, islandSlug: island.slug, islandName: island.name, districtSlug: district?.slug ?? null,
        districtName: district?.name ?? null, landmark: r.landmark || null, lat: null, lng: null, isPrimary: true }],
      serviceAreas: [{ countryCode: r.country, islandSlug: island.slug, islandName: island.name }],
      services: [],
      hours: [],
      createdAt: "2026-10-18T00:00:00.000Z",
    };
  });
}

const businesses = [...build(), ...buildDirectory()];

function haystack(b: Business): string {
  return [b.name, b.tagline, b.description, ...b.categories.map((c) => c.name), ...b.services.map((s) => `${s.name} ${s.description ?? ""}`)]
    .join(" ")
    .toLowerCase();
}

/** Crude stemming so "electrician" matches "Electricians" and "dive" matches "diving". */
function stem(word: string): string {
  return word.toLowerCase().replace(/(ing|ers|er|es|s)$/, "").slice(0, Math.max(4, word.length - 3));
}

function matchesCategory(b: Business, slug: string): boolean {
  const childSlugs = allCategories.filter((c) => c.parentSlug === slug).map((c) => c.slug);
  return b.categories.some((c) => c.slug === slug || childSlugs.includes(c.slug));
}

export const demoSource: DataSource = {
  mode: "demo",
  async getCountries() {
    return [...countries].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async getIslands(country) {
    return islands.filter((i) => i.countryCode === country);
  },
  async getDistricts(country) {
    return districts.filter((d) => d.countryCode === country);
  },
  async getCategories(country) {
    const off = disabledIn[country] ?? [];
    return allCategories.filter((c) => !off.includes(c.slug));
  },
  async searchBusinesses(country, f: SearchFilters, limit = 50) {
    const tz = countries.find((c) => c.code === country)?.timeZone ?? "UTC";
    const terms = (f.q ?? "").trim().split(/\s+/).filter((t) => t.length > 1).map(stem);
    let results = businesses.filter((b) => {
      if (!businessCountries(b).includes(country)) return false;
      if (terms.length && !terms.every((t) => haystack(b).includes(t))) return false;
      if (f.category && !matchesCategory(b, f.category)) return false;
      if (
        f.island &&
        !b.locations.some((l) => l.countryCode === country && l.islandSlug === f.island) &&
        !b.serviceAreas.some((a) => a.countryCode === country && a.islandSlug === f.island)
      )
        return false;
      if (f.district && !b.locations.some((l) => l.countryCode === country && l.districtSlug === f.district)) return false;
      if (f.verifiedOnly && !(b.verificationStatus === "verified" && !b.isDemo)) return false;
      if (f.minRating && (b.ratingAvg ?? 0) < f.minRating) return false;
      if (f.openNow && !isOpenNow(b.hours, tz)) return false;
      return true;
    });
    if (f.sort === "newest") results = results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (f.sort === "rating") results = results.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
    else results = results.sort((a, b) => a.name.localeCompare(b.name));
    return results.slice(0, limit);
  },
  async getBusiness(slug) {
    return businesses.find((b) => b.slug === slug) ?? null;
  },
  async getFeatured(country, limit) {
    return businesses.filter((b) => b.isFeatured && businessCountries(b).includes(country)).slice(0, limit);
  },
  async getRecent(country, limit) {
    return businesses
      .filter((b) => businessCountries(b).includes(country))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
  // No guidance content ships with the demo: it must come from verified sources.
  async getArticles() {
    return [];
  },
  async getArticle() {
    return null;
  },
};
