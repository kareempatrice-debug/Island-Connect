import Link from "next/link";
import { ArrowRight, CarFront, ChevronRight, UtensilsCrossed } from "lucide-react";
import { BusinessCard } from "@/components/business-card";
import { EmptyState } from "@/components/empty-state";
import { PlacePhoto } from "@/components/photo";
import { HeroSearch } from "@/components/search-form";
import { Container, Section, btn } from "@/components/ui";
import { categoryVisual, toneClasses } from "@/components/visuals";
import { countryImagery, fallbackImagery } from "@/data/photos";
import { data, getCountries, getCountry } from "@/lib/data";
import { guideSections } from "@/lib/guides";

const QUICK = [
  { slug: "transport", label: "Ride", href: "ride" },
  { slug: "restaurants", label: "Restaurants" },
  { slug: "home-construction", label: "Home services" },
  { slug: "tours", label: "Tours and activities" },
  { slug: "accommodation", label: "Places to stay" },
  { slug: "retail-everyday", label: "Shopping" },
  { slug: "estate-agents", label: "Property" },
  { slug: "professional-services", label: "Professional services" },
];

const EVERYDAY = [
  { slug: "electricians", label: "Electricians" },
  { slug: "plumbers", label: "Plumbers" },
  { slug: "builders-contractors", label: "Builders and contractors" },
  { slug: "mechanics", label: "Mechanics" },
  { slug: "cleaning", label: "Cleaning" },
  { slug: "professional-services", label: "Lawyers, accountants and advisers" },
];

const POPULAR = ["Airport transfer", "Electrician", "Boat trip", "Accountant"];

export default async function CountryHome({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const [country, countries] = await Promise.all([getCountry(code), getCountries()]);
  const c = country!;
  const imagery = countryImagery[code] ?? fallbackImagery;
  const [categories, islands, featured, recent, articles] = await Promise.all([
    data.getCategories(code),
    data.getIslands(code),
    data.getFeatured(code, 6),
    data.getRecent(code, 6),
    data.getArticles(code),
  ]);
  const enabled = new Set(categories.map((x) => x.slug));
  const counts = await Promise.all(
    EVERYDAY.map(async (e) => (enabled.has(e.slug) ? data.countBusinesses(code, { category: e.slug }) : 0)),
  );
  const favourites = featured.length ? featured : recent;
  const other = countries.filter((x) => x.code !== code);

  const experiences = [
    code === "vc"
      ? { title: "Explore St. Vincent", text: "From Kingstown to the leeward coast", href: "/vc/explore", photo: "st-vincent-leeward" }
      : { title: "Explore Grenada", text: "Beaches, bays and the spice island interior", href: "/gd/explore", photo: "grenada-beach" },
    code === "vc"
      ? { title: "Discover the Grenadines", text: "Bequia, Mustique, Canouan, Mayreau and Union Island", href: "/vc/explore?district=grenadines", photo: "mayreau-salt-whistle-bay" }
      : { title: "Carriacou and Petite Martinique", text: "Grenada’s sister islands in the Grenadines", href: "/gd/explore?island=carriacou", photo: "carriacou" },
    code === "vc"
      ? { title: "Tours and experiences", text: "Sailing, diving and days on the water", href: "/vc/services/tours", photo: "tobago-cays-sunset" }
      : { title: "Tours and experiences", text: "Hikes, boat trips and guided days out", href: "/gd/services/tours", photo: "sauteurs-bay" },
    ...other.map((o) =>
      o.code === "vc"
        ? { title: "Next door: St. Vincent and the Grenadines", text: "Browse listings across the border", href: "/vc", photo: "mayreau-salt-whistle-bay" }
        : { title: "Next door: Grenada", text: "Browse listings across the border", href: "/gd", photo: "grenada-beach" },
    ),
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-deep">
        <PlacePhoto photoKey={imagery.hero} sizes="(max-width: 767px) 250vw, 100vw" priority quality={85} credit="top" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#032E33]/60 via-[#032E33]/25 to-[#032E33]/70" aria-hidden="true" />
        <Container className="relative pb-12 pt-10 sm:pb-20 sm:pt-24">
          <p className="text-sm font-medium tracking-wide text-gold">{c.name}</p>
          <h1 className="mt-2 max-w-3xl text-[2.35rem] font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">
            Your islands. Everything connected.
          </h1>
          <p className="mt-4 max-w-xl text-[1.0625rem] text-white/85 sm:text-lg">
            Find local businesses, trusted services and things to do across {c.name}, all in one place.
          </p>
          <div className="mt-7 max-w-3xl">
            <HeroSearch country={code} countryName={c.shortName} islands={islands} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
            <Link
              href={`/${code}/ride`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 font-semibold text-[#1E2933] transition hover:brightness-105"
            >
              <CarFront className="h-4 w-4" aria-hidden="true" /> Get a ride
            </Link>
            <span className="ml-1">Popular:</span>
            {POPULAR.map((q) => (
              <Link
                key={q}
                href={`/${code}/explore?q=${encodeURIComponent(q)}`}
                className="rounded-full bg-white/10 px-3 py-1.5 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
              >
                {q}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Quick access */}
      <Container className="relative z-10 -mt-6 sm:-mt-8">
        <ul className="grid grid-cols-4 gap-2 rounded-panel bg-raised p-3 shadow-lift ring-1 ring-line/60 sm:gap-3 sm:p-4 lg:grid-cols-8">
          {QUICK.filter((q) => enabled.has(q.slug)).map((q) => {
            const { Icon, tone } = categoryVisual(q.slug);
            const t = toneClasses[tone];
            return (
              <li key={q.slug}>
                <Link
                  href={"href" in q ? `/${code}/${q.href}` : `/${code}/services/${q.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-3 text-center transition hover:bg-sunken"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105 sm:h-14 sm:w-14 ${t.soft}`}>
                    <Icon className={`h-6 w-6 ${t.icon}`} aria-hidden="true" strokeWidth={1.75} />
                  </span>
                  <span className="text-[0.75rem] font-medium leading-tight text-ink sm:text-sm">{q.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>

      {/* Featured */}
      <Section
        id="favourites"
        title="Discover local favourites"
        intro={featured.length ? "Promoted listings are marked Featured." : "The newest businesses on Island Connect."}
        action={{ href: `/${code}/explore`, label: "View all" }}
      >
        {favourites.length ? (
          <ul className="rail -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {favourites.map((b, i) => (
              <li key={b.id} className="w-[82%] shrink-0 sm:w-auto">
                <BusinessCard business={b} country={code} timeZone={c.timeZone} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={`No listings in ${c.name} yet`}>
            <p>Businesses are being added and checked. Check back soon.</p>
          </EmptyState>
        )}
      </Section>

      {/* Experiences */}
      <Section id="experiences" title="Explore by experience" intro="Places to go and ways to spend the day, on both sides of the Grenadines.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {experiences.map((e, i) => (
            <li key={e.title} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
              <Link
                href={e.href}
                className={`group relative flex h-full overflow-hidden rounded-panel bg-deep ${i === 0 ? "min-h-[18rem] lg:min-h-[28rem]" : "min-h-[13rem]"}`}
              >
                <PlacePhoto photoKey={e.photo} sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="transition duration-500 ease-out group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden="true" />
                <div className="relative mt-auto p-5">
                  <h3 className={`font-semibold text-white ${i === 0 ? "text-3xl" : "text-xl"}`}>{e.title}</h3>
                  <p className="mt-1 text-sm text-white/85">{e.text}</p>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={`/${code}/services/restaurants`}
              className="group relative flex h-full min-h-[13rem] overflow-hidden rounded-panel bg-coral"
            >
              <UtensilsCrossed className="absolute -right-6 -top-6 h-44 w-44 text-white/15" strokeWidth={1.25} aria-hidden="true" />
              <div className="relative mt-auto p-5">
                <h3 className="text-xl font-semibold text-white">Food and dining</h3>
                <p className="mt-1 text-sm text-white/90">Restaurants, cafés and bars</p>
              </div>
            </Link>
          </li>
        </ul>
      </Section>

      {/* Everyday services */}
      <section aria-labelledby="everyday-heading" className="mt-14 bg-sunken/70 py-14 sm:mt-20 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
            <div>
              <h2 id="everyday-heading" className="text-[1.6rem] font-semibold leading-tight sm:text-[2rem]">
                Everyday help, close to home
              </h2>
              <p className="mt-3 max-w-md text-[1.0625rem]">
                Trades and professionals across {c.name}, with their island and parish shown up front so you can find
                someone nearby.
              </p>
              <Link href={`/${code}/services`} className={`${btn.secondary} mt-6`}>
                All services
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {EVERYDAY.filter((e) => enabled.has(e.slug)).map((e) => {
                const { Icon, tone } = categoryVisual(e.slug);
                const n = counts[EVERYDAY.indexOf(e)];
                return (
                  <li key={e.slug}>
                    <Link
                      href={`/${code}/services/${e.slug}`}
                      className="flex items-center gap-4 rounded-2xl bg-raised p-4 shadow-card ring-1 ring-line/50 transition hover:ring-primary/40"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone].soft}`}>
                        <Icon className={`h-5 w-5 ${toneClasses[tone].icon}`} aria-hidden="true" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{e.label}</span>
                        <span className="block text-sm">{n === 0 ? "None listed yet" : n === 1 ? "1 listing" : `${n} listings`}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </Container>
      </section>

      {/* Guides */}
      <Section id="guides" title="Moving, buying or starting out" intro={`Practical guides written for ${c.name}, each linked to the official sources it relies on.`}>
        <ul className="grid gap-5 md:grid-cols-3">
          {guideSections.map((g) => {
            const count = articles.filter((a) => a.section === g.slug).length;
            const photo = imagery.guides[g.slug];
            return (
              <li key={g.slug}>
                <Link href={`/${code}/guides/${g.slug}`} className="group flex h-full flex-col overflow-hidden rounded-panel bg-raised shadow-card ring-1 ring-line/60 transition hover:shadow-lift">
                  <div className="relative aspect-[16/9] overflow-hidden bg-deep">
                    {photo && <PlacePhoto photoKey={photo} sizes="(min-width: 768px) 33vw, 100vw" className="transition duration-500 group-hover:scale-[1.03]" />}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.75rem] font-semibold text-[#1E2933]">
                      {count ? `${count} guide${count === 1 ? "" : "s"}` : "In preparation"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl font-semibold">{g.title}</h3>
                    <p className="mt-2 flex-1">{g.intro}</p>
                    <span className="mt-4 inline-flex items-center gap-1 font-semibold text-link">
                      Open guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* For businesses */}
      <Container className="pt-14 sm:pt-20">
        <section aria-labelledby="business-heading" className="relative overflow-hidden rounded-panel bg-deep px-6 py-10 sm:px-12 sm:py-14">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <h2 id="business-heading" className="text-[1.75rem] font-semibold leading-tight text-white sm:text-4xl">
              Grow your business with Island Connect
            </h2>
            <p className="mt-3 text-[1.0625rem] text-white/85">
              We’re building tools for local businesses to reach customers in {c.name} and beyond: a free listing to start,
              then enquiries, quotes and bookings as they launch.
            </p>
            <Link href={`/${code}/for-business`} className={`${btn.gold} mt-6`}>
              How listing will work
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
