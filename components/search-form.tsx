import { MapPin, Search } from "lucide-react";
import type { Island } from "@/lib/types";

/*
 * Plain GET forms: they work without JavaScript and on slow connections, and
 * submit to the same explore page the rest of the app uses.
 */
export function SearchForm({
  country,
  countryName,
  defaultValue,
  hidden,
  placeholder = "Search businesses and services",
}: {
  country: string;
  countryName: string;
  defaultValue?: string;
  hidden?: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <form action={`/${country}/explore`} method="get" role="search" className="relative">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="q" className="sr-only">
        Search {countryName}
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="h-14 w-full rounded-full border border-line bg-raised pl-12 pr-28 text-[1.0625rem] text-ink shadow-card placeholder:text-muted/75 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-primary px-5 font-semibold text-primary-ink transition hover:brightness-110"
      >
        Search
      </button>
    </form>
  );
}

/** The homepage search dock: what, where, go. */
export function HeroSearch({ country, countryName, islands }: { country: string; countryName: string; islands: Island[] }) {
  return (
    <form
      action={`/${country}/explore`}
      method="get"
      role="search"
      className="grid gap-2 rounded-[1.75rem] bg-raised p-2 shadow-dock ring-1 ring-black/5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:rounded-full"
    >
      <label className="relative block">
        <span className="sr-only">What are you looking for?</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" aria-hidden="true" />
        <input
          name="q"
          type="search"
          placeholder="What are you looking for?"
          autoComplete="off"
          className="h-14 w-full rounded-full bg-transparent pl-12 pr-4 text-[1.0625rem] text-ink placeholder:text-muted/80 focus:bg-sunken/60 focus:outline-none"
        />
      </label>
      <label className="relative block sm:border-l sm:border-line">
        <span className="sr-only">Where in {countryName}</span>
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <select
          name="island"
          defaultValue=""
          className="h-14 w-full appearance-none rounded-full bg-transparent pl-11 pr-8 text-ink focus:bg-sunken/60 focus:outline-none sm:w-52"
        >
          <option value="">All of {countryName}</option>
          {islands.map((i) => (
            <option key={i.slug} value={i.slug}>
              {i.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="h-14 rounded-full bg-primary px-8 text-[1.0625rem] font-semibold text-primary-ink transition hover:brightness-110 active:scale-[0.98]">
        Search
      </button>
    </form>
  );
}
