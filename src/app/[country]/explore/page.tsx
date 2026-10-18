import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { BusinessCard, BusinessGrid } from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "@/components/search-form";
import { Container, btn } from "@/components/ui";
import { data, getCountry } from "@/lib/data";
import { parseFilters } from "@/lib/filters";
import { PAGE_SIZE, ShowMore, pageFrom } from "@/components/pager";
import type { SearchFilters } from "@/lib/types";

type Props = {
  params: Promise<{ country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const country = await getCountry((await params).country);
  const q = parseFilters(await searchParams).q;
  return { title: q ? `“${q}”` : `Explore ${country?.name ?? ""}` };
}

const plural = (w: string) => (/(sh|ch|s|x)$/.test(w) ? `${w}es` : `${w}s`);
const field =
  "h-12 w-full appearance-none rounded-xl border border-line bg-raised px-3.5 text-ink transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

/** URL for the current search with one filter removed. */
function without(code: string, f: SearchFilters, key: string): string {
  const p = new URLSearchParams();
  if (f.q && key !== "q") p.set("q", f.q);
  if (f.category && key !== "category") p.set("category", f.category);
  if (f.island && key !== "island") p.set("island", f.island);
  if (f.district && key !== "district") p.set("district", f.district);
  if (f.openNow && key !== "open") p.set("open", "1");
  if (f.verifiedOnly && key !== "verified") p.set("verified", "1");
  if (f.sort && key !== "sort") p.set("sort", f.sort);
  const s = p.toString();
  return `/${code}/explore${s ? `?${s}` : ""}`;
}

export default async function Explore({ params, searchParams }: Props) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = pageFrom(sp.page);
  const [found, categories, islands, districts] = await Promise.all([
    data.searchBusinesses(code, filters, page * PAGE_SIZE + 1),
    data.getCategories(code),
    data.getIslands(code),
    data.getDistricts(code),
  ]);
  const results = found.slice(0, page * PAGE_SIZE);
  const hasMore = found.length > results.length;
  const parents = categories.filter((c) => !c.parentSlug);
  const categoryName = categories.find((c) => c.slug === filters.category)?.name;
  const islandName = islands.find((i) => i.slug === filters.island)?.name;
  const districtName = districts.find((d) => d.slug === filters.district)?.name;

  const active = [
    filters.category && { key: "category", label: categoryName ?? filters.category },
    filters.island && { key: "island", label: islandName ?? filters.island },
    filters.district && { key: "district", label: districtName ?? filters.district },
    filters.openNow && { key: "open", label: "Open now" },
    filters.verifiedOnly && { key: "verified", label: "Verified only" },
  ].filter((x): x is { key: string; label: string } => Boolean(x));

  const heading = filters.q
    ? `Results for “${filters.q}”`
    : categoryName
      ? `${categoryName}${islandName ? ` on ${islandName}` : ""}`
      : islandName
        ? `Everything on ${islandName}`
        : `Explore ${country.name}`;

  const filterForm = (
    <form method="get" className="space-y-5" aria-label="Filter results">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Category</span>
        <select name="category" defaultValue={filters.category ?? ""} className={field}>
          <option value="">All categories</option>
          {parents.map((p) => (
            <optgroup key={p.slug} label={p.name}>
              <option value={p.slug}>All {p.name.toLowerCase()}</option>
              {categories
                .filter((c) => c.parentSlug === p.slug)
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Island</span>
        <select name="island" defaultValue={filters.island ?? ""} className={field}>
          <option value="">All islands</option>
          {islands.map((i) => (
            <option key={i.slug} value={i.slug}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">{country.districtLabel}</span>
        <select name="district" defaultValue={filters.district ?? ""} className={field}>
          <option value="">All {plural(country.districtLabel.toLowerCase())}</option>
          {districts.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="space-y-3">
        <legend className="mb-1.5 text-sm font-semibold text-ink">Show only</legend>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="open" value="1" defaultChecked={filters.openNow} className="h-5 w-5 rounded accent-[rgb(var(--primary))]" />
          <span className="text-ink">Open now</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" name="verified" value="1" defaultChecked={filters.verifiedOnly} className="h-5 w-5 rounded accent-[rgb(var(--primary))]" />
          <span className="text-ink">Verified businesses</span>
        </label>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Sort by</span>
        <select name="sort" defaultValue={filters.sort ?? "relevance"} className={field}>
          <option value="relevance">Best match</option>
          <option value="newest">Newest</option>
          <option value="rating">Highest rated</option>
        </select>
      </label>
      <button type="submit" className={`${btn.primary} w-full`}>
        Show results
      </button>
    </form>
  );

  return (
    <main>
      <section className="bg-deep">
        <Container className="py-6 sm:py-8">
          <SearchForm
            country={code}
            countryName={country.name}
            defaultValue={filters.q}
            hidden={Object.fromEntries(
              Object.entries({ category: filters.category, island: filters.island, district: filters.district }).filter(
                (e): e is [string, string] => Boolean(e[1]),
              ),
            )}
          />
        </Container>
      </section>

      <Container className="pt-6 sm:pt-10">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24 rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60">
              <h2 className="mb-4 font-sans text-base font-semibold">Filters</h2>
              {filterForm}
            </div>
          </aside>

          <section aria-labelledby="results-heading" className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 id="results-heading" className="text-[1.75rem] font-semibold leading-tight sm:text-4xl">
                  {heading}
                </h1>
                <p className="mt-1" aria-live="polite">
                  {results.length === 1 ? "1 business" : `${hasMore ? `${results.length}+` : results.length} businesses`} in {country.name}
                </p>
              </div>
            </div>

            <details className="group mt-4 lg:hidden">
              <summary className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-raised px-4 font-semibold text-ink shadow-sm">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters{active.length ? ` (${active.length})` : ""}
              </summary>
              <div className="mt-3 rounded-panel bg-raised p-5 shadow-lift ring-1 ring-line/60">{filterForm}</div>
            </details>

            {active.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
                {active.map((a) => (
                  <li key={a.key}>
                    <Link
                      href={without(code, filters, a.key)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-deep/10 pl-3.5 pr-2.5 text-sm font-medium text-ink hover:bg-deep/15 dark:bg-link/15"
                      aria-label={`Remove filter: ${a.label}`}
                    >
                      {a.label}
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={`/${code}/explore${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ""}`} className="inline-flex h-9 items-center px-2 text-sm font-semibold text-link hover:underline">
                    Clear all
                  </Link>
                </li>
              </ul>
            )}

            <div className="mt-6">
              {results.length ? (
                <BusinessGrid>
                  {results.map((b, i) => (
                    <li key={b.id}>
                      <BusinessCard business={b} country={code} timeZone={country.timeZone} priority={i < 3} />
                    </li>
                  ))}
                </BusinessGrid>
              ) : null}
              {results.length ? (
                <ShowMore basePath={`/${code}/explore`} params={Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))} page={page} shown={results.length} hasMore={hasMore} />
              ) : (
                <EmptyState title="No businesses match yet">
                  <p>
                    Try fewer filters or a broader search. Listings in {country.name} are still being added, so something you need
                    may not be here yet.
                  </p>
                  {active.length > 0 && (
                    <Link href={`/${code}/explore`} className="mt-4 inline-block font-semibold text-link underline">
                      Clear all filters
                    </Link>
                  )}
                </EmptyState>
              )}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
