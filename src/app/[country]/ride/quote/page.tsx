import { createTripRequestAction } from "@/app/trip-actions";
import { isSupabaseConfigured } from "@/lib/data";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuoteRequest, type QuoteOperator, type QuotePlace } from "@/components/ride/quote-request";
import { Container } from "@/components/ui";
import { businessCountries, data, getCountries, getCountry } from "@/lib/data";
import { QUOTE_CATEGORIES, QUOTE_TITLES, type QuoteKind } from "@/lib/transport";

export const metadata: Metadata = { title: "Request a quote" };

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ country: code }, sp] = await Promise.all([params, searchParams]);
  // Freight is now part of trucking and haulage; keep old links working.
  if (sp.type === "freight") redirect(`/${code}/ride/quote?type=haulage`);
  const kind = (["boat", "haulage"] as const).find((k) => k === sp.type);
  if (!kind) notFound();
  const [country, countries] = await Promise.all([getCountry(code), getCountries()]);

  // Routes can cross the border, so load islands and operators for both countries.
  const places: QuotePlace[] = (
    await Promise.all(
      countries.map(async (c) =>
        (await data.getIslands(c.code)).map((i) => ({ key: `${c.code}:${i.slug}`, name: i.name, countryCode: c.code, countryName: c.shortName === "SVG" ? "SVG" : c.name, isMain: i.isMain })),
      ),
    )
  )
    .flat()
    .sort((a, b) => Number(b.countryCode === code) - Number(a.countryCode === code));

  const seen = new Set<string>();
  const operators: QuoteOperator[] = [];
  for (const c of countries) {
    for (const cat of QUOTE_CATEGORIES[kind as QuoteKind]) {
      for (const b of await data.searchBusinesses(c.code, { category: cat }, 100)) {
        if (seen.has(b.slug)) continue;
        seen.add(b.slug);
        operators.push({
          slug: b.slug,
          countryCode: businessCountries(b).includes(code) ? code : c.code,
          name: b.name,
          tagline: b.tagline,
          areas: [...b.locations.map((l) => `${l.countryCode}:${l.islandSlug}`), ...b.serviceAreas.map((a) => `${a.countryCode}:${a.islandSlug}`)],
          whatsapp: b.whatsapp,
          phone: b.phone,
          isDemo: b.isDemo,
          verified: b.verificationStatus === "verified" && !b.isDemo,
        });
      }
    }
  }

  const main = places.find((p) => p.countryCode === code && p.isMain)!;
  const defaults: Record<QuoteKind, [string, string]> = {
    freight: [main.key, "gd:carriacou"],
    haulage: [main.key, main.key],
    boat: code === "vc" ? ["vc:union-island", "gd:carriacou"] : ["gd:carriacou", "vc:union-island"],
  };
  const [from, to] = defaults[kind as QuoteKind];
  const t = QUOTE_TITLES[kind];

  return (
    <main>
      <section className="bg-deep">
        <Container className="pb-8 pt-6 sm:pb-10">
          <Link href={`/${code}/ride`} className="text-sm font-semibold text-white/80 hover:text-white hover:underline">Ride and delivery</Link>
          <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-gold">CUSTOM QUOTE · {country!.shortName.toUpperCase()}</p>
          <h1 className="mt-1 text-[2rem] font-bold leading-tight text-white sm:text-5xl">{t.title}</h1>
          <p className="mt-2 max-w-xl text-white/85">{t.lead}</p>
        </Container>
      </section>
      <Container className="max-w-2xl pt-6">
        <QuoteRequest kind={kind} countryCode={code} places={places} operators={operators} defaultFrom={from} defaultTo={to} requestInApp={isSupabaseConfigured ? createTripRequestAction : undefined} />
      </Container>
    </main>
  );
}
