"use client";

import { FileUp, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { gatewayMessageAction } from "@/app/gateway-actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

/* Reply on a request, with optional documents. Used by the applicant and by the agency. */
export function GatewayMessageBox({ requestId, fromAgency, placeholder }: { requestId: string; fromAgency: boolean; placeholder: string }) {
  const [body, setBody] = useState("");
  const [docs, setDocs] = useState<{ path: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError(null);
    try {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getUser();
      if (!data.user) throw new Error("Please sign in again.");
      for (const f of Array.from(files).slice(0, 10 - docs.length)) {
        const ext = f.type === "application/pdf" ? "pdf" : f.type === "image/png" ? "png" : "jpg";
        const path = `${data.user.id}/reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: e } = await sb.storage.from("gateway-documents").upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (e) throw new Error("An upload didn’t go through. Try again.");
        setDocs((d) => [...d, { path, label: f.name }]);
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  async function send() {
    if (!body.trim()) return;
    setBusy(true); setError(null);
    const r = await gatewayMessageAction({ requestId, body, documents: docs.map((d) => d.path), fromAgency });
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setBody(""); setDocs([]); router.refresh();
  }

  return (
    <div className="rounded-2xl bg-raised p-4 ring-1 ring-line/60">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000} placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-raised p-3 text-base text-ink" aria-label="Your message" />
      {docs.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">{docs.map((d) => (
          <li key={d.path} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{d.label}</span>
            <button type="button" aria-label={`Remove ${d.label}`} onClick={() => setDocs((x) => x.filter((y) => y.path !== d.path))}><X className="h-4 w-4" aria-hidden="true" /></button></li>
        ))}</ul>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink">
          <FileUp className="h-4 w-4" aria-hidden="true" />Attach<input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => upload(e.target.files)} />
        </label>
        <button type="button" onClick={send} disabled={busy || !body.trim()} className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-ink disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send
        </button>
      </div>
    </div>
  );
}
