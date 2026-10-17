import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck, Clock, CreditCard, Globe, Mail, MapPin, MessageCircle, MessageSquareText, Navigation, Phone, Star } from "lucide-react";
import { ContactLink } from "@/components/contact-link";
import { ListingBadges, TrustNote } from "@/components/badges";
import { locationLine } from "@/components/business-card";
import { BusinessCover, BusinessLogo } from "@/components/business-cover";
import { OpenStatus } from "@/components/open-status";
import { Container } from "@/components/ui";
import { businessCountries, data, getCountry, isSupabaseConfigured } from "@/lib/data";
import { PAYMENT_LABELS, formatPhone, localClock, mapsLink, priceLabel, weeklyHours, whatsappLink } from "@/lib/format";

type Props = { params: Promise<{ country: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await data.getBusiness((await params).slug);
  return b ? { title: b.name, description: b.tagline ?? undefined, robots: b.isDemo ? { index: false } : undefined } : {};
}

const panel = "rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60 sm:p-6";
const ghost =
  "flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-raised px-4 font-semibold text-ink transition hover:border-ink/30";

function minutes(m: number) {
  return m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
}

export default async function BusinessPage({ params }: Props) {
  const { country: code, slug } = await params;
  const [country, business] = await Promise.all([getCountry(code), data.getBusiness(slug)]);
  if (!country || !business) notFound();

  const served = businessCountries(business);
  if (!served.includes(code)) redirect(`/${served[0]}/business/${slug}`);

  const primary = business.categories.find((c) => c.isPrimary) ?? business.categories[0];
  const location = business.locations.find((l) => l.isPrimary) ?? business.locations[0];
  const hours = weeklyHours(business.hours);
  const today = localClock(country.timeZone).weekday;
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today];
  const alsoServes = business.serviceAreas.filter((a) => a.islandSlug !== location?.islandSlug);
  const rating = business.ratingCount > 0 && business.ratingAvg != null ? business.ratingAvg : null;

  const canEnquire = isSupabaseConfigured && !business.isDemo && business.claimStatus === "claimed";
  const enquireHref = `/${code}/business/${business.slug}/enquire`;
  const bookingHref = business.contactPreference === "external_booking" ? business.externalBookingUrl : null;

  // The single most useful way to get in touch, used for the mobile action bar. The business chooses which.
  const pref = business.contactPreference;
  const mainAction = bookingHref
    ? { href: bookingHref, label: "Book on their website", Icon: CalendarCheck, external: true, channel: "booking" as const }
    : pref === "platform" && canEnquire
      ? { href: enquireHref, label: "Send an enquiry", Icon: MessageSquareText, external: false, channel: null }
      : pref === "phone" && business.phone
        ? { href: `tel:${business.phone}`, label: "Call", Icon: Phone, external: false, channel: "phone" as const }
        : pref === "website" && business.website
          ? { href: business.website, label: "Visit website", Icon: Globe, external: true, channel: "website" as const }
          : business.whatsapp
            ? { href: whatsappLink(business.whatsapp, `Hello, I found ${business.name} on Island Connect.`), label: "WhatsApp", Icon: MessageCircle, external: true, channel: "whatsapp" as const }
            : business.phone
              ? { href: `tel:${business.phone}`, label: "Call", Icon: Phone, external: false, channel: "phone" as const }
              : business.email
                ? { href: `mailto:${business.email}`, label: "Email", Icon: Mail, external: false, channel: "email" as const }
                : canEnquire
                  ? { href: enquireHref, label: "Send an enquiry", Icon: MessageSquareText, external: false, channel: null }
                  : null;

  const sections = [
    { id: "about", label: "About" },
    business.services.length ? { id: "services", label: "Services" } : null,
    business.gallery.length ? { id: "photos", label: "Photos" } : null,
    { id: "info", label: "Hours and location" },
    { id: "reviews", label: "Reviews" },
  ].filter((s): s is { id: string; label: string } => Boolean(s));

  return (
    <main className={mainAction ? "pb-20 lg:pb-0" : ""}>
      {/* Cover */}
      <div className="relative h-48 overflow-hidden bg-deep sm:h-72">
        <BusinessCover business={business} sizes="100vw" priority large />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
      </div>

      <Container>
        <div className="relative flex flex-col gap-4">
          <BusinessLogo business={business} className="-mt-12 h-24 w-24 shrink-0 rounded-3xl text-3xl shadow-lift ring-4 ring-surface sm:-mt-16 sm:h-32 sm:w-32 sm:text-4xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {primary && (
                <Link href={`/${code}/services/${primary.slug}`} className="text-sm font-semibold text-link hover:underline">
                  {primary.name}
                </Link>
              )}
              <ListingBadges business={business} size="md" />
            </div>
            <h1 className="mt-1 text-[2rem] font-semibold leading-tight sm:text-5xl">{business.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {locationLine(business, code)}
              </span>
              <OpenStatus hours={business.hours} timeZone={country.timeZone} />
              {rating != null && (
                <span className="inline-flex items-center gap-1 font-semibold text-ink">
                  <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
                  {rating.toFixed(1)} <span className="font-normal text-muted">({business.ratingCount})</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <nav aria-label="On this page" className="rail sticky top-[4.25rem] z-30 -mx-5 mt-6 flex gap-1 overflow-x-auto border-b border-line bg-surface/95 px-5 backdrop-blur sm:mx-0 sm:px-0">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 border-b-2 border-transparent px-3 py-3 text-[0.95rem] font-medium text-ink hover:border-gold">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
          <div className="min-w-0 space-y-12">
            <section id="about" aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-2xl font-semibold">About</h2>
              {business.tagline && <p className="mt-3 text-xl leading-snug text-ink">{business.tagline}</p>}
              {business.description && <p className="mt-3 max-w-[65ch] text-[1.0625rem]">{business.description}</p>}
              {alsoServes.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-sans text-sm font-semibold text-ink">Serves</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {business.serviceAreas.map((a) => (
                      <li key={`${a.countryCode}-${a.islandSlug}`} className="rounded-full bg-sunken px-3 py-1 text-sm text-ink">
                        {a.islandName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6 rounded-2xl bg-sunken/70 p-4">
                <TrustNote business={business} />
              </div>
              {business.claimStatus === "unclaimed" && !business.isDemo && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line p-4">
                  <p className="text-sm">
                    <span className="font-semibold text-ink">Is this your business?</span> Claim it to update the details and receive enquiries.
                  </p>
                  <Link href={`/${code}/business/${business.slug}/claim`} className="font-semibold text-link hover:underline">Claim this listing</Link>
                </div>
              )}
            </section>

            {business.services.length > 0 && (
              <section id="services" aria-labelledby="services-heading">
                <h2 id="services-heading" className="text-2xl font-semibold">Services and prices</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {business.services.map((s) => (
                    <li key={s.id} className="flex flex-col rounded-2xl bg-raised p-5 shadow-card ring-1 ring-line/60">
                      <p className="font-semibold text-ink">{s.name}</p>
                      {s.description && <p className="mt-1 text-sm">{s.description}</p>}
                      <div className="mt-auto flex items-baseline justify-between gap-3 pt-4">
                        <p className="font-display text-lg font-semibold text-ink">{priceLabel(s)}</p>
                        {s.durationMinutes && (
                          <p className="inline-flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {minutes(s.durationMinutes)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm">Prices are set by the business and may change. Confirm the price before work starts.</p>
              </section>
            )}

            {business.gallery.length > 0 && (
              <section id="photos" aria-labelledby="photos-heading">
                <h2 id="photos-heading" className="text-2xl font-semibold">Photos</h2>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {business.gallery.map((src, i) => (
                    <li key={src} className="relative aspect-square overflow-hidden rounded-2xl">
                      <Image src={src} alt={`${business.name} photo ${i + 1}`} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section id="info" aria-labelledby="info-heading" className="scroll-mt-32">
              <h2 id="info-heading" className="text-2xl font-semibold">Hours and location</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {business.hours.length > 0 && (
                  <div className={panel}>
                    <h3 className="flex items-center gap-2 font-sans text-base font-semibold">
                      <Clock className="h-5 w-5 text-link" aria-hidden="true" /> Opening hours
                    </h3>
                    <dl className="mt-3 space-y-1.5 text-[0.95rem]">
                      {hours.map((h) => (
                        <div key={h.day} className={`flex justify-between gap-4 ${h.day === todayName ? "font-semibold text-ink" : ""}`}>
                          <dt>{h.day}</dt>
                          <dd className="text-right">{h.label}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-xs">Local time in {country.name}.</p>
                  </div>
                )}
                {location && (
                  <div className={panel}>
                    <h3 className="flex items-center gap-2 font-sans text-base font-semibold">
                      <MapPin className="h-5 w-5 text-link" aria-hidden="true" /> Location
                    </h3>
                    <p className="mt-3 text-ink">{[location.districtName, location.islandName].filter(Boolean).join(", ")}</p>
                    {location.landmark && <p className="mt-1 text-[0.95rem]">{location.landmark}</p>}
                    {location.lat != null && location.lng != null && (
                      <ContactLink slug={business.slug} channel="maps" country={code} href={mapsLink(location.lat, location.lng)} target="_blank" rel="noopener noreferrer" className={`${ghost} mt-4 w-full`}>
                        <Navigation className="h-4 w-4" aria-hidden="true" /> Open in maps
                      </ContactLink>
                    )}
                  </div>
                )}
                {(business.paymentMethods.length > 0 || business.cancellationPolicy) && (
                  <div className={`${panel} sm:col-span-2`}>
                    <h3 className="flex items-center gap-2 font-sans text-base font-semibold">
                      <CreditCard className="h-5 w-5 text-link" aria-hidden="true" /> Payment and cancellation
                    </h3>
                    {business.paymentMethods.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {business.paymentMethods.map((m) => (
                          <li key={m} className="rounded-full bg-sunken px-3 py-1 text-sm text-ink">{PAYMENT_LABELS[m] ?? m}</li>
                        ))}
                      </ul>
                    )}
                    {business.cancellationPolicy && <p className="mt-3 text-[0.95rem]">{business.cancellationPolicy}</p>}
                  </div>
                )}
              </div>
            </section>

            <section id="reviews" aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="text-2xl font-semibold">Reviews</h2>
              <div className="mt-4 rounded-panel border border-dashed border-line p-6">
                <p className="font-semibold text-ink">No reviews yet</p>
                <p className="mt-1 text-[0.95rem]">Reviews will come from customers who have booked or hired this business through Island Connect.</p>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className={`${panel} sticky top-36`}>
              <h2 className="font-sans text-base font-semibold">Get in touch</h2>
              {mainAction || business.website ? (
                <div className="mt-4 grid gap-2">
                  {mainAction && (
                    mainAction.channel ? (
                      <ContactLink slug={business.slug} channel={mainAction.channel} country={code} href={mainAction.href}
                        {...(mainAction.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-ink hover:brightness-110">
                        <mainAction.Icon className="h-5 w-5" aria-hidden="true" /> {mainAction.label}
                      </ContactLink>
                    ) : (
                      <Link href={mainAction.href} className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-ink hover:brightness-110">
                        <mainAction.Icon className="h-5 w-5" aria-hidden="true" /> {mainAction.label}
                      </Link>
                    )
                  )}
                  {business.whatsapp && mainAction?.channel !== "whatsapp" && (
                    <ContactLink slug={business.slug} channel="whatsapp" country={code} className={ghost} href={whatsappLink(business.whatsapp, `Hello, I found ${business.name} on Island Connect.`)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp
                    </ContactLink>
                  )}
                  {business.phone && mainAction?.channel !== "phone" && (
                    <ContactLink slug={business.slug} channel="phone" country={code} className={ghost} href={`tel:${business.phone}`}>
                      <Phone className="h-5 w-5" aria-hidden="true" /> {formatPhone(business.phone)}
                    </ContactLink>
                  )}
                  {business.email && mainAction?.channel !== "email" && (
                    <ContactLink slug={business.slug} channel="email" country={code} className={ghost} href={`mailto:${business.email}`}>
                      <Mail className="h-5 w-5" aria-hidden="true" /> Email
                    </ContactLink>
                  )}
                  {business.website && mainAction?.channel !== "website" && (
                    <ContactLink slug={business.slug} channel="website" country={code} className={ghost} href={business.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-5 w-5" aria-hidden="true" /> Website
                    </ContactLink>
                  )}
                  {canEnquire && mainAction?.href !== enquireHref && (
                    <Link className={ghost} href={enquireHref}><MessageSquareText className="h-5 w-5" aria-hidden="true" /> Send an enquiry</Link>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm">
                  {business.isDemo ? "Contact details are not shown for demonstration listings." : "This business hasn’t added contact details yet."}
                </p>
              )}
            </div>
          </aside>
        </div>

        {/* Contact on phones, below the main content when there is no action bar */}
        {!mainAction && (
          <div className={`${panel} mt-10 lg:hidden`}>
            <h2 className="font-sans text-base font-semibold">Get in touch</h2>
            <p className="mt-2 text-sm">
              {business.isDemo ? "Contact details are not shown for demonstration listings." : "This business hasn’t added contact details yet."}
            </p>
          </div>
        )}
      </Container>

      {mainAction && (
        <div className="fixed inset-x-0 z-30 border-t border-line bg-raised/95 px-5 py-3 backdrop-blur lg:hidden" style={{ bottom: "calc(4.6rem + env(safe-area-inset-bottom, 0px))" }}>
          <div className="mx-auto flex max-w-lg gap-2">
            {mainAction.channel ? (
              <ContactLink slug={business.slug} channel={mainAction.channel} country={code} href={mainAction.href}
                {...(mainAction.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-ink">
                <mainAction.Icon className="h-5 w-5" aria-hidden="true" /> {mainAction.label}
              </ContactLink>
            ) : (
              <Link href={mainAction.href} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-ink">
                <mainAction.Icon className="h-5 w-5" aria-hidden="true" /> {mainAction.label}
              </Link>
            )}
            {business.phone && mainAction.channel !== "phone" && (
              <ContactLink slug={business.slug} channel="phone" country={code} href={`tel:${business.phone}`} className="flex h-12 w-12 items-center justify-center rounded-full border border-line" aria-label={`Call ${business.name}`}>
                <Phone className="h-5 w-5 text-ink" aria-hidden="true" />
              </ContactLink>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
