"use client";

import { Check, FileUp, Loader2, X } from "lucide-react";
import { useActionState, useState } from "react";
import { submitGatewayRequestAction } from "@/app/gateway-actions";
import type { Service } from "@/data/gateway";
import { supabaseBrowser } from "@/lib/supabase/browser";

const field = "mt-1 block w-full rounded-xl border border-line bg-raised px-3 py-2.5 text-base text-ink";

/* The application, appointment or question form, with secure document uploads. */
export function GatewayRequestForm({ service, name, phone }: { service: Service; name: string; phone: string }) {
  const [state, action, pending] = useActionState(submitGatewayRequestAction, {} as { error?: string });
  const [docs, setDocs] = useState<{ path: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [upErr, setUpErr] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setUpErr(null);
    try {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getUser();
      if (!data.user) throw new Error("Please sign in again.");
      for (const f of Array.from(files).slice(0, 12 - docs.length)) {
        if (f.size > 10 * 1024 * 1024) throw new Error(`${f.name} is over 10 MB.`);
        const ext = f.type === "application/pdf" ? "pdf" : f.type === "image/png" ? "png" : "jpg";
        const path = `${data.user.id}/${service.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await sb.storage.from("gateway-documents").upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (error) throw new Error("An upload didn’t go through. Check your connection and try again.");
        setDocs((d) => [...d, { path, label: f.name }]);
      }
    } catch (e) { setUpErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="service" value={service.slug} />
      <input type="hidden" name="documents" value={JSON.stringify(docs.map((d) => d.path))} />
      {service.fields.map((f) => (
        <label key={f.name} className="block">
          <span className="text-sm font-semibold text-ink">{f.label}{f.required ? "" : " (optional)"}</span>
          {f.type === "textarea" ? (
            <textarea name={f.name} required={f.required} rows={4} maxLength={2000} className={field} />
          ) : f.type === "select" ? (
            <select name={f.name} required={f.required} className={field} defaultValue="">
              <option value="" disabled>Choose…</option>
              {f.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input name={f.name} type={f.type} required={f.required} maxLength={200} className={field}
              defaultValue={f.name === "full_name" ? name : f.name === "phone" ? phone : undefined} />
          )}
        </label>
      ))}

      {service.documents.length > 0 && (
        <fieldset className="rounded-2xl bg-sunken p-4">
          <legend className="sr-only">Documents</legend>
          <p className="font-semibold text-ink">Documents</p>
          <ul className="mt-1 list-disc pl-5 text-sm">{service.documents.map((d) => <li key={d}>{d}</li>)}</ul>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-raised px-3 py-4 font-semibold text-ink">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileUp className="h-5 w-5 text-primary" aria-hidden="true" />}
            Add photos or PDFs
            <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => upload(e.target.files)} />
          </label>
          {docs.length > 0 && (
            <ul className="mt-3 space-y-1">
              {docs.map((d) => (
                <li key={d.path} className="flex items-center gap-2 text-sm text-ink">
                  <Check className="h-4 w-4 text-success" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{d.label}</span>
                  <button type="button" aria-label={`Remove ${d.label}`} onClick={() => setDocs((x) => x.filter((y) => y.path !== d.path))}><X className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
          {upErr && <p role="alert" className="mt-2 text-sm text-danger">{upErr}</p>}
          <p className="mt-2 text-xs">Stored privately. Only you, the agency and Island Connect’s team can see them.</p>
        </fieldset>
      )}

      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
      <button disabled={pending || busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-ink disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {service.kind === "application" ? "Send application" : service.kind === "appointment" ? "Request appointment" : "Send question"}
      </button>
    </form>
  );
}
