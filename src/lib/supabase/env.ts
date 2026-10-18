/*
 * Supabase connection settings. Supabase's own "Connect" screen calls the key
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; older projects use NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Either name works. Both are public keys, protected by Row Level Security.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
