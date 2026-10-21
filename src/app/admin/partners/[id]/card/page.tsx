import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdmin } from "@/lib/auth";
import { qrSvg } from "@/lib/qr";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Print partner cards" };

/* Four A6 cards on an A4 sheet: for arrivals desks, welcome packs, rooms and reception. */
export default async function PartnerCard({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await supabaseForRequest();
  const { data: p } = await supabase.from("partners").select("code, name, kind, country_code, landing").eq("id", id).maybeSingle();
  if (!p) notFound();
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://islandconnect.cc").replace(/\/$/, "");
  const url = `${site}/p/${p.code}`;
  const qr = await qrSvg(url);
  const headline = p.landing === "airport" ? "Need a taxi from the airport?" : p.landing === "home" ? "Find local services, fast" : "Need a ride?";
  const lines = p.landing === "home"
    ? ["Taxis, restaurants, tours and local services", "Message businesses directly", "Free to use"]
    : ["Official fares on popular routes", "Book now or reserve ahead", "Pay your driver directly"];
  const country = p.country_code === "gd" ? "Grenada" : "St Vincent and the Grenadines";
  return (
    <div>
      <style>{`@page { size: A4; margin: 10mm } @media print { header, nav, .no-print { display: none !important } main { padding: 0 !important; max-width: none !important } body { background: #fff } }`}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Cards for {p.name}</h1><p className="text-sm">Print on card stock at 100% scale, then cut into four. Each card links to {url}</p></div>
        <PrintButton />
      </div>
      <div className="mx-auto grid max-w-[190mm] grid-cols-2 gap-[6mm] bg-white">
        {[0, 1, 2, 3].map((i) => (
          <section key={i} className="flex h-[132mm] flex-col items-center justify-between rounded-[4mm] border border-[#d5dcdc] p-[7mm] text-center text-[#172B32]">
            <Image src="/brand/ic-lockup.png" alt="Island Connect" width={150} height={100} className="h-auto w-[30mm]" />
            <div>
              <p className="text-[6mm] font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{headline}</p>
              <p className="mt-[1.5mm] text-[3.4mm]">Scan to book in {country}</p>
            </div>
            <div className="h-[48mm] w-[48mm] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <ul className="space-y-[0.8mm] text-[3.2mm]">{lines.map((l) => <li key={l}>✓ {l}</li>)}</ul>
            <p className="text-[2.8mm] text-[#56666B]">islandconnect.cc · with {p.name}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
