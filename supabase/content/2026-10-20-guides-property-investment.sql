-- ============================================================================
-- ISLAND CONNECT: guides, "Property and investment" (Grenada and St Vincent and the Grenadines)
-- Checked against official and published sources on 20 October 2026. Review due April 2027.
-- Run ONCE in Supabase > SQL Editor. Safe to run again: it replaces these twelve articles.
-- ============================================================================

delete from public.articles
where section = 'property-investment' and country_code in ('gd', 'vc')
  and slug in ('how-a-purchase-works', 'title-searches-and-surveys', 'buying-as-a-non-citizen', 'mortgages-and-finance', 'taxes-and-transfer-costs', 'building-on-land-you-own');

insert into public.articles (country_code, is_regional, section, slug, title, summary, body, sources, verified_at, verified_by, next_review_at, status, related_category_slugs)
values

-- ---------------------------------------------------------------- GRENADA
('gd', false, 'property-investment', 'how-a-purchase-works', 'How a purchase works',
 'The steps from agreeing a price to holding registered title to a home or land in Grenada.',
$b$Buying property in Grenada follows a well-worn path, and knowing the order of events makes it far less stressful. Most purchases take somewhere between two and six months, with the longer end usually explained by an Alien Landholding Licence for buyers who are not Grenadian.

It starts with an offer. If you are buying through an estate agent, the agent normally puts your offer in writing, and once the seller accepts, both sides confirm it in an acceptance letter that goes to each party's lawyer. From this point you need your own attorney-at-law; the seller's lawyer acts for the seller, not for you.

The seller's lawyer then prepares a sale agreement, which your lawyer reviews before you sign. On signing, the buyer usually pays a deposit of around 10 per cent of the price, held by a lawyer until completion. Read the agreement's terms on the deposit carefully: it should say when it is refundable, for example if title turns out to be defective or a non-citizen buyer's licence is refused.

While the agreement is in place, your lawyer searches the title to confirm the seller owns what they are selling, free of mortgages, claims or restrictions that would affect you. A survey may be needed to confirm the boundaries. If you are not a citizen, the Alien Landholding Licence application runs in parallel.

When everything is clear, the conveyance is prepared and signed, you pay the balance through your lawyer, and the seller's lawyer releases the deed. The final step is registration of the conveyance at the Deeds and Land Registry, which is what makes your ownership a matter of public record. Your lawyer will also pay the stamp duty that falls on you, and the seller pays the property transfer tax, which the law does not allow to be passed on to the buyer.$b$,
 '[{"title":"The buying process in Grenada (Century 21 Grenada)","url":"https://c21grenada.com/en/useful-tips/buying-real-estate-property-in-grenada/"},{"title":"Buying property in Grenada: legal guide (Forrester Law Chambers)","url":"https://forresterlc.com/?p=557"},{"title":"Aliens (Land-Holding Regulation) Act: registration in the Deeds and Land Registry","url":"https://faolex.fao.org/docs/pdf/grn125546.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,estate-agents}'),

('gd', false, 'property-investment', 'title-searches-and-surveys', 'Title searches and surveys',
 'How to check that the seller owns what they are selling, and that the boundaries are where you think.',
$b$A title search is the single most important protection you have when buying land or a house, and it is your lawyer's job, not the seller's. The search traces the chain of deeds recorded at the Deeds and Land Registry to confirm that the person selling actually owns the property, and to reveal anything registered against it, such as a mortgage that must be paid off at completion, a right of way across the land, or a dispute.

Family land deserves particular care. Much land in Grenada has passed down through generations without a formal transfer at each death, so the person offering to sell may be one of several heirs. In that case the title may need to be put in order, sometimes through probate or letters of administration, before a sale can safely go ahead. A good lawyer will tell you plainly if that is the position.

A survey confirms what is on the ground. A licensed land surveyor measures the boundaries, checks them against the survey plans on record and identifies any encroachments, such as a neighbour's wall or a building that strays over the line. For bare land, especially if it is being cut from a larger parcel, a new survey plan is usually needed before the land can be conveyed. Published guides put surveyors' fees at around 0.5 per cent of the land's value, though it varies with the size and difficulty of the plot.

If you are buying a house, consider a separate building inspection by an engineer or experienced contractor. Roofs, foundations, drainage and the quality of any additions matter a great deal in a hurricane zone, and an inspection costs little compared with the repairs it can reveal.$b$,
 '[{"title":"Due diligence when buying property in Grenada (Forrester Law Chambers)","url":"https://forresterlc.com/?p=557"},{"title":"Buying guide: surveyor''s fees and process (Terra Caribbean Grenada)","url":"https://terracaribbean.com/grenada/guides/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,surveyors-valuers}'),

('gd', false, 'property-investment', 'buying-as-a-non-citizen', 'Buying as a non-citizen',
 'The Alien Landholding Licence: who needs one, what it costs and how to apply.',
$b$Anyone who is not a citizen of Grenada, and any company under foreign control, needs an Alien Landholding Licence to own land in Grenada. The requirement comes from the Aliens (Land-Holding Regulation) Act, and the Ministry of Finance directs applicants to the Prime Minister's Office, which grants the licences. A licence only takes effect once it has been registered at the Deeds and Land Registry, and only after all the fees and duties have been paid.

The licence fee is the cost that most surprises overseas buyers: published guides consistently put it at 10 per cent of the property's value, payable on top of the purchase price. There is also a small stamp duty on the licence itself, a registration fee, and your lawyer's charges for preparing the application. On a EC$1,000,000 house, the licence fee alone would therefore be around EC$100,000, so build it into your budget from the start.

Applications are made through a Grenadian lawyer. Applicants are typically asked for a police record, character references and a banker's reference, alongside details of the property. Processing usually takes a few months and runs alongside the rest of the conveyancing, which is why purchases by non-citizens take longer. Make sure your sale agreement says the deposit is refundable if the licence is refused.

People who acquire Grenadian citizenship through the Citizenship by Investment programme by buying approved real estate are exempt from the licence requirement for that investment. Grenadians living abroad who have kept their citizenship do not need a licence at all, so check your status, and that of any spouse buying jointly, with your lawyer before you apply for one you may not need.$b$,
 '[{"title":"Property tax and Alien Landholding Licence (Ministry of Finance, Grenada)","url":"https://www.finance.gd/index.php/taxes/28-taxes/170-property-tax"},{"title":"Aliens (Land-Holding Regulation) Act","url":"https://faolex.fao.org/docs/pdf/grn125546.pdf"},{"title":"Buying FAQ: licence fee and documents required (Century 21 Grenada)","url":"https://c21grenada.com/en/useful-tips/faq-when-buying-real-estate-in-grenada/"},{"title":"Alien Land Holding Licence process (Forrester Law Chambers)","url":"https://forresterlc.com/?p=557"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,estate-agents}'),

('gd', false, 'property-investment', 'mortgages-and-finance', 'Mortgages and finance',
 'Borrowing to buy or build in Grenada, and what local lenders look for.',
$b$Most mortgages for property in Grenada come from local commercial banks and credit unions. Overseas lenders rarely lend against Caribbean property, so even buyers who live abroad usually end up borrowing locally or paying cash.

Lenders look at three things: your ability to repay, the property, and your deposit. Expect to show proof of income, often several months of bank statements and a letter from your employer or, if you are self-employed, accounts and tax returns. The property must have good title, so the lender's own lawyer will usually review the title search, and the lender will ask for an independent valuation. You will need buildings insurance in place, and many lenders also ask for life cover so the loan is repaid if something happens to you. Deposits vary by lender and by borrower; published guidance suggests some local lenders accept deposits as low as 10 per cent for residents, while non-residents are commonly asked for more.

Credit unions are often worth approaching first if you are a member. They tend to know their members well, and can be more flexible about irregular income, which matters for the self-employed and for people returning home whose earnings history is overseas.

If you plan to build rather than buy, most lenders release a construction loan in stages as the work progresses, inspecting the site before each payment. They will want approved building plans, a realistic budget and, often, quotes from your contractor before they agree.

Remember the costs on top of the loan. Stamp duty is charged on the mortgage deed as well as on the conveyance, and the lender's legal and valuation fees are normally passed to the borrower. Ask each lender for a full list of charges so you can compare offers properly.$b$,
 '[{"title":"Buying guide: financing your purchase (Terra Caribbean Grenada)","url":"https://terracaribbean.com/grenada/guides/"},{"title":"Costs on a purchase, including stamp duty on the mortgage (Forrester Law Chambers)","url":"https://forresterlc.com/?p=557"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,surveyors-valuers}'),

('gd', false, 'property-investment', 'taxes-and-transfer-costs', 'Taxes and transfer costs',
 'Stamp duty, property transfer tax, the licence fee for non-citizens and annual property tax in Grenada.',
$b$It helps to separate the one-off costs of buying and selling from the tax you pay every year as an owner.

On a purchase, the buyer pays stamp duty on the conveyance, generally quoted at about 1 per cent of the price, plus their own lawyer's fees, which published guides put at around 2 per cent of the price with VAT at 15 per cent charged on the fee. A non-citizen buyer also pays the Alien Landholding Licence fee, published at 10 per cent of the property's value.

The seller pays the property transfer tax, set by the Property Transfer Tax Act. The rate depends on whether the seller is a citizen: guides published by agents and lawyers give 5 per cent for citizens of Grenada and members of the OECS, and 15 per cent for non-citizens. Under the Act, the tax is charged only on the value above EC$20,000. It is the seller's liability, and a Grenadian law firm notes that it is unlawful to shift it to the buyer, so be wary of any agreement that tries. The seller also usually pays the estate agent's commission, typically quoted at 5 per cent plus VAT.

Once you own the property, you pay annual property tax to the Inland Revenue Division under the Property Tax Act. It is charged on the assessed market value, with separate rates for land and buildings and for each class of property, such as residential, commercial and agricultural. Published examples range from nothing for agricultural land to 0.5 per cent of value for commercial land. Grenada does not charge capital gains tax on a sale.

Because these figures are set by law and occasionally change, ask your lawyer for a written estimate of every cost before you sign the sale agreement.$b$,
 '[{"title":"Property tax and Property Transfer Tax Act (Ministry of Finance, Grenada)","url":"https://www.finance.gd/index.php/taxes/28-taxes/170-property-tax"},{"title":"Taxes and fees for buyers and sellers (Century 21 Grenada)","url":"https://c21grenada.com/en/useful-tips/faq-when-buying-real-estate-in-grenada/"},{"title":"Who pays what on a property transfer (Forrester Law Chambers)","url":"https://forresterlc.com/?p=557"},{"title":"Grenada buying costs (Global Property Guide)","url":"https://www.globalpropertyguide.com/Caribbean/Grenada/Buying-Guide"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,accountants}'),

('gd', false, 'property-investment', 'building-on-land-you-own', 'Building on land you own',
 'Planning permission from the Planning and Development Authority, and how to manage a build in Grenada.',
$b$Owning land does not on its own give you the right to build on it. Under the Physical Planning and Development Control Act of 2002, the development of land in Grenada requires the written permission of the Planning and Development Authority, which is supported by the Physical Planning Unit. That covers new houses, extensions, changes of use and the subdivision of land. If the Authority refuses an application, the Act provides for an appeal to the Physical Planning Appeal Tribunal.

An application is normally prepared by an architect, draughtsperson or engineer and includes site plans and building drawings, with details of access, drainage and how sewage will be handled. The Authority checks the proposal against the physical plan and the building standards, and may ask for changes. Build in time for this; starting work without approval risks an order to stop or even to remove what has been built, and lenders will not release construction loans without approved plans.

Choose your contractor carefully. Ask to see buildings they have completed, speak to their past clients, and get at least two detailed written quotes that list materials and labour separately. A written contract should set out the price, a payment schedule tied to stages of completed work rather than dates, the timetable, and who is responsible for defects. Avoid paying large sums in advance.

Grenada lies within the hurricane belt, and building to the code pays for itself. Roof fixings, reinforcement in columns and beams, and window protection are where corners are most often cut, and where an independent engineer's inspection at key stages is most valuable, especially if you are overseeing the build from abroad.$b$,
 '[{"title":"Physical Planning and Development Control Act No. 25 of 2002 (UNEP LEAP summary)","url":"https://leap.unep.org/en/countries/gd/national-legislation/physical-planning-and-development-control-act-no-25-2002"},{"title":"Land Development (Control) Act 1968: planning permission","url":"https://faolex.fao.org/docs/pdf/grn4208.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{surveyors-valuers,lawyers}'),

-- ---------------------------------------------------------------- ST VINCENT AND THE GRENADINES
('vc', false, 'property-investment', 'how-a-purchase-works', 'How a purchase works',
 'The steps from an agreed price to a registered deed of conveyance in St Vincent and the Grenadines.',
$b$A property purchase in St Vincent and the Grenadines follows a sequence that will feel familiar to anyone who has bought in the United Kingdom, and it runs through lawyers on both sides.

Once you and the seller agree a price, usually with an estate agent's help, the seller's lawyer prepares a sale agreement that your own lawyer reviews before you sign. On signing, the buyer normally pays a deposit of around 10 per cent, which takes the property off the market and is held by a lawyer until completion. The agreement should say when that deposit is refundable, particularly if you are a non-citizen and need an Alien Land Holding Licence that might be refused.

Your lawyer then examines the title, producing what is known as an abstract of title: the history of the deeds recorded at the Registry, showing that the seller owns the property and what, if anything, is registered against it. Non-citizen buyers apply for their licence at the same time.

At completion, the seller signs a deed of conveyance prepared by the lawyers, you pay the balance of the price, and the deed is stamped and registered. Registration is what makes you the owner of record. Stamp duty must be paid before the deed is registered, and the Inland Revenue Department will not stamp a deed of sale while property tax on the land is in arrears, so a tax check on the seller's account is part of the process.

Purchases in Mustique and Canouan, where much of the land sits within private estates, can work differently, with additional consents and rules set by the estate company. Ask your lawyer to explain the position before you sign anything there.$b$,
 '[{"title":"Buying property in St Vincent and the Grenadines: step by step (Chestertons)","url":"https://chestertons.com/blog/property-investment/a-guide-to-buying-property-in-st-vincent-the-grenadines-the-caribbeans-best-kept-secret"},{"title":"St Vincent and the Grenadines buying guide (Global Property Guide)","url":"https://www.globalpropertyguide.com/Caribbean/St-Vincent-and-Grenadines/Buying-Guide"},{"title":"Stamp duty and property tax clearance on transfers (Expanship)","url":"https://www.expanship.com/vc/blog/st-vincent-and-the-grenadines-stamp-duty"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,estate-agents}'),

('vc', false, 'property-investment', 'title-searches-and-surveys', 'Title searches and surveys',
 'Checking ownership, family land and boundaries before you buy in St Vincent and the Grenadines.',
$b$Before you hand over the balance of the price, your lawyer should be satisfied that the seller has good title. The search runs back through the deeds recorded at the Registry to show how the property came to the seller and whether anything, such as a mortgage, a lease or a right of way, is registered against it. The result, the abstract of title, is worth reading with your lawyer rather than simply filing away.

Family land is common in St Vincent and the Grenadines, and it is where most title problems arise. Land often passes through several generations without a fresh deed being recorded, so the person selling may share it with other heirs who also need to agree, or may need to obtain probate or letters of administration first. A sale that skips this step can leave the buyer exposed to claims years later.

A survey confirms that the land on the ground matches the land on paper. A licensed land surveyor fixes the boundaries, compares them with the plans on record at the Lands and Surveys Department, and flags any encroachment. If you are buying part of a larger parcel, it will need to be surveyed and subdivided first, and subdivision of land requires planning approval in its own right.

For a house, add an independent structural inspection. In a country exposed to hurricanes and, around La Soufrière, to volcanic risk, the condition of the roof, the reinforcement in the structure and the drainage around the building all deserve a professional eye before you commit.$b$,
 '[{"title":"Abstract of title and the conveyancing process (Global Property Guide)","url":"https://www.globalpropertyguide.com/Caribbean/St-Vincent-and-Grenadines/Buying-Guide"},{"title":"Due diligence and inspections when buying in SVG (Horizon Realty)","url":"https://horizonrealty.co.uk/buy-property-saint-vincent-foreigners-guide/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,surveyors-valuers}'),

('vc', false, 'property-investment', 'buying-as-a-non-citizen', 'Buying as a non-citizen',
 'Who counts as an alien under the law, how the Alien Land Holding Licence works and how its fee is calculated.',
$b$Under the Aliens (Land-Holding Regulation) Act, land in St Vincent and the Grenadines may not be held by an "unlicensed alien", and land held without a licence can be forfeited to the Crown. Non-citizens, and companies under foreign control, therefore need an Alien Land Holding Licence before ownership can pass to them. The licence is granted by the Governor-General, applies only to the land it describes, and has no effect until it is registered at the Registry of Deeds.

Not everyone who lacks a Vincentian passport is an alien under the Act. A Commonwealth citizen who is domiciled in the country and has lived there for at least seven years is treated as belonging to St Vincent and the Grenadines, as is anyone who is or has been married to a citizen. Nationals of several OECS and nearby territories, including Grenada, Saint Lucia and Dominica, are also treated as non-aliens where their country offers the same right in return, subject to obtaining security clearance from the minister responsible for national security.

The licence fee is set by a schedule in the Act according to the value of the property. As published, a purchase worth up to EC$100,000 attracts a fee of EC$10,000; between EC$100,000 and EC$3,000,000 the fee is EC$10,000 plus 6 per cent of the value above EC$100,000; and above EC$3,000,000 it is EC$184,000 plus 4 per cent of the excess. On a EC$1,000,000 home, that works out at EC$64,000. Schedules can be amended, so ask your lawyer to confirm the current fee.

Applications are made through a local lawyer, with personal details, a police record and information about the property, and typically take a few months. Make the sale agreement conditional on the licence being granted.$b$,
 '[{"title":"Aliens (Land-Holding Regulation) Act, Chapter 316, with Schedule of fees","url":"https://faolex.fao.org/docs/pdf/stv219969.pdf"},{"title":"Alien Land Holding Licence in practice (Chestertons)","url":"https://chestertons.com/blog/property-investment/a-guide-to-buying-property-in-st-vincent-the-grenadines-the-caribbeans-best-kept-secret"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,estate-agents}'),

('vc', false, 'property-investment', 'mortgages-and-finance', 'Mortgages and finance',
 'Borrowing to buy or build in St Vincent and the Grenadines, and preparing a strong application.',
$b$Mortgages for property in St Vincent and the Grenadines come mainly from the local commercial banks and the credit unions. Lenders outside the region seldom lend against property here, so buyers living abroad usually borrow locally or buy with cash.

A lender will want to see that you can afford the repayments, that the property is good security, and that you have a deposit. Prepare proof of income, such as recent payslips and bank statements, or accounts and tax returns if you work for yourself. The lender will instruct its own valuation and will rely on your lawyer's title report, so title problems on family land can stop a mortgage as surely as a sale. Buildings insurance is a condition of almost every mortgage, and many lenders require life cover as well.

Credit unions are an important source of housing finance here and are often more flexible with members whose income is irregular. If you are a member, or can become one, it is worth asking them early.

For self-build, lenders generally release money in stages as the work is inspected, so you will need approved building plans, a costed budget and quotes from your contractor before the first payment. Keep the receipts for everything; it makes each drawdown quicker.

Non-citizens should expect to be asked for a larger deposit, and may find that some lenders will only consider the application once the Alien Land Holding Licence has been granted. Whatever your circumstances, ask each lender for a complete list of fees, covering valuation, legal costs and the stamp duty charged on the mortgage deed, and compare the total cost rather than the interest rate alone.$b$,
 '[{"title":"Financing, deposits and costs when buying in SVG (Chestertons)","url":"https://chestertons.com/blog/property-investment/a-guide-to-buying-property-in-st-vincent-the-grenadines-the-caribbeans-best-kept-secret"},{"title":"Aliens (Land-Holding Regulation) Act: licences to hold mortgages","url":"https://faolex.fao.org/docs/pdf/stv219969.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,surveyors-valuers}'),

('vc', false, 'property-investment', 'taxes-and-transfer-costs', 'Taxes and transfer costs',
 'Stamp duty on the deed, the Alien Land Holding Licence fee, legal fees and property tax in SVG.',
$b$The main government charge on a property sale in St Vincent and the Grenadines is stamp duty on the deed of conveyance, which must be paid before the deed can be registered. Published guidance most often describes it as 10 per cent of the price shared equally, with the buyer and the seller each paying 5 per cent, though some sources refer to lower rates on lower-value property. Because the basis is not consistently described, ask your lawyer or the Inland Revenue Department to confirm the exact charge for your purchase before you sign.

On top of stamp duty, the buyer pays a registration fee, generally quoted at between 0.25 and 1 per cent, and their own lawyer's fees. A non-citizen buyer also pays the Alien Land Holding Licence fee, which is set by the schedule in the Aliens (Land-Holding Regulation) Act according to the property's value: EC$10,000 for property up to EC$100,000, then EC$10,000 plus 6 per cent of the value above EC$100,000, up to EC$3,000,000. Sellers usually pay the estate agent's commission, commonly around 5 per cent.

As an owner, you will pay annual property tax to the Inland Revenue Department. Keep it up to date: the Department will not stamp a deed of sale or a mortgage while property tax is in arrears, so unpaid tax can hold up both your own future sale and any borrowing against the property.

Add these costs together before you agree a price. For a non-citizen buying a EC$1,000,000 home, the licence fee of about EC$64,000 and a 5 per cent share of stamp duty alone come to over EC$110,000, before legal fees. A written estimate from your lawyer at the outset avoids unpleasant surprises at completion.$b$,
 '[{"title":"Stamp duty on property transfers in SVG (Expanship)","url":"https://www.expanship.com/vc/blog/st-vincent-and-the-grenadines-stamp-duty"},{"title":"Aliens (Land-Holding Regulation) Act: Schedule of licence fees","url":"https://faolex.fao.org/docs/pdf/stv219969.pdf"},{"title":"Buying costs in SVG (Chestertons)","url":"https://chestertons.com/blog/property-investment/a-guide-to-buying-property-in-st-vincent-the-grenadines-the-caribbeans-best-kept-secret"},{"title":"SVG buying costs (Global Property Guide)","url":"https://www.globalpropertyguide.com/Caribbean/St-Vincent-and-Grenadines/Buying-Guide"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,accountants}'),

('vc', false, 'property-investment', 'building-on-land-you-own', 'Building on land you own',
 'Planning approval from the Physical Planning and Development Board, inspections and choosing a builder.',
$b$New buildings, extensions and changes of use in St Vincent and the Grenadines need the approval of the Physical Planning and Development Board, with applications handled by the Physical Planning Unit. Notices of applications for commercial and other significant developments are published in the Government Gazette, giving the public a chance to see the plans and object in writing, so larger projects should allow for that period.

Applications are prepared by an architect, draughtsperson or engineer and include detailed plans showing the location and design of the building. The Physical Planning Unit reviews the technical detail and puts the application to the Board, which approves or refuses it. The building regulations introduced in the mid-2000s brought staged inspections during construction, covering the setting out, the foundations before concrete is poured, the structural frame and roof, the reinforcement of ring beams, the plumbing and drains and the electrical work, ending in a final inspection before a certificate of occupancy is issued. Plan your build around these inspections; skipping them can cause problems with insurance, lending and any future sale.

Take care choosing a contractor. Visit buildings they have finished, ask previous clients about quality and timekeeping, and get detailed written quotes. Your contract should fix the price, link payments to completed stages of work rather than to calendar dates, and say who is responsible for putting right defects.

St Vincent and the Grenadines faces hurricanes and, near La Soufrière, volcanic hazards. Building properly to the code, with sound roof fixings, reinforced concrete work and good drainage, protects both your family and your investment.$b$,
 '[{"title":"Physical Planning and Development Board applications (Government Gazette, March 2024)","url":"https://legal.gov.vc/legal/images/PDF/2024Gazettes/Gazette_No_13_2024.pdf"},{"title":"Building regulations: plans, approval and staged inspections (Searchlight)","url":"https://searchlight.vc/features/2006/12/01/submit-three-copies-of-detailed-plans"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{surveyors-valuers,lawyers}');
