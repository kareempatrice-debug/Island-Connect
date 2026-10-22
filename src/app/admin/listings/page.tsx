import Link from "next/link";
import { setListingStatusAction } from "../actions";
import { supabaseForRequest } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STATUS_LABEL: Record<string, string> = { published: "Live", suspended: "Hidden", pending_review: "In review", draft: "Draft" };
const PAGE = 50;

export default async function AdminListings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const country = sp.country === "gd" || sp.country === "vc" ? sp.country : "";
  const status = ["published", "suspended", "pending_review", "draft"].includes(sp.status ?? "") ? sp.status! : "";
  const page = Math.max(1, Math.min(50, Number(sp.page) || 1));

  const supabase = await supabaseForRequest();
  let query = supabase
    .from("businesses")
    .select("id, slug, name, listing_status, claim_status, is_demo, phone_e164, business_locations!inner ( country_code, islands ( name ) )", { count: "exact" })
    .order("name")
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (country) query = query.eq("business_locations.country_code", country);
  if (status) query = query.eq("listing_status", status as any);
  const { data, count } = await query;

  const params = new URLSearchParams(Object.entries({ q, country, status }).filter(([, v]) => v) as [string, string][]);
  const here = `/admin/listings${params.size ? `?${params}` : ""}`;
  const pageLink = (n: number) => { const p = new URLSearchParams(params); p.set("page", String(n)); return `/admin/listings?${p}`; };
  const input = "h-10 rounded-lg border border-line bg-raised px-3 text-sm text-ink";

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-semibold">Listings</h1>
      {sp.done && <p role="status" className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">{{ deleted: "Listing deleted.", suspended: "Listing hidden from the site.", published: "Listing is live.", pending_review: "Listing moved back to review." }[sp.done] ?? "Done."}</p>}
      {sp.error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{sp.error}</p>}

      <form className="mt-4 flex flex-wrap items-center gap-2" role="search">
        <label className="sr-only" htmlFor="q">Search by name</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by business name" className={`${input} w-full min-w-0 sm:w-auto sm:flex-1`} />
        <select name="country" defaultValue={country} aria-label="Country" className={input}>
          <option value="">Both countries</option><option value="vc">SVG</option><option value="gd">Grenada</option>
        </select>
        <select name="status" defaultValue={status} aria-label="Status" className={input}>
          <option value="">Any status</option><option value="published">Live</option><option value="suspended">Hidden</option><option value="pending_review">In review</option>
        </select>
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink">Search</button>
      </form>
      <p className="mt-3 text-sm">{count ?? 0} listings{q ? ` matching “${q}”` : ""}</p>

      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-raised ring-1 ring-line/60">
        {(data ?? []).map((b: any) => {
          const l = b.business_locations?.[0];
          const live = b.listing_status === "published";
          return (
            <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{b.name}{b.is_demo && <span className="ml-2 text-xs font-normal">(demo)</span>}</p>
                <p className="text-sm">{(l?.country_code ?? "").toUpperCase()} · {l?.islands?.name} · {STATUS_LABEL[b.listing_status]}{b.claim_status === "unclaimed" ? " · unclaimed" : ""}</p>
              </div>
              {live && l && <Link href={`/${l.country_code}/business/${b.slug}`} className="text-sm font-semibold text-link hover:underline">View</Link>}
              <Link href={`/admin/listings/${b.id}`} className="h-9 rounded-lg border border-line px-3 text-sm font-semibold leading-9 text-ink">Edit</Link>
              <form action={setListingStatusAction}>
                <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
                <input type="hidden" name="status" value={live ? "suspended" : "published"} />
                <button className={`h-9 rounded-lg px-3 text-sm font-semibold ${live ? "border border-line text-ink" : "bg-primary text-primary-ink"}`}>
                  {live ? "Hide" : "Make live"}
                </button>
              </form>
            </li>
          );
        })}
        {!data?.length && <li className="px-4 py-6 text-center text-sm">No listings match.</li>}
      </ul>
      {(count ?? 0) > PAGE && (
        <nav aria-label="Pages" className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 && <Link href={pageLink(page - 1)} className="font-semibold text-link hover:underline">Previous</Link>}
          <span>Page {page} of {Math.ceil((count ?? 0) / PAGE)}</span>
          {page * PAGE < (count ?? 0) && <Link href={pageLink(page + 1)} className="font-semibold text-link hover:underline">Next</Link>}
        </nav>
      )}
    </div>
  );
}
