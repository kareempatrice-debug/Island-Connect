import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { emailLinkAction, requestPasswordResetAction, signInAction, signUpAction } from "@/app/auth-actions";
import { AuthForm } from "@/components/forms/auth-form";
import { getViewer, safeNext } from "@/lib/auth";
import { getCountries, isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Join or sign in", robots: { index: false } };

export default async function Join({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string; as?: string }> }) {
  const [sp, jar, countries] = await Promise.all([searchParams, cookies(), getCountries()]);
  const remembered = jar.get("ic_country")?.value;
  const country = countries.some((c) => c.code === remembered) ? remembered! : countries[0].code;
  // After signing in, go to the welcome page, or straight to a saved favourite country.
  const favourite = jar.get("ic_home")?.value;
  const next = safeNext(sp.next, countries.some((c) => c.code === favourite) ? `/${favourite}` : "/?choose=1");
  if (await getViewer()) redirect(next);

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/?choose=1" aria-label="Island Connect home">
            <Image src="/brand/ic-lockup.png" alt="Island Connect" width={150} height={100} className="h-auto w-28" priority />
          </Link>
          <Link href="/?choose=1" className="text-sm font-semibold text-link hover:underline">Back</Link>
        </div>
        <h1 className="mt-8 text-4xl font-bold leading-tight">{sp.mode === "sign-in" ? "Welcome back" : "Join Island Connect"}</h1>
        <p className="mt-2">One free account for St Vincent and the Grenadines and Grenada.</p>
        {sp.error === "link" && <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">That link has expired or was already used. Request a new one.</p>}
        <div className="mt-8 rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60 sm:p-6">
          <AuthForm
            next={next}
            country={country}
            initial={sp.mode === "sign-in" ? "sign-in" : sp.mode === "reset" ? "reset" : "sign-up"}
            initialRole={sp.as}
            actions={isSupabaseConfigured ? { signIn: signInAction, signUp: signUpAction, emailLink: emailLinkAction, reset: requestPasswordResetAction } : undefined}
          />
        </div>
      </div>
    </main>
  );
}
