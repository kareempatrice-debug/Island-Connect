import type { Metadata } from "next";
import Link from "next/link";
import { NeedsDatabase } from "@/components/demo-notice";
import { DriverSignup } from "@/components/forms/driver-signup";
import { Container, btn } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { data, isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Apply to drive or operate", robots: { index: false } };

export default async function Apply({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Driver applications" /></Container>;
  const [viewer, islands] = await Promise.all([getViewer(), data.getIslands(country)]);
  const here = `/${country}/ride/operate/apply`;
  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <Link href={`/${country}/ride/operate`} className="text-sm font-semibold text-link hover:underline">Drive with Island Connect</Link>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Apply to drive or operate</h1>
      <p className="mt-2">One form, about five minutes. Have your licence and vehicle details ready.</p>
      {viewer ? (
        <div className="mt-8"><DriverSignup country={country} islands={islands.map((i) => ({ slug: i.slug, name: i.name }))} defaultName={viewer.name ?? ""} /></div>
      ) : (
        <div className="mt-8 rounded-2xl bg-raised p-6 ring-1 ring-line/60">
          <p className="font-semibold text-ink">First, create your free account</p>
          <p className="mt-1">It takes a minute. You’ll come straight back here to finish.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/join?as=operator&next=${encodeURIComponent(here)}`} className={btn.primary}>Create account</Link>
            <Link href={`/join?mode=sign-in&next=${encodeURIComponent(here)}`} className="inline-flex h-12 items-center rounded-full border border-line px-6 font-semibold text-ink">I already have one</Link>
          </div>
        </div>
      )}
    </Container>
  );
}
