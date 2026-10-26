"use client";

import { AlertTriangle, CheckCircle2, Clock, FileUp, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addOperatorDocumentAction } from "@/app/trip-actions";
import { DOC_LABELS } from "@/lib/operator-docs";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface DocRow { type: string; status: "approved" | "pending" | "rejected" | "missing"; expires_on: string | null; note: string | null }
export interface Compliance {
  required: string[]; missing: string[]; expired: string[]; pending: string[]; expiring: { type: string; expires_on: string }[];
  grace_until: string | null; documents_ok: boolean; good_standing: boolean;
}

const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const daysTo = (d: string) => Math.ceil((new Date(`${d}T23:59:59`).getTime() - Date.now()) / 86400_000);

/* "Your documents": what's approved, expiring, expired or missing, with one-tap renewal uploads. */
export function OperatorDocuments({ businessId, compliance, docs }: { businessId: string; compliance: Compliance; docs: DocRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function save(type: string) {
    if (!file) { setError("Choose a photo of the document."); return; }
    if (type !== "police_record" && !expires) { setError("Add the expiry date shown on the document."); return; }
    setBusy(true); setError(null);
    try {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getUser();
      if (!data.user) throw new Error("Please sign in again.");
      const ext = file.type === "application/pdf" ? "pdf" : "jpg";
      const path = `${data.user.id}/${type}-${Date.now()}.${ext}`;
      const { error: up } = await sb.storage.from("operator-documents").upload(path, file, { contentType: file.type || "image/jpeg" });
      if (up) throw new Error("The upload didn’t go through. Check your connection and try again.");
      const res = await addOperatorDocumentAction({ businessId, type, path, expires: expires || null });
      if (res.error) throw new Error(res.error);
      setOpen(null); setFile(null); setExpires("");
      router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const c = compliance;
  const graceDays = c.grace_until ? daysTo(c.grace_until) : null;
  return (
    <section className="rounded-2xl bg-raised p-4 ring-1 ring-line/60" aria-labelledby="docs-h">
      <h3 id="docs-h" className="font-semibold text-ink">Your documents</h3>
      {!c.good_standing ? (
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>You’re offline for new rides until the documents marked below are uploaded and approved.</span>
        </p>
      ) : graceDays != null && graceDays >= 0 && (c.missing.length || c.pending.length) ? (
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-gold/20 p-3 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Please add the documents below within <strong>{graceDays} day{graceDays === 1 ? "" : "s"}</strong> (by {fmt(c.grace_until)}). After that you’ll be taken offline until they’re approved.</span>
        </p>
      ) : (
        <p className="mt-1 text-sm">All up to date. We’ll remind you here 30 days before anything expires.</p>
      )}
      <ul className="mt-3 divide-y divide-line">
        {c.required.map((t) => {
          const d = docs.find((x) => x.type === t);
          const expired = c.expired.includes(t);
          const expiring = c.expiring.find((x) => x.type === t);
          const missing = c.missing.includes(t);
          const pending = c.pending.includes(t);
          const state = expired ? "expired" : pending ? "pending" : missing ? "missing" : expiring ? "expiring" : "ok";
          return (
            <li key={t} className="py-3">
              <div className="flex items-start gap-3">
                {state === "ok" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" aria-hidden="true" />
                  : state === "pending" ? <Clock className="mt-0.5 h-5 w-5 text-muted" aria-hidden="true" />
                  : state === "expiring" ? <AlertTriangle className="mt-0.5 h-5 w-5 text-gold" aria-hidden="true" />
                  : <XCircle className="mt-0.5 h-5 w-5 text-danger" aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{DOC_LABELS[t]?.title ?? t}</p>
                  <p className="text-sm">
                    {state === "ok" && (d?.expires_on ? `Approved · expires ${fmt(d.expires_on)}` : "Approved")}
                    {state === "pending" && "Uploaded · waiting for Island Connect to check it"}
                    {state === "expiring" && `Expires ${fmt(expiring!.expires_on)} (${daysTo(expiring!.expires_on)} days). Upload the renewal`}
                    {state === "expired" && `Expired${d?.expires_on ? ` on ${fmt(d.expires_on)}` : ""}. Upload the renewal`}
                    {state === "missing" && (d?.status === "rejected" ? `Not accepted${d.note ? `: ${d.note}` : ""}. Please upload it again` : "Needed")}
                  </p>
                </div>
                {state !== "pending" && state !== "ok" && (
                  <button type="button" onClick={() => { setOpen(open === t ? null : t); setError(null); }} className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-ink">Upload</button>
                )}
                {state === "ok" && <button type="button" onClick={() => { setOpen(open === t ? null : t); setError(null); }} className="shrink-0 text-sm font-semibold text-link underline">Replace</button>}
              </div>
              {open === t && (
                <div className="mt-3 space-y-2 pl-8">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-ink">
                    <FileUp className="h-4 w-4 text-primary" aria-hidden="true" />{file ? file.name : "Choose a photo or PDF"}
                    <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {t !== "police_record" && (
                    <label className="flex items-center gap-2 text-sm"><span className="shrink-0">Expires on</span>
                      <input type="date" min={today} value={expires} onChange={(e) => setExpires(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-raised px-2 text-ink" /></label>
                  )}
                  {error && <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
                  <button type="button" onClick={() => save(t)} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink disabled:opacity-60">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send for checking
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
