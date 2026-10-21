import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarDays, Hourglass } from "lucide-react";
import { PlacePhoto } from "@/components/photo";
import { Container } from "@/components/ui";
import { countryImagery } from "@/data/photos";

export const metadata: Metadata = { title: "Reserve a ride" };

export default async function Reserve({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const points = [
    { Icon: CalendarDays, text: "Choose your exact pick-up time, up to six months ahead" },
    { Icon: BadgeCheck, text: "Drivers confirm in advance, at the official fare where one is published" },
    { Icon: Hourglass, text: "Add your flight number or a note, and your driver plans around it" },
  ];
  return (
    <main>
      <div className="relative h-56 overflow-hidden sm:h-72">
        <PlacePhoto photoKey={countryImagery[code as "gd" | "vc"]?.hero ?? "grenada-beach"} sizes="(max-width: 767px) 200vw, 100vw" priority />
      </div>
      <Container className="max-w-2xl py-8">
        <h1 className="text-4xl font-bold">Reserve</h1>
        <ul className="mt-6 divide-y divide-line">
          {points.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-4 py-4"><Icon className="h-6 w-6 shrink-0 text-ink" strokeWidth={1.6} aria-hidden="true" /><span>{text}</span></li>
          ))}
        </ul>
        <Link href={`/${code}/ride/taxi?when=later`} className="mt-8 flex h-14 items-center justify-center rounded-2xl bg-deep text-[1.0625rem] font-semibold text-white">Reserve a ride</Link>
      </Container>
    </main>
  );
}
