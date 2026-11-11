import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Search, Send } from "lucide-react";
import { Container } from "@/components/ui";
import { StepToggle } from "@/components/gateway/step-toggle";
import { EligibilityChecker } from "@/components/gateway/eligibility";
import { HOW, concessionRules, journeyBySlug, serviceBySlug } from "@/data/gateway";
import { getViewer } from "@/lib/auth";
import { getCountry, isSupabaseConfigured } from "@/lib/data";
import { supabaseForRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ country: string; journey: string }> }): Promise<Metadata> {
  const { country, journey } = await params;
  return { title: journeyBySlug(country, journey)?.title ?? "Gateway" };
}

export default async function JourneyPage({ params }: { params: Promise<{ country: string; journey: string }> }) {
  const { country: code, journey: slug } = await params;
  const j = journeyBySlug(code, slug);
  if (!j) notFound();
  const country = (await getCountry(code))!;
  const viewer = isSupabaseConfigured ? await getViewer() : null;
  let done = new Set<string>();
  const agencies = new Map<string, { name: string; phone: string | null; website: string | null }>();
  if (isSupabaseConfigured) {
    const supabase = await supabaseForRequest();
    const [{ data: p }, { data: a }] = await Promise.all([
      viewer ? supabase.from("journey_progress").select("step").eq("country_code", code).eq("journey", slug) : Promise.resolve({ data: [] as { step: string }[] }),
      supabase.from("agencies").select("slug, name, phone, website").eq("country_code", code),
    ]);
    done = new Set((p ?? []).map((x) => x.step));
    for (const x of a ?? []) agencies.set(x.slug, x);
  }
  const count = j.steps.filter((s) => done.has(s.id)).length;
  const tone = { good: "bg-success/10 text-success", ok: "bg-gold/20 text-ink", warn: "bg-sunken text-ink" };
  return (
    <main>
      <Container className="py-8">
        <Link href={`/${code}/gateway`} className="inline-flex items-center gap-1 text-sm font-semibold text-link"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Gateway</Link>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{j.title} <span className="text-muted">· {country.name}</span></h1>
        <p className="mt-2 max-w-2xl text-lg">{j.intro}</p>
        <div className="mt-5 max-w-xl">
          <div className="h-2.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.round((count / j.steps.length) * 100)}%` }} /></div>
          <p className="mt-1.5 text-sm font-semibold text-ink">{count} of {j.steps.length} steps done{!viewer && " · sign in to save your progress"}</p>
        </div>

        <ol className="mt-8 space-y-4">
          {j.steps.map((s, i) => {
            const ag = s.agency ? agencies.get(s.agency) : null;
            const svc = s.service ? serviceBySlug(s.service) : null;
            return (
              <li key={s.id} className={`rounded-2xl bg-raised p-5 ring-1 ring-line/60 ${done.has(s.id) ? "opacity-80" : ""}`}>
                <div className="flex items-start gap-4">
                  <StepToggle country={code} journey={slug} step={s.id} done={done.has(s.id)} signedIn={Boolean(viewer)} index={i + 1} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-ink">{s.title}</h2>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[HOW[s.how].tone]}`}>{HOW[s.how].label}</span>
                    <p className="mt-2">{s.text}</p>
                    {ag && <p className="mt-2 text-sm"><strong className="text-ink">{ag.name}</strong>{ag.phone ? ` · ${ag.phone}` : ""}</p>}
                    {s.checker && concessionRules[code as "gd" | "vc"] && <EligibilityChecker country={code} rules={concessionRules[code as "gd" | "vc"]} />}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {svc && (
                        <Link href={`/${code}/gateway/apply/${svc.slug}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink">
                          <Send className="h-4 w-4" aria-hidden="true" />{svc.kind === "application" ? "Apply through Island Connect" : svc.kind === "appointment" ? "Request an appointment" : "Ask the agency"}
                        </Link>
                      )}
                      {s.links?.map((l) => (
                        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink">
                          {l.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ))}
                      {s.directory && (
                        <Link href={`/${code}/services/${s.directory.category}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink"><Search className="h-4 w-4" aria-hidden="true" />{s.directory.label}</Link>
                      )}
                      {s.guide && (
                        <Link href={`/${code}/guides/${s.guide.section}/${s.guide.slug}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink"><BookOpen className="h-4 w-4" aria-hidden="true" />{s.guide.label}</Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <Link href={`/${code}/gateway`} className="mt-8 inline-flex items-center gap-1 font-semibold text-link">All journeys <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </Container>
    </main>
  );
}
