import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { agencyStatusAction } from "@/app/gateway-actions";
import { GatewayMessageBox } from "@/components/gateway/message-box";
import { RequestView, type MessageRow, type RequestRow } from "@/components/gateway/request-view";
import { signedDocs } from "@/lib/gateway-docs";
import { supabaseForRequest } from "@/lib/supabase/server";

export default async function AgencyRequest({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; done?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await supabaseForRequest();
  // The database only returns this request to its agency's staff and Island Connect's administrators.
  const { data: r } = await supabase.from("gateway_requests").select("id, reference, service_slug, kind, status, details, documents, appointment_at, created_at, agencies ( name )").eq("id", id).maybeSingle();
  if (!r) notFound();
  const { data: msgs } = await supabase.from("gateway_messages").select("id, body, from_agency, documents, created_at").eq("request_id", id).order("created_at");
  const urls = await signedDocs([...(r.documents ?? []), ...(msgs ?? []).flatMap((m) => m.documents ?? [])]);
  const statuses: [string, string][] = [["received", "Received"], ["in_review", "In review"], ["needs_info", "Need more information"], ["approved", "Approve"], ["declined", "Decline"], ["closed", "Close"]];
  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/agency" className="inline-flex items-center gap-1 text-sm font-semibold text-link"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All requests</Link>
      {sp.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{sp.error}</p>}
      {sp.done && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">Updated. The applicant has been notified.</p>}
      <RequestView r={r as unknown as RequestRow} messages={(msgs ?? []) as MessageRow[]} urls={urls} viewerIsAgency />
      <GatewayMessageBox requestId={r.id} fromAgency placeholder="Reply to the applicant, ask for documents, or explain a decision" />
      <form action={agencyStatusAction} className="space-y-3 rounded-2xl bg-raised p-4 ring-1 ring-line/60">
        <input type="hidden" name="id" value={r.id} />
        <p className="font-semibold text-ink">Update status</p>
        {r.kind === "appointment" && (
          <label className="block text-sm">Confirm appointment (Eastern Caribbean time)
            <input type="datetime-local" name="appointment" className="mt-1 block h-11 w-full rounded-xl border border-line bg-raised px-3 text-base" /></label>
        )}
        <div className="flex flex-wrap gap-2">
          {statuses.map(([v, l]) => (
            <button key={v} name="status" value={v} className={`h-10 rounded-full px-4 text-sm font-semibold ${v === "approved" ? "bg-primary text-primary-ink" : v === "declined" ? "border border-line text-danger" : "border border-line text-ink"}`}>{l}</button>
          ))}
        </div>
        <p className="text-xs">The applicant is notified of every change. Explain decisions in a message above.</p>
      </form>
    </div>
  );
}
