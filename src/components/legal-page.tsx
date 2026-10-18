import Link from "next/link";

export const LEGAL_UPDATED = "19 October 2026";
export const CONTACT_EMAIL = "hello@islandconnect.cc";

/* Shared frame for the privacy policy, terms and contact pages. */
export function LegalPage({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Link href="/?choose=1" className="text-sm font-semibold text-link hover:underline">Island Connect</Link>
      <h1 className="mt-3 text-4xl font-semibold leading-tight">{title}</h1>
      <p className="mt-2 text-sm">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-6 text-lg leading-relaxed">{intro}</div>
      <div className="legal mt-8 space-y-8 leading-relaxed [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:font-semibold [&_a]:text-link [&_a]:underline">
        {children}
      </div>
      <nav aria-label="Legal" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm font-semibold">
        <Link href="/privacy" className="text-link hover:underline">Privacy policy</Link>
        <Link href="/terms" className="text-link hover:underline">Terms of use</Link>
        <Link href="/contact" className="text-link hover:underline">Contact</Link>
        <Link href="/credits" className="text-link hover:underline">Photo credits</Link>
      </nav>
    </main>
  );
}
