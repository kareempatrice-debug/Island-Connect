/*
 * The documents each kind of operator needs (Transport Regulation report, 22 Oct 2026).
 * Passenger work needs the hire versions: an ordinary licence, private insurance or private
 * registration would leave the ride unlawful. Mirrors required_documents() in the database.
 */
export const DOC_LABELS: Record<string, { title: string; hint: string }> = {
  hire_registration: { title: "Vehicle registration with H (hire) plate", hint: "The registration showing the vehicle is licensed for hire, and its current licence disc" },
  psv_permit: { title: "Taxi or public service vehicle driving permit", hint: "Your driving permit endorsed for taxis or PSVs, with your photo" },
  hire_insurance: { title: "Insurance for carrying passengers for hire or reward", hint: "Private-use insurance isn’t enough for paid passengers" },
  tourism_licence: { title: "Tourism authority taxi licence", hint: "SVG Tourism Authority or Grenada Tourism Authority, current year" },
  photo_id: { title: "Government photo ID", hint: "Passport or national ID matching your permit" },
  goods_registration: { title: "Goods vehicle registration and licence disc", hint: "For trucks and vans carrying goods" },
  driving_licence: { title: "Driving licence for your vehicle class", hint: "Must cover the goods vehicle you drive" },
  goods_insurance: { title: "Commercial vehicle insurance", hint: "Cover for carrying goods for payment" },
  vessel_registration: { title: "Vessel registration", hint: "Registration for the boat you carry passengers or goods on" },
  boat_licence: { title: "Boat operator or master’s licence", hint: "Your licence to operate the vessel commercially" },
  marine_insurance: { title: "Marine insurance", hint: "Cover for passengers or cargo on the vessel" },
  police_record: { title: "Police record (optional)", hint: "Recommended, and helps customers trust you" },
};

const PASSENGER = ["hire_registration", "psv_permit", "hire_insurance", "tourism_licence", "photo_id"];
const GOODS = ["goods_registration", "driving_licence", "goods_insurance", "photo_id"];
const BOAT = ["vessel_registration", "boat_licence", "marine_insurance", "photo_id"];

export function requiredDocs(kinds: string[]): string[] {
  const set = new Set<string>();
  if (kinds.some((k) => ["taxi", "airport", "group"].includes(k))) PASSENGER.forEach((d) => set.add(d));
  if (kinds.some((k) => ["haulage", "freight"].includes(k))) GOODS.forEach((d) => set.add(d));
  if (kinds.includes("boat")) BOAT.forEach((d) => set.add(d));
  return [...set].sort();
}
