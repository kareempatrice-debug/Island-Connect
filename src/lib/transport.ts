/*
 * The kinds of transport offered under Ride, and how each is priced.
 * Fixed and driver-entered fares apply to people transport; boats, haulage and
 * freight are always a custom quote from the operator.
 */
export type TransportKind = "taxi" | "airport" | "group" | "boat" | "haulage" | "freight";
export type QuoteKind = "boat" | "haulage" | "freight";

export const QUOTE_CATEGORIES: Record<QuoteKind, string[]> = {
  boat: ["water-taxis", "boat-trips"],
  haulage: ["trucking-haulage", "courier-delivery"],
  freight: ["trucking-haulage", "courier-delivery"],
};

export function transportOptions(country: string, mainIsland: string) {
  const vc = country === "vc";
  return [
    { kind: "taxi", title: "Taxi", text: `Now or scheduled, anywhere on ${mainIsland}.`, price: "Set fare on common routes, driver’s fare elsewhere", custom: false, href: `/${country}/ride/taxi` },
    { kind: "airport", title: "Airport transfer", text: "Meet at arrivals, or a drop-off for your flight.", price: "Set fare on airport routes", custom: false, href: `/${country}/ride/taxi?from=airport` },
    { kind: "group", title: "Minivan and groups", text: "Families, wedding parties and tours, up to 8 passengers.", price: "Driver’s fare, confirmed before you go", custom: false, href: `/${country}/ride/taxi?vehicle=van` },
    {
      kind: "boat", title: "Boat and water taxi",
      text: vc ? "Between St Vincent, the Grenadines, beaches and yachts." : "Between Grenada, Carriacou, Petite Martinique and nearby beaches.",
      price: "Custom quote from the operator", custom: true, href: `/${country}/ride/quote?type=boat`,
    },
    {
      kind: "haulage", title: "Trucking and haulage",
      text: `Building materials, moving house and heavy loads on ${mainIsland}${vc ? ", Bequia or Union Island" : " or Carriacou"}.`,
      price: "Custom quote from the operator", custom: true, href: `/${country}/ride/quote?type=haulage`,
    },
    {
      kind: "freight", title: "Freight to the Grenadines",
      text: vc
        ? "From mainland St Vincent to Bequia, Mustique, Canouan, Mayreau and Union Island, and across to Carriacou. Door to door."
        : "From mainland Grenada to Carriacou and Petite Martinique, and across to Union Island and St Vincent. Door to door.",
      price: "Custom quote from the operator", custom: true, href: `/${country}/ride/quote?type=freight`,
    },
  ] as const;
}

export const QUOTE_TITLES: Record<QuoteKind, { title: string; lead: string }> = {
  freight: { title: "Freight to the Grenadines", lead: "Door to door by truck and cargo boat. Operators quote for the whole job." },
  haulage: { title: "Trucking and haulage", lead: "Building materials, moving house and heavy loads on one island." },
  boat: { title: "Boat and water taxi", lead: "Between islands, beaches and yachts. Operators quote per trip." },
};
