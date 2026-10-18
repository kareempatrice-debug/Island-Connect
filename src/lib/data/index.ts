import { cache } from "react";
import { demoSource } from "./demo";
import type { DataSource } from "./source";
import { supabaseSource } from "./supabase";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLIC_KEY,
);

export const data: DataSource = isSupabaseConfigured ? supabaseSource : demoSource;

/** Countries are read on almost every request, so de-duplicate within a render. */
export const getCountries = cache(() => data.getCountries());

export const getCountry = cache(async (code: string) => {
  const all = await getCountries();
  return all.find((c) => c.code === code) ?? null;
});

export { businessCountries } from "./source";
