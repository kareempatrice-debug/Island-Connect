"use client";

import { useActionState, useState } from "react";
import { addServiceAction, saveHoursAction, updateProfileAction } from "@/app/[country]/dashboard/[slug]/actions";
import type { FormState } from "@/app/auth-actions";
import { btn, input } from "@/components/ui";

const label = "mb-1.5 block text-sm font-semibold text-ink";

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{state.message}</p>;
  return null;
}

function Hidden({ ids }: { ids: { country: string; businessId: string; slug: string } }) {
  return (
    <>
      <input type="hidden" name="country" value={ids.country} />
      <input type="hidden" name="businessId" value={ids.businessId} />
      <input type="hidden" name="slug" value={ids.slug} />
    </>
  );
}

export interface ProfileValues {
  tagline: string; description: string; phone: string; whatsapp: string; email: string; website: string;
  cancellationPolicy: string; contactPreference: string; externalBookingUrl: string; paymentMethods: string[];
}

const PREFS = [
  ["platform", "Enquiries on Island Connect", "Customers message you here; you reply from this dashboard."],
  ["whatsapp", "WhatsApp", "Customers are sent straight to a WhatsApp chat with you."],
  ["phone", "Phone call", "Customers are shown your number to call."],
  ["website", "My website", "Customers are sent to your website."],
  ["external_booking", "My booking page", "Customers book through your existing booking system."],
] as const;

export function ProfileForm({ ids, values }: { ids: { country: string; businessId: string; slug: string }; values: ProfileValues }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  const [pref, setPref] = useState(values.contactPreference);
  return (
    <form action={action} className="space-y-5">
      <Hidden ids={ids} />
      <fieldset>
        <legend className={label}>How should customers reach you?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PREFS.map(([v, t, d]) => (
            <label key={v} className={`flex cursor-pointer gap-3 rounded-xl p-4 ring-1 transition ${pref === v ? "bg-deep/5 ring-2 ring-deep" : "bg-raised ring-line"}`}>
              <input type="radio" name="contactPreference" value={v} checked={pref === v} onChange={() => setPref(v)} className="mt-1 accent-[rgb(var(--primary))]" />
              <span><span className="block font-semibold text-ink">{t}</span><span className="block text-sm">{d}</span></span>
            </label>
          ))}
        </div>
        {pref === "external_booking" && (
          <label className="mt-3 block"><span className={label}>Booking page link</span>
            <input name="externalBookingUrl" type="url" defaultValue={values.externalBookingUrl} placeholder="https://" className={input} /></label>
        )}
        {pref !== "external_booking" && <input type="hidden" name="externalBookingUrl" value={values.externalBookingUrl} />}
      </fieldset>
      <label className="block"><span className={label}>One-line summary</span><input name="tagline" maxLength={160} defaultValue={values.tagline} className={input} /></label>
      <label className="block"><span className={label}>Description</span><textarea name="description" rows={5} maxLength={4000} defaultValue={values.description} className={`${input} h-auto py-3`} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={label}>WhatsApp</span><input name="whatsapp" defaultValue={values.whatsapp} inputMode="tel" className={input} /></label>
        <label className="block"><span className={label}>Phone</span><input name="phone" defaultValue={values.phone} inputMode="tel" className={input} /></label>
        <label className="block"><span className={label}>Email</span><input name="email" type="email" defaultValue={values.email} className={input} /></label>
        <label className="block"><span className={label}>Website</span><input name="website" type="url" defaultValue={values.website} placeholder="https://" className={input} /></label>
      </div>
      <div>
        <p className={label}>Payments you accept</p>
        <div className="flex flex-wrap gap-2">
          {[["cash", "Cash"], ["card", "Card"], ["bank_transfer", "Bank transfer"], ["cheque", "Cheque"], ["mobile_money", "Mobile money"]].map(([v, l]) => (
            <label key={v} className="inline-flex cursor-pointer items-center rounded-full border border-line bg-raised px-3.5 py-2 text-sm text-ink has-[:checked]:border-deep has-[:checked]:bg-deep has-[:checked]:text-white">
              <input type="checkbox" name="paymentMethods" value={v} defaultChecked={values.paymentMethods.includes(v)} className="sr-only" />{l}
            </label>
          ))}
        </div>
      </div>
      <label className="block"><span className={label}>Cancellation policy</span><input name="cancellationPolicy" maxLength={500} defaultValue={values.cancellationPolicy} className={input} /></label>
      <Feedback state={state} />
      <button disabled={pending} className={`${btn.primary} disabled:opacity-60`}>{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

export function AddServiceForm({ ids }: { ids: { country: string; businessId: string; slug: string } }) {
  const [state, action, pending] = useActionState(addServiceAction, {});
  return (
    <form action={action} className="grid gap-3 rounded-2xl bg-sunken/60 p-4 sm:grid-cols-6">
      <Hidden ids={ids} />
      <label className="sm:col-span-3"><span className={label}>Service</span><input name="name" required className={input} /></label>
      <label className="sm:col-span-3"><span className={label}>Short description</span><input name="description" className={input} /></label>
      <label className="sm:col-span-1"><span className={label}>From EC$</span><input name="priceMin" inputMode="decimal" className={input} /></label>
      <label className="sm:col-span-1"><span className={label}>To EC$</span><input name="priceMax" inputMode="decimal" className={input} /></label>
      <label className="sm:col-span-2"><span className={label}>Per</span><input name="priceUnit" placeholder="e.g. hour, person, trip" className={input} /></label>
      <label className="sm:col-span-2"><span className={label}>Minutes</span><input name="duration" inputMode="numeric" className={input} /></label>
      <div className="flex flex-col gap-2 sm:col-span-6 sm:flex-row sm:items-center">
        <button disabled={pending} className={`${btn.primary} disabled:opacity-60`}>{pending ? "Adding…" : "Add service"}</button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function HoursForm({ ids, hours }: { ids: { country: string; businessId: string; slug: string }; hours: { weekday: number; opens: string; closes: string }[] }) {
  const [state, action, pending] = useActionState(saveHoursAction, {});
  return (
    <form action={action} className="space-y-2">
      <Hidden ids={ids} />
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const h = hours.find((x) => x.weekday === d);
        return (
          <div key={d} className="grid grid-cols-[6.5rem_1fr_1fr_auto] items-center gap-2 rounded-xl bg-raised p-2 ring-1 ring-line/60">
            <span className="pl-2 font-medium text-ink">{DAYS[d]}</span>
            <input type="time" name={`opens-${d}`} defaultValue={h?.opens ?? "08:00"} aria-label={`${DAYS[d]} opens`} className={`${input} h-10`} />
            <input type="time" name={`closes-${d}`} defaultValue={h?.closes ?? "17:00"} aria-label={`${DAYS[d]} closes`} className={`${input} h-10`} />
            <label className="flex items-center gap-1.5 pr-2 text-sm"><input type="checkbox" name={`closed-${d}`} defaultChecked={!h} className="accent-[rgb(var(--primary))]" />Closed</label>
          </div>
        );
      })}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
        <button disabled={pending} className={`${btn.primary} disabled:opacity-60`}>{pending ? "Saving…" : "Save hours"}</button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
