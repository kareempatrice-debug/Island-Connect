import Link from "next/link";
import { notFound } from "next/navigation";
import { assignOwnerAction, setListingStatusAction } from "../../actions";
import { adminRemoveOperatorAction, adminSetOperatorAction, setFounderAction } from "@/app/trip-actions";
import { TRIP_KIND_LABEL } from "@/lib/trips";
import { AdminListingEdit } from "@/components/forms/admin-listing-edit";
import { supabaseForRequest } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function EditListing({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await supabaseForRequest();
  const { data: b } = await supabase
    .from("businesses")
    .select("id, slug, name, founder_owned, tagline, description, phone_e164, whatsapp_e164, email, website, listing_status, claim_status, source_url, source_checked_at, business_locations ( country_code, landmark, is_primary )")
    .eq("id", id).maybeSingle();
  if (!b) notFound();
  const { data: owners } = await supabase.rpc("admin_business_owners", { p_business: id });
  const { data: op } = await supabase.from("operator_profiles").select("kinds, status, licence_details, vehicle_details, insurance_details").eq("business_id", id).maybeSingle();
  const loc = (b as any).business_locations?.find((l: any) => l.is_primary) ?? (b as any).business_locations?.[0];
  const live = b.listing_status === "published";
  const here = `/admin/listings/${b.id}`;

  return (
    <div className="mt-4 max-w-3xl">
      <Link href="/admin/listings" className="text-sm font-semibold text-link hover:underline">All listings</Link>
      <h1 className="mt-2 text-2xl font-semibold">{b.name}</h1>
      <p className="mt-1 text-sm">
        {live ? "Live on the site" : b.listing_status === "suspended" ? "Hidden from the site" : "Not live"} · {b.claim_status === "unclaimed" ? "unclaimed" : "claimed"}
        {b.source_url && <> · <a href={b.source_url} target="_blank" rel="noopener noreferrer" className="text-link underline">source</a> checked {b.source_checked_at}</>}
        {live && loc && <> · <Link href={`/${loc.country_code}/business/${b.slug}`} className="text-link underline">view on site</Link></>}
      </p>
      {sp.done && <p role="status" className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">{sp.done === "suspended" ? "Hidden from the site." : sp.done === "published" ? "The listing is live." : sp.done === "operator" ? "Saved. This business now receives trip requests for the ticked trips." : sp.done === "operator-removed" ? "This business no longer receives trip requests." : sp.done === "owner" ? "Owner added. They can now manage this listing from their account." : "Updated."}</p>}
      {sp.error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{sp.error}</p>}

      <form action={setListingStatusAction} className="mt-4">
        <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
        <input type="hidden" name="status" value={live ? "suspended" : "published"} />
                <button className={`h-10 rounded-lg px-4 text-sm font-semibold ${live ? "border border-line text-ink" : "bg-primary text-primary-ink"}`}>
          {live ? "Hide from the site" : "Make live"}
        </button>
      </form>

      <form action={setFounderAction} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-sunken px-4 py-3 text-sm">
        <input type="hidden" name="id" value={b.id} />
        <span className="flex-1 text-ink">{(b as any).founder_owned ? "Shows the label “Operated by the Island Connect founder”." : "No founder label."}</span>
        <input type="hidden" name="value" value={(b as any).founder_owned ? "off" : "on"} />
        <button className="h-9 rounded-lg border border-line bg-raised px-3 font-semibold text-ink">
          {(b as any).founder_owned ? "Remove founder label" : "Add founder label"}
        </button>
      </form>

      <section id="owner" className="mt-6 scroll-mt-24 rounded-2xl bg-raised p-5 ring-1 ring-line/60" aria-labelledby="owner-h">
        <h2 id="owner-h" className="text-lg font-semibold">Owner</h2>
        <p className="mt-1 text-sm">
          {(owners as { email: string }[] | null)?.length ? `Managed by ${(owners as { email: string }[]).map((o) => o.email).join(", ")}.` : "No one manages this listing yet."}
          {" "}To hand it to the business, ask them to create a free account (Join free) and enter the email they used.
        </p>
        <form action={assignOwnerAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={b.id} />
          <input name="email" type="email" required placeholder="Owner’s account email" className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3" />
          <button className="h-11 rounded-lg bg-primary px-4 font-semibold text-primary-ink">Add as owner</button>
        </form>
      </section>

      <section id="operator" className="mt-6 scroll-mt-24 rounded-2xl bg-raised p-5 ring-1 ring-line/60" aria-labelledby="op-h">
        <h2 id="op-h" className="text-lg font-semibold">Transport operator</h2>
        <p className="mt-1 text-sm">
          {op?.status === "approved" ? `Approved: receives requests for ${(op.kinds as string[]).map((k) => TRIP_KIND_LABEL[k]).join(", ")}.`
            : op?.status === "pending" ? "Has applied and is waiting for approval. Their details are below; tick the trips and approve."
            : "Not set up to receive trip requests. Tick the trips this business can take, then approve."}
        </p>
        {op && op.status !== "approved" && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt>Licence</dt><dd className="text-ink">{op.licence_details}</dd>
            <dt>Vehicles</dt><dd className="text-ink">{op.vehicle_details}</dd>
            <dt>Insurance</dt><dd className="text-ink">{op.insurance_details ?? "Not given"}</dd>
          </dl>
        )}
        <form action={adminSetOperatorAction} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={b.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            {(["taxi", "airport", "group", "boat", "haulage"] as const).map((k) => (
              <label key={k} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                <input type="checkbox" name="kinds" value={k} defaultChecked={(op?.kinds as string[] | undefined)?.includes(k)} className="h-5 w-5 accent-[rgb(var(--primary))]" />
                <span className="text-ink">{TRIP_KIND_LABEL[k]}</span>
              </label>
            ))}
          </div>
          <input name="note" maxLength={300} placeholder="Note for the record (e.g. licence seen in person)" className="h-11 w-full rounded-lg border border-line bg-raised px-3 text-sm" />
          <button className="h-11 rounded-lg bg-primary px-5 font-semibold text-primary-ink">{op?.status === "approved" ? "Update trip types" : "Approve as transport operator"}</button>
        </form>
        {op?.status === "approved" && (
          <form action={adminRemoveOperatorAction} className="mt-3">
            <input type="hidden" name="id" value={b.id} />
            <button className="text-sm font-semibold text-danger underline">Stop sending trip requests to this business</button>
          </form>
        )}
      </section>

      <div className="mt-6">
        <AdminListingEdit
          listing={{
            id: b.id, country: loc?.country_code ?? "gd", name: b.name, tagline: b.tagline ?? "", description: b.description ?? "",
            landmark: loc?.landmark ?? "", phone: b.phone_e164 ?? "", whatsapp: b.whatsapp_e164 ?? "", email: b.email ?? "", website: b.website ?? "",
          }}
        />
      </div>
    </div>
  );
}
