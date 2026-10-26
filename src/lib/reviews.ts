import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { isSupabaseConfigured } from "@/lib/data";

export interface PublicReview { id: string; rating: number; comment: string | null; kind: "trip" | "service"; created_at: string; author: string }

/* Published reviews for a business page (first names only). Uses the public key, so pages stay cacheable. */
export async function getReviews(businessId: string): Promise<PublicReview[]> {
  if (!isSupabaseConfigured) return [];
  const db = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false } });
  const { data } = await db.rpc("business_reviews", { p_business: businessId, p_limit: 20 });
  return (data ?? []) as PublicReview[];
}
