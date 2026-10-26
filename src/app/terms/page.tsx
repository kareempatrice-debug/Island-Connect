import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of use", description: "The terms for using Island Connect, for customers and for businesses." };

export default function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      intro={<p>These terms apply when you use islandconnect.cc, whether you’re looking for a service, listing a business or offering transport. By using the site, or by creating an account, you agree to them. Please also read our <Link href="/privacy" className="font-semibold text-link underline">privacy policy</Link>.</p>}
    >
      <section>
        <h2>What Island Connect is</h2>
        <p>Island Connect is a directory and marketplace that helps people in St Vincent and the Grenadines and Grenada find local businesses, services, transport and information. We put customers and businesses in touch with each other. We do not provide the services listed on the site, we do not employ the businesses or drivers listed, and we are not a party to any agreement you make with them.</p>
      </section>

      <section>
        <h2>Listings and their accuracy</h2>
        <ul>
          <li>Information on a listing comes from the business itself or, for listings marked “Unclaimed”, from public sources such as tourism and trade directories. We check what we reasonably can, but we cannot guarantee that every detail is complete, current or correct.</li>
          <li>A “Verified” badge means we have confirmed who runs the business. It is not a recommendation or a guarantee of the quality of its work.</li>
          <li>Listings marked “Demo” are invented examples used to show how the site works.</li>
          <li>Check prices, availability, licences and terms directly with a business before you rely on them.</li>
        </ul>
      </section>

      <section>
        <h2>Rides, transport and freight</h2>
        <p>Ride and quote requests are sent by you, through the app or by phone or WhatsApp, to approved operators. Any trip, delivery or shipment is an agreement between you and that operator. Fares shown as official come from the published source named alongside them; all other prices are set by the operator and agreed with you before the journey. For freight or travel between St Vincent and the Grenadines and Grenada, customs, immigration, duties and paperwork are the responsibility of you and the operator.</p>
        <p><strong>Licensed operators only.</strong> Passenger rides on Island Connect are provided only by operators whose vehicles are licensed for hire (H plates) and who hold a taxi or public service vehicle driving permit, insurance covering passengers for hire or reward, and a current tourism authority taxi licence. Freight and boat operators provide the licences and insurance that apply to their work. Island Connect checks these documents and their expiry dates before approving an operator, and takes operators offline when a document lapses, but checking documents is not a guarantee of any operator’s conduct.</p>
        <p><strong>Operators are independent.</strong> Drivers, captains and other operators are independent businesses or self-employed people, not employees or agents of Island Connect. They are responsible for holding and renewing their own licences, permits and insurance, for following the law, including rules on ranks, fares and passenger safety, and for the services they provide.</p>
      </section>

      <section>
        <h2>Payments</h2>
        <p>Island Connect does not currently take payments. You pay the business or operator directly, by whatever means you agree with them.</p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must be 18 or over and give accurate details. Keep your password private; you are responsible for activity on your account.</li>
          <li>We may suspend or close an account that breaks these terms or puts other users at risk.</li>
        </ul>
      </section>

      <section>
        <h2>If you list a business</h2>
        <ul>
          <li>You must be the owner of the business or authorised to act for it.</li>
          <li>Everything you publish must be accurate and lawful, and you must hold any licence, registration or insurance your work requires.</li>
          <li>Answer messages honestly and promptly, and don’t use customers’ details for anything other than their request.</li>
          <li>You keep ownership of the text, prices and photos you add, and you allow Island Connect to display them on the site and in material promoting it.</li>
          <li>We review new listings and claims before they go live and may decline, edit for accuracy, hide or remove a listing.</li>
          <li>Listing a business is free at present. If we introduce charges, such as commission on bookings made through the site, we will tell you in advance and they will apply only if you agree to them.</li>
        </ul>
      </section>

      <section>
        <h2>Using the site fairly</h2>
        <p>Don’t use Island Connect to send spam, harass anyone, post false or misleading information, impersonate another person or business, collect other users’ details, or interfere with how the site works. Don’t copy the directory in bulk for use elsewhere.</p>
      </section>

      <section>
        <h2>Corrections and removals</h2>
        <p>If a listing about your business is wrong, or you would like it removed, claim the listing to correct it yourself or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We act on removal requests promptly.</p>
      </section>

      <section>
        <h2>Our responsibility</h2>
        <p>We work to keep the site accurate and available, but we provide it “as is”. As far as the law allows, Island Connect is not responsible for the services, goods, journeys or advice provided by businesses and operators listed on the site, or for losses arising from information on a listing. Nothing in these terms limits any right you have that cannot be excluded by law, including your rights as a consumer.</p>
      </section>

      <section>
        <h2>Which law applies</h2>
        <p>These terms are governed by the laws of Grenada when you use the Grenada section of the site (pages beginning islandconnect.cc/gd) or deal with a business located in Grenada, and by the laws of St Vincent and the Grenadines when you use that country’s section (pages beginning islandconnect.cc/vc) or deal with a business located there. The courts of the relevant country deal with any dispute.</p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>We may update these terms as the site develops. We will change the date at the top of this page, and tell account holders by email about significant changes. Using the site after a change means you accept the updated terms.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}
