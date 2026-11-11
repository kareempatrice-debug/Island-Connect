import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building } from "lucide-react";
import { Container } from "@/components/ui";
import { GatewayRequestForm } from "@/components/gateway/request-form";
import { serviceBySlug } from "@/data/gateway";
import { requireViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  return { title: serviceBySlug((await params).service)?.title ?? "Gateway" };
}

export default async function Apply({ params }: { params: Promise<{ country: string; service: string }> }) {
  const { country, service: slug } = await params;
  const svc = serviceBySlug(slug);
  if (!svc || svc.country !== country) notFound();
  const viewer = await requireViewer(`/${country}/gateway/apply/${slug}`, country);
  const supabase = await supabaseForRequest();
  const [{ data: agency }, { data: profile }] = await Promise.all([
    supabase.from("agencies").select("name, phone, address").eq("slug", svc.agency).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", viewer.id).maybeSingle(),
  ]);
  return (
    <main>
      <Container className="max-w-2xl py-8">
        <Link href={`/${country}/gateway`} className="inline-flex items-center gap-1 text-sm font-semibold text-link"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Gateway</Link>
        <h1 className="mt-3 text-3xl font-semibold">{svc.title}</h1>
        {agency && <p className="mt-2 flex items-center gap-2 text-sm"><Building className="h-4 w-4 text-primary" aria-hidden="true" />Goes to <strong className="text-ink">{agency.name}</strong></p>}
        <p className="mt-3">{svc.intro}</p>
        <div className="mt-6 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
          <GatewayRequestForm service={svc} name={profile?.full_name ?? viewer.name ?? ""} phone="" />
        </div>
        <p className="mt-4 text-sm">You’ll get a reference number straight away, and see every reply from the agency in Gateway. The agency makes the decision.</p>
      </Container>
    </main>
  );
}
