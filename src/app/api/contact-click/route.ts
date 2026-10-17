import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/data";

/* Records that a visitor tapped a business's contact link. Anonymous: no personal data is stored. */
const body = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  channel: z.enum(["whatsapp", "phone", "email", "website", "booking", "maps"]),
  country: z.string().regex(/^[a-z]{2}$/),
});

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return new NextResponse(null, { status: 204 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  await supabase.rpc("log_contact_click", { p_slug: parsed.data.slug, p_channel: parsed.data.channel, p_country: parsed.data.country });
  return new NextResponse(null, { status: 204 });
}
