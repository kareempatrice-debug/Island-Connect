-- ============================================================================
-- ISLAND CONNECT: guides, "Returning home" (Grenada and St Vincent and the Grenadines)
-- Checked against official and published sources on 20 October 2026. Review due April 2027.
-- Run ONCE in Supabase > SQL Editor. Safe to run again: it replaces these twenty articles.
-- ============================================================================

delete from public.articles
where section = 'returning-home' and country_code in ('gd', 'vc')
  and slug in ('banking', 'bringing-a-vehicle', 'government-services', 'healthcare', 'housing', 'planning-the-move', 'returning-national-programmes', 'schools', 'shipping-and-customs', 'working-or-starting-a-business');

insert into public.articles (country_code, is_regional, section, slug, title, summary, body, sources, verified_at, verified_by, next_review_at, status, related_category_slugs)
values

('gd', false, 'returning-home', 'returning-national-programmes', 'Returning-national programmes',
 'Grenada''s Welcome Home Programme: who qualifies, what it covers and how to apply.',
$b$Grenada's main support for people coming home is the Returning Nationals Programme, officially called the Welcome Home Programme. It is a package of tax concessions for Grenadian nationals who have lived abroad and are returning to live in Grenada permanently.

To qualify, you must be a Grenadian national who has lived abroad continuously for at least seven years and has decided to return for good. You will be asked for proof: a one-way ticket to Grenada, evidence of your years overseas, and a packing list of everything you are shipping or plan to ship.

The programme offers a full exemption from duty and tax on household and personal effects, new or used, up to a value of EC$75,000, and a 50 per cent concession on one personal vehicle per family. You can bring the vehicle with you or buy it locally. The Ministry of Finance's notices have also listed tax incentives for returning nationals who set up a business.

Applications are handled by the Returning Nationals Facilitation Bureau, the concession desk at the Ministry of Finance, which you can call on +1 473 440 2731 to make an appointment. Customs and Immigration no longer process these applications. Timing matters: claims must be made within three months before or after your return, so contact the Bureau while you are still planning the move rather than after your container lands.

The concessions come with conditions, the most important being that goods and vehicles cannot be sold within three years without repaying the duty and tax that was waived. The details of what you ship and the vehicle are covered in the next articles in this guide.$b$,
 '[{"title": "Returning Nationals Programme (Ministry of Finance, Grenada)", "url": "https://www.finance.gd/index.php/2015-02-19-13-08-31/2-uncategorised/211-returning-nationals-programme"}, {"title": "Changes to the Returning Nationals Programme (Ministry of Finance, Grenada)", "url": "https://www.finance.gd/index.php/news/17-news-release/232-112-reminder-on-changes-made-to-returning-nationals-programme"}, {"title": "Concession procedures for returning nationals (Consulate General of Grenada)", "url": "https://grenadaconsulate.com/returning-nationals/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{customs-brokers}'),

('gd', false, 'returning-home', 'planning-the-move', 'Planning the move',
 'A practical timeline for moving home to Grenada, built around the concession deadlines.',
$b$The best moves home are planned backwards from the date you intend to arrive, because the Returning Nationals Programme has firm time windows. Claims for concessions must be made within three months before or after your return, and shipped goods should ideally arrive no more than three months before you do.

Six to twelve months ahead is the time to gather paperwork while you still have easy access to it overseas: evidence of your seven years abroad, such as tax returns, payslips, tenancy agreements and bank statements; your children's school records and immunisation history; your medical records and prescriptions; and, if you are bringing a vehicle, its registration and purchase documents. Make sure every family member's Grenadian passport or birth certificate is in order.

Three to six months ahead, decide what is worth shipping. The household and personal effects allowance is generous at EC$75,000, but freight is not cheap, and some appliances are better bought locally where spares and service are available. Get quotes from shipping companies and choose a customs broker in Grenada to clear your goods. Prepare a detailed packing list as you pack; Customs will want it.

In the final month, contact the Returning Nationals Facilitation Bureau at the Ministry of Finance to book your appointment, arrange somewhere to stay while you settle, and keep originals of every document in your hand luggage rather than in the container.

Once you arrive, work through registrations in a sensible order: your TIN with the Inland Revenue Division, National Insurance if you will work, a bank account, a local driver's licence, and school places for children. The articles in this guide cover each one.$b$,
 '[{"title": "Returning Nationals Programme (Ministry of Finance, Grenada)", "url": "https://www.finance.gd/index.php/2015-02-19-13-08-31/2-uncategorised/211-returning-nationals-programme"}, {"title": "Concession procedures for returning nationals (Consulate General of Grenada)", "url": "https://grenadaconsulate.com/returning-nationals/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{customs-brokers,courier-delivery}'),

('gd', false, 'returning-home', 'shipping-and-customs', 'Shipping and customs',
 'Shipping your household goods to Grenada and clearing them under the returning nationals allowance.',
$b$Under the Returning Nationals Programme, qualifying Grenadians can import household and personal effects free of the Common External Tariff, VAT and the Customs Service Charge, whether the items are new or used, up to a total value of EC$75,000.

Your goods can be shipped ahead of you, but they should ideally arrive no more than three months before your permanent return. The application for the concession needs a packing list of everything you have shipped or will ship, so make one as you pack, room by room, with a realistic value for each item. Keep receipts for anything new.

Most people use a customs broker in Grenada to clear a container or crate. The broker prepares the customs entry, liaises with the Ministry of Finance's concession desk and Customs, and arranges delivery once the goods are released. Agree the broker's fee in advance and give them copies of your concession approval as soon as you have it.

Two conditions catch people out. Items you import duty-free are for your own use, and if you sell them within three years of importing them you will have to pay the duty and tax that was waived. And anything above the EC$75,000 allowance, or anything that does not count as household and personal effects, such as goods for a business, will be charged at the normal rates.

If you are not a returning national, published guidance from a Grenadian estate agency suggests that duties on personal and household goods for non-nationals are around 45 per cent, though the actual charge varies by item. Get a broker's estimate before you ship.$b$,
 '[{"title": "Returning Nationals Programme (Ministry of Finance, Grenada)", "url": "https://www.finance.gd/index.php/2015-02-19-13-08-31/2-uncategorised/211-returning-nationals-programme"}, {"title": "Concession procedures for returning nationals (Consulate General of Grenada)", "url": "https://grenadaconsulate.com/returning-nationals/"}, {"title": "Relocating to Grenada (Terra Caribbean)", "url": "https://www.terracaribbean.com/Grenada/Insights/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{customs-brokers,trucking-haulage}'),

('gd', false, 'returning-home', 'bringing-a-vehicle', 'Bringing a vehicle',
 'The 50 per cent vehicle concession for returning nationals, the environmental levy and the conditions on resale.',
$b$Returning nationals who qualify for the Welcome Home Programme are entitled to a 50 per cent concession on one personal vehicle per family. You can ship a vehicle from the country you have been living in or, if you prefer, buy one in Grenada and claim the concession there.

If you import a vehicle, it must come from the country where you lived continuously for the seven years before your return. Age matters in two ways. The procedures published for returning nationals say the vehicle must be five years old or less to qualify for relief, and the environmental levy, which is charged separately, depends on the vehicle's age: the Ministry of Finance gives 2 per cent of the cost, insurance and freight value for vehicles of one to five years old, and 30 per cent for vehicles over five years. A consulate's version of the procedures applies the 2 per cent rate to vehicles up to four years old, so check the current rule with the Ministry's concession desk before you buy or ship.

The concession comes with a three-year condition. If you sell the vehicle within three years of the concession being granted, you must repay the taxes that were forgone. Some import guidance also notes that if you leave Grenada for an extended period, Customs expects to be told, and duties may become due.

Grenada drives on the left, and right-hand-drive vehicles, including used Japanese imports, are common and accepted. Before shipping, compare the total cost of freight, the levy and your share of the duty with the price of a similar vehicle bought locally with the concession; for many people, buying locally works out simpler.$b$,
 '[{"title": "Returning Nationals Programme (Ministry of Finance, Grenada)", "url": "https://www.finance.gd/index.php/2015-02-19-13-08-31/2-uncategorised/211-returning-nationals-programme"}, {"title": "Changes to the Returning Nationals Programme (Ministry of Finance, Grenada)", "url": "https://www.finance.gd/index.php/news/17-news-release/232-112-reminder-on-changes-made-to-returning-nationals-programme"}, {"title": "Concession procedures for returning nationals (Consulate General of Grenada)", "url": "https://grenadaconsulate.com/returning-nationals/"}, {"title": "Concession Procedures for Returning Nationals (Embassy of Grenada, Washington)", "url": "https://grenadaembassyusa.org/wp-content/uploads/2020/09/Concession-Procedures-for-Returning-Nationals-revised-final.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{car-rental,mechanics,customs-brokers}'),

('gd', false, 'returning-home', 'housing', 'Housing',
 'Renting first, buying or building: finding somewhere to live when you return to Grenada.',
$b$Many returning Grenadians find it wise to rent for the first few months, even if they plan to buy or build. It gives you time to get to know different areas again, to see how long the commute really takes on Grenada's winding roads, and to look at property without the pressure of a deadline.

Rentals are advertised through estate agents, online and, very often, by word of mouth. Most homes on the island are stand-alone houses rather than apartments. Before you sign a lease, check who pays for water and electricity, whether there is a water tank for when the supply is interrupted, and how the property has fared in past storms. Ask for a written tenancy agreement that sets out the rent, the deposit and the notice period.

If you are buying, our Property and investment guide explains the process step by step, including title searches, the costs of a purchase and the annual property tax. Grenadian citizens do not need the Alien Landholding Licence that non-citizens pay for, but a spouse who is not a citizen may be affected if you buy jointly, so raise it with your lawyer early.

If you already own family land and plan to build, you will need planning permission from the Planning and Development Authority before work begins, and you should make sure the land is properly in your name first. Family land that has never been formally transferred is one of the commonest causes of delay for returning nationals, and it is best sorted out by a lawyer before you spend money on plans.

Water is supplied by the National Water and Sewerage Authority, NAWASA, and setting up accounts for utilities usually requires identification and, for tenants, a copy of the lease.$b$,
 '[{"title": "Relocating to Grenada: housing and utilities (Terra Caribbean)", "url": "https://www.terracaribbean.com/Grenada/Insights/"}, {"title": "Grenada buying guide (Terra Caribbean)", "url": "https://terracaribbean.com/grenada/guides/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{estate-agents,lawyers,builders-contractors}'),

('gd', false, 'returning-home', 'banking', 'Banking',
 'Opening a bank account in Grenada, the Eastern Caribbean dollar and moving money home.',
$b$Grenada uses the Eastern Caribbean dollar, issued by the Eastern Caribbean Central Bank and shared with seven other countries and territories in the region. It has been fixed to the US dollar at EC$2.70 to US$1 for decades, which makes planning your finances from abroad easier, at least for US dollar income.

Grenada has commercial banks, including Republic Bank Grenada and the Grenada Co-operative Bank, and a strong network of credit unions. Many returning nationals keep an account with each: a bank for international transfers and a credit union for savings and, later, loans.

Opening an account is straightforward but paperwork-heavy, because banks must confirm who you are and where your money comes from. Expect to provide your passport, proof of your address in Grenada (a utility bill or tenancy agreement), your Taxpayer Identification Number, and often a reference letter from your current bank overseas. If you are moving savings or the proceeds of selling a home abroad, bring evidence of where the money came from, such as a sale completion statement; banks will ask, and having it ready avoids delays. Holders of US citizenship or green cards will also be asked for US tax information under international reporting rules.

Open your account soon after arriving, or even before you move if your bank allows it, because you will need it for utility deposits, a car purchase and receiving any pension. When transferring large sums, compare the exchange rate and fees offered by your bank abroad, your Grenadian bank and specialist transfer services; the difference on a house deposit can be substantial.

If you will receive a pension from abroad, ask the paying authority about payments to an account in Grenada, and keep your overseas account open until the first payments arrive safely.$b$,
 '[{"title": "The Eastern Caribbean dollar peg (Global Property Guide)", "url": "https://www.globalpropertyguide.com/Caribbean/St-Vincent-and-Grenadines/Buying-Guide"}, {"title": "National Insurance Scheme Grenada: banks", "url": "https://nisgrenada.org/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{banks-finance}'),

('gd', false, 'returning-home', 'healthcare', 'Healthcare',
 'Public hospitals and health centres, private care and health insurance in Grenada.',
$b$Grenada's public health service is run by the Ministry of Health. Primary care is delivered through health centres and medical stations across the island's health districts, where basic care is free or low-cost for residents. The main referral hospital is the General Hospital in St George's, supported by Princess Alice Hospital in St Andrew's, Princess Royal Hospital on Carriacou and the Mt Gay psychiatric hospital.

Alongside the public system is a sizeable private sector of hospitals, clinics and specialists, mostly in and around St George's. Many residents use both: public health centres for routine care and private doctors when they want a quicker appointment or a particular specialist. Private care is usually paid for at the time of treatment.

There is no national health insurance scheme in Grenada, although one has been discussed for years. Private health insurance is available from regional insurers, including Sagicor and Guardian, and from international insurers. Returning nationals over 50 should look at this carefully before they leave their current country, because cover is easier and cheaper to arrange before any new condition is diagnosed. Check whether a policy covers medical evacuation to a larger hospital overseas, which matters for serious illness or injury.

Before you move, gather your medical records, a summary from your current doctor, and a supply of any regular medication with the prescriptions, as some brands may not be available. Register with a doctor or your local health centre soon after you arrive so that you are known before you need urgent care.

Some specialist treatment is not available on the island, so serious conditions may involve travel to Trinidad, Barbados or further afield. Factor that into both your insurance and your savings.$b$,
 '[{"title": "Grenada''s public and private healthcare (Pacific Prime)", "url": "https://www.pacificprime.com/country/americas/grenada-health-insurance-pacific-prime-international/"}, {"title": "Healthcare in Grenada (Immigrant Invest)", "url": "https://immigrantinvest.com/blog/grenada-healthcare-en/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{doctors-clinics,insurance,pharmacies}'),

('gd', false, 'returning-home', 'schools', 'Schools',
 'Enrolling children in Grenada''s schools and transferring their records from abroad.',
$b$Grenada's school system follows the familiar Caribbean pattern. Primary education is compulsory from about age five to twelve, followed by secondary school from around twelve to seventeen, ending with the Caribbean Secondary Education Certificate examinations set by the Caribbean Examinations Council. Teaching is in English, and the school year runs from September.

Public schools are run by the Ministry of Education, many in partnership with churches, and there are private schools, including church schools and international schools, at both primary and secondary level.

To enrol a child, contact the Ministry of Education or the school directly. You will typically need the child's birth certificate, passport, immunisation record and reports from their previous school. Bring originals and copies, and ask your child's current school abroad for a full transcript and a letter describing the level they have reached, which helps the new school place them in the right class.

Timing is the main challenge for families returning mid-year. Places at popular schools fill quickly, and entry to secondary school is normally organised around the end-of-primary assessment, so a child arriving at secondary age should be discussed with the Ministry well before you move. If your child has special educational needs, raise this early, as support varies between schools.

Children who have studied a different curriculum abroad usually settle well academically, but expect an adjustment to uniforms, longer travel times and, in some subjects, a different syllabus. Homeschooling is allowed but regulated by the Ministry, and some families use online schools for a transition year.$b$,
 '[{"title": "The education system in Grenada (Expat Exchange)", "url": "https://www.expatexchange.com/ctryguide/20633/381/Grenada/Living-in-Grenada-Educational-System-in-Grenada"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{education-childcare,tutors,childcare}'),

('gd', false, 'returning-home', 'working-or-starting-a-business', 'Working or starting a business',
 'Finding work, registering for tax and National Insurance, and starting a business when you come home.',
$b$As a Grenadian national, you do not need a work permit to work in Grenada. A spouse or partner who is not a citizen generally does, so look into their position with the Ministry of Labour before you move rather than after.

Whether you take a job or work for yourself, register with the Inland Revenue Division for a Taxpayer Identification Number, through the G-TAX portal or at the office on the Carenage, and with the National Insurance Scheme. If you were an NIS contributor before you left, take your old NIS number with you. If you have paid social security in another CARICOM country or in Canada, ask the NIS about the reciprocal agreements Grenada has with them, which can allow contributions abroad to count towards a pension.

Many returning nationals bring skills, savings and experience that make self-employment attractive. Our Start a business guide covers choosing a structure, registering with CAIPO, tax and NIS, licences, finance and incentives. The Ministry of Finance has listed tax incentives for returning nationals who set up a business among the benefits of the Welcome Home Programme, so ask the Returning Nationals Facilitation Bureau what is currently available before you import equipment.

If you are looking for employment, local recruitment relies heavily on personal networks, so let people know you are back. Professional qualifications from abroad are generally respected, but regulated professions, such as medicine, nursing, law and engineering, need registration with the relevant council or body before you can practise. Contact them while you are still overseas, as the paperwork can take time.

Finally, list your services or business on Island Connect once you are set up. It is free, and it is how people across both countries find local tradespeople and professionals.$b$,
 '[{"title": "Changes to the Returning Nationals Programme, including business incentives (Ministry of Finance)", "url": "https://www.finance.gd/index.php/news/17-news-release/232-112-reminder-on-changes-made-to-returning-nationals-programme"}, {"title": "National Insurance Scheme Grenada: reciprocal agreements", "url": "https://nisgrenada.org/self-employed"}, {"title": "G-TAX: Inland Revenue Division online services", "url": "https://tax.gov.gd"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants,business-consultants,lawyers}'),

('gd', false, 'returning-home', 'government-services', 'Government services',
 'Driving licences, tax and NIS numbers, documents and where to get them in Grenada.',
$b$Coming home means re-establishing yourself on several official registers. None is difficult, but each has its own office and paperwork, so it helps to know the order.

Your Taxpayer Identification Number comes from the Inland Revenue Division and is needed for almost everything else, from bank accounts to licences. Register online through the G-TAX portal at tax.gov.gd or in person at the IRD office on the Carenage. Register with the National Insurance Scheme if you will work or be self-employed; you can manage your contributions online at my.nisgrenada.org.

You can drive in Grenada on a valid foreign licence for a limited period after arriving, after which you need a Grenadian driver's licence. Licences have been issued through the Traffic Department of the Royal Grenada Police Force on the Carenage, with the application typically requiring your existing licence, identification and a fee. In 2024 the government announced that vehicle licensing and inspection would move away from the police, so check where to apply when you arrive.

Grenadian passports are issued by the Immigration and Passport Department. If your passport is due to expire within a year or so of your return, renew it before you leave your current country, where a consulate may be able to help, or as soon as you arrive. Birth, marriage and death certificates come from the Registry, and you will need certified copies for school enrolment, property transactions and claims for concessions.

For duty concessions on your household goods and vehicle, the Returning Nationals Facilitation Bureau at the Ministry of Finance is your contact, rather than Customs or Immigration. Keep a folder of certified copies of your key documents; you will use them again and again in your first year back.$b$,
 '[{"title": "G-TAX: Inland Revenue Division online services", "url": "https://tax.gov.gd"}, {"title": "National Insurance Scheme Grenada", "url": "https://nisgrenada.org/"}, {"title": "Getting a driver''s licence in Grenada (Expat Exchange)", "url": "https://www.expatexchange.com/article/11631/Drivers-License-Grenada-Getting-a-Drivers-License-in-Grenada"}, {"title": "Returning Nationals Programme: where to apply (Ministry of Finance)", "url": "https://www.finance.gd/index.php/2015-02-19-13-08-31/2-uncategorised/211-returning-nationals-programme"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers}'),

('vc', false, 'returning-home', 'returning-national-programmes', 'Returning-national programmes',
 'Duty-free concessions for Vincentians returning home: who qualifies and what they cover.',
$b$St Vincent and the Grenadines offers returning nationals duty-free concessions through the Customs and Excise Department. They are aimed at Vincentians who have lived abroad for at least ten years and are coming back to make their permanent home in the country.

The concession covers two things. Household and personal effects, new or used, can be brought in free of all taxes, subject to conditions. One motor vehicle per household, but not a truck, can be imported at a quarter of the normal import duty, excise tax and VAT. The goods can be shipped from abroad or bought in St Vincent from a supplier who operates a private tax-free warehouse.

You must show two things. The first is that you lived abroad for at least ten years, using documents such as payslips, school or university records, bank statements, employment records, visas, residence permits or pension letters. The second is that you intend to settle permanently, which you can support with a house purchase contract, a mortgage, a land title, planning permission for a house, or documents showing you are setting up a business or have a job.

Applications are made in writing on the Customs form to the Comptroller of Customs and Excise at Custom House, Upper Bay Street, Kingstown, and you may be invited to an interview. You must apply within one year of returning.

The published conditions date from some years ago, so confirm the current version with Customs or your nearest SVG consulate before you ship. The details for goods and vehicles are in the following articles.$b$,
 '[{"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{customs-brokers}'),

('vc', false, 'returning-home', 'planning-the-move', 'Planning the move',
 'A timeline for moving home to St Vincent and the Grenadines, built around the Customs conditions.',
$b$The returning nationals concession gives you a year after your return to apply, which is more generous than many countries, but a move still goes far more smoothly when the paperwork is gathered before you leave.

Start collecting evidence of your ten or more years abroad while it is easy to obtain: payslips, tax returns, tenancy or mortgage papers, bank statements, residence permits, and your children's school records. Customs looks for proof both of your time abroad and of your intention to settle, so if you are buying a house, have a job offer or are setting up a business, keep copies of those documents too. Check that every family member's passport and birth certificate is in order.

Three to six months before you go, decide what to ship. The concession allows one of each type of household item that you would reasonably need, such as one television and one microwave, so sell or give away duplicates rather than paying freight on items that will be taxed. Prepare an itemised packing list with makes, models and serial numbers, which the Customs form asks for. Get quotes from shippers and choose a customs broker in St Vincent.

Arrange a place to stay for your first weeks and keep originals of important documents in your hand luggage.

After you arrive, apply to the Comptroller of Customs for the concession, then work through your registrations: a TIN with the Inland Revenue Department, the National Insurance Services, a bank account, a driving permit and school places. The articles in this guide explain each step.$b$,
 '[{"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{customs-brokers,courier-delivery}'),

('vc', false, 'returning-home', 'shipping-and-customs', 'Shipping and customs',
 'Bringing household goods to St Vincent and the Grenadines free of tax under the returning nationals concession.',
$b$Qualifying returning nationals can bring in household and personal effects completely free of all taxes, whether the items are new or used. The goods can be shipped from abroad or bought locally from a supplier operating a private tax-free warehouse in St Vincent.

The concession is meant to help you set up your home, not to stock a shop, and Customs applies that test. Only one set or item of each type of household good that you would reasonably need is covered: one television, one microwave, one DVD player and so on. Additional items of the same kind may be charged at the full rate of duty.

The goods must be for your own use and kept by you. For four years after import, none of them may be sold, traded, bartered, given away or otherwise disposed of without the permission of the Comptroller of Customs, and permission means paying all the normal taxes. Customs treats breaches seriously: the published conditions warn of fines, imprisonment and seizure of the goods, and the same penalties apply to false declarations.

The application form asks for a full list of your household and personal effects with makes, models and serial numbers where available, together with the name of your agent or broker and the entry numbers for your shipment. A customs broker will prepare the entry and handle clearance at the port, so choose one before your goods arrive and agree the fee.

Apply in writing to the Comptroller of Customs and Excise at Custom House, Upper Bay Street, Kingstown, within one year of returning. If you are invited to an interview, take the documents that support your claim.$b$,
 '[{"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{customs-brokers,trucking-haulage}'),

('vc', false, 'returning-home', 'bringing-a-vehicle', 'Bringing a vehicle',
 'The returning nationals vehicle concession in SVG: what you pay, which vehicles qualify and the four-year rule.',
$b$Returning nationals who qualify for the Customs concession can import one motor vehicle per household, but not a truck, on reduced terms. Instead of the full charges, you pay 25 per cent of the normal import duty, excise tax and VAT. The Customs Service Charge is payable in full, and if the vehicle is more than four years old, the vehicle surcharge is also payable in full, which makes newer vehicles considerably better value under the scheme.

The vehicle must be owned by you and registered in your name. As with household goods, you can import it yourself or buy one locally from a supplier operating a private tax-free warehouse, and you must apply to the Comptroller of Customs within one year of your return. The application form asks for the make, model, year, colour, type, engine size and the engine and chassis numbers.

The vehicle must be kept for your own use. It cannot be sold, traded, given away or otherwise disposed of for four years without the Comptroller's permission, and permission means paying the taxes that were waived. Selling it without permission risks a fine, prosecution and seizure.

Before you ship, compare the full cost of freight, the Customs Service Charge, any surcharge and your 25 per cent share of the duties with the price of a comparable vehicle bought locally under the same concession. St Vincent and the Grenadines drives on the left, its roads are steep and narrow in places, and parts and servicing are easiest to find for models already common on the island. Those practical points often favour buying locally.$b$,
 '[{"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{car-rental,mechanics,customs-brokers}'),

('vc', false, 'returning-home', 'housing', 'Housing',
 'Renting, buying and building a home when you return to St Vincent and the Grenadines.',
$b$Renting for your first few months is a sensible choice even if you intend to buy or build. It lets you get reacquainted with different districts, test the journey to work or school, and look at property without being rushed.

Rentals are found through estate agents, online listings and, often, through family and friends. Before you sign, ask who pays for water and electricity, whether the house has a water tank, and how it has coped in past storms. In areas close to La Soufrière, ask about volcanic hazard zoning too. Insist on a written tenancy agreement covering the rent, the deposit and notice periods.

If you plan to buy, our Property and investment guide sets out the process, the title checks to insist on, and the costs, including stamp duty on the deed of conveyance. Vincentian citizens do not need an Alien Land Holding Licence, and neither does a spouse who is married to a citizen. Customs also accepts a house purchase contract, mortgage agreement, land title or planning permission as evidence that you are settling permanently, which supports your application for the returning nationals concession.

If you are going to build, perhaps on family land, you will need approval from the Physical Planning and Development Board before work starts, and you should make sure the land is properly in your name first. Family land that has passed down without formal transfers is a common source of delay; a lawyer can advise on putting the title in order, which may involve probate or letters of administration.

Setting up utility accounts usually requires identification and, for tenants, a copy of the lease, so keep both to hand in your first weeks.$b$,
 '[{"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}, {"title": "Buying property in SVG (Chestertons)", "url": "https://chestertons.com/blog/property-investment/a-guide-to-buying-property-in-st-vincent-the-grenadines-the-caribbeans-best-kept-secret"}, {"title": "Aliens (Land-Holding Regulation) Act: who is treated as belonging to SVG", "url": "https://faolex.fao.org/docs/pdf/stv219969.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{estate-agents,lawyers,builders-contractors}'),

('vc', false, 'returning-home', 'banking', 'Banking',
 'Opening an account in St Vincent and the Grenadines, the EC dollar and moving money home.',
$b$St Vincent and the Grenadines uses the Eastern Caribbean dollar, issued by the Eastern Caribbean Central Bank and shared with other members of the currency union. It is pegged to the US dollar at EC$2.70 to US$1.

The main banking options are the commercial banks, including the Bank of St Vincent and the Grenadines on Halifax Street in Kingstown, and the country's credit unions, which play a large part in everyday saving and lending. Many returning nationals use a bank for international transfers and a credit union for savings and future loans; credit unions are also an important source of housing finance.

To open an account, expect to provide your passport, proof of your local address (a utility bill or tenancy agreement), your Taxpayer Identification Number and, often, a reference from your current bank. If you are bringing savings or the proceeds from selling a home abroad, have documents ready that show where the money came from; banks are required to ask. US citizens and green card holders will also be asked for US tax details.

Open an account soon after you arrive, or before you leave if your bank can arrange it, so that you can pay utility deposits, buy a car and receive any pension. For large transfers, compare the exchange rates and fees from your overseas bank, your new local bank and specialist transfer services; on the sum needed for a house, the difference can be considerable.

If you will receive a pension from abroad, confirm with the paying authority that it can be paid to an account in St Vincent, and keep your old account open until the first payments have arrived.$b$,
 '[{"title": "The Eastern Caribbean dollar peg (Global Property Guide)", "url": "https://www.globalpropertyguide.com/Caribbean/St-Vincent-and-Grenadines/Buying-Guide"}, {"title": "Bank of St Vincent and the Grenadines, Halifax Street (SVG Tourism Authority)", "url": "https://discoversvg.com/?p=3634"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{banks-finance}'),

('vc', false, 'returning-home', 'healthcare', 'Healthcare',
 'Public hospitals and clinics, user fees, private care and health insurance in St Vincent and the Grenadines.',
$b$The Ministry of Health runs public health care in St Vincent and the Grenadines through a network of clinics and health centres for primary care, with hospital care centred on the Milton Cato Memorial Hospital in Kingstown, also known as the Kingstown General Hospital. It is the main public provider of secondary care, such as general surgery and internal medicine. There is also a hospital at Georgetown serving the north of the island.

Public services are not free at the point of use: patients pay user fees, although they are well below the true cost of care. There is no national health insurance scheme, though one has been discussed. Private hospitals, clinics and specialists operate alongside the public system, mainly in and around Kingstown, and are usually paid for at the time of treatment.

Private health insurance is available from regional and international insurers. If you are over 50 or have a long-term condition, compare policies before you leave your current country, as cover is easier to arrange before any new diagnosis. Check whether a policy pays for medical evacuation, because some specialist treatment is only available overseas.

Before moving, collect your medical records, a summary letter from your doctor and a supply of regular medication with the prescriptions, as some brands may differ locally. Register with a doctor or your local clinic soon after you arrive.

If you will be living in the Grenadines, find out where the nearest clinic is and how emergencies are transferred to St Vincent, as services on the smaller islands are more limited.$b$,
 '[{"title": "Healthcare in St Vincent and the Grenadines (Pacific Prime)", "url": "https://www.pacificprime.com/country/americas/st.-vincent-and-grenadines-health-insurance-pacific-prime-international/"}, {"title": "Milton Cato Memorial Hospital: user fees and national health insurance (Business View Caribbean)", "url": "https://businessviewcaribbean.com/brochures/oct-2018/milton-cato-memorial-hospital/4-5/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{doctors-clinics,insurance,pharmacies}'),

('vc', false, 'returning-home', 'schools', 'Schools',
 'Registering children in St Vincent and the Grenadines'' schools, online or in person.',
$b$St Vincent and the Grenadines has public, government-assisted and private schools, with education governed by the Education Act. Primary school is followed by secondary school, ending with the Caribbean Secondary Education Certificate examinations, and the school year starts in September.

Registration for children entering kindergarten and early childhood centres in government primary schools normally takes place in May, both online through the Ministry of Education's website, education.gov.vc, and in person at the schools. You will need the child's original birth certificate and immunisation card, and online registration asks you to upload both, including the front and back of the immunisation card.

Families returning from abroad with older children, or arriving mid-year, should contact the Ministry of Education directly to arrange placement. Bring the child's birth certificate, passport, immunisation record and recent school reports, and ask their current school for a transcript and a letter describing the level they have reached.

There is good news on costs. In July 2026 the government announced that registration, processing and admission fees for first-form students entering public and government-assisted secondary schools would be removed, with each school issuing revised registration packages. Ask the school what, if anything, you will still be expected to pay for uniforms, books and activities.

If your child has special educational needs, raise them with the Ministry early, as the Education Act provides for special education programmes but provision varies between schools.$b$,
 '[{"title": "Registration for government primary schools (Ministry of Education)", "url": "https://education.gov.vc/education/index.php/news/185-registration-of-students-entering-primary-schools-for-the-2023-2024-academic-year"}, {"title": "Secondary school registration fees removed, July 2026 (Jamaica Gleaner / CMC)", "url": "https://jamaica-gleaner.com/article/world-news/20260716/st-vincent-and-grenadines-govt-ends-registration-fees-entry-secondary"}, {"title": "Education Act 2005 (UNESCO archive)", "url": "https://webarchive.unesco.org/web/20160802193745/http:/planipolis.iiep.unesco.org/upload/Saint%20Vincent%20and%20the%20Grenadines/Saint%20Vincent%20and%20the%20Grenadines%20Education%20Act%202005-1.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{education-childcare,tutors,childcare}'),

('vc', false, 'returning-home', 'working-or-starting-a-business', 'Working or starting a business',
 'Tax, National Insurance and setting up on your own when you return to St Vincent and the Grenadines.',
$b$Vincentian citizens can work in St Vincent and the Grenadines without a work permit, but a spouse or partner who is not a citizen may need one, so check their position before you move.

Whether employed or self-employed, register with the Inland Revenue Department for a Taxpayer Identification Number, and separately with the National Insurance Services; registering with one does not register you with the other. If you contributed to the NIS before you left, bring your old number. Ask the NIS too about social security agreements that may let contributions made abroad count towards your benefits.

National Insurance rates have risen under reforms that began in 2024. From 1 January 2026, employees pay 6.5 per cent of insurable earnings and employers 7.5 per cent; self-employed contributors pay 13.5 per cent. For someone returning to work for themselves, keeping up NIS contributions is the route to a pension and other benefits, and good standing with the NIS is a condition of some government incentives.

If you plan to start a business, our Start a business guide covers registration with the Commerce and Intellectual Property Office, tax, licences, finance and incentives. Evidence that you are setting up a business also supports your application for the returning nationals concession on your household goods and vehicle.

Regulated professions, such as medicine, nursing, law and engineering, require registration with the relevant council before you can practise, so contact them while you are still abroad. And once you are up and running, list your business or services on Island Connect; it is free.$b$,
 '[{"title": "NIS contribution rates from 1 January 2026 (One News SVG)", "url": "https://onenewsstvincent.com/2025/12/30/all-employers-and-employees-reminded-of-nis-increase-from-jan-1-2026/"}, {"title": "Inland Revenue Department e-Tax platform", "url": "https://etax.gov.vc"}, {"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants,business-consultants,lawyers}'),

('vc', false, 'returning-home', 'government-services', 'Government services',
 'Driving permits, tax and NIS registration, and dealing with Customs when you return to SVG.',
$b$Several government offices will become familiar in your first months home, and knowing which does what saves wasted trips.

The Inland Revenue Department, on Halifax Street in Kingstown, issues your Taxpayer Identification Number and handles income tax and VAT through its e-Tax platform. It is also the licensing authority for driving permits, and Vincentian driving permits carry the holder's TIN.

On driving, the rules depend on where your licence comes from. A valid driving permit issued in another Commonwealth Caribbean country exempts you from needing a Vincentian one. Holders of an international driving permit from a country that has signed the international convention are also exempt, but must register the permit with the Licensing Authority before driving. Visitors with a valid licence from their own country can obtain a temporary permit for up to six months for a fee of EC$125. As a returning resident, plan to obtain a full Vincentian driving permit through the Licensing Authority once you are settled.

The National Insurance Services, separate from the IRD, handles contributions and benefits; register as soon as you start work. For your household goods and vehicle concession, deal with the Comptroller of Customs and Excise at Custom House, Upper Bay Street, Kingstown.

Keep certified copies of your passport, birth certificate, marriage certificate and evidence of your years abroad in one folder. You will need them for Customs, banks, schools and licensing in your first year back.$b$,
 '[{"title": "Temporary driving permits for visitors (Ministry of Finance, SVG)", "url": "https://finance.gov.vc/finance/index.php/frequently-asked-questions/248-what-is-the-procedure-in-acquiring-a-temporary-vincentian-drivers-license"}, {"title": "International driving permits and the Licensing Department (Ministry of Finance, SVG)", "url": "https://finance.gov.vc/finance/index.php/frequently-asked-questions/250-what-is-the-procedure-to-acquire-an-international-license"}, {"title": "Inland Revenue Department e-Tax platform", "url": "https://etax.gov.vc"}, {"title": "Duty Free Concessions for Returning Nationals: General Conditions (SVG Customs and Excise Department)", "url": "https://www.svgconsulate.vc/documents/consular/nationals/n-duty-free-return-nationals.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers}');
