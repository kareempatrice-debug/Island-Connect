import { CalendarCheck, FileText } from "lucide-react";
import { serviceBySlug } from "@/data/gateway";
import { STATUS_LABEL } from "@/lib/gateway-notify";
import { docName } from "@/lib/gateway-docs";

export interface RequestRow { id: string; reference: string; service_slug: string; kind: string; status: string; details: Record<string, string>; documents: string[]; appointment_at: string | null; created_at: string; agencies?: { name: string } | null }
export interface MessageRow { id: number; body: string; from_agency: boolean; documents: string[]; created_at: string }

const fmt = (t: string) => new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Grenada" });
const STEPS = ["submitted", "received", "in_review", "approved"];

/* The request, its documents and the conversation, shared by the applicant's and the agency's pages. */
export function RequestView({ r, messages, urls, viewerIsAgency }: { r: RequestRow; messages: MessageRow[]; urls: Map<string, string>; viewerIsAgency: boolean }) {
  const svc = serviceBySlug(r.service_slug);
  const reached = STEPS.indexOf(r.status === "needs_info" ? "in_review" : r.status);
  const doc = (p: string) => (
    <a key={p} href={urls.get(p) ?? "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-sm font-semibold text-ink">
      <FileText className="h-4 w-4 text-primary" aria-hidden="true" />{docName(p)}
    </a>
  );
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
        <p className="text-sm">Reference <strong className="text-ink">{r.reference}</strong> · sent {fmt(r.created_at)}</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{svc?.title ?? "Request"}</h1>
        <p className="mt-1 text-sm">To {r.agencies?.name ?? "the agency"}</p>
        {["declined", "closed"].includes(r.status) ? (
          <p className="mt-4 rounded-xl bg-sunken px-4 py-3 font-semibold text-ink">{STATUS_LABEL[r.status]}</p>
        ) : (
          <ol className="mt-4 grid grid-cols-4 gap-1 text-center text-xs font-semibold">
            {STEPS.map((s, i) => (
              <li key={s}><span className={`mb-1 block h-1.5 rounded-full ${i <= reached ? "bg-success" : "bg-sunken"}`} />{STATUS_LABEL[s]}</li>
            ))}
          </ol>
        )}
        {r.status === "needs_info" && <p className="mt-3 rounded-xl bg-gold/20 px-4 py-3 text-sm font-semibold text-ink">{viewerIsAgency ? "Waiting for the applicant to reply." : "The agency needs more information. Reply below."}</p>}
        {r.appointment_at && <p className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success"><CalendarCheck className="h-4 w-4" aria-hidden="true" />Appointment: {fmt(r.appointment_at)}</p>}
      </div>

      <details className="rounded-2xl bg-raised p-5 ring-1 ring-line/60" open={viewerIsAgency}>
        <summary className="cursor-pointer font-semibold text-ink">Details and documents</summary>
        <dl className="mt-3 space-y-2 text-sm">
          {svc?.fields.filter((f) => r.details[f.name]).map((f) => (
            <div key={f.name}><dt className="text-muted">{f.label}</dt><dd className="whitespace-pre-line font-medium text-ink">{r.details[f.name]}</dd></div>
          ))}
        </dl>
        {r.documents.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{r.documents.map(doc)}</div>}
      </details>

      <section aria-label="Messages" className="space-y-3">
        {messages.map((m) => {
          const mine = m.from_agency === viewerIsAgency;
          return (
            <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "ml-auto bg-primary text-primary-ink" : "bg-raised text-ink ring-1 ring-line/60"}`}>
              <p className={`text-xs font-semibold ${mine ? "text-primary-ink/80" : "text-muted"}`}>{m.from_agency ? r.agencies?.name ?? "Agency" : viewerIsAgency ? r.details.full_name ?? "Applicant" : "You"} · {fmt(m.created_at)}</p>
              <p className="mt-1 whitespace-pre-line">{m.body}</p>
              {m.documents.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{m.documents.map(doc)}</div>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
