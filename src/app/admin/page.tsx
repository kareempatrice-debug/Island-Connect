import Link from "next/link";
import { InsightsPanel } from "@/components/admin/insights";
import { approveBusinessAction, approveClaimAction, rejectBusinessAction, rejectClaimAction } from "./actions";
import { supabaseForRequest } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
function ReviewButtons({ id, approve, reject }: { id: string; approve: (f: FormData) => Promise<void>; reject: (f: FormData) => Promise<void> }) {
  return (
    <form action={approve} className="mt-4 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="note" placeholder="Note to the applicant (optional)" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-sm text-ink" />
      <button formAction={approve} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink">Approve</button>
      <button formAction={reject} className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-ink">Reject</button>
    </form>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ error?: string; done?: string; range?: string }> }) {
  const sp = await searchParams;
  const range = [7, 30, 90, 365].includes(Number(sp.range)) ? Number(sp.range) : 30;
  const supabase = await supabaseForRequest();
  const [{ data: insights }, { data: pending }, { data: claims }, { count: live }, { count: unclaimed }, { count: opApps }] = await Promise.all([
    supabase.rpc("admin_insights", { p_days: range }),
    supabase.from("businesses")
      .select("id, slug, name, tagline, phone_e164, whatsapp_e164, email, website, created_at, claim_status, source_url, source_note, source_checked_at, business_locations ( country_code, landmark, islands ( name ), districts ( name ) ), business_categories ( categories ( name ) ), business_members ( user_id )")
      .eq("listing_status", "pending_review").order("created_at"),
    supabase.from("business_claims")
      .select("id, claimant_name, role_at_business, phone, evidence, created_at, businesses ( name, slug, phone_e164, whatsapp_e164, business_locations ( country_code ) )")
      .eq("status", "pending").order("created_at"),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("listing_status", "published").eq("is_demo", false),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("claim_status", "unclaimed").eq("is_demo", false),
    supabase.from("operator_profiles").select("business_id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stat = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";
  return (
    <div className="mt-4 space-y-10">
      <InsightsPanel data={insights} range={range} />
      <h2 className="pt-6 text-2xl font-semibold">Review queue</h2>
      <form action="/admin/listings" className="flex gap-2" role="search">
        <label htmlFor="admin-q" className="sr-only">Find any business</label>
        <input id="admin-q" name="q" placeholder="Find any business by name" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3" />
        <button className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-ink">Find</button>
      </form>
      {(opApps ?? 0) > 0 && (
        <Link href="/admin/operators" className="block rounded-2xl bg-gold/20 p-4 font-semibold text-ink">
          {opApps} transport operator application{opApps === 1 ? "" : "s"} waiting: review them on the Operators page →
        </Link>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className={stat}><p className="text-sm">Live listings</p><p className="font-display text-3xl font-semibold text-ink">{live ?? 0}</p></div>
        <div className={stat}><p className="text-sm">Unclaimed (from research)</p><p className="font-display text-3xl font-semibold text-ink">{unclaimed ?? 0}</p></div>
        <div className={stat}><p className="text-sm">Registrations to review</p><p className="font-display text-3xl font-semibold text-ink">{pending?.length ?? 0}</p></div>
        <div className={stat}><p className="text-sm">Claims to review</p><p className="font-display text-3xl font-semibold text-ink">{claims?.length ?? 0}</p></div>
      </div>

      {sp.error && <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">That didn’t go through: {sp.error}</p>}
      {sp.done && <p role="status" className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">{sp.done === "approved" ? "Approved. It’s now live on the site." : "Declined."}</p>}
      <section aria-labelledby="reg-heading">
        <h1 id="reg-heading" className="text-2xl font-semibold">New registrations</h1>
        {pending?.length ? (
          <ul className="mt-4 space-y-3">
            {pending.map((b: any) => {
              const l = b.business_locations?.[0];
              return (
                <li key={b.id} className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
                  <p className="font-semibold text-ink">{b.name} <span className="font-normal text-muted">· {(l?.country_code ?? "").toUpperCase()} · {[l?.districts?.name, l?.islands?.name].filter(Boolean).join(", ")}</span></p>
                  <p className="text-sm">{b.business_categories?.map((c: any) => c.categories?.name).join(", ")}</p>
                  {b.tagline && <p className="mt-1 text-sm">{b.tagline}</p>}
                  <p className="mt-2 text-sm text-ink">{[b.whatsapp_e164 && `WhatsApp ${b.whatsapp_e164}`, b.phone_e164 && `Phone ${b.phone_e164}`, b.email, b.website].filter(Boolean).join(" · ")}</p>
                  {l?.landmark && <p className="text-sm">Directions: {l.landmark}</p>}
                  {b.claim_status === "unclaimed" && (
                    <p className="mt-2 rounded-lg bg-gold/15 px-3 py-2 text-sm text-ink">
                      From research, checked {b.source_checked_at}: <a href={b.source_url} target="_blank" rel="noopener noreferrer" className="text-link underline">source</a>
                      {b.source_note && ` · ${b.source_note}`}
                    </p>
                  )}
                  <p className="mt-1 text-xs">Submitted {new Date(b.created_at).toLocaleString("en-GB")}. Check the business exists (call or message it) before approving.</p>
                  <ReviewButtons id={b.id} approve={approveBusinessAction} reject={rejectBusinessAction} />
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-3">Nothing waiting.</p>}
      </section>

      <section aria-labelledby="claims-heading">
        <h2 id="claims-heading" className="text-2xl font-semibold">Ownership claims</h2>
        {claims?.length ? (
          <ul className="mt-4 space-y-3">
            {claims.map((c: any) => {
              const b = c.businesses;
              const cc = b?.business_locations?.[0]?.country_code ?? "gd";
              return (
                <li key={c.id} className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
                  <p className="font-semibold text-ink">
                    {c.claimant_name} ({c.role_at_business}) claims{" "}
                    <Link href={`/${cc}/business/${b?.slug}`} className="text-link underline">{b?.name}</Link>
                  </p>
                  <p className="mt-1 text-sm">Claimant phone: {c.phone ?? "not given"}. Listed business contact: {b?.whatsapp_e164 ?? b?.phone_e164 ?? "none"}.</p>
                  <p className="mt-2 whitespace-pre-line rounded-xl bg-sunken p-3 text-sm text-ink">{c.evidence}</p>
                  <p className="mt-1 text-xs">Best check: contact the business on its listed number, not the claimant’s, and confirm the person.</p>
                  <ReviewButtons id={c.id} approve={approveClaimAction} reject={rejectClaimAction} />
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-3">Nothing waiting.</p>}
      </section>
    </div>
  );
}
