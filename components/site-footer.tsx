import Link from "next/link";
import type { Country } from "@/lib/types";
import { Wordmark } from "./wordmark";

/*
 * Only links to pages that exist. Privacy, terms, help and accessibility pages
 * are listed as missing in PROGRESS.md and get added here once written.
 */
export function SiteFooter({ country, countries }: { country: Country; countries: Country[] }) {
  const c = country.code;
  const groups = [
    {
      title: "Explore",
      links: [
        { href: `/${c}/explore`, label: "All businesses" },
        { href: `/${c}/services`, label: "Services" },
        { href: `/${c}/guides`, label: "Guides" },
        { href: "/?choose=1", label: "Destinations" },
      ],
    },
    {
      title: "For businesses",
      links: [{ href: `/${c}/for-business`, label: "Listing your business" }],
    },
    {
      title: "Island Connect",
      links: [
        { href: `/${c}/about`, label: "About" },
        ...countries.filter((x) => x.code !== c).map((x) => ({ href: `/${x.code}`, label: x.name })),
        { href: "/credits", label: "Photo credits" },
      ],
    },
  ];
  return (
    <footer className="mt-20 bg-deep text-white/80">
      <div className="mx-auto grid max-w-content gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Wordmark onDark />
          <p className="mt-4 max-w-xs text-sm">
            A marketplace for Grenada and St. Vincent and the Grenadines. You are browsing {country.name}.
          </p>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="font-sans text-sm font-semibold text-white">{g.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
