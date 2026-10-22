import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NeedsDatabase } from "@/components/demo-notice";
import { ClaimForm } from "@/components/forms/claim-form";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { data, isSupabaseConfigured } from "@/lib/data";

// Personal or search-driven: always built fresh for each visitor, never shared.
export const dynamic = "force-dynamic";


export const metadata: Metadata = { title: "Claim this listing", robots: { index: false } };

export default async function Claim({ params }: { params: Promise<{ country: string; slug: string }> }) {
  const { country, slug } = await params;
  const business = await data.getBusiness(slug);
  if (!business) notFound();
  if (!isSupabaseConfigured || business.isDemo) {
    return <Container className="max-w-xl py-12"><NeedsDatabase feature="Claiming listings" /></Container>;
  }
  const viewer = await requireViewer(`/${country}/business/${slug}/claim`, country);
  return (
    <Container className="max-w-xl py-10 sm:py-14">
      <h1 className="text-4xl font-semibold">Claim {business.name}</h1>
      {business.claimStatus === "claimed" ? (
        <p className="mt-4 text-lg">This listing is already managed by its owner. If you think that’s wrong, contact Island Connect.</p>
      ) : (
        <>
          <p className="mt-3 text-lg">
            This listing was added by Island Connect from public information. Once we confirm you run the business, you can update
            its details, add services and prices, and receive enquiries.
          </p>
          <div className="mt-8 rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60 sm:p-7">
            <ClaimForm country={country} businessId={business.id} slug={slug} defaultName={viewer.name ?? ""} />
          </div>
        </>
      )}
    </Container>
  );
}
