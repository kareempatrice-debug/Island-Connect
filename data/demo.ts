import type { BookingModel, OpeningHours } from "@/lib/types";

/*
 * DEMONSTRATION LISTINGS ONLY.
 * These businesses are invented. They exist so the app can be shown before
 * real listings are added. They are always flagged is_demo, carry no contact
 * details, are never marked verified, and are removed by supabase/remove-demo.sql.
 * Any resemblance to a real business name is unintended.
 */

export interface DemoBusiness {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categories: string[]; // first is primary
  location: { country: string; island: string; district: string; landmark: string; lat: number; lng: number };
  serves: { country: string; island: string }[];
  paymentMethods: string[];
  cancellationPolicy: string | null;
  isFeatured?: boolean;
  services: { name: string; description?: string; min?: number; max?: number; unit?: string; minutes?: number; models: BookingModel[] }[];
  hours: OpeningHours[];
  daysAgo: number;
}

const weekdays = (opens: string, closes: string, saturday?: [string, string]): OpeningHours[] => [
  ...[1, 2, 3, 4, 5].map((weekday) => ({ weekday, opens, closes })),
  ...(saturday ? [{ weekday: 6, opens: saturday[0], closes: saturday[1] }] : []),
];
const everyDay = (opens: string, closes: string): OpeningHours[] =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opens, closes }));

export const demoBusinesses: DemoBusiness[] = [
  {
    slug: "harbourline-electrical",
    name: "Harbourline Electrical",
    tagline: "Domestic and commercial wiring, fault-finding and inspections",
    description:
      "A small team handling rewiring, new circuits, breaker panels and fault-finding for homes and shops. Most call-outs in St. George are seen the same or next working day, and every job is quoted before work starts.",
    categories: ["electricians", "solar-installers"],
    location: { country: "gd", island: "grenada", district: "st-george", landmark: "Near the Morne Jaloux junction", lat: 12.045, lng: -61.738 },
    serves: [{ country: "gd", island: "grenada" }],
    paymentMethods: ["cash", "bank_transfer"],
    cancellationPolicy: "Free to cancel up to 24 hours before a booked visit.",
    isFeatured: true,
    services: [
      { name: "Call-out and fault diagnosis", min: 150, unit: "visit", minutes: 60, models: ["appointment"] },
      { name: "Rewiring", description: "Priced after an inspection", models: ["quote"] },
      { name: "Breaker panel replacement", min: 900, max: 2200, models: ["quote"] },
    ],
    hours: weekdays("08:00", "17:00", ["09:00", "13:00"]),
    daysAgo: 40,
  },
  {
    slug: "nutmeg-ridge-hikes",
    name: "Nutmeg Ridge Hikes",
    tagline: "Guided rainforest and waterfall hikes with a local guide",
    description:
      "Half-day and full-day guided hikes through the interior, with stops at waterfalls and working spice farms. Groups are kept small, and walks are matched to your fitness rather than a fixed pace.",
    categories: ["hiking", "tours"],
    location: { country: "gd", island: "grenada", district: "st-john", landmark: "Gouyave, opposite the fish market", lat: 12.168, lng: -61.728 },
    serves: [{ country: "gd", island: "grenada" }],
    paymentMethods: ["cash", "card"],
    cancellationPolicy: "Full refund if cancelled 48 hours ahead. Hikes cancelled for weather are rescheduled or refunded.",
    isFeatured: true,
    services: [
      { name: "Half-day waterfall hike", min: 160, unit: "person", minutes: 240, models: ["appointment"] },
      { name: "Private group hike", description: "For groups of six or more", models: ["quote"] },
    ],
    hours: everyDay("07:00", "16:00"),
    daysAgo: 12,
  },
  {
    slug: "lagoon-road-accounting",
    name: "Lagoon Road Accounting",
    tagline: "Bookkeeping, tax returns and company compliance",
    description:
      "Accounting support for small businesses and returning nationals setting up locally: monthly bookkeeping, annual returns, payroll and help registering for tax.",
    categories: ["accountants", "business-consultants"],
    location: { country: "gd", island: "grenada", district: "st-george", landmark: "Lagoon Road, upstairs from the bank", lat: 12.047, lng: -61.751 },
    serves: [{ country: "gd", island: "grenada" }, { country: "gd", island: "carriacou" }],
    paymentMethods: ["bank_transfer", "cheque"],
    cancellationPolicy: null,
    services: [
      { name: "Initial consultation", min: 200, unit: "hour", minutes: 60, models: ["appointment"] },
      { name: "Monthly bookkeeping", min: 400, unit: "month", models: ["quote"] },
    ],
    hours: weekdays("08:30", "16:30"),
    daysAgo: 70,
  },
  {
    slug: "carriacou-island-hauling",
    name: "Carriacou Island Hauling",
    tagline: "Truck hire for building materials and freight on Carriacou",
    description:
      "Flatbed and tipper trucks for moving building materials, containers and household goods around Carriacou, including collection from the jetty.",
    categories: ["trucking-haulage", "courier-delivery"],
    location: { country: "gd", island: "carriacou", district: "carriacou-petite-martinique", landmark: "Hillsborough, behind the jetty", lat: 12.481, lng: -61.457 },
    serves: [{ country: "gd", island: "carriacou" }],
    paymentMethods: ["cash"],
    cancellationPolicy: null,
    services: [{ name: "Truck and driver", min: 250, unit: "trip", models: ["quote"] }],
    hours: weekdays("07:00", "16:00", ["07:00", "12:00"]),
    daysAgo: 5,
  },
  {
    slug: "point-salines-transfers",
    name: "Point Salines Transfers",
    tagline: "Airport pick-ups and transfers across the south of Grenada",
    description:
      "Pre-booked airport pick-ups and drop-offs, and rides between hotels, marinas and St. George’s, in cars and a seven-seat minivan. Drivers meet arriving passengers in the arrivals hall.",
    categories: ["airport-transfers", "taxis"],
    location: { country: "gd", island: "grenada", district: "st-george", landmark: "Near the airport roundabout, Point Salines", lat: 12.0, lng: -61.78 },
    serves: [{ country: "gd", island: "grenada" }],
    paymentMethods: ["cash", "card"],
    cancellationPolicy: "Free cancellation up to 12 hours before pick-up.",
    services: [
      { name: "Airport pick-up or drop-off", description: "Fare confirmed when you book", models: ["appointment"] },
      { name: "Island tour by car", description: "Half day or full day", models: ["quote"] },
    ],
    hours: everyDay("05:00", "23:00"),
    daysAgo: 4,
  },
  {
    slug: "sea-grape-cottages",
    name: "Sea Grape Cottages",
    tagline: "Three self-catering cottages above a quiet bay",
    description:
      "Three one-bedroom cottages with kitchens and shared garden, a short walk down to the water. Popular with returning visitors and people on longer stays.",
    categories: ["accommodation"],
    location: { country: "gd", island: "grenada", district: "st-david", landmark: "Off the main road past the St. David's church", lat: 12.028, lng: -61.668 },
    serves: [{ country: "gd", island: "grenada" }],
    paymentMethods: ["card", "bank_transfer"],
    cancellationPolicy: "Free cancellation up to 14 days before arrival.",
    services: [{ name: "One-bedroom cottage", min: 320, unit: "night", models: ["enquiry"] }],
    hours: everyDay("08:00", "20:00"),
    daysAgo: 25,
  },
  {
    slug: "greenleaf-pharmacy",
    name: "Greenleaf Pharmacy",
    tagline: "Prescriptions, over-the-counter medicines and health supplies",
    description: "A neighbourhood pharmacy filling prescriptions and stocking everyday medicines, baby supplies and first-aid items.",
    categories: ["pharmacies"],
    location: { country: "gd", island: "grenada", district: "st-andrew", landmark: "Grenville, near the bus terminal", lat: 12.122, lng: -61.623 },
    serves: [{ country: "gd", island: "grenada" }],
    paymentMethods: ["cash", "card"],
    cancellationPolicy: null,
    services: [],
    hours: weekdays("08:00", "19:00", ["08:00", "15:00"]),
    daysAgo: 3,
  },
  {
    slug: "kingstown-cool-air",
    name: "Kingstown Cool Air",
    tagline: "Air-conditioning installation, servicing and repairs",
    description:
      "Supply, installation and servicing of split units for homes and offices. Annual service plans are available for businesses with several units.",
    categories: ["air-conditioning", "electricians"],
    location: { country: "vc", island: "st-vincent", district: "st-george", landmark: "Kingstown, near the Heritage Square", lat: 13.157, lng: -61.226 },
    serves: [{ country: "vc", island: "st-vincent" }, { country: "vc", island: "bequia" }],
    paymentMethods: ["cash", "bank_transfer"],
    cancellationPolicy: "Please give 24 hours' notice to cancel a service visit.",
    isFeatured: true,
    services: [
      { name: "Unit service and clean", min: 180, unit: "unit", minutes: 90, models: ["appointment"] },
      { name: "New installation", description: "Priced after a site visit", models: ["quote"] },
    ],
    hours: weekdays("08:00", "16:30", ["08:00", "12:00"]),
    daysAgo: 30,
  },
  {
    slug: "leeward-coast-builders",
    name: "Leeward Coast Builders",
    tagline: "New homes, extensions and renovation",
    description:
      "General contractor for block-built homes, extensions and renovations, working from drawings or arranging them through partner architects.",
    categories: ["builders-contractors", "carpenters"],
    location: { country: "vc", island: "st-vincent", district: "st-patrick", landmark: "Barrouallie, on the main leeward road", lat: 13.235, lng: -61.272 },
    serves: [{ country: "vc", island: "st-vincent" }],
    paymentMethods: ["bank_transfer", "cheque"],
    cancellationPolicy: null,
    services: [{ name: "Site visit and estimate", min: 150, unit: "visit", models: ["quote"] }],
    hours: weekdays("07:00", "16:00"),
    daysAgo: 55,
  },
  {
    slug: "bequia-blue-dive",
    name: "Bequia Blue Dive",
    tagline: "Guided dives, courses and snorkel trips",
    description:
      "Guided dives on reefs and walls around Bequia, beginner courses and snorkel trips for non-divers. Equipment is included in every booking.",
    categories: ["diving-snorkelling", "boat-trips"],
    location: { country: "vc", island: "bequia", district: "grenadines", landmark: "Port Elizabeth, along the Belmont walkway", lat: 13.008, lng: -61.243 },
    serves: [{ country: "vc", island: "bequia" }],
    paymentMethods: ["card", "cash"],
    cancellationPolicy: "Full refund with 24 hours' notice.",
    services: [
      { name: "Two-tank guided dive", min: 330, unit: "person", minutes: 240, models: ["appointment"] },
      { name: "Snorkel trip", min: 130, unit: "person", minutes: 150, models: ["appointment"] },
    ],
    hours: everyDay("07:30", "17:00"),
    daysAgo: 8,
  },
  {
    slug: "windward-legal-chambers",
    name: "Windward Legal Chambers",
    tagline: "Property, conveyancing and company law",
    description:
      "Advice on property purchases, title searches, conveyancing, wills and company formation, including for buyers and investors based overseas.",
    categories: ["lawyers"],
    location: { country: "vc", island: "st-vincent", district: "st-george", landmark: "Kingstown, Halifax Street", lat: 13.156, lng: -61.228 },
    serves: [{ country: "vc", island: "st-vincent" }],
    paymentMethods: ["bank_transfer"],
    cancellationPolicy: null,
    services: [{ name: "Initial consultation", min: 300, unit: "hour", minutes: 60, models: ["appointment"] }],
    hours: weekdays("09:00", "16:30"),
    daysAgo: 90,
  },
  {
    slug: "grenadines-link-water-taxi",
    name: "Grenadines Link Water Taxi",
    tagline: "Water taxi between Union Island, Carriacou and nearby islands",
    description:
      "Scheduled and charter water-taxi runs across the southern Grenadines, including the Union Island to Carriacou crossing. Passengers crossing between the two countries need to complete customs and immigration clearance.",
    categories: ["water-taxis", "boat-trips"],
    location: { country: "vc", island: "union-island", district: "grenadines", landmark: "Clifton harbour", lat: 12.597, lng: -61.418 },
    serves: [
      { country: "vc", island: "union-island" },
      { country: "vc", island: "mayreau" },
      { country: "vc", island: "canouan" },
      { country: "gd", island: "carriacou" },
      { country: "gd", island: "petite-martinique" },
    ],
    paymentMethods: ["cash"],
    cancellationPolicy: "Charters cancelled for sea conditions are refunded in full.",
    isFeatured: true,
    services: [
      { name: "Union Island to Carriacou charter", min: 450, unit: "boat", minutes: 45, models: ["quote", "appointment"] },
      { name: "Day charter", description: "Island-hopping with a captain", models: ["quote"] },
    ],
    hours: everyDay("07:00", "17:00"),
    daysAgo: 2,
  },
  {
    slug: "windward-transfers",
    name: "Windward Transfers",
    tagline: "Airport pick-ups and island transfers",
    description:
      "Pre-booked airport pick-ups and drop-offs, and transfers to the ferry terminal and hotels across St. Vincent, in air-conditioned minivans.",
    categories: ["airport-transfers", "taxis"],
    location: { country: "vc", island: "st-vincent", district: "charlotte", landmark: "Near the airport roundabout", lat: 13.153, lng: -61.152 },
    serves: [{ country: "vc", island: "st-vincent" }],
    paymentMethods: ["cash", "card"],
    cancellationPolicy: "Free cancellation up to 12 hours before pick-up.",
    services: [
      { name: "Airport to Kingstown", min: 90, unit: "vehicle", minutes: 30, models: ["appointment"] },
      { name: "Island tour by vehicle", description: "Half day or full day", models: ["quote"] },
    ],
    hours: everyDay("05:00", "22:00"),
    daysAgo: 15,
  },
];
