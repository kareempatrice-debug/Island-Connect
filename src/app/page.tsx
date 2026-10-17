import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { IslandChain } from "@/components/island-chain";
import { PlacePhoto } from "@/components/photo";
import { countryImagery, fallbackImagery } from "@/data/photos";
import { data, getCountries } from "@/lib/data";

const BLURB: Record<string, string> = {
  gd: "The Spice Isle and its sister islands, from St. George’s harbour to the beaches of Carriacou.",
  vc: "St. Vincent’s green mountains and a chain of Grenadine islands stretching south to Union Island.",
};

export default async function CountryPicker({ searchParams }: { searchParams: Promise<{ choose?: string }> }) {
  const [countries, params, jar] = await Promise.all([getCountries(), searchParams, cookies()]);
  const remembered = jar.get("ic_country")?.value;
  if (!params.choose && remembered && countries.some((c) => c.code === remembered)) redirect(`/${remembered}`);

  const islands = (await Promise.all(countries.map((c) => data.getIslands(c.code)))).flat();

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-content px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <Image src="/brand/ic-lockup.png" alt="Island Connect: people, places, services" width={180} height={120} priority className="h-auto w-36 sm:w-44" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_17rem] lg:items-end">
          <div>
            <h1 className="max-w-2xl text-[2.4rem] font-semibold leading-[1.04] sm:text-6xl">Where would you like to start?</h1>
            <p className="mt-4 max-w-xl text-lg">
              Each country has its own businesses, services and local guides. You can switch at any time from the top of the page.
            </p>
          </div>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {countries.map((c, i) => {
            const photo = (countryImagery[c.code] ?? fallbackImagery).picker;
            const names = islands.filter((x) => x.countryCode === c.code).map((x) => x.name);
            return (
              <li key={c.code}>
                <Link
                  href={`/${c.code}`}
                  className="group relative flex min-h-[22rem] overflow-hidden rounded-panel bg-deep shadow-lift sm:min-h-[30rem]"
                >
                  <PlacePhoto photoKey={photo} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} className="transition duration-700 ease-out group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#032E33]/95 via-[#032E33]/35 to-transparent" aria-hidden="true" />
                  <div className="relative mt-auto w-full p-6 sm:p-8">
                    <p className="text-sm font-medium text-gold">{names.join(" · ")}</p>
                    <h2 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">{c.name}</h2>
                    <p className="mt-2 max-w-md text-white/85">{BLURB[c.code]}</p>
                    <span className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 font-semibold text-[#064F56] transition group-hover:gap-3">
                      Explore {c.shortName}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="chain-heading" className="mt-14 grid items-center gap-8 rounded-panel bg-raised p-6 shadow-card ring-1 ring-line/60 sm:p-10 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="chain-heading" className="text-2xl font-semibold">One island chain, two countries</h2>
            <p className="mt-2 max-w-md">
              The Grenadines run between St. Vincent and Grenada, and some businesses work on both sides. Tap an island to see
              what’s listed there.
            </p>
            <p className="mt-4 flex flex-wrap gap-5 text-sm">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#0B6FB8]" aria-hidden="true" />St. Vincent and the Grenadines</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#E85B43]" aria-hidden="true" />Grenada</span>
            </p>
          </div>
          <div className="mx-auto w-56 text-ink sm:w-64">
            <IslandChain countries={countries} islands={islands} />
          </div>
        </section>
      </div>
    </main>
  );
}
