"use client";

import { useActionState, useState } from "react";
import { addListingAction } from "@/app/admin/actions";

const field = "h-11 w-full rounded-lg border border-line bg-raised px-3 text-ink focus:border-primary focus:outline-none";
const label = "mb-1 block text-sm font-semibold text-ink";

interface Props {
  country: string;
  categories: { slug: string; name: string; group: string }[];
  islands: { slug: string; name: string }[];
  districts: { slug: string; name: string; islandSlug: string | null }[];
  today: string;
}

export function AdminListingForm({ country, categories, islands, districts, today }: Props) {
  const [state, action, pending] = useActionState(addListingAction, {});
  const [island, setIsland] = useState(islands[0]?.slug ?? "");
  const groups = [...new Set(categories.map((c) => c.group))];
  return (
    <form action={action} className="mt-6 grid gap-5 lg:grid-cols-2">
      <input type="hidden" name="country" value={country} />
      <div className="space-y-4 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
        <h2 className="text-lg font-semibold">Business</h2>
        <label className="block"><span className={label}>Name</span><input name="name" required className={field} /></label>
        <label className="block"><span className={label}>Categories (hold Ctrl or Cmd for up to three)</span>
          <select name="categories" multiple required size={8} className={`${field} h-auto py-2`}>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {categories.filter((c) => c.group === g).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </optgroup>
            ))}
          </select></label>
        <label className="block"><span className={label}>One-line summary</span><input name="tagline" maxLength={160} className={field} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={label}>Island</span>
            <select name="island" value={island} onChange={(e) => setIsland(e.target.value)} className={field}>
              {islands.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
            </select></label>
          <label className="block"><span className={label}>Parish</span>
            <select name="district" className={field}><option value="">Unknown</option>
              {districts.filter((d) => !d.islandSlug || d.islandSlug === island).map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select></label>
        </div>
        <label className="block"><span className={label}>Landmark or address</span><input name="landmark" className={field} /></label>
      </div>
      <div className="space-y-4">
        <div className="space-y-4 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
          <h2 className="text-lg font-semibold">Public contact details</h2>
          <p className="text-sm">Only details the business itself publishes. Never a personal number found elsewhere.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className={label}>Phone</span><input name="phone" className={field} /></label>
            <label className="block"><span className={label}>WhatsApp</span><input name="whatsapp" className={field} /></label>
            <label className="block"><span className={label}>Email</span><input name="email" type="email" className={field} /></label>
            <label className="block"><span className={label}>Website</span><input name="website" placeholder="https://" className={field} /></label>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl bg-gold/15 p-5 ring-1 ring-gold/40">
          <h2 className="text-lg font-semibold">Source (required)</h2>
          <p className="text-sm">Link to where you confirmed these facts: the business’s own website or social page, or an official directory. Discovery sites such as Google or TripAdvisor are leads, not sources; never copy their reviews, ratings or photos.</p>
          <label className="block"><span className={label}>Source link</span><input name="sourceUrl" type="url" required placeholder="https://" className={field} /></label>
          <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
            <label className="block"><span className={label}>Note</span><input name="sourceNote" placeholder="e.g. Facebook page, confirmed by phone" className={field} /></label>
            <label className="block"><span className={label}>Date checked</span><input name="sourceCheckedAt" type="date" defaultValue={today} required className={field} /></label>
          </div>
        </div>
        {state.error && <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 font-medium text-danger">{state.error}</p>}
        <button disabled={pending} className="h-12 w-full rounded-lg bg-primary font-semibold text-primary-ink disabled:opacity-60">{pending ? "Adding…" : "Publish as unclaimed listing"}</button>
      </div>
    </form>
  );
}
