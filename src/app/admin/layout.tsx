import type { Metadata } from "next";
import Link from "next/link";
import { NeedsDatabase } from "@/components/demo-notice";
import { Wordmark } from "@/components/wordmark";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/* A deliberately plain, business-like workspace, separate from the consumer site. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <main className="mx-auto max-w-xl px-5 py-16"><NeedsDatabase feature="The admin panel" /></main>;
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh bg-surface">
      <header className="bg-deep">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/admin"><Wordmark onDark compact /></Link>
          <nav aria-label="Admin" className="flex items-center gap-1 text-sm font-medium">
            <Link href="/admin" className="rounded-full px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Review queue</Link>
            <Link href="/admin/add-listing" className="rounded-full px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">Add listing</Link>
            <Link href="/gd" className="rounded-full px-3 py-2 text-white/60 hover:text-white">View site</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm">Signed in as {admin.email}</p>
        {children}
      </main>
    </div>
  );
}
