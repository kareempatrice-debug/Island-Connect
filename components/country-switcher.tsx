"use client";

import { Check, ChevronDown, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { equivalentPath } from "@/lib/format";

interface Option {
  code: string;
  name: string;
  shortName: string;
}

/*
 * Built on <details> so it opens and closes without JavaScript. Each option
 * keeps the visitor on the equivalent page in the other country.
 */
export function CountrySwitcher({ current, countries }: { current: Option; countries: Option[] }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return (
    <details className="group relative">
      <summary
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15"
        aria-label={`Country: ${current.name}. Change country`}
      >
        <MapPin className="h-4 w-4 text-gold" aria-hidden="true" />
        <span className="sm:hidden">{current.shortName}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className="h-4 w-4 opacity-80 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-50 mt-3 w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-raised p-2 text-ink shadow-lift ring-1 ring-line">
        <p className="px-3 pb-1 pt-2 text-sm text-muted">Show listings and guides for</p>
        <ul>
          {countries.map((c) => {
            const active = c.code === current.code;
            return (
              <li key={c.code}>
                <Link
                  href={active ? pathname : equivalentPath(pathname, search, c.code)}
                  aria-current={active ? "true" : undefined}
                  className={`flex items-center justify-between rounded-xl px-3 py-3 ${active ? "bg-deep/10 font-semibold dark:bg-link/10" : "hover:bg-sunken"}`}
                >
                  {c.name}
                  {active && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/?choose=1" className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-semibold text-link hover:bg-sunken">
          Compare destinations
        </Link>
      </div>
    </details>
  );
}
