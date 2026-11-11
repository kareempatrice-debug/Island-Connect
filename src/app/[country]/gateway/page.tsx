import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, FileCheck2, Home, Landmark, Plane } from "lucide-react";
import { PlacePhoto } from "@/components/photo";
import { Container } from "@/components/ui";
import { countryImagery, fallbackImagery } from "@/data/photos";
import { journeys } from "@/data/gateway";
import { getViewer } from "@/lib/auth";
import { getCountry, isSupabaseConfigured } from "@/lib/data";
import { guideSections } from "@/lib/guides";
import { supabaseForRequest } from "@/lib/supabase/server";
import { STATUS_LABEL } from "@/lib/gateway-notify";
import { serviceBySlug } from "@/data/gateway";

// Shows each person's own progress and requests, so it's built fresh for them.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gateway: return, start a business, invest" };

const ICONS = { "return-home": Plane, "start-a-business": Building2, "buy-property": Home } as Record<string, typeof Plane>;

export default async function Gateway({ params }: { params: Promise<{ country: string }> }) {
  const { country: code } = await params;
  const country = (await getCountry(code))!;
  const list = journeys[code as "gd" | "vc"] ?? [];
  const imagery = countryImagery[code] ?? fallbackImagery;
  const viewer = isSupabaseConfigured ? await getViewer() : null;
  let progress: { journey: string; step: string }[] = [];
  let requests: { id: string; reference: string; service_slug: string; status: string; updated_at: string }[] = [];
  if (viewer) {
    const supabase = await supabaseForRequest();
    const [p, r] = await Promise.all([
      supabase.from("journey_progress").select("journey, step").eq("country_code", code),
      supabase.from("gateway_requests").select("id, reference, service_slug, status, updated_at").eq("user_id", viewer.id).eq("country_code", code).order("updated_at", { ascending: false }).limit(10),
    ]);
    progress = p.data ?? [];
    requests = r.data ?? [];
  }
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-deep">
        <PlacePhoto photoKey={imagery.hero} sizes="100vw" priority credit />
        <div className="absolute inset-0 bg-[#032E33]/75" aria-hidden="true" />
        <Container className="relative py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold">Gateway</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">Come home, start a business or invest in {country.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Step-by-step journeys for everything involved, from wherever you are now. Send applications, book appointments and ask
            questions of the agencies that handle them, and follow every reply here.
          </p>
        </Container>
      </section>

      <Container className="py-10">
        <h2 className="text-2xl font-semibold">Where are you starting?</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {list.map((j) => {
            const Icon = ICONS[j.slug] ?? Landmark;
            const done = progress.filter((p) => p.journey === j.slug).length;
            return (
              <li key={j.slug}>
                <Link href={`/${code}/gateway/${j.slug}`} className="flex h-full flex-col rounded-2xl bg-raised p-5 shadow-card ring-1 ring-line/60 transition hover:-translate-y-0.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <span className="mt-4 text-xl font-semibold text-ink">{j.title}</span>
                  <span className="mt-1 text-sm">{j.short}</span>
                  {viewer && done > 0 && (
                    <span className="mt-3 block">
                      <span className="block h-2 overflow-hidden rounded-full bg-sunken"><span className="block h-full rounded-full bg-success" style={{ width: `${Math.round((done / j.steps.length) * 100)}%` }} /></span>
                      <span className="mt-1 block text-xs font-semibold text-ink">{done} of {j.steps.length} steps done</span>
                    </span>
                  )}
                  <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-link">{done ? "Continue" : "Start"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>
              </li>
            );
          })}
        </ul>

        {viewer && requests.length > 0 && (
          <section className="mt-10" aria-labelledby="req-h">
            <h2 id="req-h" className="text-2xl font-semibold">Your requests</h2>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-raised ring-1 ring-line/60">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/${code}/gateway/requests/${r.id}`} className="flex items-center gap-3 px-4 py-3">
                    <FileCheck2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold text-ink">{serviceBySlug(r.service_slug)?.title ?? "Request"}</span><span className="block text-sm">{r.reference}</span></span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "needs_info" ? "bg-gold/25 text-ink" : r.status === "approved" ? "bg-success/15 text-success" : "bg-sunken text-ink"}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10" aria-labelledby="lib-h">
          <h2 id="lib-h" className="flex items-center gap-2 text-2xl font-semibold"><BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />Reference library</h2>
          <p className="mt-1 text-sm">The full guides behind each journey, checked against official {country.name} sources.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {guideSections.map((g) => (
              <li key={g.slug}><Link href={`/${code}/guides/${g.slug}`} className="block rounded-2xl bg-raised p-4 ring-1 ring-line/60"><span className="block font-semibold text-ink">{g.title}</span><span className="mt-1 block text-sm">{g.intro}</span></Link></li>
            ))}
          </ul>
        </section>

        <p className="mt-10 max-w-3xl rounded-2xl bg-sunken p-4 text-sm">
          Island Connect sends your requests to the agency responsible and shows you every reply. Decisions are made by the agencies themselves.
          Where an agency isn’t on Island Connect yet, our team passes your request on for you. This is information, not legal or tax advice.
        </p>
      </Container>
    </main>
  );
}
