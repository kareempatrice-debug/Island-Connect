"use client";

import { BookOpen, CarFront, Compass, Home, LayoutGrid, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * One navigation definition for desktop and mobile. The long-term mobile bar is
 * Home · Explore · Bookings · Saved · More; Bookings and Saved are added here
 * (with `live: true`) when those features work. Until then they are not shown.
 */
interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  live: boolean;
}

const items: NavItem[] = [
  { href: "", label: "Home", Icon: Home, live: true },
  { href: "/explore", label: "Explore", Icon: Compass, live: true },
  { href: "/ride", label: "Ride", Icon: CarFront, live: true },
  { href: "/services", label: "Services", Icon: LayoutGrid, live: true },
  { href: "/guides", label: "Guides", Icon: BookOpen, live: true },
  // { href: "/bookings", label: "Bookings", Icon: CalendarCheck, live: false },
  // { href: "/saved", label: "Saved", Icon: Heart, live: false },
];

const liveItems = items.filter((i) => i.live);

function useActive(country: string) {
  const pathname = usePathname();
  return (href: string) => {
    const full = `/${country}${href}`;
    if (href === "") return pathname === full;
    if (href === "/explore") return pathname.startsWith(full) || pathname.includes("/business/");
    return pathname.startsWith(full);
  };
}

export function DesktopNav({ country }: { country: string }) {
  const isActive = useActive(country);
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {liveItems.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={label}
            href={`/${country}${href}`}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-full px-4 py-2 text-[0.95rem] font-medium transition ${
              active ? "text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
            {active && <span className="absolute inset-x-4 -bottom-[0.95rem] h-[3px] rounded-full bg-gold" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ country }: { country: string }) {
  const isActive = useActive(country);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-raised/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${liveItems.length}, minmax(0, 1fr))` }}>
        {liveItems.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={label}>
              <Link
                href={`/${country}${href}`}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 pb-2 pt-2.5 text-[0.72rem] font-semibold ${active ? "text-deep dark:text-link" : "text-muted"}`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${active ? "bg-deep/10 dark:bg-link/15" : ""}`}>
                  <Icon className="h-[1.35rem] w-[1.35rem]" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
