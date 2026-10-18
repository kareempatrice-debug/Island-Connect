import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { Container, btn } from "@/components/ui";
import { getCountry } from "@/lib/data";

export const metadata: Metadata = { title: "Drive, sail or haul with Island Connect" };

export default async function Operate({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const c = (await getCountry(code))!;
  const steps = [
    { done: true, title: "List your transport business", text: "Taxi, transfer, boat, trucking or freight: a free listing customers can find and contact." },
    { done: true, title: "Receive requests on WhatsApp", text: "Ride and quote requests reach you with every detail written out." },
    { done: false, title: "Operator approval", text: "Send your licence, vehicle or vessel details and insurance for checking." },
    { done: false, title: "In-app requests and quotes", text: "Accept rides and send quotes inside Island Connect, with trip records and monthly statements." },
  ];
  return (
    <main>
      <section className="bg-deep">
        <Container className="py-12 sm:py-16">
          <p className="text-sm font-semibold text-gold">For operators in {c.name}</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">Drive, sail or haul with Island Connect</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/85">Taxi drivers, boat captains and freight operators: reach customers across both countries, free while we launch.</p>
        </Container>
      </section>
      <Container className="max-w-3xl py-10">
        <ol className="space-y-3">
          {steps.map((s) => (
            <li key={s.title} className="flex gap-4 rounded-card bg-raised p-5 ring-1 ring-line/60">
              {s.done ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden="true" /> : <CircleDashed className="mt-0.5 h-6 w-6 shrink-0 text-muted" aria-hidden="true" />}
              <div>
                <h2 className="text-lg font-bold">{s.title}</h2>
                <p className="mt-1">{s.text}</p>
                <p className={`mt-2 text-sm font-semibold ${s.done ? "text-success" : "text-muted"}`}>{s.done ? "Available now" : "Coming next"}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href={`/${code}/for-business/register`} className={`${btn.primary} mt-8`}>List your transport business</Link>
      </Container>
    </main>
  );
}
