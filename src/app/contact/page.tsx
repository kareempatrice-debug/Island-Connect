import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Contact", description: "How to contact Island Connect about listings, your account or privacy." };

export default function Contact() {
  const mail = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  const rows = [
    { title: "Correct or remove a listing", text: "Tell us the business name and what needs to change. If it’s your business, you can also claim the listing and update it yourself.", subject: "Listing correction" },
    { title: "List your business or join as an operator", text: "Questions about registering a business, claiming a listing, or driving, sailing or hauling with Island Connect.", subject: "Business enquiry" },
    { title: "Your account or your information", text: "Help signing in, closing your account, or a request to see, correct or delete the information we hold about you.", subject: "Account or privacy request" },
    { title: "Report a problem", text: "Something not working, or a listing or message that looks wrong or abusive.", subject: "Problem report" },
  ];
  return (
    <LegalPage
      title="Contact Island Connect"
      intro={
        <p>
          Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-link underline">{CONTACT_EMAIL}</a>. To reach a business listed on the site, use the buttons on its page: we don’t take bookings or messages on a business’s behalf.
        </p>
      }
    >
      <ul className="!mt-0 !list-none space-y-3 !pl-0">
        {rows.map((r) => (
          <li key={r.title} className="rounded-2xl bg-raised p-5 ring-1 ring-line/60">
            <h2 className="!text-lg">{r.title}</h2>
            <p className="!mt-1">{r.text}</p>
            <a href={mail(r.subject)} className="mt-3 inline-block">Email us about this</a>
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
