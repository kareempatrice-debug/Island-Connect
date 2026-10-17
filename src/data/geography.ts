import type { Country, District, Island } from "@/lib/types";

/*
 * Launch geography. This file is the single source of truth: the SQL seed in
 * supabase/seed.sql is generated from it (npm run seed:generate).
 *
 * Sources to re-verify before production:
 *  - Parishes: Government of Grenada (gov.gd) and Government of SVG (gov.vc).
 *  - Dialling codes: NANPA area codes 473 (Grenada) and 784 (SVG).
 *  - Time zones: IANA tz database.
 *  - Island coordinates are approximate centroids for map framing only.
 */

export const countries: Country[] = [
  {
    code: "gd",
    name: "Grenada",
    shortName: "Grenada",
    currency: "XCD",
    timeZone: "America/Grenada",
    diallingCode: "+1473",
    districtLabel: "Parish",
    sortOrder: 1,
  },
  {
    code: "vc",
    name: "St. Vincent and the Grenadines",
    shortName: "SVG",
    currency: "XCD",
    timeZone: "America/St_Vincent",
    diallingCode: "+1784",
    districtLabel: "Parish",
    sortOrder: 2,
  },
];

export const islands: Island[] = [
  { slug: "grenada", countryCode: "gd", name: "Grenada", lat: 12.12, lng: -61.68, isMain: true },
  { slug: "carriacou", countryCode: "gd", name: "Carriacou", lat: 12.48, lng: -61.45, isMain: false },
  { slug: "petite-martinique", countryCode: "gd", name: "Petite Martinique", lat: 12.53, lng: -61.41, isMain: false },

  { slug: "st-vincent", countryCode: "vc", name: "St. Vincent", lat: 13.25, lng: -61.2, isMain: true },
  { slug: "bequia", countryCode: "vc", name: "Bequia", lat: 13.01, lng: -61.23, isMain: false },
  { slug: "mustique", countryCode: "vc", name: "Mustique", lat: 12.88, lng: -61.19, isMain: false },
  { slug: "canouan", countryCode: "vc", name: "Canouan", lat: 12.71, lng: -61.33, isMain: false },
  { slug: "mayreau", countryCode: "vc", name: "Mayreau", lat: 12.64, lng: -61.39, isMain: false },
  { slug: "union-island", countryCode: "vc", name: "Union Island", lat: 12.6, lng: -61.43, isMain: false },
];

export const districts: District[] = [
  { slug: "st-andrew", countryCode: "gd", name: "St. Andrew", islandSlug: "grenada" },
  { slug: "st-david", countryCode: "gd", name: "St. David", islandSlug: "grenada" },
  { slug: "st-george", countryCode: "gd", name: "St. George", islandSlug: "grenada" },
  { slug: "st-john", countryCode: "gd", name: "St. John", islandSlug: "grenada" },
  { slug: "st-mark", countryCode: "gd", name: "St. Mark", islandSlug: "grenada" },
  { slug: "st-patrick", countryCode: "gd", name: "St. Patrick", islandSlug: "grenada" },
  { slug: "carriacou-petite-martinique", countryCode: "gd", name: "Carriacou and Petite Martinique", islandSlug: null },

  { slug: "charlotte", countryCode: "vc", name: "Charlotte", islandSlug: "st-vincent" },
  { slug: "st-andrew", countryCode: "vc", name: "St. Andrew", islandSlug: "st-vincent" },
  { slug: "st-david", countryCode: "vc", name: "St. David", islandSlug: "st-vincent" },
  { slug: "st-george", countryCode: "vc", name: "St. George", islandSlug: "st-vincent" },
  { slug: "st-patrick", countryCode: "vc", name: "St. Patrick", islandSlug: "st-vincent" },
  { slug: "grenadines", countryCode: "vc", name: "Grenadines", islandSlug: null },
];
