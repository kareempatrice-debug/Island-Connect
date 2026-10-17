import { cache } from "react";
import { demoSource } from "./demo";
import type { DataSource } from "./source";
import { supabaseSource } from "./supabase";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const data: DataSource = isSupabaseConfigured ? supabaseSource : demoSource;

/** Countries are read on almost every request, so de-duplicate within a render. */
export const getCountries = cache(() => data.getCountries());

export const getCountry = cache(async (code: string) => {
  const all = await getCountries();
  return all.find((c) => c.code === code) ?? null;
});

export { businessCountries } from "./source";
