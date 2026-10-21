import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Members" };

const PAGE = 50;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never");
const JOINED: Record<string, string> = { customer: "Customer", business: "Business", operator: "Driver or operator" };

export default async function Members({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.rpc("admin_list_members", { p_search: q || null, p_limit: PAGE, p_offset: (page - 1) * PAGE });
  const rows = (data ?? []) as { id: string; email: string; name: string | null; role: string; joined_as: string | null; joined_at: string; last_sign_in_at: string | null; confirmed: boolean; listings: number; trips: number; total: number }[];
  const total = Number(rows[0]?.total ?? 0);
  const link = (p: number) => `/admin/members?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Members</h1>
        <p className="mt-1 text-sm">Everyone with an Island Connect account, newest first. For running the platform only: support, approvals and safety. Don’t copy, export or use these details for marketing.</p>
      </div>
      <form className="flex gap-2" role="search">
        <label htmlFor="mq" className="sr-only">Search by name or email</label>
        <input id="mq" name="q" defaultValue={q} placeholder="Search by name or email" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3" />
        <button className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-ink">Search</button>
      </form>
      {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error.message}</p>}
      <p className="text-sm">{total.toLocaleString("en-GB")} member{total === 1 ? "" : "s"}{q ? ` matching “${q}”` : ""}</p>
      <div className="overflow-x-auto rounded-2xl ring-1 ring-line/60">
        <table className="w-full min-w-[44rem] bg-raised text-left text-sm">
          <thead className="bg-sunken text-ink">
            <tr><th className="px-4 py-2.5">Name and email</th><th className="px-4 py-2.5">Joined as</th><th className="px-4 py-2.5">Joined</th><th className="px-4 py-2.5">Last signed in</th><th className="px-4 py-2.5 text-right">Listings</th><th className="px-4 py-2.5 text-right">Trips</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2.5">
                  <span className="block font-semibold text-ink">{m.name ?? "No name given"}{m.role === "admin" && <span className="ml-2 rounded-full bg-gold/30 px-2 py-0.5 text-xs">Admin</span>}</span>
                  <span className="block">{m.email}{!m.confirmed && <span className="ml-2 text-xs text-danger">email not confirmed</span>}</span>
                </td>
                <td className="px-4 py-2.5">{JOINED[m.joined_as ?? ""] ?? "Customer"}</td>
                <td className="px-4 py-2.5">{fmt(m.joined_at)}</td>
                <td className="px-4 py-2.5">{fmt(m.last_sign_in_at)}</td>
                <td className="px-4 py-2.5 text-right">{m.listings}</td>
                <td className="px-4 py-2.5 text-right">{m.trips}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-4 py-6 text-center">No members found.</td></tr>}
          </tbody>
        </table>
      </div>
      {total > PAGE && (
        <nav className="flex justify-between text-sm font-semibold" aria-label="Pages">
          {page > 1 ? <Link href={link(page - 1)} className="text-link underline">Newer</Link> : <span />}
          <span>Page {page} of {Math.ceil(total / PAGE)}</span>
          {page * PAGE < total ? <Link href={link(page + 1)} className="text-link underline">Older</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
