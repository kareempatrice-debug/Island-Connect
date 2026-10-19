"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/auth-actions";

type Mode = "sign-in" | "sign-up" | "link";
type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export interface AuthActions {
  signIn: Action;
  signUp: Action;
  emailLink: Action;
}

/* Without a database (demo and preview), forms explain instead of submitting. */
const demoAction: Action = async () => ({
  message: "Preview only: accounts work once the live database is connected.",
});

const ROLES = [
  { id: "customer", label: "Find services", cta: "Create account", note: "Free. Save places, message businesses and request rides." },
  { id: "business", label: "List my business or services", cta: "Create account and add my listing", note: "Free for businesses and self-employed people. We review each listing before it goes live." },
  { id: "operator", label: "Drive or haul", cta: "Create account and apply to operate", note: "Taxi, boat and freight operators send licence and vehicle details for approval." },
] as const;

const field =
  "h-12 w-full rounded-xl border border-line bg-raised px-4 text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";
const primary =
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 font-semibold text-primary-ink transition hover:brightness-110 disabled:opacity-60";
const label = "mb-1.5 block text-sm font-semibold text-ink";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{state.message}</p>;
  return null;
}

export function AuthForm({
  next,
  country,
  initial = "sign-up",
  initialRole = "customer",
  actions,
}: {
  next: string;
  country: string;
  initial?: Mode;
  initialRole?: string;
  actions?: AuthActions;
}) {
  const [mode, setMode] = useState<Mode>(initial);
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>(
    ROLES.some((r) => r.id === initialRole) ? (initialRole as (typeof ROLES)[number]["id"]) : "customer",
  );
  const [inState, signIn, signingIn] = useActionState(actions?.signIn ?? demoAction, {});
  const [upState, signUp, signingUp] = useActionState(actions?.signUp ?? demoAction, {});
  const [linkState, sendLink, sending] = useActionState(actions?.emailLink ?? demoAction, {});
  const current = ROLES.find((r) => r.id === role)!;
  const signInTab = mode === "sign-in" || mode === "link";

  return (
    <div>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-sunken p-1" role="tablist" aria-label="Account">
        <button type="button" role="tab" aria-selected={mode === "sign-up"} onClick={() => setMode("sign-up")}
          className={`h-11 rounded-full text-[0.95rem] font-semibold transition ${mode === "sign-up" ? "bg-raised text-ink shadow-sm" : "text-muted"}`}>
          Join free
        </button>
        <button type="button" role="tab" aria-selected={signInTab} onClick={() => setMode("sign-in")}
          className={`h-11 rounded-full text-[0.95rem] font-semibold transition ${signInTab ? "bg-raised text-ink shadow-sm" : "text-muted"}`}>
          Sign in
        </button>
      </div>

      {mode === "sign-up" && (
        <form action={signUp} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="role" value={role} />
          <fieldset>
            <legend className={label}>I’m joining to</legend>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button key={r.id} type="button" aria-pressed={role === r.id} onClick={() => setRole(r.id)}
                  className={`min-h-14 rounded-2xl px-2 py-2 text-sm font-semibold leading-tight transition ${role === r.id ? "border-2 border-primary bg-primary/10 text-ink" : "border border-line bg-raised text-ink"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block"><span className={label}>Your name</span><input name="name" autoComplete="name" required className={field} /></label>
          <label className="block"><span className={label}>Email</span><input name="email" type="email" autoComplete="email" required className={field} /></label>
          <label className="block"><span className={label}>Password</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
            <span className="mt-1 block text-xs">At least 8 characters.</span></label>
          <Status state={upState} />
          <button disabled={signingUp} className={primary}>{signingUp ? "Creating account…" : current.cta}</button>
          <p className="text-center text-sm">{current.note}</p>
          <p className="text-center text-xs">
            By creating an account you agree to the <Link href="/terms" className="font-semibold text-link underline">terms of use</Link> and{" "}
            <Link href="/privacy" className="font-semibold text-link underline">privacy policy</Link>.
          </p>
        </form>
      )}

      {mode === "sign-in" && (
        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className={label}>Email</span><input name="email" type="email" autoComplete="email" required className={field} /></label>
          <label className="block"><span className={label}>Password</span><input name="password" type="password" autoComplete="current-password" required className={field} /></label>
          <Status state={inState} />
          <button disabled={signingIn} className={primary}>{signingIn ? "Signing in…" : "Sign in"}</button>
          <button type="button" onClick={() => setMode("link")} className="w-full text-center text-sm font-semibold text-link hover:underline">
            Email me a sign-in link instead
          </button>
        </form>
      )}

      {mode === "link" && (
        <form action={sendLink} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className={label}>Email</span><input name="email" type="email" autoComplete="email" required className={field} /></label>
          <Status state={linkState} />
          <button disabled={sending} className={primary}>{sending ? "Sending…" : "Send sign-in link"}</button>
          <button type="button" onClick={() => setMode("sign-in")} className="w-full text-center text-sm font-semibold text-link hover:underline">
            Use my password
          </button>
        </form>
      )}
    </div>
  );
}
