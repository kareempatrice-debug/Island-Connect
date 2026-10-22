import type { Metadata } from "next";
import Link from "next/link";
import { NeedsDatabase } from "@/components/demo-notice";
import { DriverAccount } from "@/components/forms/driver-account";
import { DriverSignup } from "@/components/forms/driver-signup";
import { Container } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { data, isSupabaseConfigured } from "@/lib/data";

// Personal or search-driven: always built fresh for each visitor, never shared.
export const dynamic = "force-dynamic";


export const metadata: Metadata = { title: "Apply to drive or operate", robots: { index: false } };

export default async function Apply({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!isSupabaseConfigured) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Driver applications" /></Container>;
  const [viewer, islands] = await Promise.all([getViewer(), data.getIslands(country)]);
  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <Link href={`/${country}/ride/operate`} className="text-sm font-semibold text-link hover:underline">Drive with Island Connect</Link>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Apply to drive or operate</h1>
      <p className="mt-2">Two short steps. Have your licence and permit, insurance certificate and vehicle registration to hand: you’ll take a photo of each.</p>
      {viewer ? (
        <div className="mt-8"><p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{"Step 2 of 2"}</p><DriverSignup country={country} islands={islands.map((i) => ({ slug: i.slug, name: i.name }))} defaultName={viewer.name ?? ""} /></div>
      ) : (
        <div className="mt-8"><DriverAccount country={country} /></div>
      )}
    </Container>
  );
}
