/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { TRIP_KIND_LABEL, fmtXcd } from "@/lib/trips";
import { BarList, Funnel, LineChart, Stat } from "./charts";

const sum = (rows: any[], k: string) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);

export function InsightsPanel({ data, range }: { data: any; range: number }) {
  const s: any[] = data?.series ?? [];
  const prev = data?.previous ?? {};
  const totals = data?.totals ?? {};
  // Weekly buckets for long ranges keep the charts readable on a phone.
  const weekly = range > 31;
  const buckets: { label: string; rows: any[] }[] = [];
  s.forEach((r, i) => {
    const d = new Date(`${r.day}T12:00:00`);
    if (!weekly || i % 7 === 0) buckets.push({ label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), rows: [] });
    buckets[buckets.length - 1].rows.push(r);
  });
  const labels = buckets.map((b) => b.label);
  const line = (k: string) => buckets.map((b) => sum(b.rows, k));
  const status = data?.trip_status ?? {};
  const kinds = Object.entries(data?.trip_kinds ?? {}).map(([k, v]) => ({ label: TRIP_KIND_LABEL[k] ?? k, value: Number(v) }));
  const channels = Object.entries(data?.click_channels ?? {}).map(([k, v]) => ({ label: ({ whatsapp: "WhatsApp", phone: "Phone", email: "Email", website: "Website", booking: "Booking link", maps: "Directions" } as any)[k] ?? k, value: Number(v) }));

  return (
    <section aria-labelledby="insights-h" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="insights-h" className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm">Last {range} days, compared with the {range} days before. Times are Grenada and St Vincent time.</p>
        </div>
        <nav aria-label="Period" className="flex rounded-full bg-sunken p-1 text-sm font-semibold">
          {[7, 30, 90, 365].map((r) => (
            <Link key={r} href={`/admin?range=${r}`} aria-current={r === range ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 ${r === range ? "bg-raised text-ink shadow-card" : "text-muted"}`}>{r === 365 ? "1 year" : `${r} days`}</Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Page views" value={sum(s, "views")} previous={Number(prev.views ?? 0)} />
        <Stat label="New accounts" value={sum(s, "signups")} previous={Number(prev.signups ?? 0)} />
        <Stat label="Trip requests" value={sum(s, "requests")} previous={Number(prev.requests ?? 0)} />
        <Stat label="Trips booked" value={sum(s, "booked")} previous={Number(prev.booked ?? 0)} />
        <Stat label="Trips completed" value={sum(s, "completed")} hint={`Fares ${fmtXcd(sum(s, "fares"))}`} />
        <Stat label="Conversations started" value={sum(s, "conversations")} previous={Number(prev.conversations ?? 0)} />
        <Stat label="Messages sent" value={sum(s, "messages")} />
        <Stat label="WhatsApp, call and other taps" value={sum(s, "clicks")} previous={Number(prev.clicks ?? 0)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <LineChart title="Visitors: page views" labels={labels} series={[{ name: "Page views", values: line("views") }]} />
        <LineChart title="Bookings" labels={labels} series={[{ name: "Requests", values: line("requests") }, { name: "Booked", values: line("booked") }, { name: "Completed", values: line("completed") }]} />
        <LineChart title="Customer interaction" labels={labels} series={[{ name: "Conversations", values: line("conversations") }, { name: "Messages", values: line("messages") }, { name: "Contact taps", values: line("clicks") }]} />
        <LineChart title="New accounts" labels={labels} series={[{ name: "Sign-ups", values: line("signups") }]} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Funnel steps={[
          { label: "Requests", value: sum(s, "requests") },
          { label: "Booked", value: sum(s, "booked") },
          { label: "Completed", value: sum(s, "completed") },
        ]} />
        <BarList title="Requests by type" items={kinds} empty="No trip requests in this period." />
        <BarList title="Requests by country" items={Object.entries(data?.trip_countries ?? {}).map(([k, v]) => ({ label: k === "gd" ? "Grenada" : k === "vc" ? "St Vincent and the Grenadines" : k, value: Number(v) }))} empty="No trip requests in this period." />
        <BarList title="Most visited pages" items={(data?.top_pages ?? []).map((p: any) => ({ label: p.path, value: Number(p.views) }))} empty="No visits counted yet." />
        <BarList title="Businesses customers contact most" items={(data?.top_businesses ?? []).map((b: any) => ({ label: b.name, value: Number(b.clicks) + Number(b.conversations) }))} empty="No contacts in this period." />
        <BarList title="How customers get in touch" items={channels} empty="No contact taps in this period." />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Accounts" value={Number(totals.accounts ?? 0)} />
        <Stat label="Live listings" value={Number(totals.listings ?? 0)} />
        <Stat label="Claimed by owners" value={Number(totals.claimed ?? 0)} />
        <Stat label="Verified" value={Number(totals.verified ?? 0)} />
        <Stat label="Approved operators" value={Number(totals.operators ?? 0)} />
        <Stat label="Phones with alerts on" value={Number(totals.notification_devices ?? 0)} />
      </div>
      {Number(status.open ?? 0) > 0 && (
        <p className="rounded-xl bg-gold/20 px-4 py-3 text-sm font-medium text-ink">{status.open} trip request{Number(status.open) === 1 ? " is" : "s are"} still open. <Link href="/admin/operators#open-h" className="underline">See them</Link></p>
      )}
    </section>
  );
}
