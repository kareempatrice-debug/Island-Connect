/*
 * Destination photography. Every image is from Wikimedia Commons under a licence
 * that allows commercial use with attribution. Credits are shown on /credits and
 * must stay there while these images are used. Replace with commissioned or
 * owned photography when available (see PROGRESS.md).
 *
 * These are photographs of places, never of listed businesses: business pages
 * only ever show images the business itself has uploaded.
 */
export interface Photo {
  key: string;
  src: string;
  alt: string;
  place: string;
  countryCode: string;
  author: string;
  license: string;
  licenseUrl?: string;
  source?: string;
  focus?: string; // CSS object-position
}

export const photos: Record<string, Photo> = {
  // Supplied by the site owner (18 October 2026).
  "mbia-arrivals": {
    key: "mbia-arrivals",
    src: "/images/places/mbia-arrivals.jpg",
    alt: "Travellers with luggage walking towards the arrivals entrance at Maurice Bishop International Airport, Grenada",
    place: "Maurice Bishop International Airport, Grenada",
    countryCode: "gd",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "50% 55%",
  },
  "st-georges-sailboat": {
    key: "st-georges-sailboat",
    src: "/images/places/st-georges-sailboat.jpg",
    alt: "A red-hulled sailing boat heading out of St. George’s harbour, with the town’s waterfront houses climbing the hill behind",
    place: "St. George’s, Grenada",
    countryCode: "gd",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "40% 55%",
  },
  "grenada-beach-aerial": {
    key: "grenada-beach-aerial",
    src: "/images/places/grenada-beach-aerial.jpg",
    alt: "Looking straight down on turquoise water breaking on a white-sand beach lined with green trees in Grenada",
    place: "Grenada",
    countryCode: "gd",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "50% 45%",
  },
  "salt-whistle-beach": {
    key: "salt-whistle-beach",
    src: "/images/places/salt-whistle-beach.jpg",
    alt: "Looking down on turquoise umbrellas, palms and a white-sand beach at Salt Whistle Bay on Mayreau, with a dinghy in the clear water",
    place: "Salt Whistle Bay, Mayreau",
    countryCode: "vc",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "50% 40%",
  },
  "mayreau-aerial": {
    key: "mayreau-aerial",
    src: "/images/places/mayreau-aerial.jpg",
    alt: "Aerial view of Salt Whistle Bay on Mayreau, with yachts at anchor and other Grenadine islands on the horizon",
    place: "Salt Whistle Bay, Mayreau",
    countryCode: "vc",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "55% 55%",
  },
  "opening-soon-shop": {
    key: "opening-soon-shop",
    src: "/images/places/opening-soon-shop.jpg",
    alt: "A new shop being fitted out behind open green doors, with an Opening Soon sign outside and a harbour view down the street",
    place: "Grenada",
    countryCode: "gd",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "60% 50%",
  },
  "grenada-villa": {
    key: "grenada-villa",
    src: "/images/places/grenada-villa.jpg",
    alt: "A modern single-storey villa with a pool and lawn at dusk, with houses on the hillside behind",
    place: "Grenada",
    countryCode: "gd",
    author: "Island Connect",
    license: "Supplied by Island Connect",
    focus: "50% 60%",
  },
  "st-georges-bay": {
    key: "st-georges-bay",
    src: "/images/places/st-georges-bay.jpg",
    alt: "The Carenage in St. George's, Grenada, with houses on the hillside above the harbour",
    place: "St. George's, Grenada",
    countryCode: "gd",
    author: "dpursoo",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:2009_07-28_St._George%27s_Bay_(3).JPG",
    focus: "50% 45%",
  },
  "grenada-beach": {
    key: "grenada-beach",
    src: "/images/places/grenada-beach.jpg",
    alt: "Beach chairs in the shade of a tree on a calm beach in St. George, Grenada",
    place: "St. George, Grenada",
    countryCode: "gd",
    author: "Just a Brazilian man from Brazil",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Saint_George,_Grenada_(51231575268).jpg",
    focus: "50% 60%",
  },
  "grenada-shore": {
    key: "grenada-shore",
    src: "/images/places/grenada-shore.jpg",
    alt: "Waves on a sandy shore just south of St. George's, Grenada, under a cloudy sky",
    place: "South of St. George's, Grenada",
    countryCode: "gd",
    author: "Vlad Podvorny",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:A_beach_in_Grenada_(40549387515).jpg",
  },
  "sauteurs-bay": {
    key: "sauteurs-bay",
    src: "/images/places/sauteurs-bay.jpg",
    alt: "A long beach and green hills at Sauteurs Bay in the north of Grenada",
    place: "Sauteurs Bay, Grenada",
    countryCode: "gd",
    author: "Stefan_und_Bille",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Grenada_Sauteurs_Bay_-_panoramio.jpg",
  },
  "st-georges-hillside": {
    key: "st-georges-hillside",
    src: "/images/places/st-georges-hillside.jpg",
    alt: "A two-storey house among trees on a hillside in St. George's, Grenada",
    place: "St. George's, Grenada",
    countryCode: "gd",
    author: "Annelis",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:A_house_on_the_hill_IMG_0096_C.JPG",
    focus: "50% 70%",
  },
  carriacou: {
    key: "carriacou",
    src: "/images/places/carriacou.jpg",
    alt: "A small boat moored in clear turquoise water off a beach on Carriacou",
    place: "Carriacou, Grenada",
    countryCode: "gd",
    author: "Vlad Podvorny",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Carriacou_(27593339068).jpg",
  },
  "mayreau-salt-whistle-bay": {
    key: "mayreau-salt-whistle-bay",
    src: "/images/places/mayreau-salt-whistle-bay.jpg",
    alt: "Aerial view of yachts anchored in Salt Whistle Bay on Mayreau, in the Grenadines",
    place: "Salt Whistle Bay, Mayreau",
    countryCode: "vc",
    author: "Stefan Schäfer, Lich",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Saltwhistlebay.jpg",
    focus: "50% 55%",
  },
  "st-vincent-leeward": {
    key: "st-vincent-leeward",
    src: "/images/places/st-vincent-leeward.jpg",
    alt: "Forested hills of the leeward coast of St. Vincent, with La Soufrière in the distance",
    place: "Richmond, St. Vincent",
    countryCode: "vc",
    author: "DavidMPyle",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Soufriere_Volcano_St_Vincent.jpg",
  },
  "tobago-cays-sunset": {
    key: "tobago-cays-sunset",
    src: "/images/places/tobago-cays-sunset.jpg",
    alt: "Sunset over the Tobago Cays with anchored sailing boats",
    place: "Tobago Cays, St. Vincent and the Grenadines",
    countryCode: "vc",
    author: "FishSpeaker",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://commons.wikimedia.org/wiki/File:Tobago_Cays_Sunset_Panorama_-_panoramio.jpg",
  },
  kingstown: {
    key: "kingstown",
    src: "/images/places/kingstown.jpg",
    alt: "A street of shops and arcades in Kingstown, St. Vincent",
    place: "Kingstown, St. Vincent",
    countryCode: "vc",
    author: "ctsnow (Flickr)",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source: "https://commons.wikimedia.org/wiki/File:Kingstown_Saint_Vincent.jpg",
  },
  "kingstown-ferry": {
    key: "kingstown-ferry",
    src: "/images/places/kingstown-ferry.jpg",
    alt: "The Bequia Express ferry at the ferry terminal in Kingstown harbour",
    place: "Kingstown, St. Vincent",
    countryCode: "vc",
    author: "Ein Dahmer",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:BEQUIA_EXPRESS_1_2105.jpg",
  },
};

/** Per-country imagery for each part of the site. */
export const countryImagery: Record<string, { hero: string; guides: Record<string, string>; picker: string }> = {
  gd: {
    hero: "grenada-beach",
    picker: "grenada-beach-aerial",
    guides: { "returning-home": "mbia-arrivals", "property-investment": "grenada-villa", "start-a-business": "opening-soon-shop" },
  },
  vc: {
    hero: "salt-whistle-beach",
    picker: "mayreau-aerial",
    guides: { "returning-home": "kingstown-ferry", "property-investment": "st-vincent-leeward", "start-a-business": "kingstown" },
  },
};

export const fallbackImagery = { hero: "st-georges-bay", picker: "st-georges-bay", guides: {} as Record<string, string> };
