import { unstable_cache } from "next/cache";
import { cache } from "react";
import { demoSource } from "./demo";
import type { DataSource } from "./source";
import { supabaseSource } from "./supabase";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLIC_KEY,
);

/*
 * Public data is cached on the server so pages don't wait on the database every time:
 * reference data (countries, islands, categories) for an hour, listings for a minute.
 * Anything an admin or business owner changes clears the "listings" cache at once
 * (revalidateTag("listings")), so edits still show immediately.
 * Only public, signed-out data passes through here; personal data is never cached.
 */
const REF = { revalidate: 3600, tags: ["reference"] };
const LIST = { revalidate: 60, tags: ["listings"] };
const ART = { revalidate: 600, tags: ["articles"] };

function cached(src: DataSource): DataSource {
  return {
    mode: src.mode,
    getCountries: unstable_cache(() => src.getCountries(), ["countries"], REF),
    getIslands: unstable_cache((c: string) => src.getIslands(c), ["islands"], REF),
    getDistricts: unstable_cache((c: string) => src.getDistricts(c), ["districts"], REF),
    getCategories: unstable_cache((c: string) => src.getCategories(c), ["categories"], LIST),
    searchBusinesses: unstable_cache((c, f, limit?: number) => src.searchBusinesses(c, f, limit), ["search"], LIST),
    countBusinesses: unstable_cache((c, f) => src.countBusinesses(c, f), ["count"], LIST),
    getBusiness: unstable_cache((slug: string) => src.getBusiness(slug), ["business"], LIST),
    getFeatured: unstable_cache((c: string, n: number) => src.getFeatured(c, n), ["featured"], LIST),
    getRecent: unstable_cache((c: string, n: number) => src.getRecent(c, n), ["recent"], LIST),
    getArticles: unstable_cache((c, section?) => src.getArticles(c, section), ["articles"], ART),
    getArticle: unstable_cache((c, section, slug: string) => src.getArticle(c, section, slug), ["article"], ART),
  };
}

export const data: DataSource = isSupabaseConfigured ? cached(supabaseSource) : demoSource;

/** Countries are read on almost every request, so de-duplicate within a render. */
/* St Vincent and the Grenadines first, then Grenada, everywhere the two are listed together. */
const COUNTRY_ORDER: Record<string, number> = { vc: 0, gd: 1 };
export const getCountries = cache(async () =>
  [...(await data.getCountries())].sort((a, b) => (COUNTRY_ORDER[a.code] ?? 9) - (COUNTRY_ORDER[b.code] ?? 9)));

export const getCountry = cache(async (code: string) => {
  const all = await getCountries();
  return all.find((c) => c.code === code) ?? null;
});

export { businessCountries } from "./source";
