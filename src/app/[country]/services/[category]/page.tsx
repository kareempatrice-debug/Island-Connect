import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { BusinessCard, BusinessGrid } from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";
import { SearchForm } from "@/components/search-form";
import { Chip, Container } from "@/components/ui";
import { categoryVisual, coverStyle } from "@/components/visuals";
import { data, getCountry } from "@/lib/data";
import { PAGE_SIZE, ShowMore, pageFrom } from "@/components/pager";

type Props = { params: Promise<{ country: string; category: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Omit<Props, "searchParams">): Promise<Metadata> {
  const { country, category } = await params;
  const c = (await data.getCategories(country)).find((x) => x.slug === category);
  return { title: c?.name ?? "Services" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { country: code, category: slug } = await params;
  const page = pageFrom((await searchParams).page);
  const country = (await getCountry(code))!;
  const [categories, islands] = await Promise.all([data.getCategories(code), data.getIslands(code)]);
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <Container className="pt-12">
        <EmptyState title={`This category isn’t available in ${country.name}`}>
          <Link href={`/${code}/services`} className="font-semibold text-link underline">
            See all services in {country.name}
          </Link>
        </EmptyState>
      </Container>
    );
  }

  const parent = category.parentSlug ? categories.find((c) => c.slug === category.parentSlug) : null;
  const children = categories.filter((c) => c.parentSlug === category.slug);
  const siblings = parent ? categories.filter((c) => c.parentSlug === parent.slug) : [];
  const chips = children.length ? children : siblings;
  const found = await data.searchBusinesses(code, { category: slug }, page * PAGE_SIZE + 1);
  const results = found.slice(0, page * PAGE_SIZE);
  const hasMore = found.length > results.length;
  const { Icon, tone } = categoryVisual(slug);
  const islandList = islands.map((i) => i.name);
  const where = islandList.length > 2 ? `${islandList.slice(0, -1).join(", ")} and ${islandList.at(-1)}` : islandList.join(" and ");
  const intro = category.description ?? `${category.name} across ${where}.`;

  return (
    <main>
      <section className="relative overflow-hidden" style={coverStyle(tone)}>
        <Icon className="absolute -right-8 -top-10 h-64 w-64 text-white/10 sm:h-80 sm:w-80" strokeWidth={1.1} aria-hidden="true" />
        <Container className="relative pb-10 pt-8 sm:pb-14 sm:pt-12">
          <nav aria-label="Breadcrumb" className="text-sm text-white/80">
            <Link href={`/${code}/services`} className="hover:text-white hover:underline">Services</Link>
            {parent && (
              <>
                <span className="mx-2" aria-hidden="true">/</span>
                <Link href={`/${code}/services/${parent.slug}`} className="hover:text-white hover:underline">{parent.name}</Link>
              </>
            )}
          </nav>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">{category.name}</h1>
          <p className="mt-2 max-w-xl text-lg text-white/85">{intro}</p>
          <div className="mt-6 max-w-xl">
            <SearchForm
              country={code}
              countryName={country.name}
              hidden={{ category: slug }}
              placeholder={`Search within ${category.name.toLowerCase()}`}
            />
          </div>
        </Container>
      </section>

      <Container>
        {chips.length > 0 && (
          <ul className="rail -mx-5 flex gap-2 overflow-x-auto px-5 py-5 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Narrow by type">
            {chips.map((c) => (
              <li key={c.slug}>
                <Chip href={`/${code}/services/${c.slug}`} active={c.slug === slug}>
                  {c.name}
                </Chip>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium text-ink" aria-live="polite">
            {results.length === 1 ? "1 business" : `${hasMore ? `${results.length}+` : results.length} businesses`} in {country.name}
          </p>
          <Link
            href={`/${code}/explore?category=${slug}`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-raised px-4 text-sm font-semibold text-ink hover:border-ink/30"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filter by island or {country.districtLabel.toLowerCase()}
          </Link>
        </div>

        <div className="mt-5">
          {results.length ? (
            <BusinessGrid>
              {results.map((b, i) => (
                <li key={b.id}>
                  <BusinessCard business={b} country={code} timeZone={country.timeZone} priority={i < 3} browsing={slug} />
                </li>
              ))}
            </BusinessGrid>
          ) : null}
          {results.length ? (
            <ShowMore basePath={`/${code}/services/${slug}`} params={{}} page={page} shown={results.length} hasMore={hasMore} />
          ) : (
            <EmptyState title={`No ${category.name.toLowerCase()} listed in ${country.name} yet`}>
              <p>Listings are being added and checked. Try a related type above, or search for what you need.</p>
            </EmptyState>
          )}
        </div>
      </Container>
    </main>
  );
}
