import type { ArticleSection } from "./types";

export interface GuideSection {
  slug: ArticleSection;
  title: string;
  intro: string;
  /** Topics the guide will cover once verified content is published. Descriptions say what, never what the rules are. */
  topics: { title: string; text: string }[];
  relatedCategories: string[];
  /** Optional groups of related directory categories with a heading, shown as cards. */
  areas?: { title: string; text: string; category: string }[];
}

export const guideSections: GuideSection[] = [
  {
    slug: "returning-home",
    title: "Returning home",
    intro: "For nationals living overseas who are planning a move back: what to arrange, in what order, and who can help.",
    topics: [
      { title: "Returning-national programmes", text: "Which official programmes exist and where to apply" },
      { title: "Planning the move", text: "A timeline from deciding to arriving" },
      { title: "Shipping and customs", text: "Sending household goods and clearing them on arrival" },
      { title: "Bringing a vehicle", text: "What to check before shipping a car" },
      { title: "Housing", text: "Renting, buying or building on your return" },
      { title: "Banking", text: "Opening local accounts and moving money" },
      { title: "Healthcare", text: "Registering with doctors and insurance" },
      { title: "Schools", text: "Enrolling children and transferring records" },
      { title: "Working or starting a business", text: "Employment and self-employment on return" },
      { title: "Government services", text: "Documents, IDs and the offices that issue them" },
    ],
    relatedCategories: ["customs-brokers", "lawyers", "accountants", "estate-agents", "insurance", "trucking-haulage"],
  },
  {
    slug: "property-investment",
    title: "Property and investment",
    intro: "Buying, building or renting out property, including the extra steps that apply to buyers who are not citizens.",
    topics: [
      { title: "How a purchase works", text: "The steps from offer to registered title" },
      { title: "Title searches and surveys", text: "Checking what you are buying" },
      { title: "Buying as a non-citizen", text: "Additional permissions and how to apply" },
      { title: "Mortgages and finance", text: "Borrowing locally and from overseas" },
      { title: "Taxes and transfer costs", text: "What to budget on top of the price" },
      { title: "Building on land you own", text: "Planning approval and working with contractors" },
    ],
    areas: [
      { title: "Homes", text: "Houses and apartments to buy", category: "estate-agents" },
      { title: "Land", text: "Plots for building or farming", category: "estate-agents" },
      { title: "Rentals", text: "Long-term and holiday lets", category: "estate-agents" },
      { title: "Commercial", text: "Shops, offices and warehouses", category: "estate-agents" },
      { title: "Valuation and survey", text: "Independent advice before you buy", category: "surveyors-valuers" },
      { title: "Conveyancing", text: "Lawyers who handle the transfer", category: "lawyers" },
    ],
    relatedCategories: ["estate-agents", "lawyers", "surveyors-valuers", "architects-engineers", "builders-contractors"],
  },
  {
    slug: "start-a-business",
    title: "Start a business",
    intro: "Registering, licensing and running a business, from choosing a structure to hiring your first employee.",
    topics: [
      { title: "Choosing a structure", text: "Sole trader, partnership or company" },
      { title: "Registering", text: "Business names and company incorporation" },
      { title: "Tax and social security", text: "Registering as an employer and taxpayer" },
      { title: "Licences", text: "Trade and sector-specific permissions" },
      { title: "Finance", text: "Banks, credit unions and development finance" },
      { title: "Incentives", text: "Official investment incentives and how to apply" },
    ],
    areas: [
      { title: "Accounting and tax", text: "Bookkeeping, returns and payroll", category: "accountants" },
      { title: "Legal", text: "Company formation and contracts", category: "lawyers" },
      { title: "Advice", text: "Business plans and growth", category: "business-consultants" },
      { title: "Digital", text: "Websites, IT and online sales", category: "it-web" },
      { title: "Insurance", text: "Cover for premises, stock and staff", category: "insurance" },
      { title: "Premises", text: "Commercial property and fit-out", category: "estate-agents" },
    ],
    relatedCategories: ["accountants", "lawyers", "business-consultants", "it-web", "insurance"],
  },
];

export const getGuideSection = (slug: string) => guideSections.find((s) => s.slug === slug) ?? null;
