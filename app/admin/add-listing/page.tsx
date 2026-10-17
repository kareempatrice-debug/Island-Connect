import Link from "next/link";
import { AdminListingForm } from "@/components/forms/admin-listing-form";
import { data, getCountries } from "@/lib/data";

export default async function AddListing({ searchParams }: { searchParams: Promise<{ country?: string; added?: string }> }) {
  const sp = await searchParams;
  const countries = await getCountries();
  const code = countries.some((c) => c.code === sp.country) ? sp.country! : countries[0].code;
  const [categories, islands, districts] = await Promise.all([data.getCategories(code), data.getIslands(code), data.getDistricts(code)]);
  const parents = new Map(categories.filter((c) => !c.parentSlug).map((c) => [c.slug, c.name]));
  return (
    <div className="mt-4">
      <h1 className="text-2xl font-semibold">Add a listing from research</h1>
      <p className="mt-1 max-w-3xl">It goes live straight away as unclaimed, with a “Claim this listing” link for the owner.</p>
      <div className="mt-4 flex gap-2">
        {countries.map((c) => (
          <Link key={c.code} href={`/admin/add-listing?country=${c.code}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${c.code === code ? "bg-deep text-white" : "bg-raised text-ink ring-1 ring-line"}`}>{c.name}</Link>
        ))}
      </div>
      {sp.added && (
        <p role="status" className="mt-4 rounded-lg bg-success/10 px-4 py-3 font-medium text-success">
          Added. <Link href={`/${code}/business/${sp.added}`} className="underline">View the listing</Link>
        </p>
      )}
      <AdminListingForm
        key={code}
        country={code}
        categories={categories.filter((c) => c.parentSlug).map((c) => ({ slug: c.slug, name: c.name, group: parents.get(c.parentSlug!) ?? "" }))}
        islands={islands.map(({ slug, name }) => ({ slug, name }))}
        districts={districts.map(({ slug, name, islandSlug }) => ({ slug, name, islandSlug }))}
        today={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}
