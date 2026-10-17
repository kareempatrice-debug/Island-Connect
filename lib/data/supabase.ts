import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isOpenNow } from "@/lib/format";
import type { Article, ArticleSection, Business, BookingModel, Category, Country, District, Island } from "@/lib/types";
import type { DataSource } from "./source";

/*
 * Supabase implementation. Uses the public anon key only: what each visitor can
 * read is enforced by Row Level Security in the database, not by this code.
 */

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

const BUSINESS_SELECT = `
  id, slug, name, tagline, description, verification_status, is_demo, claim_status, contact_preference, external_booking_url, is_featured, rating_avg, rating_count,
  phone_e164, whatsapp_e164, email, website, logo_path, cover_path, payment_methods, cancellation_policy, created_at,
  business_categories ( is_primary, categories ( slug, name ) ),
  business_locations ( is_primary, landmark, lat, lng, country_code, islands ( slug, name ), districts ( slug, name ) ),
  business_service_areas ( islands ( slug, name, country_code ) ),
  services ( id, name, description, price_min, price_max, currency_code, price_unit, duration_minutes, booking_models, sort_order, is_active ),
  opening_hours ( weekday, opens, closes )
`;

/** Only absolute https URLs are used until a storage bucket for business media is set up. */
function mediaUrl(path: string | null): string | null {
  return path && /^https:\/\//.test(path) ? path : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toBusiness(r: any): Business {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    verificationStatus: r.verification_status,
    isDemo: r.is_demo,
    claimStatus: r.claim_status ?? "claimed",
    contactPreference: r.contact_preference ?? "platform",
    externalBookingUrl: r.external_booking_url ?? null,
    isFeatured: r.is_featured,
    ratingAvg: r.rating_avg == null ? null : Number(r.rating_avg),
    ratingCount: r.rating_count,
    phone: r.phone_e164,
    whatsapp: r.whatsapp_e164,
    email: r.email,
    website: r.website,
    logoUrl: mediaUrl(r.logo_path),
    coverUrl: mediaUrl(r.cover_path),
    gallery: [],
    paymentMethods: r.payment_methods ?? [],
    cancellationPolicy: r.cancellation_policy,
    categories: (r.business_categories ?? [])
      .filter((c: any) => c.categories)
      .sort((a: any, b: any) => Number(b.is_primary) - Number(a.is_primary))
      .map((c: any) => ({ slug: c.categories.slug, name: c.categories.name, isPrimary: c.is_primary })),
    locations: (r.business_locations ?? []).map((l: any) => ({
      countryCode: l.country_code,
      islandSlug: l.islands?.slug,
      islandName: l.islands?.name,
      districtSlug: l.districts?.slug ?? null,
      districtName: l.districts?.name ?? null,
      landmark: l.landmark,
      lat: l.lat,
      lng: l.lng,
      isPrimary: l.is_primary,
    })),
    serviceAreas: (r.business_service_areas ?? [])
      .filter((a: any) => a.islands)
      .map((a: any) => ({ countryCode: a.islands.country_code, islandSlug: a.islands.slug, islandName: a.islands.name })),
    services: (r.services ?? [])
      .filter((s: any) => s.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        priceMin: s.price_min == null ? null : Number(s.price_min),
        priceMax: s.price_max == null ? null : Number(s.price_max),
        currency: s.currency_code,
        priceUnit: s.price_unit,
        durationMinutes: s.duration_minutes,
        bookingModels: s.booking_models as BookingModel[],
      })),
    hours: (r.opening_hours ?? []).map((h: any) => ({ weekday: h.weekday, opens: h.opens.slice(0, 5), closes: h.closes.slice(0, 5) })),
    createdAt: r.created_at,
  };
}

function toArticle(r: any): Article {
  return {
    id: r.id,
    countryCode: r.country_code,
    section: r.section,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    body: r.body,
    sources: r.sources ?? [],
    verifiedAt: r.verified_at,
    verifiedBy: r.verified_by,
    nextReviewAt: r.next_review_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

async function fetchBusinesses(ids: string[]): Promise<Business[]> {
  if (!ids.length) return [];
  const { data, error } = await db().from("businesses").select(BUSINESS_SELECT).in("id", ids);
  if (error) fail("Loading businesses", error);
  const byId = new Map((data ?? []).map((r) => [r.id as string, toBusiness(r)]));
  return ids.map((id) => byId.get(id)).filter((b): b is Business => Boolean(b));
}

async function countryTimeZone(code: string): Promise<string> {
  const { data } = await db().from("countries").select("time_zone").eq("code", code).maybeSingle();
  return data?.time_zone ?? "UTC";
}

export const supabaseSource: DataSource = {
  mode: "supabase",
  async getCountries(): Promise<Country[]> {
    const { data, error } = await db().from("countries").select("*").eq("is_active", true).order("sort_order");
    if (error) fail("Loading countries", error);
    return (data ?? []).map((c) => ({
      code: c.code,
      name: c.name,
      shortName: c.short_name,
      currency: c.currency_code,
      timeZone: c.time_zone,
      diallingCode: c.dialling_code,
      districtLabel: c.district_label,
      sortOrder: c.sort_order,
    }));
  },
  async getIslands(country): Promise<Island[]> {
    const { data, error } = await db().from("islands").select("*").eq("country_code", country).order("is_main", { ascending: false }).order("name");
    if (error) fail("Loading islands", error);
    return (data ?? []).map((i) => ({ slug: i.slug, countryCode: i.country_code, name: i.name, lat: i.lat, lng: i.lng, isMain: i.is_main }));
  },
  async getDistricts(country): Promise<District[]> {
    const { data, error } = await db().from("districts").select("slug, name, country_code, islands ( slug )").eq("country_code", country).order("name");
    if (error) fail("Loading districts", error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((d: any) => ({ slug: d.slug, name: d.name, countryCode: d.country_code, islandSlug: d.islands?.slug ?? null }));
  },
  async getCategories(country): Promise<Category[]> {
    const { data, error } = await db()
      .from("categories")
      .select("id, slug, name, description, booking_models, sort_order, parent_id, country_categories!inner ( country_code, is_enabled )")
      .eq("country_categories.country_code", country)
      .eq("country_categories.is_enabled", true)
      .order("sort_order");
    if (error) fail("Loading categories", error);
    const rows = data ?? [];
    const slugById = new Map(rows.map((r) => [r.id as string, r.slug as string]));
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      parentSlug: r.parent_id ? (slugById.get(r.parent_id) ?? null) : null,
      description: r.description,
      bookingModels: r.booking_models,
      sortOrder: r.sort_order,
    }));
  },
  async searchBusinesses(country, f, limit = 50) {
    const { data, error } = await db().rpc("search_businesses", {
      p_country: country,
      p_query: f.q || null,
      p_category: f.category || null,
      p_island: f.island || null,
      p_district: f.district || null,
      p_verified_only: Boolean(f.verifiedOnly),
      p_min_rating: f.minRating ?? null,
      p_sort: f.sort ?? "relevance",
      p_limit: limit,
    });
    if (error) fail("Searching businesses", error);
    let results = await fetchBusinesses((data ?? []).map((r: { business_id: string }) => r.business_id));
    if (f.openNow) {
      const tz = await countryTimeZone(country);
      results = results.filter((b) => isOpenNow(b.hours, tz));
    }
    return results;
  },
  async getBusiness(slug) {
    const { data, error } = await db().from("businesses").select(BUSINESS_SELECT).eq("slug", slug).maybeSingle();
    if (error) fail("Loading business", error);
    return data ? toBusiness(data) : null;
  },
  async getFeatured(country, limit) {
    const all = await this.searchBusinesses(country, {}, 100);
    return all.filter((b) => b.isFeatured).slice(0, limit);
  },
  async getRecent(country, limit) {
    return this.searchBusinesses(country, { sort: "newest" }, limit);
  },
  async getArticles(country, section?: ArticleSection) {
    let q = db()
      .from("articles")
      .select("*")
      .or(`country_code.eq.${country},is_regional.eq.true`)
      .in("status", ["published", "needs_update"])
      .order("title");
    if (section) q = q.eq("section", section);
    const { data, error } = await q;
    if (error) fail("Loading articles", error);
    return (data ?? []).map(toArticle);
  },
  async getArticle(country, section, slug) {
    const { data, error } = await db()
      .from("articles")
      .select("*")
      .or(`country_code.eq.${country},is_regional.eq.true`)
      .eq("section", section)
      .eq("slug", slug)
      .in("status", ["published", "needs_update"])
      .maybeSingle();
    if (error) fail("Loading article", error);
    return data ? toArticle(data) : null;
  },
};
