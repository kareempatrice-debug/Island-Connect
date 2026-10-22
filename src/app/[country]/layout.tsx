import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { BottomNav, DesktopNav } from "@/components/nav";
import { RememberCountry } from "@/components/remember-country";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import { data, getCountries, getCountry, isSupabaseConfigured } from "@/lib/data";
import { HeaderOnline, HeaderStrip, HeaderSwitcher, SessionProvider } from "@/components/session";

type Props = { children: React.ReactNode; params: Promise<{ country: string }> };

// The two countries are known in advance, so their pages can be prepared ahead of visitors.
export function generateStaticParams() {
  return [{ country: "vc" }, { country: "gd" }];
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const country = await getCountry((await params).country);
  return country ? { title: { default: `Island Connect ${country.name}`, template: `%s · ${country.shortName} · Island Connect` } } : {};
}

export default async function CountryLayout({ children, params }: Props) {
  const { country: code } = await params;
  // No sign-in check here: pages are served ready-made, and the signed-in parts of the header
  // (account menu, Online switch, ride status) load just after, from /api/session.
  const [country, countries] = await Promise.all([getCountry(code), getCountries()]);
  if (!country) notFound();
  const options = countries.map(({ code, name, shortName }) => ({ code, name, shortName }));

  return (
    <SessionProvider>
    <div className="pb-nav min-h-dvh">
      <RememberCountry code={country.code} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-[#1E2933]">
        Skip to content
      </a>
      {data.mode === "demo" && (
        <div className="bg-gold px-5 py-1.5 text-center text-[0.8rem] font-medium text-[#1E2933]">
          Preview: listings marked Unclaimed come from public directories and are not yet confirmed. Those marked Demo are invented.
        </div>
      )}
      <header className="sticky top-0 z-40 bg-deep/95 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-content items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/?choose=1" aria-label="Island Connect main page" className="shrink-0">
            <Wordmark onDark compact />
          </Link>
          <DesktopNav country={country.code} />
          <div className="flex items-center gap-2">
            <HeaderOnline />
            <Link
              href={`/${country.code}/explore`}
              aria-label="Search"
              // Drivers see the Online switch here instead; search stays one tap away under Explore.
              className="flex h-10 w-10 items-center justify-center rounded-full text-white ring-1 ring-white/20 transition hover:bg-white/10 [div:has(>[data-driver-online])>&]:hidden"
            >
              <Search className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
            </Link>
            <Suspense fallback={<span className="h-10 w-28 rounded-full bg-white/10" />}>
              <HeaderSwitcher current={options.find((o) => o.code === country.code)!} countries={options}
                enabled={isSupabaseConfigured || Boolean(process.env.PREVIEW_SAMPLE_ACCOUNT)} />
            </Suspense>
          </div>
        </div>
        <HeaderStrip country={country.code} />
      </header>
      <div id="main">{children}</div>
      <SiteFooter country={country} countries={countries} />
      <BottomNav country={country.code} />
    </div>
    </SessionProvider>
  );
}
