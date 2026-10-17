import { z } from "zod";
import type { SearchFilters } from "./types";

const slug = z.string().regex(/^[a-z0-9-]{1,60}$/).optional().catch(undefined);

/** Validates and normalises search parameters from the URL. Anything malformed is ignored. */
const schema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: slug,
  island: slug,
  district: slug,
  verified: z.literal("1").optional().catch(undefined),
  open: z.literal("1").optional().catch(undefined),
  sort: z.enum(["relevance", "rating", "newest"]).optional().catch(undefined),
});

export function parseFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const p = schema.parse(flat);
  return {
    q: p.q || undefined,
    category: p.category,
    island: p.island,
    district: p.district,
    verifiedOnly: p.verified === "1",
    openNow: p.open === "1",
    sort: p.sort,
  };
}
