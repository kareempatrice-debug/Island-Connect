"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteAccountAction, updatePasswordAction } from "@/app/auth-actions";

const field = "h-12 w-full rounded-xl border border-line bg-raised px-3.5 text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

export function NewPasswordForm() {
  const [state, act, pending] = useActionState(updatePasswordAction, {});
  if (state.message) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl bg-success/10 px-4 py-3 font-medium text-success">{state.message}</p>
        <Link href="/?choose=1" className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-ink">Continue</Link>
      </div>
    );
  }
  return (
    <form action={act} className="space-y-4">
      <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">New password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className={field} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Type it again</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={field} /></label>
      {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
      <button disabled={pending} className="h-12 w-full rounded-full bg-primary font-semibold text-primary-ink disabled:opacity-60">{pending ? "Saving…" : "Save new password"}</button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, act, pending] = useActionState(deleteAccountAction, {});
  return (
    <details className="rounded-2xl border border-danger/30 p-5">
      <summary className="cursor-pointer font-semibold text-danger">Delete my account</summary>
      <form action={act} className="mt-4 space-y-3">
        <p className="text-sm">This permanently deletes your account and your data: your profile, messages, trip requests, saved phone numbers, sign-in devices and any documents you uploaded. Listings you created or that describe you as self-employed are deleted with their photos, if nobody else manages them. Listings that came from public directories go back to unclaimed and are hidden. A record of completed trips, without your details, is kept for Island Connect’s accounts. This can’t be undone.</p>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Type DELETE to confirm</span>
          <input name="confirm" autoComplete="off" className={field} /></label>
        {state.error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
        <button disabled={pending} className="h-12 rounded-full bg-danger px-6 font-semibold text-white disabled:opacity-60">{pending ? "Deleting…" : "Delete my account permanently"}</button>
      </form>
    </details>
  );
}
