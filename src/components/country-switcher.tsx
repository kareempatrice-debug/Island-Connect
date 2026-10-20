"use client";

import { Check, ChevronDown, MapPin, UserRound, House, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { signOutAction } from "@/app/auth-actions";
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
export interface AccountLinks { signedIn: boolean; name?: string | null; isAdmin?: boolean }

export function CountrySwitcher({ current, countries, account }: { current: Option; countries: Option[]; account?: AccountLinks }) {
  // Close when tapping or clicking anywhere outside the menu, pressing Escape, or changing page.
  const ref = useRef<HTMLDetailsElement>(null);
  const pathnameNow = usePathname();
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && ref.current) ref.current.open = false; };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, []);
  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathnameNow]);

  const pathname = usePathname();
  const search = useSearchParams().toString();
  return (
    <details ref={ref} className="group relative">
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
        <Link href="/?choose=1" className="flex items-center gap-2 rounded-xl px-3 py-3 font-semibold text-ink hover:bg-sunken">
          <House className="h-4 w-4 text-primary" aria-hidden="true" />
          Home
        </Link>
        <ul className="mt-1 border-t border-line pt-1">
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
        {account && (
          <div className="mt-1 border-t border-line pt-1">
            {account.signedIn ? (
              <>
                <Link href={`/${current.code}/account`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-sunken">
                  <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  Your account{account.name ? <span className="truncate font-normal text-muted">· {account.name}</span> : null}
                </Link>
                <Link href={`/${current.code}/trips`} className="block rounded-xl px-3 py-2.5 pl-9 text-sm text-ink hover:bg-sunken">Your trips</Link>
                <Link href={`/${current.code}/messages`} className="block rounded-xl px-3 py-2.5 pl-9 text-sm text-ink hover:bg-sunken">Messages</Link>
                {account.isAdmin && <Link href="/admin" className="block rounded-xl px-3 py-2.5 pl-9 text-sm text-ink hover:bg-sunken">Admin</Link>}
                <form action={signOutAction}>
                  <input type="hidden" name="next" value="/?choose=1" />
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-sunken">
                    <LogOut className="h-4 w-4 text-primary" aria-hidden="true" />
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/join?mode=sign-in" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-sunken">
                <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                Sign in or join free
              </Link>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
