import type { Metadata } from "next";
import Link from "next/link";
import { Bus, CarFront, ChevronRight, Package, Plane, Ship, Truck } from "lucide-react";
import { Container } from "@/components/ui";
import { data, getCountry } from "@/lib/data";
import { transportOptions } from "@/lib/transport";

export const metadata: Metadata = { title: "Ride and transport" };

const ICONS = { taxi: CarFront, airport: Plane, group: Bus, boat: Ship, haulage: Truck, freight: Package } as const;

export default async function RideHub({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  const islands = await data.getIslands(code);
  const main = islands.find((i) => i.isMain)?.name ?? country.name;
  const options = transportOptions(code, main);

  return (
    <main>
      <section className="bg-deep">
        <Container className="pb-10 pt-8 sm:pb-14 sm:pt-12">
          <p className="text-sm font-semibold tracking-wide text-gold">RIDE AND DELIVERY · {country.shortName.toUpperCase()}</p>
          <h1 className="mt-2 max-w-2xl text-[2.1rem] font-bold leading-[1.08] text-white sm:text-5xl">Get there, the easy way.</h1>
          <p className="mt-3 max-w-xl text-lg text-white/85">People, parcels or a truckload, on one island or across the Grenadines.</p>
        </Container>
      </section>
      <Container className="pt-6">
        <ul className="grid gap-3 md:grid-cols-2">
          {options.map((o) => {
            const Icon = ICONS[o.kind];
            return (
              <li key={o.kind}>
                <Link href={o.href} className="group flex h-full items-start gap-4 rounded-card bg-raised p-4 shadow-card ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:ring-primary/50 sm:p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-ink">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold text-ink">{o.title}</span>
                    <span className="mt-0.5 block text-[0.95rem]">{o.text}</span>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${o.custom ? "bg-gold/25 text-[#5C3D00] dark:text-gold" : "bg-primary/10 text-primary"}`}>{o.price}</span>
                  </span>
                  <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
        <section aria-labelledby="quotes-heading" className="mt-6 rounded-card bg-raised p-5 ring-1 ring-line/60">
          <h2 id="quotes-heading" className="text-lg font-bold">How custom quotes work</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Describe the job: what, from where, to where, and when.</li>
            <li>Send it to operators who cover that route. They reply with their own price.</li>
            <li>You choose. Nothing is booked until you agree a price with an operator.</li>
          </ol>
        </section>
        <p className="mt-6 text-sm">
          Drive a taxi, run a boat or operate trucks?{" "}
          <Link href={`/${code}/ride/operate`} className="font-semibold text-link hover:underline">Work with Island Connect</Link>
        </p>
      </Container>
    </main>
  );
}
