/*
 * Official taxi fares, each table with its published source and date.
 * Shown as "official fare" where a ride's pickup and destination match a listed place.
 *  - Grenada: Grenada Airport Taxi Association rates from Maurice Bishop International Airport,
 *    as published by the Grenada Tourism Authority (puregrenada.com), checked 20 October 2026.
 *  - SVG: Cabinet decision 1744 of 17 August 2022 (Memorandum of 23 August 2022), effective 1 September 2022.
 *  - Carriacou: taxi price list supplied to Island Connect (dated 20 August 2026), from Hillsborough,
 *    Harvey Vale (Tyrrel Bay) port and Lauriston Airport.
 */
export interface FareRow {
  places: string; xcd: number; usd?: number; afterXcd?: number;
  /** A range on the list (e.g. EC$30 / 35): shown, but not used as a fixed price; drivers quote instead. */
  maxXcd?: number;
  note?: string;
}
export interface FareTable {
  id: string; country: string; origin: string; originLandmark: string;
  basis: string; rows: FareRow[]; source: string; sourceUrl?: string; sourceDate: string; note?: string;
  /** For tables that only apply on one island of the country (Carriacou). */
  island?: string;
}

export const fareTables: FareTable[] = [
  {
    id: "cq-hillsborough", country: "gd", island: "carriacou", origin: "Hillsborough", originLandmark: "hillsborough",
    basis: "As listed. Confirm with your driver whether the fare is per taxi or per person", source: "Carriacou taxi price list, supplied to Island Connect", sourceDate: "list dated 20 August 2026",
    rows: [
      { places: "Lauriston Airport", xcd: 25 },
      { places: "Brunswick", xcd: 20 },
      { places: "Six Roads", xcd: 25 },
      { places: "Belle Vue", xcd: 40 },
      { places: "Belmont", xcd: 40 },
      { places: "Harvey Vale (Tyrrel Bay)", xcd: 40 },
      { places: "Hermitage", xcd: 50 },
      { places: "L’Esterre", xcd: 30, maxXcd: 35, note: "EC$30 or 35 depending on where in L’Esterre" },
      { places: "Lauriston", xcd: 30 },
      { places: "Bogles", xcd: 30 },
      { places: "Prospect", xcd: 40 },
      { places: "Limlair", xcd: 50 },
      { places: "Craigston", xcd: 35 },
      { places: "Belvedere", xcd: 35 },
      { places: "Dover", xcd: 40 },
      { places: "Bayaleau", xcd: 50 },
      { places: "Windward", xcd: 45 },
      { places: "Petite Carenage", xcd: 55 },
      { places: "Cherry Hill", xcd: 30 },
      { places: "Belair", xcd: 30 },
      { places: "Mt. Royal", xcd: 35 },
      { places: "Mt. Pleasant", xcd: 40 },
      { places: "Grand Bay", xcd: 45 },
      { places: "Point (Mt. Pleasant)", xcd: 45 },
    ],
  },
  {
    id: "cq-airport", country: "gd", island: "carriacou", origin: "Lauriston Airport", originLandmark: "lauriston-airport",
    basis: "As listed. Confirm with your driver whether the fare is per taxi or per person", source: "Carriacou taxi price list, supplied to Island Connect", sourceDate: "list dated 20 August 2026",
    rows: [
      { places: "Hillsborough", xcd: 25 },
      { places: "Brunswick", xcd: 25 },
      { places: "Six Roads", xcd: 30 },
      { places: "Lauriston", xcd: 30 },
      { places: "Harvey Vale (Tyrrel Bay)", xcd: 45 },
      { places: "Belmont", xcd: 45 },
      { places: "Hermitage", xcd: 50 },
      { places: "Belle Vue", xcd: 45 },
      { places: "L’Esterre", xcd: 35 },
      { places: "Mt. Royal", xcd: 40 },
      { places: "Mt. Pleasant", xcd: 50 },
      { places: "Grand Bay", xcd: 55 },
      { places: "Point (Mt. Pleasant)", xcd: 55 },
      { places: "Cherry Hill", xcd: 35 },
      { places: "Belair", xcd: 40 },
      { places: "Craigston", xcd: 40, note: "Inside Craigston" },
      { places: "Prospect", xcd: 50 },
      { places: "Bogles", xcd: 40 },
      { places: "Belvedere", xcd: 40 },
      { places: "Dover", xcd: 50 },
      { places: "Limlair", xcd: 50 },
      { places: "Windward", xcd: 55 },
      { places: "Petite Carenage", xcd: 60 },
    ],
  },
  {
    id: "cq-harvey-vale", country: "gd", island: "carriacou", origin: "Harvey Vale (Tyrrel Bay) port", originLandmark: "tyrrel-bay",
    basis: "As listed. Confirm with your driver whether the fare is per taxi or per person", source: "Carriacou taxi price list, supplied to Island Connect", sourceDate: "list dated 20 August 2026",
    rows: [
      { places: "Hillsborough", xcd: 40 },
      { places: "Harvey Vale", xcd: 20 },
      { places: "Belmont", xcd: 20 },
      { places: "Hermitage", xcd: 20 },
      { places: "Belle Vue", xcd: 25 },
      { places: "Six Roads", xcd: 35 },
      { places: "L’Esterre", xcd: 20, maxXcd: 25, note: "EC$20 or 25 depending on where in L’Esterre" },
      { places: "Lauriston", xcd: 30 },
      { places: "Brunswick", xcd: 35 },
      { places: "Belair", xcd: 50 },
      { places: "Bogles", xcd: 50 },
      { places: "Craigston", xcd: 50 },
      { places: "Prospect", xcd: 60 },
      { places: "Cherry Hill", xcd: 50 },
      { places: "Dover", xcd: 55 },
      { places: "Belvedere", xcd: 50 },
      { places: "Limlair, Bayaleau", xcd: 60 },
      { places: "Windward", xcd: 60 },
      { places: "Petite Carenage", xcd: 65 },
      { places: "Mt. Royal", xcd: 50 },
      { places: "Mt. Pleasant", xcd: 60 },
      { places: "Grand Bay", xcd: 60 },
      { places: "Point", xcd: 60 },
    ],
  },
  {
    id: "gd-airport", country: "gd", origin: "Maurice Bishop International Airport", originLandmark: "gnd-airport",
    basis: "Per taxi", source: "Grenada Airport Taxi Association, published by the Grenada Tourism Authority",
    sourceUrl: "https://www.puregrenada.com/grenada-airport-taxi-association/", sourceDate: "checked 20 October 2026",
    rows: [
      { places: "La Source, Rex Grenadian, Calliste", xcd: 25, usd: 10 },
      { places: "True Blue, Housing Scheme, Spice Isle Marine", xcd: 35, usd: 14 },
      { places: "Lance aux Épines, Grand Anse, Grand Anse Valley", xcd: 40, usd: 16 },
      { places: "Fall Edge, Belmont, Lagoon Road, St. George’s town, Springs, Woodlands, Woburn, La Luna", xcd: 50, usd: 20 },
      { places: "Calivigny, Marian, Morne Jaloux, Laborie, River Road, Cherry Hill", xcd: 60, usd: 24 },
      { places: "Gay, The Glen", xcd: 65, usd: 26 },
      { places: "Pauls, Mt. Moritz, Molinere, Grand Mal, Mt. Parnassus, Tempe", xcd: 70, usd: 28 },
      { places: "Westerhall", xcd: 70, usd: 28 },
      { places: "Happy Hill, La Mode, Beaulieu", xcd: 75, usd: 30 },
      { places: "Perseverance", xcd: 75, usd: 30 },
      { places: "Boca, Willis, Annandale, Vendome", xcd: 80, usd: 32 },
      { places: "Red Gate to La Sagesse", xcd: 80, usd: 32 },
      { places: "Concord", xcd: 80, usd: 32 },
      { places: "La Sagesse up to Lambert", xcd: 90, usd: 36 },
      { places: "Marigot, Grand Roy", xcd: 90, usd: 36 },
      { places: "Birchgrove and surroundings", xcd: 95, usd: 38 },
      { places: "Crochu to Grenville", xcd: 110, usd: 44 },
      { places: "Gouyave", xcd: 110, usd: 44 },
      { places: "Clozier", xcd: 120, usd: 48 },
      { places: "Paradise, Dunfermline, Paraclete", xcd: 125, usd: 50 },
      { places: "Victoria, St. Mark’s", xcd: 130, usd: 52 },
      { places: "La Poterie, Sauteurs, Union", xcd: 170, usd: 64 },
    ],
  },
  {
    id: "vc-airport", country: "vc", origin: "Argyle International Airport", originLandmark: "argyle-airport",
    basis: "Per taxi for 1 to 3 passengers; EC$13 for each extra passenger",
    source: "Government of St Vincent and the Grenadines, Cabinet decision 1744 (17 August 2022)", sourceDate: "effective 1 September 2022",
    note: "After-hours rates apply outside normal working hours.",
    rows: [
      { places: "Diamond, Stubbs, Enhams, Mt. Pleasant, Calder, La Croix, Peruvian Vale, Biabou, Cedars, Spring", xcd: 39, usd: 16, afterXcd: 49 },
      { places: "Belmont, Evesham, Mesopotamia, Cane End", xcd: 52, usd: 20, afterXcd: 65 },
      { places: "Brighton", xcd: 52, usd: 20, afterXcd: 65 },
      { places: "Richland Park", xcd: 59, usd: 22, afterXcd: 74 },
      { places: "Ratho Mill, Calliaqua, Glen", xcd: 65, usd: 25, afterXcd: 82 },
      { places: "Fair Hall, Choppins", xcd: 72, usd: 27, afterXcd: 90 },
      { places: "Fountain, Villa, Arnos Vale", xcd: 72, usd: 27, afterXcd: 90 },
      { places: "Lowmans Windward, North and South Union", xcd: 72, usd: 27, afterXcd: 90 },
      { places: "Cane Hall", xcd: 78, usd: 29, afterXcd: 98 },
      { places: "Greiggs, Chapmans", xcd: 78, usd: 29, afterXcd: 98 },
      { places: "Queens Drive, Sion Hill Bay, Frenches", xcd: 85, usd: 31, afterXcd: 107 },
      { places: "Colonarie", xcd: 85, usd: 31, afterXcd: 107 },
      { places: "Kingstown, Murrays Village, Cane Garden, Dorsetshire Hill", xcd: 91, usd: 34, afterXcd: 114 },
      { places: "Edinboro, Montrose, Largo Height, Lodge Village, Sharpes", xcd: 98, usd: 36, afterXcd: 122 },
      { places: "Green Hill", xcd: 104, usd: 39, afterXcd: 130 },
      { places: "Georgetown", xcd: 104, usd: 39, afterXcd: 130 },
      { places: "Lowmans Leeward", xcd: 104, usd: 39, afterXcd: 130 },
      { places: "Campden Park", xcd: 111, usd: 42, afterXcd: 139 },
      { places: "Questelles", xcd: 117, usd: 44, afterXcd: 147 },
      { places: "Chauncey, Clare Valley", xcd: 124, usd: 47, afterXcd: 155 },
      { places: "Orange Hill", xcd: 124, usd: 47, afterXcd: 155 },
      { places: "Dubois, Pembroke, Vermont", xcd: 130, usd: 48, afterXcd: 163 },
      { places: "Buccament", xcd: 137, usd: 51, afterXcd: 172 },
      { places: "Overland", xcd: 137, usd: 51, afterXcd: 172 },
      { places: "Retreat, Layou", xcd: 143, usd: 53, afterXcd: 179 },
      { places: "Barrouallie", xcd: 169, usd: 64, afterXcd: 212 },
      { places: "Sandy Bay", xcd: 170, usd: 64, afterXcd: 213 },
      { places: "Wallilabou", xcd: 176, usd: 66, afterXcd: 220 },
      { places: "Spring Village", xcd: 202, usd: 75, afterXcd: 252 },
      { places: "Owia", xcd: 217, usd: 82, afterXcd: 272 },
      { places: "Fancy", xcd: 240, usd: 90, afterXcd: 300 },
      { places: "Coulls Hill, Cumberland", xcd: 240, usd: 90, afterXcd: 302 },
      { places: "Troumaca", xcd: 256, usd: 97, afterXcd: 321 },
      { places: "Rose Hall, Petit Bordel", xcd: 272, usd: 101, afterXcd: 341 },
      { places: "Chateaubelair", xcd: 280, usd: 105, afterXcd: 350 },
      { places: "Richmond", xcd: 295, usd: 111, afterXcd: 369 },
    ],
  },
  {
    id: "vc-kingstown", country: "vc", origin: "Kingstown", originLandmark: "kingstown",
    basis: "Per passenger", source: "Government of St Vincent and the Grenadines, Cabinet decision 1744 (17 August 2022)", sourceDate: "effective 1 September 2022",
    note: "After-hours rates apply outside normal working hours.",
    rows: [
      { places: "In and around Kingstown", xcd: 13, usd: 5, afterXcd: 17 },
      { places: "Edinboro, Montrose, Lodge Village, Sharpes, Kingstown Park, Largo Height, Murray Village, Sion Hill, Cane Garden", xcd: 20, usd: 8, afterXcd: 25 },
      { places: "Ottley Hall, Fort Charlotte, Green Hill, Lowmans Leeward", xcd: 26, usd: 10, afterXcd: 33 },
      { places: "Arnos Vale, Fountain, Dorsetshire Hill, Shipyard, Campden Park (to Ash’s)", xcd: 33, usd: 12, afterXcd: 40 },
      { places: "Villa, Calliaqua, Queens Drive, Belair, Fairbain Pasture, Campden Park, Questelles", xcd: 39, usd: 14, afterXcd: 49 },
      { places: "Ratho Mill, Gomea, Belmont, Clare Valley, Chauncey", xcd: 46, usd: 17, afterXcd: 57 },
      { places: "Fair Hall, Prospect, La Croix, Rillan Hill", xcd: 52, usd: 20, afterXcd: 65 },
      { places: "Brighton, Diamond, Kelbourney, Penniston, Buccament", xcd: 59, usd: 22, afterXcd: 73 },
      { places: "Stubbs, Calder, Evesham, Mesopotamia, Buccama Resort", xcd: 65, usd: 25, afterXcd: 82 },
      { places: "Vermont, Layou", xcd: 72, usd: 27, afterXcd: 90 },
      { places: "Cane End, Yambou, Richland Park, Mt. Wynne", xcd: 78, usd: 29, afterXcd: 98 },
      { places: "Argyle, Peruvian Vale, Maroon Hill, Barrouallie, Keartons", xcd: 91, usd: 34, afterXcd: 114 },
      { places: "Spring, Belle Isle Hill", xcd: 104, usd: 39, afterXcd: 130 },
      { places: "Biabou, Cedars", xcd: 111, usd: 42, afterXcd: 138 },
      { places: "South Union, Chapmans, Spring Village, Cumberland", xcd: 117, usd: 44, afterXcd: 147 },
      { places: "Diamonds Gap and up", xcd: 124, usd: 47, afterXcd: 155 },
      { places: "Colonarie", xcd: 137, usd: 51, afterXcd: 170 },
      { places: "Coulls Hill", xcd: 143, usd: 53, afterXcd: 179 },
      { places: "Byera, Park Hill, South Rivers", xcd: 150, usd: 56, afterXcd: 187 },
      { places: "Georgetown (Bay Road)", xcd: 163, usd: 61, afterXcd: 203 },
      { places: "Troumaca, Rose Bank", xcd: 169, usd: 64, afterXcd: 212 },
      { places: "Orange Hill, Overland", xcd: 182, usd: 68, afterXcd: 228 },
      { places: "Rose Hall", xcd: 189, usd: 70, afterXcd: 235 },
      { places: "Petit Bordel", xcd: 198, usd: 73, afterXcd: 244 },
      { places: "Sandy Bay, Chateaubelair", xcd: 208, usd: 78, afterXcd: 260 },
      { places: "Owia", xcd: 228, usd: 86, afterXcd: 285 },
      { places: "Richmond", xcd: 245, usd: 87, afterXcd: 293 },
      { places: "Fancy", xcd: 247, usd: 92, afterXcd: 309 },
    ],
  },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'.]/g, "").replace(/\b(town centre|beach|jetty|harbour|and indian bay|marina)\b/g, "").replace(/\s+/g, " ").trim();

/** The official fare for a trip between two landmarks, if one is published (either direction). */
export function officialFare(a: { id: string; name: string }, b: { id: string; name: string }) {
  for (const t of fareTables) {
    const other = a.id === t.originLandmark ? b : b.id === t.originLandmark ? a : null;
    if (!other) continue;
    const target = norm(other.name);
    const row = t.rows.find((r) => !r.maxXcd && r.places.split(/,| to | and |\(|\)/).map(norm).some((p) => p && (p === target || target.startsWith(p) || p.startsWith(target))));
    if (row) return { table: t, row };
  }
  return null;
}

/** The fare for a whole trip: per-taxi tables, extra passengers (SVG airport), or per-passenger tables (Kingstown). */
export function fareAmount(f: { table: FareTable; row: FareRow }, passengers: number): number {
  const p = Math.max(1, passengers || 1);
  if (f.table.id === "vc-kingstown") return f.row.xcd * p;
  if (f.table.id === "vc-airport") return f.row.xcd + Math.max(0, p - 3) * 13;
  return f.row.xcd;
}

/* ---------- Matching free-typed or Google places to the official tables ---------- */
const ORIGIN_ALIASES: Record<string, string[]> = {
  "cq-hillsborough": ["hillsborough"],
  "cq-harvey-vale": ["harvey vale port", "tyrrel bay", "harvey vale"],
  "cq-airport": ["lauriston airport", "carriacou airport", "lauriston point"],
  "gd-airport": ["maurice bishop", "point salines", "mbia", "gnd airport", "grenada airport", "airport"],
  "vc-airport": ["argyle international", "argyle airport", "argyle", "svd", "airport"],
  "vc-kingstown": ["kingstown"],
};
const clean = (s: string) => ` ${norm(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()} `;
const placeTokens = (row: FareRow) =>
  row.places.split(/,| to | and |\(|\)/).map((p) => clean(p.replace(/\b(town|and surroundings|up to|lower|upper|from junction|playing field|and up|bay road)\b/gi, "")).trim())
    .filter((t) => t.length >= 3 && !["in and around kingstown", "around"].includes(t));

/**
 * The official fare between two places described in words (a typed address, a Google place,
 * or a named point), for the given country. Returns null when the published tables don't
 * cover the trip, rather than guessing.
 */
export function officialFareForText(country: string, a: string, b: string): { table: FareTable; row: FareRow } | null {
  const A = clean(a), B = clean(b);
  const onCarriacou = /carriacou|hillsborough|tyrrel bay|harvey vale|lauriston|l.?esterre|windward|bogles|belair|petite carenage|mt\.? royal|mount royal/i.test(`${a} ${b}`);
  for (const t of fareTables.filter((x) => x.country === country && (x.island === "carriacou" ? onCarriacou : !(onCarriacou && x.id === "gd-airport")))) {
    const aliases = ORIGIN_ALIASES[t.id] ?? [];
    const isOrigin = (s: string) => aliases.some((al) => s.includes(` ${al} `) || s.includes(` ${al}`));
    const otherRaw = isOrigin(A) ? b : isOrigin(B) ? a : null;
    if (otherRaw === null) continue;
    const other = clean(otherRaw);
    if (isOrigin(other)) continue;
    // Try the place's own name first (before the first comma), then the whole address.
    for (const target of [clean(otherRaw.split(",")[0]), other]) {
      let best: { row: FareRow; len: number } | null = null;
      for (const row of t.rows) {
        for (const tok of placeTokens(row)) {
          if (!row.maxXcd && target.includes(` ${tok} `) && (!best || tok.length > best.len)) best = { row, len: tok.length };
        }
      }
      if (best) return { table: t, row: best.row };
    }
  }
  return null;
}
