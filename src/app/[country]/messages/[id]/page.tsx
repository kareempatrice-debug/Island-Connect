import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setEnquiryStatusAction } from "@/app/enquiry-actions";
import { ReplyForm } from "@/components/forms/enquiry-forms";
import { Container } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { supabaseForRequest } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function Thread({ params }: { params: Promise<{ country: string; id: string }> }) {
  const { country, id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const viewer = await requireViewer(`/${country}/messages/${id}`, country);
  const supabase = await supabaseForRequest();
  const [{ data: e }, { data: messages }] = await Promise.all([
    supabase.from("enquiries").select("id, subject, status, preferred_date, customer_id, business_id, created_at, businesses ( name, slug ), services ( name )").eq("id", id).maybeSingle(),
    supabase.from("enquiry_messages").select("id, sender_id, body, created_at").eq("enquiry_id", id).order("created_at"),
  ]);
  if (!e) notFound();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const enquiry = e as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const isCustomer = enquiry.customer_id === viewer.id;
  const back = isCustomer ? `/${country}/messages` : `/${country}/dashboard/${enquiry.businesses?.slug}?tab=enquiries`;

  return (
    <Container className="max-w-2xl py-8 sm:py-12">
      <Link href={back} className="text-sm font-semibold text-link hover:underline">{isCustomer ? "All messages" : "Back to messages"}</Link>
      <h1 className="mt-2 text-3xl font-semibold">{enquiry.subject}</h1>
      <p className="mt-1 text-sm">
        {isCustomer ? `With ${enquiry.businesses?.name}` : `Customer message to ${enquiry.businesses?.name}`}
        {enquiry.services?.name && ` · ${enquiry.services.name}`}
        {enquiry.preferred_date && ` · Preferred date ${new Date(enquiry.preferred_date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
      </p>
      <ol className="mt-8 space-y-3">
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === viewer.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "bg-deep text-white" : "bg-raised text-ink ring-1 ring-line/60"}`}>
                <p className="whitespace-pre-line">{m.body}</p>
                <p className={`mt-1 text-[0.7rem] ${mine ? "text-white/70" : "text-muted"}`}>{new Date(m.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-6"><ReplyForm enquiryId={id} country={country} /></div>
      {!isCustomer && (
        <form action={setEnquiryStatusAction} className="mt-4">
          <input type="hidden" name="enquiryId" value={id} />
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="status" value={enquiry.status === "closed" ? "open" : "closed"} />
          <button className="text-sm font-semibold text-link hover:underline">{enquiry.status === "closed" ? "Reopen conversation" : "Mark as done"}</button>
        </form>
      )}
    </Container>
  );
}
