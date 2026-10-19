import Link from "next/link";
import { approveOperatorAction, declineOperatorAction } from "@/app/trip-actions";
import { supabaseForRequest } from "@/lib/supabase/server";
import { TRIP_KIND_LABEL, fmtXcd } from "@/lib/trips";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Operators({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const supabase = await supabaseForRequest();
  const q = (sp.q ?? "").trim().slice(0, 80);
  const { data: found } = q
    ? await supabase.from("businesses").select("id, name, listing_status, business_locations ( country_code )").ilike("name", `%${q.replace(/[%_]/g, "")}%`).order("name").limit(10)
    : { data: null };
  const [{ data: ops }, { data: ledger }, { count: openCount }] = await Promise.all([
    supabase.from("operator_profiles").select("*, businesses ( name, slug, phone_e164, business_locations ( country_code ) )").order("created_at", { ascending: false }),
    supabase.from("commission_ledger").select("fare_xcd, commission_xcd, created_at, businesses ( name )").order("created_at", { ascending: false }).limit(500),
    supabase.from("trip_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const pending = (ops ?? []).filter((o: any) => o.status === "pending");
  // Private documents: short-lived links only admins can open.
  const docPaths = pending.flatMap((o: any) => o.document_paths ?? []);
  const { data: signed } = docPaths.length ? await supabase.storage.from("operator-documents").createSignedUrls(docPaths, 3600) : { data: [] as any[] };
  const docUrl = new Map((signed ?? []).map((x: any) => [x.path, x.signedUrl]));
  const approved = (ops ?? []).filter((o: any) => o.status === "approved");
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = (ledger ?? []).filter((l: any) => l.created_at.startsWith(month));
  const sum = (rows: any[], k: string) => rows.reduce((a, r) => a + Number(r[k]), 0);
  const card = "rounded-2xl bg-raised p-5 ring-1 ring-line/60";

  return (
    <div className="mt-4 space-y-8">
      <h1 className="text-2xl font-semibold">Operators and trips</h1>
      {sp.error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{sp.error}</p>}
      {sp.done && <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">Saved.</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-sm">Approved operators</p><p className="text-2xl font-semibold text-ink">{approved.length}</p></div>
        <div className={card}><p className="text-sm">Requests waiting for quotes</p><p className="text-2xl font-semibold text-ink">{openCount ?? 0}</p></div>
        <div className={card}><p className="text-sm">Completed this month</p><p className="text-2xl font-semibold text-ink">{thisMonth.length}</p>
          <p className="text-xs">Fares {fmtXcd(sum(thisMonth, "fare_xcd"))} · commission {fmtXcd(sum(thisMonth, "commission_xcd"))}</p></div>
      </div>

      <section aria-labelledby="setup-h" className={card}>
        <h2 id="setup-h" className="text-lg font-semibold">Set up an operator</h2>
        <p className="mt-1 text-sm">Find any business, then approve it for the trips it can take. It doesn’t need to have applied first.</p>
        <form className="mt-3 flex gap-2" role="search">
          <label htmlFor="op-q" className="sr-only">Business name</label>
          <input id="op-q" name="q" defaultValue={q} placeholder="Business name, e.g. Trans Island" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3" />
          <button className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-ink">Find</button>
        </form>
        {found && (
          <ul className="mt-3 divide-y divide-line">
            {found.map((b: any) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="font-semibold text-ink">{b.name}</span> <span className="text-sm">· {(b.business_locations?.[0]?.country_code ?? "").toUpperCase()} · {b.listing_status === "published" ? "live" : b.listing_status === "pending_review" ? "waiting for approval" : b.listing_status}</span></span>
                <Link href={`/admin/listings/${b.id}#operator`} className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink">Set up</Link>
              </li>
            ))}
            {!found.length && <li className="py-2.5 text-sm">No business found with that name. Check the Review queue: new registrations appear there until approved.</li>}
          </ul>
        )}
      </section>

      <section aria-labelledby="pending-h">
        <h2 id="pending-h" className="text-xl font-semibold">Applications to review ({pending.length})</h2>
        {!pending.length ? <p className="mt-2 text-sm">None waiting.</p> : (
          <ul className="mt-3 space-y-3">
            {pending.map((o: any) => (
              <li key={o.business_id} className={card}>
                <p className="font-semibold text-ink">{o.businesses?.name} <span className="text-sm font-normal">({(o.businesses?.business_locations?.[0]?.country_code ?? "").toUpperCase()})</span></p>
                <p className="text-sm">{(o.kinds as string[]).map((k) => TRIP_KIND_LABEL[k]).join(", ")}</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt>Licence</dt><dd className="text-ink">{o.licence_details}</dd>
                  <dt>Vehicles</dt><dd className="text-ink">{o.vehicle_details}</dd>
                  <dt>Insurance</dt><dd className="text-ink">{o.insurance_details ?? "Not given"}</dd>
                  <dt>Phone</dt><dd className="text-ink">{o.businesses?.phone_e164 ?? "None on listing"}</dd>
                  <dt>Documents</dt>
                  <dd className="flex flex-wrap gap-2">
                    {(o.document_paths ?? []).length ? (o.document_paths as string[]).map((p) => (
                      <a key={p} href={docUrl.get(p) ?? "#"} target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline">
                        {p.split("/")[1]?.split("-")[0] ?? "document"}
                      </a>
                    )) : <span className="text-ink">None uploaded</span>}
                  </dd>
                </dl>
                <p className="mt-2 text-xs">Approving also puts their listing live.</p>
                <form action={approveOperatorAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={o.business_id} />
                  <input name="note" maxLength={300} placeholder="Note (e.g. licence seen)" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-sm" />
                  <button formAction={approveOperatorAction} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink">Approve</button>
                  <button formAction={declineOperatorAction} className="h-10 rounded-lg border border-line px-4 text-sm font-semibold text-ink">Decline</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="approved-h">
        <h2 id="approved-h" className="text-xl font-semibold">Approved operators</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl bg-raised ring-1 ring-line/60">
          {approved.map((o: any) => (
            <li key={o.business_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span><span className="font-semibold text-ink">{o.businesses?.name}</span> <span className="text-sm">· {(o.kinds as string[]).map((k) => TRIP_KIND_LABEL[k]).join(", ")}</span></span>
              <form action={declineOperatorAction}><input type="hidden" name="id" value={o.business_id} />
                <button className="text-sm font-semibold text-danger underline">Withdraw approval</button></form>
            </li>
          ))}
          {!approved.length && <li className="px-4 py-4 text-sm">None yet.</li>}
        </ul>
      </section>
    </div>
  );
}
