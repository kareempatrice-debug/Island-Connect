import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NewPasswordForm } from "@/components/forms/account-forms";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPassword() {
  const viewer = await getViewer();
  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <Link href="/?choose=1" aria-label="Island Connect home">
          <Image src="/brand/ic-lockup.png" alt="Island Connect" width={150} height={100} className="h-auto w-28" priority />
        </Link>
        <h1 className="mt-8 text-4xl font-bold leading-tight">Choose a new password</h1>
        <div className="mt-8 rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60 sm:p-6">
          {viewer ? <NewPasswordForm /> : (
            <p>This link has expired or was already used. <Link href="/join?mode=reset" className="font-semibold text-link underline">Ask for a new one</Link>.</p>
          )}
        </div>
      </div>
    </main>
  );
}
