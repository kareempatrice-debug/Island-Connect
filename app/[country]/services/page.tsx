import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Chip, Container } from "@/components/ui";
import { categoryVisual, coverStyle } from "@/components/visuals";
import { data, getCountry } from "@/lib/data";

export const metadata: Metadata = { title: "Services" };

const POPULAR = ["airport-transfers", "electricians", "plumbers", "builders-contractors", "tours", "restaurants", "lawyers", "accountants", "car-rental", "salons-barbers"];

export default async function Services({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ find?: string }>;
}) {
  const { country: code } = await params;
  const find = ((await searchParams).find ?? "").trim().slice(0, 60);
  const country = (await getCountry(code))!;
  const categories = await data.getCategories(code);
  const parents = categories.filter((c) => !c.parentSlug);
  const childrenOf = (slug: string) => categories.filter((c) => c.parentSlug === slug);
  const matches = find ? categories.filter((c) => c.name.toLowerCase().includes(find.toLowerCase())) : [];

  return (
    <main>
      <section className="bg-deep">
        <Container className="pb-10 pt-10 sm:pb-14 sm:pt-14">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Services in {country.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-white/80">Every kind of business on Island Connect, from airport transfers to accountants.</p>
          <form method="get" role="search" className="relative mt-6 max-w-xl">
            <label htmlFor="find" className="sr-only">Find a type of service</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="find"
              name="find"
              defaultValue={find}
              placeholder="Find a type of service, e.g. plumber"
              className="h-14 w-full rounded-full bg-raised pl-12 pr-28 text-[1.0625rem] text-ink placeholder:text-muted/75 focus:outline-none focus:ring-4 focus:ring-gold/40"
            />
            <button type="submit" className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-primary px-5 font-semibold text-primary-ink">
              Find
            </button>
          </form>
        </Container>
      </section>

      <Container className="pt-10">
        {find && (
          <section aria-labelledby="matches-heading" className="mb-12">
            <h2 id="matches-heading" className="text-2xl font-semibold">
              Service types matching “{find}”
            </h2>
            {matches.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {matches.map((m) => (
                  <li key={m.slug}>
                    <Chip href={`/${code}/services/${m.slug}`}>{m.name}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState title="No service type by that name">
                  <p>
                    Try a broader word, or{" "}
                    <Link className="font-semibold text-link underline" href={`/${code}/explore?q=${encodeURIComponent(find)}`}>
                      search businesses for “{find}”
                    </Link>
                    .
                  </p>
                </EmptyState>
              </div>
            )}
          </section>
        )}

        <h2 className="text-2xl font-semibold">Browse by category</h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {parents.map((p) => {
            const { Icon, tone } = categoryVisual(p.slug);
            return (
              <li key={p.slug}>
                <Link
                  href={`/${code}/services/${p.slug}`}
                  style={coverStyle(tone)}
                  className="group relative flex aspect-[5/4] flex-col justify-end overflow-hidden rounded-panel p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:aspect-[4/3] sm:p-5"
                >
                  <Icon className="absolute right-3 top-3 h-9 w-9 text-white/90 sm:h-11 sm:w-11" strokeWidth={1.5} aria-hidden="true" />
                  <span className="font-display text-lg font-semibold leading-tight text-white sm:text-xl">{p.name}</span>
                  <span className="mt-1 text-[0.8rem] text-white/80">{childrenOf(p.slug).length} types</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h2 className="mt-12 text-2xl font-semibold">Popular right now</h2>
        <ul className="rail -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {POPULAR.map((s) => categories.find((c) => c.slug === s))
            .filter((c) => c !== undefined)
            .map((c) => {
              const { Icon } = categoryVisual(c.slug);
              return (
                <li key={c.slug}>
                  <Chip href={`/${code}/services/${c.slug}`}>
                    <Icon className="h-4 w-4 text-link" aria-hidden="true" />
                    {c.name}
                  </Chip>
                </li>
              );
            })}
        </ul>

        <h2 className="mt-12 text-2xl font-semibold">Full directory</h2>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-panel bg-raised shadow-card ring-1 ring-line/60">
          {parents.map((p) => {
            const { Icon } = categoryVisual(p.slug);
            return (
              <details key={p.slug} className="group">
                <summary className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-sunken/60">
                  <Icon className="h-5 w-5 text-link" aria-hidden="true" />
                  <span className="flex-1 font-semibold text-ink">{p.name}</span>
                  <span className="text-sm">{childrenOf(p.slug).length}</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="grid gap-x-6 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                  {childrenOf(p.slug).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/${code}/services/${c.slug}`} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-ink hover:bg-sunken">
                        {c.name}
                        <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={`/${code}/services/${p.slug}`} className="flex items-center rounded-lg px-2 py-2.5 font-semibold text-link hover:bg-sunken">
                      Everything in {p.name.toLowerCase()}
                    </Link>
                  </li>
                </ul>
              </details>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
