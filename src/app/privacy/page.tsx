import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy policy", description: "What Island Connect collects, why, who it is shared with, and how to see or delete your information." };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={<p>This policy explains what information Island Connect collects when you use islandconnect.cc, why we collect it, who we share it with and what you can ask us to do with it. Island Connect is a directory and marketplace for Grenada and St Vincent and the Grenadines. We don’t sell personal information and we don’t show advertising.</p>}
    >
      <section>
        <h2>Who we are</h2>
        <p>Island Connect operates islandconnect.cc. For anything about your information, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>You can browse the site without an account. We collect personal information only when you give it to us or when it is needed to make the site work:</p>
        <ul>
          <li><strong>Your account:</strong> your name, email address and a password, which is stored in scrambled (hashed) form so that nobody, including us, can read it. We also note why you joined: to find services, to list a business or to operate transport.</li>
          <li><strong>Businesses you register or claim:</strong> the business’s name, categories, location, contact details, services, prices and opening hours. To confirm a claim we also ask for your name, your role at the business and how we can check it’s yours.</li>
          <li><strong>Messages:</strong> what you write to a business through the site, and their replies.</li>
          <li><strong>Contact taps:</strong> when someone taps a business’s WhatsApp, phone, email or website button, we count the tap so the business can see how many people contacted it. These counts are not linked to your account.</li>
          <li><strong>Settings stored in your browser:</strong> a cookie remembering which country you chose, and the cookies that keep you signed in. We don’t use advertising or tracking cookies.</li>
        </ul>
        <p>Ride and quote requests are written out on your phone and sent by you through WhatsApp or a phone call. We don’t receive or store those messages.</p>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To run your account and sign you in, including sending sign-in and confirmation emails.</li>
          <li>To show business listings and pass your messages to the business you chose, and to email you or the business when a new message arrives.</li>
          <li>To check that businesses and claims are genuine before they go live.</li>
          <li>To keep the site safe, for example by limiting how many messages an account can send in a day and keeping a record of administrative changes.</li>
          <li>To answer you when you contact us.</li>
        </ul>
      </section>

      <section>
        <h2>Who can see what</h2>
        <ul>
          <li><strong>Business listings</strong> are public once approved. Listings marked “Unclaimed” were compiled from public sources such as tourism and trade directories, and show only the business’s published contact details.</li>
          <li><strong>Your messages</strong> are visible only to you and the business you wrote to. Island Connect administrators can see them when needed to deal with a complaint, abuse or a legal requirement.</li>
          <li><strong>Your email address</strong> is not shown to businesses or other users.</li>
        </ul>
      </section>

      <section>
        <h2>Services that handle data for us</h2>
        <p>We use a small number of providers to run the site. They process information only to provide their service to us:</p>
        <ul>
          <li><strong>Supabase:</strong> our database and sign-in system.</li>
          <li><strong>Netlify:</strong> hosting for the website.</li>
          <li><strong>Resend:</strong> sending our emails.</li>
        </ul>
        <p>These providers store data on servers outside Grenada and St Vincent and the Grenadines, including in the United States. When you choose to contact a business by WhatsApp, that conversation is handled by WhatsApp under its own privacy policy, not ours.</p>
        <p>We will disclose information if the law requires it, for example in response to a valid order from a court or the police in Grenada or St Vincent and the Grenadines.</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>When something goes wrong on the site, an error report is sent to Sentry, our error-monitoring service, so we can fix it. Reports describe the technical problem (the page, browser and error) and do not include your name, email or messages.</li>
          <li>A small number of Island Connect administrators can see account details (name, email, when you joined and last signed in, and how many listings or trips you have) to run the service: for support, approving businesses and drivers, and keeping the platform safe. They don’t use them for marketing.</li>
          <li>If you add family members or trusted contacts, we keep their names and phone numbers only to fill in your bookings and let you share trips with them. Please add people only with their agreement and, for anyone under 18, as their parent or guardian. They are deleted if you remove them or delete your account. A shared trip link shows the route, time, status and the driver’s business name, never phone numbers, and stops working after three days.</li>
          <li>Your account and messages are kept while your account is open. You can delete your account at any time from Your account, Account settings. Deleting it immediately erases your account details, messages, trip requests and the phone numbers attached to them, sign-in devices, uploaded documents, and any listing you created or that describes you as self-employed (if nobody else manages it). The only thing kept is the financial record of completed trips (date, fare, commission and the business name, without your details), which we need for our accounts. Copies in our database backups are overwritten within our provider’s backup period.</li>
          <li>Business listings stay up until the business or Island Connect removes them. A business can ask for its listing to be corrected or removed at any time.</li>
          <li>Records of administrative changes, such as approvals and removals, are kept for as long as needed to show how the directory has been managed.</li>
        </ul>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>You can delete your account and data yourself from Your account. You can also ask us to show you the information we hold about you, correct it, delete it, or stop using it for a particular purpose. Businesses can ask us to correct or remove a listing, including one compiled from public sources. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address on your account and we’ll respond as soon as we can.</p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Accounts are for people aged 18 or over. If you believe a child has created an account, contact us and we will remove it.</p>
      </section>

      <section>
        <h2>Which law applies</h2>
        <p>When you use the Grenada section of the site (pages beginning islandconnect.cc/gd), this policy is governed by the laws of Grenada. When you use the St Vincent and the Grenadines section (pages beginning islandconnect.cc/vc), it is governed by the laws of St Vincent and the Grenadines. See also our <Link href="/terms">terms of use</Link>.</p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>If we change how we use personal information, we will update this page and change the date at the top. For significant changes we will also tell account holders by email.</p>
      </section>
    </LegalPage>
  );
}
