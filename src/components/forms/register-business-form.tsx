"use client";

import { useActionState, useState } from "react";
import { registerBusinessAction } from "@/app/[country]/for-business/register/actions";
import { btn, input } from "@/components/ui";

interface Props {
  country: { code: string; name: string; districtLabel: string };
  groups: { slug: string; name: string; children: { slug: string; name: string }[] }[];
  islands: { slug: string; name: string }[];
  districts: { slug: string; name: string; islandSlug: string | null }[];
}

const PAYMENTS = [
  ["cash", "Cash"],
  ["card", "Card"],
  ["bank_transfer", "Bank transfer"],
  ["cheque", "Cheque"],
  ["mobile_money", "Mobile money"],
] as const;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60 sm:p-7">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-sm font-semibold text-white">{n}</span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </fieldset>
  );
}

const label = "mb-1.5 block text-sm font-semibold text-ink";

export function RegisterBusinessForm({ country, groups, islands, districts }: Props) {
  const [state, action, pending] = useActionState(registerBusinessAction, {});
  const [chosen, setChosen] = useState<string[]>([]);
  const [island, setIsland] = useState(islands[0]?.slug ?? "");
  const toggle = (slug: string) =>
    setChosen((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : c.length < 3 ? [...c, slug] : c));
  const islandDistricts = districts.filter((d) => !d.islandSlug || d.islandSlug === island);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="country" value={country.code} />

      <Step n={1} title="Your business">
        <label className="block"><span className={label}>Business name</span>
          <input name="name" required maxLength={120} className={input} /></label>
        <div>
          <p className={label}>What do you do? <span className="font-normal text-muted">Choose up to three ({chosen.length}/3)</span></p>
          <div className="space-y-2">
            {groups.map((g) => (
              <details key={g.slug} className="rounded-xl bg-sunken/70 px-4 py-1" open={g.children.some((c) => chosen.includes(c.slug))}>
                <summary className="cursor-pointer py-2.5 font-medium text-ink">{g.name}</summary>
                <div className="flex flex-wrap gap-2 pb-3">
                  {g.children.map((c) => {
                    const on = chosen.includes(c.slug);
                    return (
                      <label key={c.slug} className={`inline-flex cursor-pointer items-center rounded-full border px-3.5 py-2 text-sm transition ${on ? "border-deep bg-deep text-white" : "border-line bg-raised text-ink"} ${!on && chosen.length >= 3 ? "opacity-40" : ""}`}>
                        <input type="checkbox" name="categories" value={c.slug} checked={on} onChange={() => toggle(c.slug)} disabled={!on && chosen.length >= 3} className="sr-only" />
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Step>

      <Step n={2} title="Where you are">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className={label}>Island</span>
            <select name="island" value={island} onChange={(e) => setIsland(e.target.value)} className={input}>
              {islands.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
            </select></label>
          <label className="block"><span className={label}>{country.districtLabel}</span>
            <select name="district" className={input}>
              <option value="">Not sure</option>
              {islandDistricts.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select></label>
        </div>
        <label className="block"><span className={label}>How do customers find you?</span>
          <input name="landmark" maxLength={160} placeholder="e.g. Opposite the fish market, blue building" className={input} /></label>
      </Step>

      <Step n={3} title="How customers reach you">
        <p className="text-sm">Add at least one. Local numbers are fine; we add the area code.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className={label}>WhatsApp</span><input name="whatsapp" inputMode="tel" autoComplete="tel" className={input} /></label>
          <label className="block"><span className={label}>Phone</span><input name="phone" inputMode="tel" className={input} /></label>
          <label className="block"><span className={label}>Email</span><input name="email" type="email" className={input} /></label>
          <label className="block"><span className={label}>Website</span><input name="website" type="url" placeholder="https://" className={input} /></label>
        </div>
      </Step>

      <Step n={4} title="About your business">
        <label className="block"><span className={label}>One-line summary</span>
          <input name="tagline" maxLength={160} placeholder="e.g. Domestic and commercial wiring and repairs" className={input} /></label>
        <label className="block"><span className={label}>Description</span>
          <textarea name="description" maxLength={4000} rows={5} className={`${input} h-auto py-3`} placeholder="What you offer, your experience, areas you cover." /></label>
        <div>
          <p className={label}>Payments you accept</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENTS.map(([v, l]) => (
              <label key={v} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-raised px-3.5 py-2 text-sm text-ink has-[:checked]:border-deep has-[:checked]:bg-deep has-[:checked]:text-white">
                <input type="checkbox" name="paymentMethods" value={v} className="sr-only" />{l}
              </label>
            ))}
          </div>
        </div>
      </Step>

      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 font-medium text-danger">{state.error}</p>}
      <p className="text-sm">
        We review every new listing before it appears, usually within two working days. You can add services, prices and hours once it’s approved.
      </p>
      <button disabled={pending || chosen.length === 0} className={`${btn.primary} w-full disabled:opacity-50 sm:w-auto`}>
        {pending ? "Sending…" : "Submit for review"}
      </button>
    </form>
  );
}
