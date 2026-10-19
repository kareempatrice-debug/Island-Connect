import type { Metadata } from "next";
import Link from "next/link";
import { NeedsDatabase } from "@/components/demo-notice";
import { BottomNav } from "@/components/nav";
import { Wordmark } from "@/components/wordmark";
import { navCountry } from "@/lib/nav-country";
import { supabaseForRequest } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/* A deliberately plain, business-like workspace, separate from the consumer site. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <main className="mx-auto max-w-xl px-5 py-16"><NeedsDatabase feature="The admin panel" /></main>;
  const [admin, country] = await Promise.all([requireAdmin(), navCountry()]);
  const supabase = await supabaseForRequest();
  const [{ count: regs }, { count: claims }, { count: ops }] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("listing_status", "pending_review"),
    supabase.from("business_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("operator_profiles").select("business_id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const badge = (n: number | null) => (n ? <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-[#172B32]">{n}</span> : null);
  return (
    <div className="min-h-dvh bg-surface">
      <header className="bg-deep">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href="/admin" className="shrink-0"><Wordmark onDark compact /></Link>
          <nav aria-label="Admin" className="-mr-5 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap pr-5 text-sm font-medium [scrollbar-width:none] sm:justify-end">
            <Link href="/admin" className="rounded-full px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Review queue{badge((regs ?? 0) + (claims ?? 0))}</Link>
            <Link href="/admin/listings" className="rounded-full px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Listings</Link>
            <Link href="/admin/operators" className="rounded-full px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Operators{badge(ops)}</Link>
            <Link href="/admin/add-listing" className="rounded-full px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Add listing</Link>
            <Link href={`/${country}`} className="rounded-full px-3 py-2 text-white/60 hover:text-white">View site</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 lg:pb-8">
        <p className="text-sm">Signed in as {admin.email}</p>
        {children}
      </main>
      <BottomNav country={country} />
    </div>
  );
}
