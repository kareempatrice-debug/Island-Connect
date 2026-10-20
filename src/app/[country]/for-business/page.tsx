import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, CircleDashed, FileText, MessageSquare, Store } from "lucide-react";
import { Container, btn } from "@/components/ui";
import { getCountry, isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Listing your business" };

const STAGES = [
  { Icon: Store, title: "A free business profile", text: "Your services, prices, opening hours, location and contact details, found by people searching nearby.", live: true },
  { Icon: CheckCircle2, title: "Claim an existing listing", text: "If we’ve already listed your business, claim it to take over and keep it up to date.", live: true },
  { Icon: CheckCircle2, title: "Verification", text: "Submit your documents and earn a Verified badge, so customers know you’re who you say you are.", live: false },
  { Icon: MessageSquare, title: "Messages and quote requests", text: "Customers describe the job, add photos and send it to you. You reply with a price.", live: false },
  { Icon: CalendarCheck, title: "Bookings", text: "Set your availability and let customers book appointments, tours and transfers.", live: false },
  { Icon: FileText, title: "A business dashboard", text: "Manage your listing, messages, bookings and reviews in one place.", live: false },
];

export default async function ForBusiness({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const c = (await getCountry(code))!;
  return (
    <main>
      <section className="bg-deep">
        <Container className="py-14 sm:py-20">
          <p className="text-sm font-medium text-gold">For businesses in {c.name}</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Reach more customers, starting with a free listing</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Island Connect is being built in stages. Here’s what exists today and what comes next, so you know exactly what
            you’re signing up for when registration opens.
          </p>
        </Container>
      </section>
      <Container className="py-12 sm:py-16">
        <ol className="grid gap-4 md:grid-cols-2">
          {STAGES.map((s) => (
            <li key={s.title} className="flex gap-4 rounded-panel bg-raised p-6 shadow-card ring-1 ring-line/60">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-deep/10 dark:bg-link/10">
                <s.Icon className="h-6 w-6 text-deep dark:text-link" aria-hidden="true" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="mt-1">{s.text}</p>
                <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${s.live ? "text-success" : "text-muted"}`}>
                  {s.live ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <CircleDashed className="h-4 w-4" aria-hidden="true" />}
                  {s.live ? "Available now" : "Planned"}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {isSupabaseConfigured ? (
          <div className="mt-10 rounded-panel bg-deep p-6 text-white sm:p-8">
            <h2 className="text-xl font-semibold text-white">Register for free</h2>
            <p className="mt-2 max-w-2xl text-white/85">
              Four short steps. We review each new listing before it goes live. If your business is already listed, open its page and
              choose “Claim this listing” instead.
            </p>
            <Link href={`/${code}/for-business/register`} className={`${btn.gold} mt-5`}>Register your business</Link>
          </div>
        ) : (
          <div className="mt-10 rounded-panel bg-sunken/70 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Registration opens when the database is connected</h2>
            <p className="mt-2 max-w-2xl">This preview runs on demonstration data. Browse how listings look to customers in the meantime.</p>
            <Link href={`/${code}/explore`} className={`${btn.primary} mt-5`}>See listings in {c.shortName}</Link>
          </div>
        )}
      </Container>
    </main>
  );
}
