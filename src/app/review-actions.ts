"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { supabaseForRequest } from "@/lib/supabase/server";

/* Save a star rating and optional comment for a ride or a business the person used. */
export async function submitReviewAction(input: { kind: "trip" | "service"; ref: string; rating: number; comment?: string }): Promise<{ ok?: boolean; error?: string }> {
  const d = z.object({ kind: z.enum(["trip", "service"]), ref: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() }).safeParse(input);
  if (!d.success) return { error: "Choose between 1 and 5 stars." };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.rpc("submit_review", { p_kind: d.data.kind, p_ref: d.data.ref, p_rating: d.data.rating, p_comment: d.data.comment ?? null });
  if (error) return { error: error.message };
  // Business pages and star ratings on cards update straight away.
  revalidateTag("listings");
  revalidatePath("/[country]/business/[slug]", "page");
  return { ok: true };
}
