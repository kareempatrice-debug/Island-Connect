/*
 * Category illustrations (supplied by Island Connect, 2026), shown when a business has no
 * cover photo of its own. Each category type uses the picture that matches it best;
 * anything not listed falls back to its group's picture. Stored at full resolution, and the
 * image service sends each phone a sharp, appropriately sized version.
 * "focus" keeps the subject in frame when the picture is cropped to a card or banner.
 */
type Photo = { src: string; focus: string };
const p = (name: string, focus: string): Photo => ({ src: `/images/categories/${name}.jpg`, focus });

const PICTURES = {
  construction: p("home-construction", "58% 45%"),
  office: p("professional-services", "38% 45%"),
  poolside: p("tourism-hospitality", "50% 55%"),
  produce: p("retail-everyday", "60% 50%"),
  airport: p("transport", "45% 55%"),
  doctor: p("health", "42% 40%"),
  classroom: p("education-childcare", "50% 55%"),
  events: p("events-venues", "50% 60%"),
  boats: p("boats", "62% 55%"),
  haulage: p("haulage", "58% 55%"),
  mechanics: p("mechanics", "60% 50%"),
  restaurants: p("restaurants", "50% 55%"),
  tours: p("tours", "45% 50%"),
  shop: p("shop-counter", "60% 45%"),
  barber: p("barber", "60% 55%"),
  fitness: p("fitness", "45% 50%"),
  homeCare: p("home-care", "50% 55%"),
  vets: p("vets", "55% 45%"),
  driving: p("driving-college", "45% 55%"),
} as const;

/* The group's picture, used for any type not listed below. */
export const categoryPhotos: Record<string, Photo> = {
  "home-construction": PICTURES.construction,
  "professional-services": PICTURES.office,
  "tourism-hospitality": PICTURES.poolside,
  "retail-everyday": PICTURES.shop,
  "transport": PICTURES.airport,
  "health": PICTURES.doctor,
  "education-childcare": PICTURES.classroom,
  "events-venues": PICTURES.events,
};

/* Pictures chosen for individual types. */
export const typePhotos: Record<string, Photo> = {
  // Transport
  "taxis": PICTURES.airport, "airport-transfers": PICTURES.airport, "car-rental": PICTURES.airport,
  "water-taxis": PICTURES.boats, "marine-services": PICTURES.boats,
  "trucking-haulage": PICTURES.haulage, "courier-delivery": PICTURES.haulage,
  "mechanics": PICTURES.mechanics, "scooter-rental": PICTURES.mechanics,
  // Home and construction
  "cleaning": PICTURES.homeCare, "landscaping": PICTURES.homeCare, "pest-control": PICTURES.homeCare,
  // Tourism and hospitality
  "accommodation": PICTURES.poolside, "wellness": PICTURES.poolside,
  "restaurants": PICTURES.restaurants, "bars-cafes": PICTURES.restaurants,
  "tours": PICTURES.tours, "hiking": PICTURES.tours,
  "boat-trips": PICTURES.boats, "diving-snorkelling": PICTURES.boats, "fishing-charters": PICTURES.boats,
  "events": PICTURES.events,
  // Shops and everyday
  "supermarkets": PICTURES.produce, "farm-produce": PICTURES.produce, "local-products": PICTURES.produce,
  "hardware": PICTURES.construction,
  "electronics": PICTURES.shop, "gifts-retail": PICTURES.shop, "pharmacies": PICTURES.shop,
  "salons-barbers": PICTURES.barber, "fitness": PICTURES.fitness, "laundry": PICTURES.homeCare,
  // Professional services
  "printing-office": PICTURES.shop,
  // Health
  "vets": PICTURES.vets,
  // Education
  "driving-schools": PICTURES.driving, "colleges-universities": PICTURES.driving,
};

export function photoForCategory(slug: string, group: string): Photo | undefined {
  return typePhotos[slug] ?? categoryPhotos[group];
}
