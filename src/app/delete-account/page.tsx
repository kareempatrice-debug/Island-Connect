import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/legal-page";

export const metadata: Metadata = { title: "Delete your Island Connect account", description: "How to delete your Island Connect account and data." };

/* Google Play requires a web page where people can ask for their account to be deleted. */
export default function DeleteAccount() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-3xl font-bold">Delete your Island Connect account</h1>
      <p className="mt-4">You can delete your account and your data at any time, from the app or the website.</p>
      <h2 className="mt-8 text-xl font-semibold">In the app</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6">
        <li>Sign in, then open the menu at the top and tap <strong>Your account</strong>.</li>
        <li>Scroll to <strong>Account settings</strong> and tap <strong>Delete my account</strong>.</li>
        <li>Type <strong>DELETE</strong> to confirm. Your account is deleted straight away.</li>
      </ol>
      <p className="mt-4"><Link href="/gd/account" className="font-semibold text-link underline">Go to Your account</Link></p>
      <h2 className="mt-8 text-xl font-semibold">By email</h2>
      <p className="mt-3">If you can’t sign in, email <a href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20account`} className="font-semibold text-link underline">{CONTACT_EMAIL}</a> from the email address on your account, with the subject “Delete my account”. We’ll delete it within 30 days and confirm by email.</p>
      <h2 className="mt-8 text-xl font-semibold">What is deleted, and what is kept</h2>
      <p className="mt-3">Deleting your account erases your profile, sign-in details, messages, trip requests and the phone numbers attached to them, saved family members and trusted contacts, sign-in devices, uploaded documents, and any listing you created or that describes you as self-employed, if nobody else manages it. The only thing kept is the financial record of completed trips (date, fare and the business name, without your details), which we need for our accounts. See our <Link href="/privacy" className="font-semibold text-link underline">privacy policy</Link> for more.</p>
    </main>
  );
}
