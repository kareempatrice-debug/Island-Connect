import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCircle2, FileCheck2, MessagesSquare, Wallet, Zap } from "lucide-react";
import { Container, btn } from "@/components/ui";
import { getCountry } from "@/lib/data";

// Served ready-made from Netlify and refreshed at most every 5 minutes (or straight away when a listing changes).
export const revalidate = 300;


export const metadata: Metadata = { title: "Drive, sail or haul with Island Connect" };

export default async function Operate({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const c = (await getCountry(code))!;
  const how = [
    { Icon: FileCheck2, title: "Apply in about five minutes", text: "One form: your details, the trips you take, and photos of your licence, insurance and registration. You don’t need a registered business; drivers with their own car or boat are welcome." },
    { Icon: CheckCircle2, title: "We check and approve you", text: "Usually within two working days. You get an email, and your listing goes live at the same time." },
    { Icon: Bell, title: "Get trip requests on your phone", text: "Add Island Connect to your home screen and turn on notifications. Every request also arrives by email." },
    { Icon: Zap, title: "Accept rides at the official fare", text: "Where a published fare applies, tap Accept and the trip is yours. For everything else, send your own price." },
    { Icon: MessagesSquare, title: "Message customers in the app", text: "Confirm the pickup by chat, WhatsApp or phone. You see the customer’s number once they’ve booked you." },
    { Icon: Wallet, title: "Customers pay you directly", text: "Cash or however you agree. No commission while Island Connect launches." },
  ];
  return (
    <main>
      <section className="bg-deep">
        <Container className="py-12 sm:py-16">
          <p className="text-sm font-semibold text-gold">For drivers and operators in {c.name}</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">Drive, sail or haul with Island Connect</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/85">Earn from rides, boat trips and haulage across both countries, full time or whenever suits you. Free while we launch.</p>
          <Link href={`/${code}/ride/operate/apply`} className="mt-6 inline-flex h-14 items-center rounded-full bg-gold px-7 text-[1.0625rem] font-semibold text-[#172B32]">Apply now</Link>
        </Container>
      </section>
      <Container className="max-w-3xl py-10">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-4 space-y-3">
          {how.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-4 rounded-card bg-raised p-5 ring-1 ring-line/60">
              <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
              <div><h3 className="text-lg font-bold">{title}</h3><p className="mt-1">{text}</p></div>
            </li>
          ))}
        </ol>
        <section className="mt-8 rounded-card bg-raised p-5 ring-1 ring-line/60" aria-labelledby="need-h">
          <h2 id="need-h" className="text-lg font-bold">What you’ll need</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>A valid driving licence and taxi or hire permit (or a boat licence, or a goods vehicle permit for haulage)</li>
            <li>Your vehicle or boat registration</li>
            <li>Your insurance certificate</li>
            <li>A phone that can take photos of your documents</li>
          </ul>
        </section>
        <Link href={`/${code}/ride/operate/apply`} className={`${btn.primary} mt-8`}>Apply now</Link>
      </Container>
    </main>
  );
}
