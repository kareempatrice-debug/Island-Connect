import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { getCountries, getCountry } from "@/lib/data";

// Served ready-made from Netlify and refreshed at most every 5 minutes (or straight away when a listing changes).
export const revalidate = 300;


export const metadata: Metadata = { title: "About" };

export default async function About({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const [c, countries] = await Promise.all([getCountry(code), getCountries()]);
  return (
    <main>
      <Container className="max-w-3xl py-12 sm:py-16">
        <h1 className="text-4xl font-semibold sm:text-5xl">About Island Connect</h1>
        <div className="mt-6 space-y-4 text-lg">
          <p>
            Island Connect is a marketplace for the Eastern Caribbean. It helps residents, visitors and nationals living
            overseas find local businesses, services and practical information, one country at a time.
          </p>
          <p>
            It is available in {countries.map((x) => x.name).join(" and ")}. Each country has its own listings and its own
            guides, because rules, programmes and prices differ from one island nation to the next. You are currently
            browsing {c!.name}.
          </p>
          <p>
            Guidance on government programmes, property and business registration is only published once it has been
            checked against official sources, and every guide shows when it was last checked.
          </p>
        </div>
        <Link href={`/${code}/explore`} className="mt-8 inline-block font-semibold text-link hover:underline">
          Start exploring {c!.shortName}
        </Link>
      </Container>
    </main>
  );
}
