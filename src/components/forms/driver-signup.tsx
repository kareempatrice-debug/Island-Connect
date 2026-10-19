"use client";

import { Check, FileUp, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { applyAsDriverAction } from "@/app/trip-actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

const KINDS = [
  ["taxi", "Taxi"], ["airport", "Airport transfers"], ["group", "Minivan and groups"],
  ["boat", "Boat and water taxi"], ["haulage", "Trucking and haulage"],
] as const;
const DOCS = [
  ["licence", "Driving licence and taxi or hire permit (or boat or goods licence)"],
  ["insurance", "Insurance certificate"],
  ["vehicle", "Vehicle or vessel registration"],
] as const;

const field = "h-12 w-full rounded-xl border border-line bg-raised px-3.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";
const label = "mb-1.5 block text-sm font-semibold text-ink";

/* Photos are shrunk on the phone; PDFs are sent as they are. */
async function prepare(file: File): Promise<{ blob: Blob; ext: string }> {
  if (file.type === "application/pdf") {
    if (file.size > 5 * 1024 * 1024) throw new Error("That PDF is over 5 MB. Try a photo of the page instead.");
    return { blob: file, ext: "pdf" };
  }
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error("That photo couldn’t be read. Try a JPEG or PNG."); });
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("That photo couldn’t be processed.");
  return { blob, ext: "jpg" };
}

export function DriverSignup({ country, islands, defaultName }: { country: string; islands: { slug: string; name: string }[]; defaultName: string }) {
  const [state, act, pending] = useActionState(applyAsDriverAction, {});
  const [who, setWho] = useState<"individual" | "business">("individual");
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sameWhatsApp, setSameWhatsApp] = useState(true);

  async function upload(kind: string, file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setBusy(kind);
    try {
      const { data } = await supabaseBrowser().auth.getUser();
      if (!data.user) throw new Error("Please sign in again.");
      const { blob, ext } = await prepare(file);
      const path = `${data.user.id}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabaseBrowser().storage.from("operator-documents").upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
      if (error) throw new Error("The upload didn’t go through. Check your connection and try again.");
      setDocs((d) => ({ ...d, [kind]: path }));
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <form action={act} className="space-y-6">
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="providerType" value={who} />
      {Object.values(docs).map((p) => <input key={p} type="hidden" name="documents" value={p} />)}

      <fieldset className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
        <legend className="sr-only">About you</legend>
        <p className={label}>Are you applying as</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([["individual", "Myself", "A driver or captain with my own vehicle or boat."], ["business", "A business", "A taxi, tour, boat or haulage company."]] as const).map(([k, t, d]) => (
            <button key={k} type="button" aria-pressed={who === k} onClick={() => setWho(k)}
              className={`rounded-2xl p-4 text-left ${who === k ? "border-2 border-primary bg-primary/10" : "border border-line bg-raised"}`}>
              <span className="block font-semibold text-ink">{t}</span><span className="mt-1 block text-sm">{d}</span>
            </button>
          ))}
        </div>
        <label className="mt-4 block"><span className={label}>{who === "individual" ? "Your name, as customers will see it" : "Business name"}</span>
          <input name="name" required defaultValue={who === "individual" ? defaultName : ""} placeholder={who === "individual" ? "e.g. Marcus Charles" : "e.g. Island Rides Ltd"} className={field} /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className={label}>Where you’re based</span>
            <select name="island" className={field}>{islands.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}</select></label>
          <label className="block"><span className={label}>Town or area (optional)</span>
            <input name="area" maxLength={120} placeholder="e.g. Grand Anse" className={field} /></label>
          <label className="block"><span className={label}>Phone</span>
            <input name="phone" required inputMode="tel" placeholder="e.g. 444 1234" className={field} /></label>
          <div>
            <label className="flex h-full items-end gap-3 pb-3 text-ink">
              <input type="checkbox" checked={sameWhatsApp} onChange={(e) => setSameWhatsApp(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--primary))]" />
              Same number on WhatsApp
            </label>
          </div>
          {!sameWhatsApp && (
            <label className="block"><span className={label}>WhatsApp number</span>
              <input name="whatsapp" inputMode="tel" className={field} /></label>
          )}
          {sameWhatsApp && <input type="hidden" name="whatsappSame" value="1" />}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
        <legend className="sr-only">Trips</legend>
        <p className={label}>Which trips can you take?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {KINDS.map(([k, l]) => (
            <label key={k} className="flex items-center gap-3 rounded-xl border border-line px-3 py-3">
              <input type="checkbox" name="kinds" value={k} defaultChecked={k === "taxi"} className="h-5 w-5 accent-[rgb(var(--primary))]" />
              <span className="text-ink">{l}</span>
            </label>
          ))}
        </div>
        <label className="mt-4 block"><span className={label}>Licence and permit numbers</span>
          <input name="licence" required minLength={3} maxLength={500} placeholder="e.g. Licence D12345, taxi permit T678" className={field} /></label>
        <label className="mt-4 block"><span className={label}>Your vehicle or boat</span>
          <input name="vehicles" required minLength={3} maxLength={500} placeholder="e.g. Toyota Noah, 7 seats" className={field} /></label>
        <label className="mt-4 block"><span className={label}>Insurance</span>
          <input name="insurance" required minLength={3} maxLength={500} placeholder="Insurer and type of cover" className={field} /></label>
      </fieldset>

      <section className="rounded-2xl bg-raised p-5 ring-1 ring-line/60" aria-labelledby="docs-h">
        <h2 id="docs-h" className="text-base font-semibold text-ink">Documents</h2>
        <p className="mt-1 text-sm">All three are needed for approval. Take a clear photo of each one. Only Island Connect’s team can see them.</p>
        <ul className="mt-3 space-y-2">
          {DOCS.map(([k, l]) => (
            <li key={k}>
              <input id={`doc-${k}`} type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => upload(k, e.target.files?.[0])} />
              <label htmlFor={`doc-${k}`} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${docs[k] ? "border-success/40 bg-success/10" : "border-dashed border-line"}`}>
                {busy === k ? <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" /> : docs[k] ? <Check className="h-5 w-5 text-success" aria-hidden="true" /> : <FileUp className="h-5 w-5 text-primary" aria-hidden="true" />}
                <span className="min-w-0 flex-1 text-ink">{l}</span>
                <span className="text-sm font-semibold text-link">{docs[k] ? "Replace" : "Add photo"}</span>
              </label>
            </li>
          ))}
        </ul>
        {uploadError && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{uploadError}</p>}
      </section>

      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
      {(() => {
        const missing = DOCS.filter(([k]) => !docs[k]).length;
        return (
          <button disabled={pending || Boolean(busy) || missing > 0} className="h-14 w-full rounded-full bg-primary text-[1.0625rem] font-semibold text-primary-ink disabled:opacity-50">
            {pending ? "Sending…" : missing ? `Add ${missing === 1 ? "the last document" : `${missing} more documents`} to continue` : "Send application"}
          </button>
        );
      })()}
      <p className="text-center text-sm">Free while Island Connect launches. We usually check applications within two working days and email you when you’re approved.</p>
    </form>
  );
}
