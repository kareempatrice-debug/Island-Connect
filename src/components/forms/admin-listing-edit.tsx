"use client";

import { useActionState } from "react";
import { deleteListingAction, editListingAction } from "@/app/admin/actions";
import type { FormState } from "@/app/auth-actions";

const field = "h-11 w-full rounded-lg border border-line bg-raised px-3 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";
const label = "mb-1 block text-sm font-semibold text-ink";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">{state.message}</p>;
  return null;
}

export interface EditableListing {
  id: string; country: string; name: string; tagline: string; description: string; landmark: string;
  phone: string; whatsapp: string; email: string; website: string;
}

export function AdminListingEdit({ listing }: { listing: EditableListing }) {
  const [state, save, saving] = useActionState(editListingAction, {});
  const [delState, remove, removing] = useActionState(deleteListingAction, {});
  return (
    <div className="space-y-8">
      <form action={save} className="space-y-4 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
        <input type="hidden" name="id" value={listing.id} />
        <input type="hidden" name="country" value={listing.country} />
        <label className="block"><span className={label}>Business name</span><input name="name" defaultValue={listing.name} required className={field} /></label>
        <label className="block"><span className={label}>Short description (one line)</span><input name="tagline" defaultValue={listing.tagline} maxLength={160} className={field} /></label>
        <label className="block"><span className={label}>About the business</span>
          <textarea name="description" defaultValue={listing.description} rows={5} maxLength={4000} className={`${field} h-auto py-2`} /></label>
        <label className="block"><span className={label}>Location or directions</span><input name="landmark" defaultValue={listing.landmark} maxLength={160} className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className={label}>Phone</span><input name="phone" defaultValue={listing.phone} inputMode="tel" className={field} /></label>
          <label className="block"><span className={label}>WhatsApp</span><input name="whatsapp" defaultValue={listing.whatsapp} inputMode="tel" className={field} /></label>
          <label className="block"><span className={label}>Email</span><input name="email" type="email" defaultValue={listing.email} className={field} /></label>
          <label className="block"><span className={label}>Website</span><input name="website" type="url" defaultValue={listing.website} placeholder="https://" className={field} /></label>
        </div>
        <p className="text-xs">Leave a box empty to remove that detail. Seven-digit numbers get the country code added.</p>
        <Status state={state} />
        <button disabled={saving} className="h-11 rounded-lg bg-primary px-5 font-semibold text-primary-ink disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
      </form>

      <form action={remove} className="space-y-3 rounded-2xl border border-danger/30 p-5">
        <input type="hidden" name="id" value={listing.id} />
        <h2 className="text-lg font-semibold text-ink">Delete this listing</h2>
        <p className="text-sm">Permanent. Use this when a business asks to be removed or doesn’t exist. If customers have messaged it, hide it instead.</p>
        <label className="block"><span className={label}>Reason (kept in the audit log)</span><input name="reason" maxLength={300} className={field} placeholder="e.g. Owner asked to be removed" /></label>
        <label className="block"><span className={label}>Type DELETE to confirm</span><input name="confirm" autoComplete="off" className={field} /></label>
        <Status state={delState} />
        <button disabled={removing} className="h-11 rounded-lg bg-danger px-5 font-semibold text-white disabled:opacity-60">{removing ? "Deleting…" : "Delete permanently"}</button>
      </form>
    </div>
  );
}
