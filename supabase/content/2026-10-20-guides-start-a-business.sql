-- ============================================================================
-- ISLAND CONNECT: guides, "Start a business" (Grenada and St Vincent and the Grenadines)
-- Checked against official and published sources on 20 October 2026. Review due April 2027.
-- Run ONCE in Supabase > SQL Editor. Safe to run again: it replaces these twelve articles.
-- ============================================================================

delete from public.articles
where section = 'start-a-business' and country_code in ('gd', 'vc')
  and slug in ('choosing-a-structure', 'registering', 'tax-and-social-security', 'licences', 'finance', 'incentives');

insert into public.articles (country_code, is_regional, section, slug, title, summary, body, sources, verified_at, verified_by, next_review_at, status, related_category_slugs)
values

-- ---------------------------------------------------------------- GRENADA
('gd', false, 'start-a-business', 'choosing-a-structure', 'Choosing a structure',
 'Sole trader, partnership or company: what each means in Grenada and when each one makes sense.',
$b$Most new businesses in Grenada start as sole traders, and for good reason. It is the cheapest and quickest way to trade legally. If you work under a name other than your own, such as "Island Fresh Juices" rather than "Marcia Joseph", the Registration of Business Names Act requires you to register that name with the Corporate Affairs and Intellectual Property Office (CAIPO). Legally, though, you and the business are the same person. You keep the profits and pay income tax on them personally, and if the business runs up debts you cannot pay, creditors can pursue your own savings and property. The business cannot own land or sign a contract in its own name.

A partnership works the same way for two or more people trading together, and is registered at CAIPO in much the same manner. Each partner is usually liable for the debts of the whole business, which is why a written partnership agreement, prepared or at least reviewed by a lawyer, matters more than most people expect. It should cover who puts in what money, how profits are shared and what happens if one partner wants to leave.

A company, incorporated under the Companies Act, is a separate legal person. It can own property, borrow, employ staff and sign contracts in its own name, and the shareholders' risk is generally limited to what they put in. In return there is more paperwork: a registered office, statutory registers, annual filings with CAIPO and corporation tax returns with the Inland Revenue Division. A company starts to make sense when you are taking on real financial risk, bringing in investors, borrowing seriously from a bank or bidding for contracts with larger clients who prefer to deal with a company.

There is no penalty for starting small and incorporating later, and many businesses do exactly that once they have proved the idea. If you are unsure, an hour with an accountant or lawyer before you register usually costs far less than unpicking the wrong structure afterwards.$b$,
 '[{"title":"Grenada Corporate Registry Act and the Acts it administers (Parliament of Grenada)","url":"https://grenadaparliament.gd/wp-content/uploads/2021/08/Cap128B-GRENADA-CORPORATE-REGISTRY-ACT.pdf"},{"title":"Grenada Investment Development Corporation: business development services","url":"https://businessviewcaribbean.com/?p=18534"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants,lawyers}'),

('gd', false, 'start-a-business', 'registering', 'Registering',
 'How to register a business name or incorporate a company at CAIPO, and the registrations that follow.',
$b$Registration happens at the Corporate Affairs and Intellectual Property Office (CAIPO) in St George's, which keeps the official registers of business names and companies under the Grenada Corporate Registry Act. Filings can be made at the office or through CAIPO's online services.

The first step for any business is a name search. You give CAIPO one or more proposed names, and it confirms whether they are available. You can then reserve the approved name so that nobody else registers it while you prepare your papers. The fees for searching and reserving are small, but they change from time to time, so check the current figures with CAIPO when you apply.

For a sole trader or partnership, you then register the business name. The application records who you are, the business name, what the business does, where it operates, who owns it and the date it started trading. Once accepted, you receive a certificate of registration, which banks, the Inland Revenue Division and many suppliers will ask to see.

For a company, you file Articles of Incorporation together with notices of the registered office and the directors. The Articles must describe the nature of the business. When everything is in order, CAIPO issues a Certificate of Incorporation and the company legally exists from that date. Most people use a lawyer for this step, particularly if there will be several shareholders.

Registration at CAIPO is not the end. Every business must also register with the Inland Revenue Division for a Taxpayer Identification Number, which can be done online through the G-TAX portal or at the IRD office on the Carenage, and with the National Insurance Scheme. The Grenada Investment Development Corporation (GIDC) offers help with business and company registration and with preparing a business plan, which is worth using if this is your first business.$b$,
 '[{"title":"Grenada Corporate Registry Act (Parliament of Grenada)","url":"https://grenadaparliament.gd/wp-content/uploads/2021/08/Cap128B-GRENADA-CORPORATE-REGISTRY-ACT.pdf"},{"title":"G-TAX: Grenada Inland Revenue Division online services","url":"https://tax.gov.gd"},{"title":"National Insurance Scheme Grenada","url":"https://nisgrenada.org/"},{"title":"GIDC business development and registration support","url":"https://businessviewcaribbean.com/?p=18534"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,accountants}'),

('gd', false, 'start-a-business', 'tax-and-social-security', 'Tax and social security',
 'Registering with the Inland Revenue Division, when VAT applies, and National Insurance for you and your staff.',
$b$The Inland Revenue Division (IRD) has been clear that every business in Grenada must be registered with it for tax purposes, whatever its size. Under the Tax Administration Act of 2016, failing to register carries a penalty of $2,500. Registration gives you a Taxpayer Identification Number (TIN), which you will need for licences, bank accounts and government contracts. Since January 2024 the IRD has run its services through G-TAX, an online portal at tax.gov.gd, where you can register, file returns and request tax clearance.

Value Added Tax applies once a business's taxable supplies pass EC$300,000 in a twelve-month period, or are reasonably expected to. VAT-registered businesses charge VAT at the standard rate of 15 per cent, claim back the VAT they pay on business purchases, file regular returns, and must display their VAT registration certificate where customers can see it. Smaller businesses can sometimes register voluntarily if the IRD agrees. Because thresholds and rates are set by law and do change, confirm the current figures with the IRD before you rely on them.

If you employ staff, you must deduct PAYE income tax from their pay and pass it to the IRD each month. You must also register as an employer with the National Insurance Scheme (NIS) and pay contributions on their earnings. The combined rate was 13 per cent in 2025, split between employer and employee, and published guidance for 2026 puts it at 14 per cent, with 7.5 per cent paid by the employer and 6.5 per cent deducted from the employee. Contributions are due within fourteen days of the end of each month, and late payment attracts a 10 per cent surcharge plus monthly interest.

Self-employed people must register with the NIS and pay contributions themselves. The NIS currently gives the self-employed rate as 13.5 per cent of gross earnings, and contributing in one year is what qualifies you for benefits in the next. Payments and records can be managed online through my.nisgrenada.org.$b$,
 '[{"title":"G-TAX: Grenada Inland Revenue Division online services","url":"https://tax.gov.gd"},{"title":"VAT and the consumer (Ministry of Finance, Grenada)","url":"https://www.finance.gd/index.php/taxes/28-taxes/172-vat-and-the-consumer"},{"title":"IRD reminder that all businesses must register, Tax Administration Act 2016 penalty (NOW Grenada)","url":"https://nowgrenada.com/2019/07/ird-gta-and-rgpf-encourage-compliance-among-motor-rental-operators/"},{"title":"National Insurance Scheme Grenada: contributors and self-employed rate","url":"https://nisgrenada.org/"},{"title":"NIS contribution rate and payment deadlines for 2025 (NOW Grenada)","url":"https://nowgrenada.com/2025/01/the-nis-contribution-rate-is-13-for-2025/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants}'),

('gd', false, 'start-a-business', 'licences', 'Licences',
 'Which businesses need a licence in Grenada, from tourism and taxis to food and alcohol.',
$b$Which licences you need depends entirely on what your business does, so it is worth checking before you spend money on premises or equipment.

Tourism businesses are licensed by the Grenada Tourism Authority (GTA) under the Grenada Tourism Authority Act, No. 42 of 2013. That covers taxi drivers, tour operators, tourism attractions, watersports operators, car rental operators, tourist guides and accommodation, from hotels and guest houses to villas, apartments and cottages. Licences are renewed every year through the GTA's Quality Assurance Department, and the GTA only promotes licensed businesses. Car rental operators also need a Taxpayer Identification Number from the Inland Revenue Division before their licence can be approved. If you plan to drive or run tours through Island Connect, your GTA licence is one of the documents we will ask to see.

Anyone handling food for sale, whether cooking, serving, packing or tending bar, needs a food handler's certificate from the Ministry of Health. Premises where food is prepared or sold are also subject to environmental health inspection, so speak to the Ministry's environmental health officers before fitting out a kitchen.

Selling alcohol requires a liquor dealer's licence under the Liquor Dealers' Licences Act. Applications are heard at quarterly licensing sessions held for each parish, and the dates are announced in the Government Gazette.

Vehicles used for hire, haulage or rental must carry the right registration and pass inspection. In 2024 the government announced that vehicle licensing and inspection would move away from the Royal Grenada Police Force, so confirm the current office and procedure before you buy or import a vehicle for business use.

Regulated professions and financial services, such as pharmacies, banking, insurance and money transfer, each have their own regulator and licensing rules. A short conversation with the relevant ministry or authority at the planning stage can save a great deal of time later.$b$,
 '[{"title":"GTA tourism enterprise licences under the GTA Act No. 42 of 2013 (NOW Grenada)","url":"https://nowgrenada.com/?p=83220"},{"title":"GTA licensing of tourism enterprises including restaurants (NOW Grenada)","url":"https://nowgrenada.com/?p=18542"},{"title":"Car rental operators need a TIN before GTA licensing (NOW Grenada)","url":"https://nowgrenada.com/2019/07/ird-gta-and-rgpf-encourage-compliance-among-motor-rental-operators/"},{"title":"Government Gazette notices of Liquor Dealers'' Licensing Sessions","url":"https://grenadaparliament.gd/wp-content/uploads/2026/06/No.-29-of-2026-Friday-26th-June-2026.pdf"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers}'),

('gd', false, 'start-a-business', 'finance', 'Finance',
 'Where small businesses in Grenada find money to start or grow, and what lenders will ask for.',
$b$Most small businesses in Grenada are started with the owner's own savings, help from family, or a modest loan, and it pays to know what each source of finance expects before you ask.

Commercial banks, including Republic Bank Grenada and the Grenada Co-operative Bank, offer business accounts, overdrafts and loans. Credit unions are often more willing to lend to new and small businesses, particularly to members with a savings history, and their terms can be more flexible. The Grenada Development Bank exists to finance development and small enterprise, and is worth approaching for projects that commercial banks consider too small or too new.

Whoever you approach, expect to be asked for the same things: a clear business plan with realistic figures, your CAIPO registration certificate, your Taxpayer Identification Number and evidence that your tax and National Insurance affairs are up to date, details of any security you can offer, and records of income if you are already trading. Lenders are far more comfortable with a business that keeps proper books from the start, even simple ones.

The Grenada Investment Development Corporation (GIDC) runs a business development service for small and medium-sized enterprises. It helps with business plans and offers training in financial management, bookkeeping, customer service, customs procedures and digital business. A business plan prepared with the GIDC's help tends to be taken more seriously by lenders.

Grant programmes for small businesses appear from time to time, often funded by regional or international partners, and usually run for a fixed period. Ask the GIDC what is open when you are ready to apply, and be wary of anyone who charges a fee to "guarantee" a grant.$b$,
 '[{"title":"GIDC business development: business plans and SME training (Business View Caribbean, July 2026)","url":"https://businessviewcaribbean.com/?p=18534"},{"title":"National Insurance Scheme Grenada: payment banks","url":"https://nisgrenada.org/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants}'),

('gd', false, 'start-a-business', 'incentives', 'Incentives',
 'How Grenada''s investment incentives work, which sectors they favour and how to apply through the GIDC.',
$b$Grenada's investment incentives are handled by the Grenada Investment Development Corporation (GIDC), the government's investment promotion agency. Rather than a fixed menu of benefits, Grenada operates a performance-based regime: each proposal is assessed on its likely contribution to the economy, and larger investments with more jobs, exports or local spending attract more support.

The incentives available can include relief from customs duties on equipment and materials brought in for an approved project, investment allowances and tax credits. The GIDC gives priority to tourism, agribusiness, health and wellness, information and communications technology, renewable energy and the creative industries, though projects in other sectors can still apply.

The practical route is to contact the GIDC with a written proposal that sets out what you plan to do, how much you will invest, how many people you expect to employ and what you will need to import. The GIDC evaluates it and advises on what you may qualify for. Concessions must be approved before you import or buy, because relief is not normally granted retrospectively on goods that have already cleared customs.

For smaller businesses, the most valuable support is often the GIDC's business development service rather than tax relief: help with business plans and registration, and training in bookkeeping, customs procedures and digital business. If you are just starting out, begin there and ask whether any incentive applies to your plans.$b$,
 '[{"title":"GIDC: performance-based incentive regime and priority sectors (Business View Caribbean, July 2026)","url":"https://businessviewcaribbean.com/?p=18534"},{"title":"GIDC: duty relief, investment allowances and tax credits (Business View Caribbean, June 2024)","url":"https://businessviewcaribbean.com/digital-magazines/june-2024/44/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants,lawyers}'),

-- ---------------------------------------------------------------- ST VINCENT AND THE GRENADINES
('vc', false, 'start-a-business', 'choosing-a-structure', 'Choosing a structure',
 'Sole proprietor, partnership or company: what each means in St Vincent and the Grenadines.',
$b$In St Vincent and the Grenadines, the simplest way to start is as a sole proprietor, registering your business name with the Commerce and Intellectual Property Office (CIPO) in Kingstown. You and the business are legally the same person: profits are taxed as your personal income, and you are personally responsible for the business's debts. It suits most one-person trades and services, and it is quick and inexpensive to set up.

A partnership is the same arrangement for two or more people, and each partner is generally liable for the debts of the whole business. Put the terms in writing before you start, covering money put in, how profits are shared and what happens if someone leaves, and have a lawyer review it.

A domestic company, incorporated under the Companies Act, is a separate legal person that can own property, borrow and contract in its own name, with shareholders' risk generally limited to their investment. It brings more administration, including a registered office, annual filings and corporation tax returns to the Inland Revenue Department. Since 1 January 2023 the corporation tax rate and the top rate of personal income tax have both been 28 per cent, so the choice is rarely about tax rates alone. It is more often about limiting personal risk, bringing in investors or meeting the expectations of larger customers.

Overseas companies that want to trade locally register as external companies. Business Companies formed through the Financial Services Authority are designed for international business and are not the right vehicle for trading on St Vincent or in the Grenadines.

Starting as a sole proprietor and incorporating later is common and perfectly sensible. Take advice from an accountant or lawyer if you expect to borrow heavily, employ several people or take on investors.$b$,
 '[{"title":"Commerce and Intellectual Property Office (CIPO): business names","url":"https://cipo.gov.vc/index.php/business-name-forms"},{"title":"Corporate and personal income tax reduced to 28% from 1 January 2023 (Ministry of Finance)","url":"https://finance.gov.vc/finance/index.php/news?start=6"},{"title":"Business structures in St Vincent and the Grenadines (iGuide)","url":"https://www.theiguides.org/public-docs/guides/svg"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants,lawyers}'),

('vc', false, 'start-a-business', 'registering', 'Registering',
 'Registering a business name or company with CIPO in Kingstown, then with the IRD and NIS.',
$b$Businesses in St Vincent and the Grenadines are registered with the Commerce and Intellectual Property Office (CIPO), on the first floor of Brewster's Building, McCoy Street, Kingstown. The office can be reached on +1 784 456 1516, and its forms are published on cipo.gov.vc.

A sole proprietor or partnership completes the Application for Registration of a Business, giving the business name, the owners, the nature of the business and where it operates. CIPO also publishes the forms you will need later: one for changing the registered particulars, such as a new address or partner, and a Notice of Cessation for when a business closes. Keeping these up to date matters, because the register is what banks and government departments check.

A company starts with approval of its proposed name, followed by the incorporation documents and notices of its registered office and directors. CIPO publishes a list of lawyers and local agents, and most people use one for incorporation, particularly when there are several shareholders.

Registering with CIPO does not register you for tax or social security. Each business must separately register with the Inland Revenue Department (IRD) on Halifax Street, Kingstown, which issues a Taxpayer Identification Number for the taxes that apply to you, and with the National Insurance Services (NIS). The IRD's online services are available through its e-Tax platform.

If you would like help with a business plan before you register, the Centre for Enterprise Development (CED) offers business counselling and plan preparation, and Invest SVG can advise on larger or export-focused projects.$b$,
 '[{"title":"CIPO business name forms and office details","url":"https://cipo.gov.vc/index.php/business-name-forms"},{"title":"Register your business in St Vincent and the Grenadines (iGuide)","url":"https://www.theiguides.org/public-docs/guides/svg"},{"title":"Inland Revenue Department e-Tax platform","url":"https://etax.gov.vc"},{"title":"National Insurance Services","url":"http://www.nissvg.org"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers,accountants}'),

('vc', false, 'start-a-business', 'tax-and-social-security', 'Tax and social security',
 'Income tax, VAT and National Insurance in St Vincent and the Grenadines, including the 2026 NIS rates.',
$b$Every business needs a Taxpayer Identification Number (TIN) from the Inland Revenue Department (IRD), which also administers income tax, PAYE and Value Added Tax. Returns and payments can be made through the IRD's e-Tax platform.

Since 1 January 2023, the corporation tax rate and the top rate of personal income tax have been 28 per cent, reduced from 30 per cent, and the standard personal deduction rose from $20,000 to $22,000. Sole proprietors pay personal income tax on their business profits; companies pay corporation tax on theirs.

A business must register for VAT once its taxable sales reach EC$300,000 in a twelve-month period. The standard rate is 16 per cent, with a reduced rate of 11 per cent for hotel accommodation. VAT-registered businesses charge VAT on their sales, reclaim the VAT on their business purchases and file monthly returns. Thresholds and rates are set by law and do change, so confirm them with the IRD before you rely on them.

National Insurance is a separate registration with the National Insurance Services (NIS), and registering with the IRD does not register you with the NIS. Contribution rates have been rising under a reform programme that began in 2024. From 1 January 2026 the rate for employees is 14 per cent of insurable earnings, of which the employer pays 7.5 per cent and the employee 6.5 per cent. Self-employed contributors pay 13.5 per cent and voluntary contributors 12.84 per cent.

Employers deduct PAYE and the employee's NIS share from wages and pay both, together with the employer's NIS share, each month. Self-employed people, including drivers and tradespeople working for themselves, are strongly encouraged to contribute: it is the only route to an NIS pension and other benefits, and good standing with the NIS is a condition of some government incentives.$b$,
 '[{"title":"Corporate and personal income tax reduced to 28% from 1 January 2023 (Ministry of Finance)","url":"https://finance.gov.vc/finance/index.php/news?start=6"},{"title":"NIS contribution rates from 1 January 2026 (NIS announcement, One News SVG)","url":"https://onenewsstvincent.com/2025/12/30/all-employers-and-employees-reminded-of-nis-increase-from-jan-1-2026/"},{"title":"Inland Revenue Department e-Tax platform","url":"https://etax.gov.vc"},{"title":"National Insurance Services","url":"http://www.nissvg.org"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants}'),

('vc', false, 'start-a-business', 'licences', 'Licences',
 'The Tourism Approved licence for accommodation, taxis, tours and rentals, and other licences to check.',
$b$If your business serves visitors, the most important licence in St Vincent and the Grenadines is the Tourism Approved licence issued by the St Vincent and the Grenadines Tourism Authority (SVGTA). The Tourism Authority Act makes it an offence to provide a tourism service or run a tourism establishment without a licence, and the Tourism Licensing Regulations that came into force in January 2014 set out how services are registered and approved.

Tourism Approved licences are issued for accommodation, taxi operators, tour operators, tour guides and short-term vehicle rentals. They are renewed every year, and approval depends on meeting the published standards for each service, including the National Standard for Taxi Services and the codes of practice for tour guides and tour operators. Taxi and tour vehicles are inspected as part of the process. The SVGTA's offices are on the second floor of the NIS Building, Upper Bay Street, Kingstown.

The licence matters commercially too. Licensed operators are the ones the SVGTA promotes, access to cruise passengers at the port depends on certification, and the Taxi Operators Fiscal Incentive Programme is open only to operators who have held the licence for the last three years. If you plan to take rides or tours through Island Connect, your Tourism Approved licence is one of the documents we will ask to see.

Other activities need their own permissions. Food businesses should speak to the environmental health services of the Ministry of Health before fitting out premises; selling alcohol requires a liquor licence; and regulated sectors such as financial services and pharmacies each have their own regulator. Check with the relevant ministry or authority before you commit to premises or equipment.$b$,
 '[{"title":"Tourism Approved licensing and service standards (Discover SVG)","url":"https://discoversvg.com/?p=3634"},{"title":"Tourism Approved licences under the Tourism Authority Act, Section 30 (iWitness News)","url":"https://www.iwnsvg.com/2020/12/08/55-tourist-accommodations-approved-for-2021/"},{"title":"Taxi Operators Fiscal Incentive Programme requirements (Ministry of Tourism)","url":"https://tourism.gov.vc/tourism/index.php/maxin"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{lawyers}'),

('vc', false, 'start-a-business', 'finance', 'Finance',
 'Banks, credit unions and the business-support organisations that help Vincentian entrepreneurs find money.',
$b$Finance for small businesses in St Vincent and the Grenadines comes from a familiar mix: savings, family, banks, credit unions and occasional grant programmes. Knowing who supports what saves a great deal of time.

The Centre for Enterprise Development (CED) is the first stop for most new entrepreneurs. It offers business counselling and help preparing a business plan, and it runs training that some lenders require before they will release funds. The CED has managed government grant programmes for young entrepreneurs, such as PRYME, and has partnered with credit unions on micro-loans: one programme with the SVG Police Co-operative Credit Union offered start-ups and small businesses loans of up to EC$10,000 for working capital or equipment, after a business plan and a one-week CED training workshop. Programmes like these open and close, so ask the CED what is currently available.

Commercial banks, including the Bank of St Vincent and the Grenadines, and the country's credit unions offer business accounts and loans. Expect to provide a business plan, your CIPO registration, your Taxpayer Identification Number, evidence that your tax and National Insurance contributions are up to date, and details of any security.

Invest SVG helps established businesses, particularly exporters, to find funding, including regional grant schemes such as those run with the Caribbean Export Development Agency, which have usually required a registered business rather than a start-up.

The government has announced plans to establish a National Development Bank, and the CED has positioned itself as a route for entrepreneurs to prepare for it. Watch for announcements, and keep proper records from the start: they are the first thing any lender will ask to see.$b$,
 '[{"title":"CED micro-loan programme with the SVG Police Co-operative Credit Union (Government of SVG)","url":"https://www.gov.vc/index.php/media-center/3208-ced-partners-with-local-credit-union-to-help-entrepreneurs"},{"title":"CED 2026–2030 Strategic Plan and the planned National Development Bank (Caribbean Development Bank)","url":"https://www.caribank.org/node/12205"},{"title":"PRYME grants for young entrepreneurs (ECLAC programme database)","url":"https://dds.cepal.org/bpsnc/programme?id=187"},{"title":"Invest SVG and the Direct Assistance Grant Scheme (Government of SVG)","url":"https://www.gov.vc/index.php/home/cabinet/2-uncategorised/816-invest-svg-caribbean-export-development-agency-host-direct-assistance-grant-scheme-sensitization-workshop"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants}'),

('vc', false, 'start-a-business', 'incentives', 'Incentives',
 'Investment concessions through Invest SVG, small-business incentives, and duty-free taxis for licensed operators.',
$b$St Vincent and the Grenadines offers incentives through several Acts, with applications for investment concessions made through Invest SVG and approved by Cabinet. The Fiscal Incentives Act covers manufacturing and light manufacturing, the Information Communication Technology Incentives Act encourages investment in technology businesses, and the Small Business Development Act provides incentives for small and micro businesses. The Department of Industry also handles duty-free concessions for manufacturers and agro-processors.

For anyone working in transport, the most directly useful scheme is the Taxi Operators Fiscal Incentive Programme, announced by the Ministry of Tourism in October 2023. Operators who have run a taxi for three years or more can apply for exemption from import duty, excise duty, vehicle charge and VAT on a new taxi. To qualify, you must hold the SVG Tourism Authority's Tourism Approved licence and have paid its fees for the past three consecutive years, be in good standing with the Inland Revenue Department, and be registered with and up to date at the National Insurance Services. The vehicle must be used mainly for tours and general taxi services, and you must follow the National Standard for Taxi Services. Applications go to the Permanent Secretary in the Ministry of Tourism with the licence, a quotation for the vehicle and its specifications.

Concessions are granted before goods are imported, not afterwards, so apply early and do not ship anything until approval is confirmed in writing.

Smaller businesses should also talk to the Centre for Enterprise Development, which helps prepare the business plans and applications these programmes require.$b$,
 '[{"title":"Investment concessions and incentive Acts through Invest SVG (iGuide)","url":"https://www.theiguides.org/public-docs/guides/svg"},{"title":"Taxi Operators Fiscal Incentive Programme (Ministry of Tourism)","url":"https://tourism.gov.vc/tourism/index.php/maxin"},{"title":"Taxi concession application form (Ministry of Tourism)","url":"https://tourism.gov.vc/tourism/images/stories/PDF/Updated_TAXI_Fiscal_Incentive_Application_Form_FINAL.pdf"},{"title":"Duty-free taxi concessions announced, October 2023 (One News SVG)","url":"https://onenewsstvincent.com/2023/10/06/svg-govt-announces-duty-free-concessions-for-taxi-operators/"}]'::jsonb,
 '2026-10-20', 'Island Connect editorial team', '2027-04-20', 'published', '{accountants,lawyers}');
