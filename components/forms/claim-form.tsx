"use client";

import { useActionState } from "react";
import { claimListingAction } from "@/app/[country]/business/[slug]/claim/actions";
import { btn, input } from "@/components/ui";

const label = "mb-1.5 block text-sm font-semibold text-ink";

export function ClaimForm({ country, businessId, slug, defaultName }: { country: string; businessId: string; slug: string; defaultName: string }) {
  const [state, action, pending] = useActionState(claimListingAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="block"><span className={label}>Your name</span><input name="claimantName" defaultValue={defaultName} required className={input} /></label>
      <label className="block"><span className={label}>Your role</span><input name="role" required placeholder="e.g. Owner, Manager" className={input} /></label>
      <label className="block"><span className={label}>Phone we can call to confirm</span><input name="phone" inputMode="tel" className={input} /></label>
      <label className="block"><span className={label}>How can we confirm it’s your business?</span>
        <textarea name="evidence" required rows={4} className={`${input} h-auto py-3`}
          placeholder="e.g. Call the number on the listing and ask for me; my email uses the business website domain; I can send a trade licence." /></label>
      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 font-medium text-danger">{state.error}</p>}
      <button disabled={pending} className={`${btn.primary} w-full disabled:opacity-60`}>{pending ? "Sending…" : "Submit claim"}</button>
    </form>
  );
}
