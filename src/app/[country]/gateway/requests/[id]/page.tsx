import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui";
import { GatewayMessageBox } from "@/components/gateway/message-box";
import { RequestView, type MessageRow, type RequestRow } from "@/components/gateway/request-view";
import { requireViewer } from "@/lib/auth";
import { signedDocs } from "@/lib/gateway-docs";
import { supabaseForRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your request", robots: { index: false } };

export default async function MyRequest({ params, searchParams }: { params: Promise<{ country: string; id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const { country, id } = await params;
  const sp = await searchParams;
  const viewer = await requireViewer(`/${country}/gateway/requests/${id}`, country);
  const supabase = await supabaseForRequest();
  const { data: r } = await supabase.from("gateway_requests").select("id, reference, service_slug, kind, status, details, documents, appointment_at, created_at, user_id, agencies ( name )").eq("id", id).maybeSingle();
  if (!r || r.user_id !== viewer.id) notFound();
  const { data: msgs } = await supabase.from("gateway_messages").select("id, body, from_agency, documents, created_at").eq("request_id", id).order("created_at");
  const all = [...(r.documents ?? []), ...(msgs ?? []).flatMap((m) => m.documents ?? [])];
  const urls = await signedDocs(all);
  return (
    <main>
      <Container className="max-w-2xl space-y-5 py-8">
        <Link href={`/${country}/gateway`} className="inline-flex items-center gap-1 text-sm font-semibold text-link"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Gateway</Link>
        {sp.sent && <p role="status" className="flex items-start gap-2 rounded-2xl bg-success/10 p-4 font-semibold text-success"><CheckCircle2 className="mt-0.5 h-5 w-5" aria-hidden="true" />Sent. Your reference is {r.reference}. You’ll be notified when the agency replies.</p>}
        <RequestView r={r as unknown as RequestRow} messages={(msgs ?? []) as MessageRow[]} urls={urls} viewerIsAgency={false} />
        {!["approved", "declined", "closed"].includes(r.status) && <GatewayMessageBox requestId={r.id} fromAgency={false} placeholder="Write to the agency, or send more documents" />}
      </Container>
    </main>
  );
}
