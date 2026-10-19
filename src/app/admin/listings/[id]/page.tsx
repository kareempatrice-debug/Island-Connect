import Link from "next/link";
import { notFound } from "next/navigation";
import { setListingStatusAction } from "../../actions";
import { setFounderAction } from "@/app/trip-actions";
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
      {sp.done && <p role="status" className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">{sp.done === "suspended" ? "Hidden from the site." : sp.done === "published" ? "The listing is live." : "Updated."}</p>}
      {sp.error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{sp.error}</p>}

      <form action={setListingStatusAction} className="mt-4">
        <input type="hidden" name="id" value={b.id} /><input type="hidden" name="back" value={here} />
        <button name="status" value={live ? "suspended" : "published"} className={`h-10 rounded-lg px-4 text-sm font-semibold ${live ? "border border-line text-ink" : "bg-primary text-primary-ink"}`}>
          {live ? "Hide from the site" : "Make live"}
        </button>
      </form>

      <form action={setFounderAction} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-sunken px-4 py-3 text-sm">
        <input type="hidden" name="id" value={b.id} />
        <span className="flex-1 text-ink">{(b as any).founder_owned ? "Shows the label “Operated by the Island Connect founder”." : "No founder label."}</span>
        <button name="value" value={(b as any).founder_owned ? "off" : "on"} className="h-9 rounded-lg border border-line bg-raised px-3 font-semibold text-ink">
          {(b as any).founder_owned ? "Remove founder label" : "Add founder label"}
        </button>
      </form>

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
