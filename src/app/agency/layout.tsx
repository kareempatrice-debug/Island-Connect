import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NeedsDatabase } from "@/components/demo-notice";
import { Wordmark } from "@/components/wordmark";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Agency portal", robots: { index: false } };
export const dynamic = "force-dynamic";

/* The agency portal: government staff receive and answer Gateway requests here, free of charge. */
export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <main className="mx-auto max-w-xl px-5 py-16"><NeedsDatabase feature="The agency portal" /></main>;
  const viewer = await requireViewer("/agency");
  const supabase = await supabaseForRequest();
  const { data: mine } = await supabase.from("agency_members").select("agency_id").eq("user_id", viewer.id);
  if (!mine?.length && viewer.role !== "admin") redirect("/");
  return (
    <div className="min-h-dvh bg-surface">
      <header className="bg-deep">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5">
          <Link href="/agency" aria-label="Agency portal" className="shrink-0"><Wordmark onDark compact /></Link>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">Agency portal</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
