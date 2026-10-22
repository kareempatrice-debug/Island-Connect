import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PlacePhoto } from "@/components/photo";
import { Container } from "@/components/ui";
import { countryImagery, fallbackImagery } from "@/data/photos";
import { data, getCountry } from "@/lib/data";
import { guideSections } from "@/lib/guides";

// Served ready-made from Netlify and refreshed at most every 5 minutes (or straight away when a listing changes).
export const revalidate = 300;


export const metadata: Metadata = { title: "Guides" };

export default async function Guides({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  const articles = await data.getArticles(code);
  const imagery = countryImagery[code] ?? fallbackImagery;
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-deep">
        <PlacePhoto photoKey={imagery.hero} sizes="100vw" priority credit />
        <div className="absolute inset-0 bg-[#032E33]/70" aria-hidden="true" />
        <Container className="relative py-14 sm:py-20">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Guides for {country.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Practical guidance written for {country.name} specifically, for people moving home, buying property or starting
            out in business.
          </p>
        </Container>
      </section>
      <Container className="pt-10">
        <p className="flex max-w-3xl items-start gap-3 rounded-2xl bg-raised p-4 shadow-card ring-1 ring-line/60">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <span>
            Every guide is checked against official {country.name} sources before it’s published, shows the date it was checked,
            and links to those sources. Guides are information, not legal or tax advice.
          </span>
        </p>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {guideSections.map((g) => {
            const count = articles.filter((a) => a.section === g.slug).length;
            const photo = imagery.guides[g.slug];
            return (
              <li key={g.slug}>
                <Link href={`/${code}/guides/${g.slug}`} className="group flex h-full flex-col overflow-hidden rounded-panel bg-raised shadow-card ring-1 ring-line/60 transition hover:shadow-lift">
                  <div className="relative aspect-[4/3] overflow-hidden bg-deep">
                    {photo && <PlacePhoto photoKey={photo} sizes="(min-width: 768px) 33vw, 100vw" className="transition duration-500 group-hover:scale-[1.03]" />}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.75rem] font-semibold text-[#1E2933]">
                      {count ? `${count} guide${count === 1 ? "" : "s"}` : "In preparation"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-2xl font-semibold">{g.title}</h2>
                    <p className="mt-2 flex-1">{g.intro}</p>
                    <p className="mt-4 text-sm">{g.topics.length} topics planned</p>
                    <span className="mt-3 inline-flex items-center gap-1 font-semibold text-link">
                      Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </main>
  );
}
