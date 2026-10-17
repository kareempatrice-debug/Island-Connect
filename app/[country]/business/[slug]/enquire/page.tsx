import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NeedsDatabase } from "@/components/demo-notice";
import { StartEnquiryForm } from "@/components/forms/enquiry-forms";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { data, isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = { title: "Send an enquiry", robots: { index: false } };

export default async function Enquire({ params }: { params: Promise<{ country: string; slug: string }> }) {
  const { country, slug } = await params;
  const business = await data.getBusiness(slug);
  if (!business) notFound();
  if (!isSupabaseConfigured || business.isDemo) return <Container className="max-w-xl py-12"><NeedsDatabase feature="Enquiries" /></Container>;
  await requireViewer(`/${country}/business/${slug}/enquire`, country);
  return (
    <Container className="max-w-xl py-10 sm:py-14">
      <p className="text-sm font-semibold text-link">{business.name}</p>
      <h1 className="mt-1 text-4xl font-semibold">Send an enquiry</h1>
      {business.claimStatus === "unclaimed" ? (
        <p className="mt-4 text-lg">This business hasn’t joined Island Connect yet, so it can’t receive messages here. Use the contact details on its page.</p>
      ) : (
        <>
          <p className="mt-3">The business replies here, and you’ll find the conversation under Messages.</p>
          <div className="mt-8 rounded-panel bg-raised p-5 shadow-card ring-1 ring-line/60 sm:p-7">
            <StartEnquiryForm country={country} businessId={business.id} services={business.services.map(({ id, name }) => ({ id, name }))} />
          </div>
        </>
      )}
    </Container>
  );
}
