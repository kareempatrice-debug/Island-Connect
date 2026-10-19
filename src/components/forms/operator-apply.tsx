"use client";

import { useActionState } from "react";
import { applyOperatorAction } from "@/app/trip-actions";

const KINDS = [
  ["taxi", "Taxi"], ["airport", "Airport transfers"], ["group", "Minivan and groups"],
  ["boat", "Boat and water taxi"], ["haulage", "Trucking and haulage"], ["freight", "Freight between islands"],
] as const;
const field = "w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

export function OperatorApply({ ids, current }: { ids: { businessId: string; country: string; slug: string }; current?: { kinds: string[]; licence: string; vehicles: string; insurance: string } }) {
  const [state, act, pending] = useActionState(applyOperatorAction, {});
  return (
    <form action={act} className="space-y-4 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
      <input type="hidden" name="businessId" value={ids.businessId} />
      <input type="hidden" name="country" value={ids.country} />
      <input type="hidden" name="slug" value={ids.slug} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Which trips can you take?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {KINDS.map(([k, l]) => (
            <label key={k} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <input type="checkbox" name="kinds" value={k} defaultChecked={current?.kinds.includes(k)} className="h-5 w-5 accent-[rgb(var(--primary))]" />
              <span className="text-ink">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block"><span className="mb-1 block text-sm font-semibold text-ink">Licence or permit</span>
        <textarea name="licence" rows={2} required defaultValue={current?.licence} placeholder="e.g. Taxi licence number and issuing authority; boat or haulage permit" className={field} /></label>
      <label className="block"><span className="mb-1 block text-sm font-semibold text-ink">Vehicles or vessels</span>
        <textarea name="vehicles" rows={2} required defaultValue={current?.vehicles} placeholder="e.g. Toyota Noah, 7 seats, registration H1234; 26 ft pirogue, 12 passengers" className={field} /></label>
      <label className="block"><span className="mb-1 block text-sm font-semibold text-ink">Insurance (optional)</span>
        <textarea name="insurance" rows={2} defaultValue={current?.insurance} placeholder="Insurer and policy type" className={field} /></label>
      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
      {state.message && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{state.message}</p>}
      <button disabled={pending} className="h-12 rounded-full bg-primary px-6 font-semibold text-primary-ink disabled:opacity-60">{pending ? "Sending…" : current ? "Update application" : "Apply to take requests"}</button>
      <p className="text-xs">We check these details before approving. You may be asked for copies of your licence and insurance.</p>
    </form>
  );
}
