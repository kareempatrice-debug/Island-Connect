import type { Metadata } from "next";
import { setAdminAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin team" };

export default async function Team({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const supabase = await supabaseForRequest();
  const { data: team } = await supabase.rpc("admin_team");
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Admin team</h1>
      {sp.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{sp.error}</p>}
      {sp.done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{sp.done === "added" ? "Admin access granted. They’ll see Admin in their menu next time a page loads." : "Admin access removed."}</p>}
      <section className={card} aria-labelledby="team-h">
        <h2 id="team-h" className="text-lg font-semibold">Administrators</h2>
        <ul className="mt-3 divide-y divide-line">
          {(team as { id: string; email: string; name: string | null }[] | null)?.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0"><span className="block font-semibold text-ink">{t.name ?? t.email}</span><span className="block truncate text-sm">{t.email}</span></span>
              {t.id === me.id ? <span className="text-sm">You</span> : (
                <form action={setAdminAction}>
                  <input type="hidden" name="email" value={t.email} /><input type="hidden" name="value" value="off" />
                  <button className="text-sm font-semibold text-danger underline">Remove admin</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className={card} aria-labelledby="add-h">
        <h2 id="add-h" className="text-lg font-semibold">Add an administrator</h2>
        <p className="mt-1 text-sm">They need an Island Connect account first (Join free on the site). Admins can approve listings and operators, edit any listing, see all trips and the dashboard, and manage this team.</p>
        <form action={setAdminAction} className="mt-3 flex flex-wrap gap-2">
          <input name="email" type="email" required placeholder="Their account email" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3" />
          <button className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-ink">Make admin</button>
        </form>
      </section>
    </div>
  );
}
