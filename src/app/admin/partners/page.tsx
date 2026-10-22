import type { Metadata } from "next";
import Link from "next/link";
import { createPartnerAction, togglePartnerAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { qrSvg } from "@/lib/qr";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Partners" };

const KIND: Record<string, string> = { hotel: "Hotel", villa: "Villa", airport: "Airport", port: "Port or ferry terminal", other: "Other" };
const LANDING: Record<string, string> = { airport: "Book a ride from the airport", ride: "Book a ride", home: "Island Connect home page" };
const field = "h-11 w-full rounded-lg border border-line bg-raised px-3";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function Partners({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await supabaseForRequest();
  const { data } = await supabase.rpc("admin_partner_stats");
  const partners = (data ?? []) as any[];
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://islandconnect.cc").replace(/\/$/, "");
  const qrs = await Promise.all(partners.map((p) => qrSvg(`${site}/p/${p.code}`)));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Partners</h1>
        <p className="mt-1 text-sm">Villas, hotels, the airport and ferry terminals. Each partner gets a link and a QR code for arrivals desks, welcome packs and rooms. Scans and bookings are credited to them.</p>
      </div>
      {sp.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{sp.error}</p>}
      {sp.done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">Partner added. Their link is {site}/p/{sp.done}</p>}

      <details className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
        <summary className="cursor-pointer font-semibold text-ink">Add a partner</summary>
        <form action={createPartnerAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Name, e.g. Spice Island Villas" className={`${field} sm:col-span-2`} />
          <select name="kind" className={field} defaultValue="villa">{Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select name="country" className={field}><option value="vc">St Vincent and the Grenadines</option><option value="gd">Grenada</option></select>
          <select name="landing" className={`${field} sm:col-span-2`} defaultValue="ride">{Object.entries(LANDING).map(([k, v]) => <option key={k} value={k}>Scanning opens: {v}</option>)}</select>
          <input name="contact" placeholder="Contact person, phone or email (optional)" className={`${field} sm:col-span-2`} />
          <button className="h-11 rounded-lg bg-primary px-5 font-semibold text-primary-ink sm:w-fit">Create link and QR code</button>
        </form>
      </details>

      {!partners.length ? <p className="text-sm">No partners yet.</p> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {partners.map((p, i) => (
            <li key={p.id} className={`rounded-2xl bg-raised p-5 ring-1 ring-line/60 ${p.active ? "" : "opacity-60"}`}>
              <div className="flex gap-4">
                <div className="h-28 w-28 shrink-0 rounded-lg bg-white p-1 ring-1 ring-line [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrs[i] }} aria-label={`QR code for ${p.name}`} role="img" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-sm">{KIND[p.kind]} · {p.country_code === "gd" ? "Grenada" : "SVG"} · opens {LANDING[p.landing].toLowerCase()}</p>
                  <p className="mt-1 break-all text-sm font-semibold text-link">{site}/p/{p.code}</p>
                  {p.contact && <p className="text-xs">{p.contact}</p>}
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[["Scans (30 days)", p.visits_30d], ["Scans in total", p.visits_total], ["Ride requests", p.requests], ["Booked", p.booked]].map(([l, v]) => (
                  <div key={l as string} className="rounded-xl bg-sunken p-2"><dt className="text-[0.7rem]">{l}</dt><dd className="text-lg font-semibold text-ink">{Number(v)}</dd></div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <Link href={`/admin/partners/${p.id}/card`} className="rounded-full bg-primary px-4 py-2 text-primary-ink">Print cards</Link>
                <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrs[i])}`} download={`island-connect-${p.code}-qr.svg`} className="rounded-full border border-line px-4 py-2 text-ink">Download QR code</a>
                <form action={togglePartnerAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={p.active ? "off" : "on"} />
                  <button className="px-2 py-2 text-muted underline">{p.active ? "Pause link" : "Turn link back on"}</button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
