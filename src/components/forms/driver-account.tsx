"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createDriverAccountAction } from "@/app/trip-actions";

const field = "h-12 w-full rounded-xl border border-line bg-raised px-3.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

/* Step 1 of 2: a driver's account, created and signed in on the spot. */
export function DriverAccount({ country }: { country: string }) {
  const [state, act, pending] = useActionState(createDriverAccountAction, {});
  const here = `/${country}/ride/operate/apply`;
  return (
    <form action={act} className="space-y-4 rounded-2xl bg-raised p-5 ring-1 ring-line/60">
      <input type="hidden" name="country" value={country} />
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Step 1 of 2</p>
      <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Your name</span><input name="name" autoComplete="name" required className={field} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Email</span><input name="email" type="email" autoComplete="email" required className={field} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Choose a password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
        <span className="mt-1 block text-xs">At least 8 characters. You’ll use this to sign in.</span></label>
      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
      {state.message && <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{state.message}</p>}
      <button disabled={pending} className="h-14 w-full rounded-full bg-primary text-[1.0625rem] font-semibold text-primary-ink disabled:opacity-60">{pending ? "Creating your account…" : "Continue"}</button>
      <p className="text-center text-sm">
        <Link href={`/join?mode=sign-in&next=${encodeURIComponent(here)}`} className="font-semibold text-link underline">I already have an account</Link>
      </p>
    </form>
  );
}
