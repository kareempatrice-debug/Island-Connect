"use client";

import { Check, FileUp, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { applyAsDriverAction } from "@/app/trip-actions";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { DOC_LABELS, requiredDocs } from "@/lib/operator-docs";

const KINDS = [
  ["taxi", "Taxi"], ["airport", "Airport transfers"], ["group", "Minivan and groups"],
  ["boat", "Boat and water taxi"], ["haulage", "Trucking and haulage"],
] as const;
// Which documents are needed depends on the work chosen (see src/lib/operator-docs.ts).

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
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const [kinds, setKinds] = useState<string[]>(["taxi"]);
  const needed = requiredDocs(kinds);
  const passenger = kinds.some((k) => ["taxi", "airport", "group"].includes(k));
  const goods = kinds.includes("haulage");
  const today = new Date().toISOString().slice(0, 10);
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
      <input type="hidden" name="docs" value={JSON.stringify(needed.filter((k) => docs[k]).map((k) => ({ type: k, path: docs[k], expires_on: expiry[k] ?? "" })))} />

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
              <input type="checkbox" name="kinds" value={k} checked={kinds.includes(k)}
                onChange={(e) => setKinds((cur) => (e.target.checked ? [...cur, k] : cur.filter((x) => x !== k)))} className="h-5 w-5 accent-[rgb(var(--primary))]" />
              <span className="text-ink">{l}</span>
            </label>
          ))}
        </div>
        {passenger && (
          <div className="mt-4 rounded-xl bg-gold/15 p-4 text-sm text-ink">
            <p><strong>Passenger rides are only for licensed hire vehicles.</strong> In SVG and Grenada, anyone carrying paying passengers needs an H (hire) plate, a taxi or PSV driving permit, insurance that covers passengers for hire, and a tourism authority taxi licence. Private cars can’t be used. If you don’t have these yet, you can still join for freight or deliveries.</p>
            <label className="mt-3 flex items-start gap-3">
              <input type="checkbox" name="confirmPassenger" required className="mt-0.5 h-5 w-5 accent-[rgb(var(--primary))]" />
              <span>I am 19 or older, and my vehicle and I hold all of the above</span>
            </label>
          </div>
        )}
        {goods && (
          <label className="mt-4 flex items-start gap-3 rounded-xl bg-sunken p-4 text-sm text-ink">
            <input type="checkbox" name="confirmGoods" required className="mt-0.5 h-5 w-5 accent-[rgb(var(--primary))]" />
            <span>For freight: I am 21 or older with at least 12 months of regular driving, and my vehicle is licensed for its weight (over 5 tons needs a special permit)</span>
          </label>
        )}
        <label className="mt-4 block"><span className={label}>{passenger ? "Taxi or PSV permit number" : "Licence or permit numbers"}</span>
          <input name="licence" required minLength={3} maxLength={500} placeholder={passenger ? "e.g. PSV permit T678" : "e.g. Goods licence G123"} className={field} /></label>
        <label className="mt-4 block"><span className={label}>Your vehicle or boat</span>
          <input name="vehicles" required minLength={3} maxLength={500} placeholder={passenger ? "e.g. Toyota Noah, 7 seats, plate H1234" : "e.g. Isuzu truck, 3 tons"} className={field} /></label>
        <label className="mt-4 block"><span className={label}>Insurance</span>
          <input name="insurance" required minLength={3} maxLength={500} placeholder={passenger ? "Insurer and policy number (hire and reward)" : "Insurer and policy number"} className={field} /></label>
      </fieldset>

      <section className="rounded-2xl bg-raised p-5 ring-1 ring-line/60" aria-labelledby="docs-h">
        <h2 id="docs-h" className="text-base font-semibold text-ink">Documents</h2>
        <p className="mt-1 text-sm">Take a clear photo of each one and add its expiry date. Only Island Connect’s team can see them. We’ll remind you before any of them expire.</p>
        <ul className="mt-3 space-y-3">
          {needed.map((k) => (
            <li key={k} className="rounded-xl border border-line p-3">
              <input id={`doc-${k}`} type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => upload(k, e.target.files?.[0])} />
              <label htmlFor={`doc-${k}`} className="flex cursor-pointer items-start gap-3">
                {busy === k ? <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" aria-hidden="true" /> : docs[k] ? <Check className="mt-0.5 h-5 w-5 text-success" aria-hidden="true" /> : <FileUp className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />}
                <span className="min-w-0 flex-1"><span className="block font-semibold text-ink">{DOC_LABELS[k].title}</span><span className="block text-xs">{DOC_LABELS[k].hint}</span></span>
                <span className="text-sm font-semibold text-link">{docs[k] ? "Replace" : "Add photo"}</span>
              </label>
              <label className="mt-2 flex items-center gap-2 pl-8 text-sm">
                <span className="shrink-0">Expires on</span>
                <input type="date" min={today} value={expiry[k] ?? ""} onChange={(e) => setExpiry((x) => ({ ...x, [k]: e.target.value }))}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-raised px-2 text-ink" aria-label={`${DOC_LABELS[k].title} expiry date`} />
              </label>
            </li>
          ))}
        </ul>
        {uploadError && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{uploadError}</p>}
      </section>

      <label className="flex items-start gap-3 rounded-2xl bg-raised p-4 ring-1 ring-line/60">
        <input type="checkbox" name="whatsappAlerts" defaultChecked className="mt-1 h-5 w-5 accent-[rgb(var(--primary))]" />
        <span className="text-sm"><strong className="text-ink">Send me new trip requests on WhatsApp.</strong> You can turn this off any time in your Trips tab.</span>
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
      {(() => {
        const missing = needed.filter((k) => !docs[k] || !expiry[k]).length;
        return (
          <button disabled={pending || Boolean(busy) || missing > 0} className="h-14 w-full rounded-full bg-primary text-[1.0625rem] font-semibold text-primary-ink disabled:opacity-50">
            {pending ? "Sending…" : missing ? `Add ${missing === 1 ? "the last document" : `${missing} more documents`} with expiry dates to continue` : "Send application"}
          </button>
        );
      })()}
      <p className="text-center text-sm">Free while Island Connect launches. We usually check applications within two working days and email you when you’re approved.</p>
    </form>
  );
}
