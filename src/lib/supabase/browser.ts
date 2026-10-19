"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./env";

/* Browser-side Supabase client, used only for uploading photos. Row Level Security still applies. */
let client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
  return client;
}
