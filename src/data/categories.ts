import type { BookingModel, Category } from "@/lib/types";

/*
 * Launch categories. Admins will manage these in the database; this file only
 * seeds the starting set. Every category is enabled in both launch countries
 * unless listed in `disabledIn`.
 */

interface CategorySeed {
  slug: string;
  name: string;
  icon: string;
  description: string;
  children: { slug: string; name: string; models: BookingModel[] }[];
}

const E: BookingModel[] = ["enquiry"];
const Q: BookingModel[] = ["enquiry", "quote"];
const A: BookingModel[] = ["enquiry", "appointment"];
const QA: BookingModel[] = ["enquiry", "quote", "appointment"];

export const categoryTree: CategorySeed[] = [
  {
    slug: "transport",
    name: "Transport",
    icon: "car",
    description: "Taxis, transfers, rentals, ferries and haulage",
    children: [
      { slug: "taxis", name: "Taxis", models: QA },
      { slug: "airport-transfers", name: "Airport transfers", models: QA },
      { slug: "car-rental", name: "Car rental", models: Q },
      { slug: "scooter-rental", name: "Scooter and bike rental", models: Q },
      { slug: "water-taxis", name: "Water taxis and ferries", models: QA },
      { slug: "courier-delivery", name: "Courier and delivery", models: Q },
      { slug: "trucking-haulage", name: "Trucking and haulage", models: Q },
      { slug: "mechanics", name: "Mechanics", models: QA },
      { slug: "marine-services", name: "Marine services and repairs", models: Q },
    ],
  },
  {
    slug: "home-construction",
    name: "Home and construction",
    icon: "hammer",
    description: "Trades, builders and home maintenance",
    children: [
      { slug: "electricians", name: "Electricians", models: QA },
      { slug: "plumbers", name: "Plumbers", models: QA },
      { slug: "carpenters", name: "Carpenters", models: Q },
      { slug: "builders-contractors", name: "Builders and contractors", models: Q },
      { slug: "architects-engineers", name: "Architects and engineers", models: QA },
      { slug: "roofers", name: "Roofers", models: Q },
      { slug: "painters", name: "Painters", models: Q },
      { slug: "air-conditioning", name: "Air conditioning", models: QA },
      { slug: "solar-installers", name: "Solar installers", models: Q },
      { slug: "cleaning", name: "Cleaning", models: QA },
      { slug: "landscaping", name: "Landscaping", models: Q },
      { slug: "pest-control", name: "Pest control", models: QA },
    ],
  },
  {
    slug: "professional-services",
    name: "Professional services",
    icon: "briefcase",
    description: "Legal, financial, property and digital professionals",
    children: [
      { slug: "lawyers", name: "Lawyers", models: A },
      { slug: "accountants", name: "Accountants and tax advisers", models: A },
      { slug: "insurance", name: "Insurance brokers", models: A },
      { slug: "surveyors-valuers", name: "Surveyors and valuers", models: QA },
      { slug: "estate-agents", name: "Estate agents", models: A },
      { slug: "customs-brokers", name: "Customs brokers", models: Q },
      { slug: "it-web", name: "IT and web services", models: QA },
      { slug: "business-consultants", name: "Business consultants", models: A },
      { slug: "banks-finance", name: "Banks and finance", models: E },
      { slug: "printing-office", name: "Printing and office supplies", models: Q },
      { slug: "utilities-telecoms", name: "Utilities and telecoms", models: E },
      { slug: "security-services", name: "Security services", models: Q },
    ],
  },
  {
    slug: "tourism-hospitality",
    name: "Tourism and hospitality",
    icon: "palmtree",
    description: "Places to stay, eat and things to do",
    children: [
      { slug: "accommodation", name: "Places to stay", models: E },
      { slug: "restaurants", name: "Restaurants", models: E },
      { slug: "bars-cafes", name: "Bars and cafés", models: E },
      { slug: "tours", name: "Tours and guides", models: QA },
      { slug: "boat-trips", name: "Boat trips and charters", models: QA },
      { slug: "diving-snorkelling", name: "Diving and snorkelling", models: A },
      { slug: "fishing-charters", name: "Fishing charters", models: QA },
      { slug: "hiking", name: "Hiking", models: A },
      { slug: "wellness", name: "Wellness and spa", models: A },
      { slug: "events", name: "Event organisers", models: Q },
    ],
  },
  {
    slug: "retail-everyday",
    name: "Shops and everyday",
    icon: "shopping-basket",
    description: "Supermarkets, pharmacies, hardware and personal care",
    children: [
      { slug: "supermarkets", name: "Supermarkets and groceries", models: E },
      { slug: "pharmacies", name: "Pharmacies", models: E },
      { slug: "hardware", name: "Hardware and building supplies", models: E },
      { slug: "electronics", name: "Electronics", models: E },
      { slug: "salons-barbers", name: "Salons and barbers", models: A },
      { slug: "fitness", name: "Gyms and fitness", models: A },
      { slug: "laundry", name: "Laundry", models: E },
      { slug: "farm-produce", name: "Farm produce and agricultural supplies", models: E },
      { slug: "local-products", name: "Local food, drink and products", models: E },
      { slug: "gifts-retail", name: "Gifts, jewellery and duty-free", models: E },
    ],
  },
  {
    slug: "health",
    name: "Health",
    icon: "stethoscope",
    description: "Doctors, dentists and clinics",
    children: [
      { slug: "doctors-clinics", name: "Doctors and clinics", models: A },
      { slug: "dentists", name: "Dentists", models: A },
      { slug: "opticians", name: "Opticians", models: A },
      { slug: "vets", name: "Vets and animal care", models: A },
    ],
  },
  {
    slug: "education-childcare",
    name: "Education and childcare",
    icon: "graduation-cap",
    description: "Tutors, schools and childcare",
    children: [
      { slug: "tutors", name: "Tutors", models: A },
      { slug: "childcare", name: "Childcare", models: A },
      { slug: "driving-schools", name: "Driving schools", models: A },
      { slug: "colleges-universities", name: "Colleges and universities", models: E },
    ],
  },
  {
    slug: "events-venues",
    name: "Events and venues",
    icon: "party-popper",
    description: "Venues, catering, music and hire",
    children: [
      { slug: "venues", name: "Venues", models: Q },
      { slug: "catering", name: "Catering", models: Q },
      { slug: "djs-entertainment", name: "DJs and entertainment", models: Q },
      { slug: "equipment-hire", name: "Tents, chairs and equipment hire", models: Q },
    ],
  },
];

export const categoryIcons: Record<string, string> = Object.fromEntries(
  categoryTree.map((c) => [c.slug, c.icon]),
);

export const categories: Category[] = categoryTree.flatMap((parent, i) => [
  {
    slug: parent.slug,
    name: parent.name,
    parentSlug: null,
    description: parent.description,
    bookingModels: [],
    sortOrder: i * 100,
  },
  ...parent.children.map((child, j) => ({
    slug: child.slug,
    name: child.name,
    parentSlug: parent.slug,
    description: null,
    bookingModels: child.models,
    sortOrder: i * 100 + j + 1,
  })),
]);

/** Per-country exceptions. Empty at launch: everything is enabled in both countries. */
export const disabledIn: Record<string, string[]> = { gd: [], vc: [] };
