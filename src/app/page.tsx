import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Briefcase, CarFront, Search } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { IslandChain } from "@/components/island-chain";
import { PlacePhoto } from "@/components/photo";
import { countryImagery, fallbackImagery } from "@/data/photos";
import { data, getCountries, isSupabaseConfigured } from "@/lib/data";

/* Destination card copy, as approved. Countries without an entry fall back to their data. */
const CARD: Record<string, { flag: string; title: string; islands: string; text: string; cta: string }> = {
  gd: {
    flag: "🇬🇩",
    title: "Grenada",
    islands: "Grenada · Carriacou · Petite Martinique",
    text: "From everyday services and local businesses to beautiful destinations and unforgettable experiences, discover what Grenada has to offer.",
    cta: "Explore Grenada",
  },
  vc: {
    flag: "🇻🇨",
    title: "St Vincent & the Grenadines",
    islands: "St Vincent · Bequia · Mustique · Canouan · Union Island",
    text: "Discover local businesses, essential services and island experiences across St Vincent and the Grenadines.",
    cta: "Explore SVG",
  },
};

export default async function Welcome({ searchParams }: { searchParams: Promise<{ choose?: string }> }) {
  const [countries, params, jar] = await Promise.all([getCountries(), searchParams, cookies()]);
  const remembered = jar.get("ic_country")?.value;
  if (!params.choose && remembered && countries.some((c) => c.code === remembered)) redirect(`/${remembered}`);

  const islands = (await Promise.all(countries.map((c) => data.getIslands(c.code)))).flat();
  const viewer = isSupabaseConfigured ? await getViewer() : null;
  const home = countries.some((c) => c.code === remembered) ? remembered! : countries[0].code;

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-content px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <div className="flex items-start justify-between gap-4">
          <Image src="/brand/ic-lockup.png" alt="Island Connect: people, places, services" width={180} height={120} priority className="h-auto w-32 sm:w-40" />
          {viewer ? (
            <Link href={`/${home}/account`} className="inline-flex h-11 items-center rounded-full border border-line bg-raised px-5 font-semibold text-ink hover:border-ink/30">Your account</Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/join?mode=sign-in" className="inline-flex h-11 items-center rounded-full px-4 font-semibold text-link hover:underline">Sign in</Link>
              <Link href="/join" className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-ink hover:brightness-110">Join free</Link>
            </div>
          )}
        </div>

        <header className="mt-10 max-w-3xl sm:mt-14">
          <p className="text-[0.8rem] font-semibold tracking-[0.2em] text-link">WELCOME TO ISLAND CONNECT</p>
          <h1 className="mt-3 text-[2.6rem] font-semibold leading-[1.02] sm:text-7xl">Your islands. Everything connected.</h1>
          <p className="mt-5 max-w-2xl text-lg sm:text-xl">
            Discover local businesses, find the services you need and explore everything Grenada and St Vincent and the
            Grenadines have to offer.
          </p>
          <p className="mt-6 font-semibold text-ink">Choose your destination and start exploring.</p>
        </header>

        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {countries.map((c, i) => {
            const card = CARD[c.code] ?? {
              flag: "",
              title: c.name,
              islands: islands.filter((x) => x.countryCode === c.code).map((x) => x.name).join(" · "),
              text: `Discover local businesses, services and experiences in ${c.name}.`,
              cta: `Explore ${c.shortName}`,
            };
            const photo = (countryImagery[c.code] ?? fallbackImagery).picker;
            return (
              <li key={c.code}>
                <Link
                  href={`/${c.code}`}
                  className="group relative flex min-h-[24rem] overflow-hidden rounded-panel bg-deep shadow-lift outline-offset-4 sm:min-h-[32rem]"
                >
                  <PlacePhoto photoKey={photo} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} className="transition duration-700 ease-out group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#032E33] via-[#032E33]/45 to-[#032E33]/5" aria-hidden="true" />
                  <div className="relative mt-auto w-full p-6 sm:p-8">
                    <h2 className="flex items-center gap-3 text-[1.9rem] font-semibold leading-tight text-white sm:text-[2.4rem]">
                      {card.flag && (
                        <span className="text-[1.6rem] sm:text-[2rem]" role="img" aria-label={`Flag of ${c.name}`}>
                          {card.flag}
                        </span>
                      )}
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-gold">{card.islands}</p>
                    <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-white/85">{card.text}</p>
                    <span className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-[#064F56] transition-all group-hover:gap-3 group-hover:bg-gold group-hover:text-[#1E2933]">
                      {card.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>


        {!viewer && (
          <section aria-labelledby="join-heading" className="mt-14 rounded-panel bg-deep p-6 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <h2 id="join-heading" className="text-3xl font-bold leading-tight text-white sm:text-4xl">One free account for both countries</h2>
                <p className="mt-3 text-lg text-white/85">Join as a customer, list your business, or apply to drive, sail or haul for Island Connect.</p>
                <Link href="/join?mode=sign-in" className="mt-5 inline-block font-semibold text-gold hover:underline">Already have an account? Sign in</Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-3">
                {[
                  { as: "customer", Icon: Search, title: "Find services", text: "Save places, message businesses and request rides." },
                  { as: "business", Icon: Briefcase, title: "List a business", text: "A free listing, reviewed before it goes live." },
                  { as: "operator", Icon: CarFront, title: "Drive or haul", text: "Taxis, boats and freight across the islands." },
                ].map((r) => (
                  <li key={r.as}>
                    <Link href={`/join?as=${r.as}`} className="flex h-full flex-col rounded-2xl bg-white/[0.08] p-5 ring-1 ring-white/15 transition hover:bg-white/[0.14]">
                      <r.Icon className="h-6 w-6 text-gold" aria-hidden="true" />
                      <span className="mt-3 font-display text-lg font-bold">{r.title}</span>
                      <span className="mt-1 flex-1 text-sm text-white/80">{r.text}</span>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold">Join free <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section aria-labelledby="chain-heading" className="mt-16 overflow-hidden rounded-panel bg-raised shadow-card ring-1 ring-line/60 sm:mt-20">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_minmax(0,32rem)]">
            <div className="p-6 sm:p-10 md:p-12">
              <h2 id="chain-heading" className="text-3xl font-semibold leading-tight sm:text-4xl">One island chain, two countries</h2>
              <p className="mt-4 max-w-md text-lg">
                The Grenadines run between St Vincent and Grenada, and some businesses work on both sides. Tap an island to see
                what’s listed there.
              </p>
              <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                <span className="inline-flex items-center gap-2 text-ink"><span className="h-3.5 w-3.5 rounded-[4px] bg-[#0B6FB8]" aria-hidden="true" />St Vincent and the Grenadines</span>
                <span className="inline-flex items-center gap-2 text-ink"><span className="h-3.5 w-3.5 rounded-[4px] bg-[#E85B43]" aria-hidden="true" />Grenada</span>
              </p>
              <p className="mt-8 text-xs">Island shapes © OpenStreetMap contributors.</p>
            </div>
            <div
              className="px-6 pb-8 text-ink md:py-10 md:pr-10"
              style={{ backgroundImage: "radial-gradient(rgb(6 79 86 / 0.07) 1px, transparent 1.4px)", backgroundSize: "14px 14px" }}
            >
              <IslandChain countries={countries} islands={islands} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
