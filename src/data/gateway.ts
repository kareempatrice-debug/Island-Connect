/*
 * Island Connect Gateway: step-by-step journeys for returning home, starting a business and
 * buying property, with the agencies that handle each step. Facts come from the checked guides
 * (supabase/content, reviewed October 2026). Each step says honestly whether it can be done
 * from abroad, and how.
 */

export type HowCode = "online" | "island-connect" | "agent" | "in-person";
export const HOW: Record<HowCode, { label: string; tone: "good" | "ok" | "warn" }> = {
  online: { label: "From abroad: online with the agency", tone: "good" },
  "island-connect": { label: "From abroad: through Island Connect", tone: "good" },
  agent: { label: "From abroad: through a local lawyer or agent", tone: "ok" },
  "in-person": { label: "Needs you, or someone you appoint, in person", tone: "warn" },
};

export interface Step {
  id: string;
  title: string;
  text: string;
  how: HowCode;
  agency?: string; // agencies.slug
  service?: string; // a service below that can be sent through Island Connect
  links?: { label: string; href: string }[];
  guide?: { section: string; slug: string; label: string };
  directory?: { category: string; label: string };
  checker?: boolean; // show the eligibility checker
}

export interface Journey {
  slug: string;
  title: string;
  short: string;
  intro: string;
  steps: Step[];
}

export interface Field { name: string; label: string; type: "text" | "number" | "date" | "textarea" | "select"; required?: boolean; options?: string[]; hint?: string }
export interface Service {
  slug: string;
  country: "gd" | "vc";
  agency: string;
  kind: "application" | "appointment" | "question";
  title: string;
  intro: string;
  fields: Field[];
  documents: string[];
}

const personFields: Field[] = [
  { name: "full_name", label: "Full name, as on your passport", type: "text", required: true },
  { name: "phone", label: "Phone or WhatsApp, with country code", type: "text", required: true },
  { name: "country_now", label: "Country you live in now", type: "text", required: true },
];

export const services: Service[] = [
  // ---------- Grenada ----------
  {
    slug: "gd-rn-concession", country: "gd", agency: "gd-returning-nationals", kind: "application",
    title: "Apply for returning national concessions",
    intro: "For Grenadian nationals who have lived abroad for at least seven continuous years and are returning to live permanently. Concessions cover household and personal effects up to EC$75,000 free of duty and tax, and 50% off one vehicle per family. Claims must be made within three months before or after your return.",
    fields: [
      ...personFields,
      { name: "years_abroad", label: "Years you have lived abroad continuously", type: "number", required: true },
      { name: "return_date", label: "Date you plan to return (or returned)", type: "date", required: true },
      { name: "goods_value", label: "Estimated value of household and personal effects (EC$)", type: "number" },
      { name: "vehicle", label: "Vehicle", type: "select", options: ["No vehicle", "Importing a vehicle", "Buying a vehicle in Grenada"], required: true },
      { name: "notes", label: "Anything else the Bureau should know", type: "textarea" },
    ],
    documents: ["Grenadian passport or birth certificate", "Proof of seven years abroad (tax returns, payslips, tenancy or bank statements)", "One-way ticket or travel booking", "Packing list of your goods with values"],
  },
  {
    slug: "gd-rn-appointment", country: "gd", agency: "gd-returning-nationals", kind: "appointment",
    title: "Book an appointment with the Returning Nationals Bureau",
    intro: "Ask the Bureau for an appointment to discuss or complete your concession claim. Give a few dates that suit you; the Bureau confirms one.",
    fields: [...personFields, { name: "preferred_dates", label: "Dates and times that suit you", type: "textarea", required: true }, { name: "topic", label: "What the appointment is about", type: "textarea", required: true }],
    documents: [],
  },
  {
    slug: "gd-caipo-help", country: "gd", agency: "gd-caipo", kind: "question",
    title: "Ask CAIPO about registering your business",
    intro: "Questions about name searches, registering a business name or incorporating a company in Grenada. CAIPO is the official registry; companies also need a local registered agent.",
    fields: [...personFields, { name: "business_name", label: "Proposed business name(s)", type: "text", required: true }, { name: "structure", label: "Type of business", type: "select", options: ["Sole trader (business name)", "Partnership", "Company", "Not sure yet"], required: true }, { name: "question", label: "Your question", type: "textarea", required: true }],
    documents: [],
  },
  {
    slug: "gd-gidc-incentives", country: "gd", agency: "gd-gidc", kind: "question",
    title: "Ask GIDC about investment incentives",
    intro: "The Grenada Investment Development Corporation advises investors on incentives and approvals. Describe your project and the help you are looking for.",
    fields: [...personFields, { name: "project", label: "Your project", type: "textarea", required: true }, { name: "investment", label: "Approximate investment (EC$ or US$)", type: "text" }, { name: "jobs", label: "Jobs you expect to create", type: "number" }],
    documents: ["Business plan or project summary (optional)"],
  },
  {
    slug: "gd-pda-permit", country: "gd", agency: "gd-pda", kind: "question",
    title: "Ask the Planning and Development Authority about building",
    intro: "Questions about planning permission for a new house, extension, change of use or subdivision in Grenada.",
    fields: [...personFields, { name: "location", label: "Where the land is", type: "text", required: true }, { name: "question", label: "What you plan to build, and your question", type: "textarea", required: true }],
    documents: ["Site plan or drawings (optional)"],
  },
  // ---------- St Vincent and the Grenadines ----------
  {
    slug: "vc-customs-rn", country: "vc", agency: "vc-customs", kind: "application",
    title: "Apply for returning national concessions",
    intro: "For Vincentians who have lived abroad for at least ten years and are returning to settle permanently. Household and personal effects come in free of all taxes (one of each item you reasonably need), and one vehicle per household at 25% of the normal import duty, excise and VAT. Apply within one year of returning.",
    fields: [
      ...personFields,
      { name: "years_abroad", label: "Years you have lived abroad", type: "number", required: true },
      { name: "return_date", label: "Date you plan to return (or returned)", type: "date", required: true },
      { name: "settling_evidence", label: "How you are settling (house purchase, job, business, land)", type: "textarea", required: true },
      { name: "vehicle", label: "Vehicle", type: "select", options: ["No vehicle", "Importing a vehicle", "Buying from a tax-free warehouse in St Vincent"], required: true },
      { name: "notes", label: "Anything else Customs should know", type: "textarea" },
    ],
    documents: ["Passport or birth certificate", "Proof of ten years abroad (payslips, school or bank records, residence permits)", "Proof you are settling (house contract, land title, job offer or business papers)", "List of household and personal effects, with makes, models and serial numbers"],
  },
  {
    slug: "vc-customs-appointment", country: "vc", agency: "vc-customs", kind: "appointment",
    title: "Book an interview with Customs",
    intro: "Customs may invite you to an interview about your concession. Suggest dates that suit you; Customs confirms one.",
    fields: [...personFields, { name: "preferred_dates", label: "Dates and times that suit you", type: "textarea", required: true }, { name: "topic", label: "What the interview is about", type: "textarea", required: true }],
    documents: [],
  },
  {
    slug: "vc-cipo-help", country: "vc", agency: "vc-cipo", kind: "question",
    title: "Ask CIPO about registering your business",
    intro: "Questions about name searches, business names and companies in St Vincent and the Grenadines. CIPO runs the official registry and its one-stop shop.",
    fields: [...personFields, { name: "business_name", label: "Proposed business name(s)", type: "text", required: true }, { name: "structure", label: "Type of business", type: "select", options: ["Sole trader (business name)", "Partnership", "Company", "Not sure yet"], required: true }, { name: "question", label: "Your question", type: "textarea", required: true }],
    documents: [],
  },
  {
    slug: "vc-invest-incentives", country: "vc", agency: "vc-invest-svg", kind: "question",
    title: "Ask Invest SVG about incentives",
    intro: "Invest SVG supports investors with incentives and approvals. Describe your project and the help you are looking for.",
    fields: [...personFields, { name: "project", label: "Your project", type: "textarea", required: true }, { name: "investment", label: "Approximate investment (EC$ or US$)", type: "text" }, { name: "jobs", label: "Jobs you expect to create", type: "number" }],
    documents: ["Business plan or project summary (optional)"],
  },
  {
    slug: "vc-planning-permit", country: "vc", agency: "vc-physical-planning", kind: "question",
    title: "Ask the Physical Planning Unit about building",
    intro: "Questions about approval for a new house, extension, change of use or subdivision in St Vincent and the Grenadines.",
    fields: [...personFields, { name: "location", label: "Where the land is", type: "text", required: true }, { name: "question", label: "What you plan to build, and your question", type: "textarea", required: true }],
    documents: ["Site plan or drawings (optional)"],
  },
];

export const journeys: Record<"gd" | "vc", Journey[]> = {
  gd: [
    {
      slug: "return-home", title: "Return home", short: "Concessions, shipping, settling in",
      intro: "Moving back to Grenada after years abroad. Check what you qualify for, apply for your concessions, and set up everything you need, most of it before you land.",
      steps: [
        { id: "check-eligibility", title: "Check what you qualify for", how: "island-connect", checker: true, text: "Grenadian nationals who have lived abroad continuously for at least seven years and are returning to live permanently can claim concessions on household goods and a vehicle." },
        { id: "gather-proof", title: "Gather your documents", how: "island-connect", text: "Your passport or birth certificate, proof of your years abroad such as tax returns, payslips and tenancy or bank statements, your travel booking, and a packing list of your goods with values. Keep copies; you will use them again." },
        { id: "apply-concessions", title: "Apply for your concessions", how: "island-connect", agency: "gd-returning-nationals", service: "gd-rn-concession", text: "The Returning Nationals Facilitation Bureau at the Ministry of Finance handles claims; Customs and Immigration no longer do. Claims must be made within three months before or after your return.", guide: { section: "returning-home", slug: "returning-national-programmes", label: "Read the guide" } },
        { id: "book-bureau", title: "Book an appointment with the Bureau", how: "island-connect", agency: "gd-returning-nationals", service: "gd-rn-appointment", text: "If the Bureau needs to see you or you want to talk your claim through, request an appointment with the dates that suit you." },
        { id: "ship-goods", title: "Ship your household goods", how: "agent", text: "Up to EC$75,000 of household and personal effects come in free of duty and tax. Ship no more than about three months before you arrive, and use a customs broker to clear them. Goods cannot be sold within three years.", directory: { category: "customs-brokers", label: "Find a customs broker" }, guide: { section: "returning-home", slug: "shipping-and-customs", label: "Shipping and customs" } },
        { id: "vehicle", title: "Bring or buy a vehicle", how: "agent", text: "One vehicle per family gets a 50% concession, imported or bought locally. Check the age rules and environmental levy before you ship.", guide: { section: "returning-home", slug: "bringing-a-vehicle", label: "Bringing a vehicle" } },
        { id: "tax-number", title: "Get your tax number (TIN)", how: "online", agency: "gd-ird", text: "Register with the Inland Revenue Division online through G-TAX, or at the office on the Carenage.", links: [{ label: "G-TAX", href: "https://tax.gov.gd" }] },
        { id: "nis", title: "Register with the National Insurance Scheme", how: "online", agency: "gd-nis", text: "Needed if you will work or be self-employed. Bring your old NIS number if you had one.", links: [{ label: "NIS Grenada", href: "https://nisgrenada.org" }] },
        { id: "bank", title: "Open a bank account", how: "in-person", text: "Banks need to confirm who you are and where your money comes from. Some may start the process before you arrive; ask the bank.", directory: { category: "banks-finance", label: "Banks and credit unions" }, guide: { section: "returning-home", slug: "banking", label: "Banking" } },
        { id: "settle-in", title: "Housing, schools and healthcare", how: "agent", text: "Arrange somewhere to live, school places and a doctor.", guide: { section: "returning-home", slug: "housing", label: "Housing guide" }, directory: { category: "estate-agents", label: "Estate agents" } },
      ],
    },
    {
      slug: "start-a-business", title: "Start a business", short: "Register, tax, licences, incentives",
      intro: "Set up a business in Grenada, including from abroad. Most registration can be done online or through a local agent, so you can arrive ready to trade.",
      steps: [
        { id: "structure", title: "Choose your structure", how: "island-connect", text: "A sole trader registers a business name; a company is incorporated with articles and directors. Companies need a local registered agent.", guide: { section: "start-a-business", slug: "choosing-a-structure", label: "Choosing a structure" } },
        { id: "name", title: "Search and reserve your business name", how: "online", agency: "gd-caipo", service: "gd-caipo-help", text: "CAIPO keeps the register. Name searches and registrations can be filed through CAIPO’s online portal or in person, and a local agent can do it for you." },
        { id: "register", title: "Register the business or company", how: "agent", agency: "gd-caipo", service: "gd-caipo-help", text: "File with CAIPO. A local lawyer or registered agent can handle incorporation documents and lodge them for you while you are abroad.", directory: { category: "lawyers", label: "Find a lawyer or agent" }, guide: { section: "start-a-business", slug: "registering", label: "Registering" } },
        { id: "tax", title: "Register for tax", how: "online", agency: "gd-ird", text: "Once you have your CAIPO certificate, get a TIN from the Inland Revenue Division through G-TAX. VAT registration is required once turnover is expected to pass the threshold.", links: [{ label: "G-TAX", href: "https://tax.gov.gd" }], guide: { section: "start-a-business", slug: "tax-and-social-security", label: "Tax and social security" } },
        { id: "nis", title: "Register as an employer with NIS", how: "online", agency: "gd-nis", text: "Needed before you employ anyone, and for yourself if self-employed.", links: [{ label: "NIS Grenada", href: "https://nisgrenada.org" }] },
        { id: "licences", title: "Get the licences your trade needs", how: "agent", text: "Some trades need a licence or approval, such as tourism, food and transport businesses.", guide: { section: "start-a-business", slug: "licences", label: "Licences" } },
        { id: "bank", title: "Open a business bank account", how: "in-person", text: "Banks will ask for your registration documents and to verify the owners. Ask whether they can start the process before you arrive.", directory: { category: "banks-finance", label: "Banks and credit unions" } },
        { id: "incentives", title: "Ask about incentives", how: "island-connect", agency: "gd-gidc", service: "gd-gidc-incentives", text: "Investment incentives and approvals are handled through GIDC. Describe your project and get advice before you commit.", guide: { section: "start-a-business", slug: "incentives", label: "Incentives" } },
      ],
    },
    {
      slug: "buy-property", title: "Buy property and build", short: "Search, lawyer, title, permits",
      intro: "Buy land or a home in Grenada and build on it. A local lawyer can act for you throughout, so most of the process works from abroad.",
      steps: [
        { id: "find", title: "Find a property", how: "agent", text: "Work with an estate agent, and see the land in person or through someone you trust before you commit.", directory: { category: "estate-agents", label: "Estate agents" } },
        { id: "lawyer", title: "Appoint your own lawyer", how: "agent", text: "Your lawyer handles the agreement, deposit, title search and registration, and can act under power of attorney while you are abroad.", directory: { category: "lawyers", label: "Find a lawyer" }, guide: { section: "property-investment", slug: "how-a-purchase-works", label: "How a purchase works" } },
        { id: "title", title: "Title search and survey", how: "agent", text: "Your lawyer checks the title; a licensed surveyor confirms the boundaries.", directory: { category: "surveyors-valuers", label: "Surveyors and valuers" }, guide: { section: "property-investment", slug: "title-searches-and-surveys", label: "Title searches and surveys" } },
        { id: "licence", title: "Non-citizens: Alien Landholding Licence", how: "agent", text: "Non-citizens need a licence, applied for through a Grenadian lawyer. Citizens do not.", guide: { section: "property-investment", slug: "buying-as-a-non-citizen", label: "Buying as a non-citizen" } },
        { id: "costs", title: "Budget for taxes and costs", how: "island-connect", text: "Stamp duty, legal fees and, for non-citizens, the licence fee.", guide: { section: "property-investment", slug: "taxes-and-transfer-costs", label: "Taxes and transfer costs" } },
        { id: "build", title: "Planning permission to build", how: "island-connect", agency: "gd-pda", service: "gd-pda-permit", text: "Any new building needs written permission from the Planning and Development Authority. Ask your questions before you draw up plans.", guide: { section: "property-investment", slug: "building-on-land-you-own", label: "Building on land you own" } },
      ],
    },
  ],
  vc: [
    {
      slug: "return-home", title: "Return home", short: "Concessions, shipping, settling in",
      intro: "Moving back to St Vincent and the Grenadines after years abroad. Check what you qualify for, apply to Customs, and set up everything you need, most of it before you land.",
      steps: [
        { id: "check-eligibility", title: "Check what you qualify for", how: "island-connect", checker: true, text: "Vincentians who have lived abroad for at least ten years and are returning to settle permanently can claim duty-free concessions on household goods and a vehicle." },
        { id: "gather-proof", title: "Gather your documents", how: "island-connect", text: "Proof of your years abroad, such as payslips, school, bank or employment records and residence permits, and proof you are settling, such as a house contract, land title, job offer or business papers. Make a full list of your goods with makes, models and serial numbers." },
        { id: "apply-concessions", title: "Apply to Customs for your concessions", how: "island-connect", agency: "vc-customs", service: "vc-customs-rn", text: "Applications go in writing to the Comptroller of Customs and Excise, within one year of your return.", guide: { section: "returning-home", slug: "returning-national-programmes", label: "Read the guide" } },
        { id: "interview", title: "Book your Customs interview", how: "island-connect", agency: "vc-customs", service: "vc-customs-appointment", text: "If Customs invites you to an interview, suggest dates that suit you here." },
        { id: "ship-goods", title: "Ship your household goods", how: "agent", text: "Household and personal effects come in free of all taxes, one of each item you reasonably need. Use a customs broker. Goods must be kept for four years.", directory: { category: "customs-brokers", label: "Find a customs broker" }, guide: { section: "returning-home", slug: "shipping-and-customs", label: "Shipping and customs" } },
        { id: "vehicle", title: "Bring or buy a vehicle", how: "agent", text: "One vehicle per household, not a truck, at 25% of the normal import duty, excise and VAT. Vehicles over four years old pay the full surcharge.", guide: { section: "returning-home", slug: "bringing-a-vehicle", label: "Bringing a vehicle" } },
        { id: "tax-number", title: "Get your tax number (TIN)", how: "online", agency: "vc-ird", text: "Register with the Inland Revenue Department through its e-Tax platform or at the office in Kingstown.", links: [{ label: "SVG e-Tax", href: "https://etax.gov.vc" }] },
        { id: "nis", title: "Register with the National Insurance Services", how: "in-person", agency: "vc-nis", text: "Separate from the IRD. Needed if you will work or be self-employed.", links: [{ label: "NIS SVG", href: "https://www.nissvg.org" }] },
        { id: "bank", title: "Open a bank account", how: "in-person", text: "Banks need to confirm who you are and where your money comes from. Ask whether they can start before you arrive.", directory: { category: "banks-finance", label: "Banks and credit unions" }, guide: { section: "returning-home", slug: "banking", label: "Banking" } },
        { id: "settle-in", title: "Housing, schools and healthcare", how: "agent", text: "Arrange somewhere to live, school places and a doctor.", guide: { section: "returning-home", slug: "housing", label: "Housing guide" }, directory: { category: "estate-agents", label: "Estate agents" } },
      ],
    },
    {
      slug: "start-a-business", title: "Start a business", short: "Register, tax, licences, incentives",
      intro: "Set up a business in St Vincent and the Grenadines, including from abroad. CIPO runs a one-stop shop for registration, and a local agent can act for you.",
      steps: [
        { id: "structure", title: "Choose your structure", how: "island-connect", text: "A sole trader registers a business name; a company is incorporated with articles and directors.", guide: { section: "start-a-business", slug: "choosing-a-structure", label: "Choosing a structure" } },
        { id: "name", title: "Search and reserve your business name", how: "online", agency: "vc-cipo", service: "vc-cipo-help", text: "CIPO keeps the register and runs the one-stop shop for business registration.", links: [{ label: "CIPO", href: "https://cipo.gov.vc" }] },
        { id: "register", title: "Register the business or company", how: "online", agency: "vc-cipo", service: "vc-cipo-help", text: "File through CIPO, or have a local lawyer or agent file for you while you are abroad.", directory: { category: "lawyers", label: "Find a lawyer or agent" }, guide: { section: "start-a-business", slug: "registering", label: "Registering" } },
        { id: "tax", title: "Register for tax", how: "online", agency: "vc-ird", text: "Get a TIN from the Inland Revenue Department through e-Tax, and register for VAT when your turnover requires it.", links: [{ label: "SVG e-Tax", href: "https://etax.gov.vc" }], guide: { section: "start-a-business", slug: "tax-and-social-security", label: "Tax and social security" } },
        { id: "nis", title: "Register as an employer with NIS", how: "in-person", agency: "vc-nis", text: "Needed before you employ anyone, and for yourself if self-employed.", links: [{ label: "NIS SVG", href: "https://www.nissvg.org" }] },
        { id: "licences", title: "Get the licences your trade needs", how: "agent", text: "Some trades need a licence or approval, such as tourism, food and transport businesses.", guide: { section: "start-a-business", slug: "licences", label: "Licences" } },
        { id: "bank", title: "Open a business bank account", how: "in-person", text: "Banks will ask for your registration documents and to verify the owners.", directory: { category: "banks-finance", label: "Banks and credit unions" } },
        { id: "incentives", title: "Ask about incentives", how: "island-connect", agency: "vc-invest-svg", service: "vc-invest-incentives", text: "Invest SVG advises investors on incentives and approvals.", guide: { section: "start-a-business", slug: "incentives", label: "Incentives" } },
      ],
    },
    {
      slug: "buy-property", title: "Buy property and build", short: "Search, lawyer, title, permits",
      intro: "Buy land or a home in St Vincent and the Grenadines and build on it. A local lawyer can act for you throughout.",
      steps: [
        { id: "find", title: "Find a property", how: "agent", text: "Work with an estate agent, and see the land in person or through someone you trust.", directory: { category: "estate-agents", label: "Estate agents" } },
        { id: "lawyer", title: "Appoint your own lawyer", how: "agent", text: "Your lawyer prepares the abstract of title, handles the deposit and conveyance, and can act under power of attorney.", directory: { category: "lawyers", label: "Find a lawyer" }, guide: { section: "property-investment", slug: "how-a-purchase-works", label: "How a purchase works" } },
        { id: "title", title: "Title search and survey", how: "agent", text: "Family land is the most common source of problems; your lawyer checks every link in the chain.", directory: { category: "surveyors-valuers", label: "Surveyors and valuers" }, guide: { section: "property-investment", slug: "title-searches-and-surveys", label: "Title searches and surveys" } },
        { id: "licence", title: "Non-citizens: Alien Land Holding Licence", how: "agent", text: "Needed by non-citizens, with some exceptions such as spouses of citizens. Applied for through a local lawyer.", guide: { section: "property-investment", slug: "buying-as-a-non-citizen", label: "Buying as a non-citizen" } },
        { id: "costs", title: "Budget for taxes and costs", how: "island-connect", text: "Stamp duty on the deed, registration and legal fees, and the licence fee for non-citizens.", guide: { section: "property-investment", slug: "taxes-and-transfer-costs", label: "Taxes and transfer costs" } },
        { id: "build", title: "Approval to build", how: "island-connect", agency: "vc-physical-planning", service: "vc-planning-permit", text: "New buildings need approval from the Physical Planning and Development Board.", guide: { section: "property-investment", slug: "building-on-land-you-own", label: "Building on land you own" } },
      ],
    },
  ],
};

/* Returning-national concessions: who qualifies, by country (from the checked guides). */
export const concessionRules = {
  gd: { minYears: 7, nationalOf: "Grenada", goods: "Household and personal effects up to EC$75,000, free of duty and tax", vehicle: "50% concession on one vehicle per family", window: "Claim within three months before or after your return", keep: "Goods and vehicle cannot be sold within three years", service: "gd-rn-concession" },
  vc: { minYears: 10, nationalOf: "St Vincent and the Grenadines", goods: "Household and personal effects free of all taxes, one of each item you reasonably need", vehicle: "One vehicle per household (not a truck) at 25% of the normal import duty, excise and VAT", window: "Apply within one year of your return", keep: "Goods and vehicle must be kept for four years", service: "vc-customs-rn" },
} as const;

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
export const journeyBySlug = (country: string, slug: string) => (journeys[country as "gd" | "vc"] ?? []).find((j) => j.slug === slug);
