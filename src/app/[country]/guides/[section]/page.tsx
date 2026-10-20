import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, CircleDashed, FileCheck2 } from "lucide-react";
import { PlacePhoto } from "@/components/photo";
import { Container } from "@/components/ui";
import { categoryVisual, toneClasses } from "@/components/visuals";
import { countryImagery, fallbackImagery } from "@/data/photos";
import { data, getCountry } from "@/lib/data";
import { getGuideSection } from "@/lib/guides";

type Props = { params: Promise<{ country: string; section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getGuideSection((await params).section)?.title ?? "Guides" };
}

const longDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function GuideSectionPage({ params }: Props) {
  const { country: code, section: slug } = await params;
  const section = getGuideSection(slug);
  if (!section) notFound();
  const [country, unordered, categories] = await Promise.all([getCountry(code), data.getArticles(code, section.slug), data.getCategories(code)]);
  // Articles follow the guide's own topic order; topics already published drop out of "on the way".
  const order = (t: string) => { const i = section.topics.findIndex((x) => x.title.toLowerCase() === t.toLowerCase()); return i < 0 ? 999 : i; };
  const articles = [...unordered].sort((a, b) => order(a.title) - order(b.title));
  const published = new Set(articles.map((a) => a.title.toLowerCase()));
  const upcoming = section.topics.filter((t) => !published.has(t.title.toLowerCase()));
  const c = country!;
  const imagery = countryImagery[code] ?? fallbackImagery;
  const photo = imagery.guides[section.slug] ?? imagery.hero;
  const enabled = new Set(categories.map((x) => x.slug));
  const related = section.relatedCategories.filter((s) => enabled.has(s)).map((s) => categories.find((x) => x.slug === s)!);
  const counts = new Map(
    await Promise.all(related.map(async (r) => [r.slug, (await data.searchBusinesses(code, { category: r.slug })).length] as const)),
  );

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-deep">
        <PlacePhoto photoKey={photo} sizes="100vw" priority credit />
        <div className="absolute inset-0 bg-gradient-to-r from-[#032E33]/90 via-[#032E33]/70 to-[#032E33]/30" aria-hidden="true" />
        <Container className="relative py-14 sm:py-20">
          <Link href={`/${code}/guides`} className="text-sm font-medium text-gold hover:underline">Guides for {c.name}</Link>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">{section.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{section.intro}</p>
        </Container>
      </section>

      <Container className="pt-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_21rem] lg:gap-14">
          <div className="min-w-0">
            {articles.length > 0 && (
              <section aria-labelledby="published-heading" className="mb-12">
                <h2 id="published-heading" className="text-2xl font-semibold">Published guides</h2>
                <ul className="mt-4 grid gap-3">
                  {articles.map((a) => (
                    <li key={a.id}>
                      <Link href={`/${code}/guides/${section.slug}/${a.slug}`} className="group flex items-start gap-4 rounded-2xl bg-raised p-5 shadow-card ring-1 ring-line/60 hover:ring-primary/40">
                        <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                        <span className="flex-1">
                          <span className="block font-display text-lg font-semibold text-ink">{a.title}</span>
                          {a.summary && <span className="mt-1 block">{a.summary}</span>}
                          {a.verifiedAt && <span className="mt-2 block text-sm">Checked {longDate(a.verifiedAt)}</span>}
                        </span>
                        <ChevronRight className="mt-1 h-5 w-5 text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {upcoming.length > 0 && <section aria-labelledby="topics-heading">
              <h2 id="topics-heading" className="text-2xl font-semibold">
                {articles.length ? "More topics on the way" : "What this guide will cover"}
              </h2>
              {!articles.length && (
                <p className="mt-2 max-w-2xl">
                  This guide is in preparation. Each topic is published only after it has been checked against official sources for {c.name}.
                </p>
              )}
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {upcoming.map((t) => (
                  <li key={t.title} className="flex gap-3 rounded-2xl bg-raised p-4 ring-1 ring-line/60">
                    <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-ink">{t.title}</span>
                      <span className="block text-sm">{t.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>}

            {section.areas && (
              <section aria-labelledby="areas-heading" className="mt-12">
                <h2 id="areas-heading" className="text-2xl font-semibold">
                  {section.slug === "property-investment" ? "Property help in " : "Business help in "}
                  {c.name}
                </h2>
                <p className="mt-2 max-w-2xl">
                  {section.slug === "property-investment"
                    ? "Property listings are planned. For now, these links take you to the professionals who handle each kind of property."
                    : "Professionals who can help you set up and run a business."}
                </p>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.areas
                    .filter((a) => enabled.has(a.category))
                    .map((a) => {
                      const { Icon, tone } = categoryVisual(a.category);
                      return (
                        <li key={a.title}>
                          <Link href={`/${code}/services/${a.category}`} className="group flex h-full flex-col rounded-2xl bg-raised p-5 shadow-card ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-lift">
                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone].soft}`}>
                              <Icon className={`h-5 w-5 ${toneClasses[tone].icon}`} aria-hidden="true" />
                            </span>
                            <span className="mt-4 font-semibold text-ink">{a.title}</span>
                            <span className="mt-1 flex-1 text-sm">{a.text}</span>
                            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-link">
                              Find providers <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </section>
            )}
          </div>

          {related.length > 0 && (
            <aside aria-labelledby="help-heading">
              <div className="rounded-panel bg-deep p-6 text-white lg:sticky lg:top-24">
                <h2 id="help-heading" className="text-xl font-semibold text-white">Find help in {c.shortName}</h2>
                <ul className="mt-4 space-y-1">
                  {related.map((r) => {
                    const n = counts.get(r.slug) ?? 0;
                    return (
                      <li key={r.slug}>
                        <Link href={`/${code}/services/${r.slug}`} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/10">
                          <span className="font-medium">{r.name}</span>
                          <span className="text-sm text-white/70">{n ? n : "None yet"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </Container>
    </main>
  );
}
