"use client";

import { useActionState, useState } from "react";
import { emailLinkAction, signInAction, signUpAction, type FormState } from "@/app/auth-actions";
import { btn, input } from "@/components/ui";

type Mode = "sign-in" | "sign-up" | "link";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{state.message}</p>;
  return null;
}

export function AuthForm({ next, initial = "sign-in" }: { next: string; initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [inState, signIn, signingIn] = useActionState(signInAction, {});
  const [upState, signUp, signingUp] = useActionState(signUpAction, {});
  const [linkState, sendLink, sending] = useActionState(emailLinkAction, {});

  return (
    <div>
      <div className="flex gap-1 rounded-full bg-sunken p-1" role="tablist" aria-label="Account">
        {(["sign-in", "sign-up"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m || (m === "sign-in" && mode === "link")} onClick={() => setMode(m)}
            className={`h-11 flex-1 rounded-full text-sm font-semibold transition ${mode === m || (m === "sign-in" && mode === "link") ? "bg-raised text-ink shadow-sm" : "text-muted"}`}>
            {m === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "sign-in" && (
        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" autoComplete="email" required className={input} /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Password</span>
            <input name="password" type="password" autoComplete="current-password" required className={input} /></label>
          <Status state={inState} />
          <button disabled={signingIn} className={`${btn.primary} w-full disabled:opacity-60`}>{signingIn ? "Signing in…" : "Sign in"}</button>
          <button type="button" onClick={() => setMode("link")} className="w-full text-center text-sm font-semibold text-link hover:underline">
            Email me a sign-in link instead
          </button>
        </form>
      )}

      {mode === "link" && (
        <form action={sendLink} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" autoComplete="email" required className={input} /></label>
          <Status state={linkState} />
          <button disabled={sending} className={`${btn.primary} w-full disabled:opacity-60`}>{sending ? "Sending…" : "Send sign-in link"}</button>
          <button type="button" onClick={() => setMode("sign-in")} className="w-full text-center text-sm font-semibold text-link hover:underline">
            Use my password
          </button>
        </form>
      )}

      {mode === "sign-up" && (
        <form action={signUp} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Your name</span>
            <input name="name" autoComplete="name" required className={input} /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" autoComplete="email" required className={input} /></label>
          <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink">Password</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className={input} />
            <span className="mt-1 block text-xs">At least 8 characters.</span></label>
          <Status state={upState} />
          <button disabled={signingUp} className={`${btn.primary} w-full disabled:opacity-60`}>{signingUp ? "Creating account…" : "Create account"}</button>
        </form>
      )}
    </div>
  );
}
