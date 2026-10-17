/*
 * Pickup and drop-off points for ride requests. Many places in Grenada and SVG
 * are known by landmark rather than street address, so riders pick a landmark
 * and can add directions for the driver.
 *
 * Coordinates are approximate and are used only to place pins on the schematic
 * map. Shoreline points (beaches, jetties) are nudged just inside the simplified
 * coastline so they sit on land. Verify before using them for any routing.
 */
export interface Landmark {
  id: string;
  name: string;
  countryCode: string;
  island: string;
  kind: "airport" | "port" | "town" | "beach" | "area";
  lat: number;
  lng: number;
}

const L = (countryCode: string, island: string, id: string, name: string, kind: Landmark["kind"], lat: number, lng: number): Landmark => ({
  id, name, countryCode, island, kind, lat, lng,
});

export const landmarks: Landmark[] = [
  // Grenada
  L("gd", "grenada", "gnd-airport", "Maurice Bishop International Airport", "airport", 11.9967, -61.7862),
  L("gd", "grenada", "st-georges", "St. George’s town centre", "town", 12.0532, -61.7514),
  L("gd", "grenada", "port-louis", "Port Louis Marina", "port", 12.0475, -61.749),
  L("gd", "grenada", "grand-anse", "Grand Anse Beach", "beach", 12.0275, -61.7565),
  L("gd", "grenada", "morne-rouge", "Morne Rouge", "beach", 12.024, -61.7681),
  L("gd", "grenada", "true-blue", "True Blue", "area", 12.005, -61.774),
  L("gd", "grenada", "lance-aux-epines", "Lance aux Épines", "area", 12.001, -61.757),
  L("gd", "grenada", "grand-etang", "Grand Etang", "area", 12.095, -61.695),
  L("gd", "grenada", "gouyave", "Gouyave", "town", 12.168, -61.729),
  L("gd", "grenada", "victoria", "Victoria", "town", 12.19, -61.706),
  L("gd", "grenada", "sauteurs", "Sauteurs", "town", 12.218, -61.639),
  L("gd", "grenada", "grenville", "Grenville", "town", 12.122, -61.624),
  L("gd", "carriacou", "lauriston-airport", "Lauriston Airport", "airport", 12.4761, -61.4728),
  L("gd", "carriacou", "hillsborough", "Hillsborough jetty", "port", 12.481, -61.456),
  L("gd", "carriacou", "tyrrel-bay", "Tyrrel Bay", "beach", 12.4561, -61.4857),
  L("gd", "carriacou", "windward-carriacou", "Windward", "town", 12.493, -61.433),

  // St. Vincent and the Grenadines
  L("vc", "st-vincent", "argyle-airport", "Argyle International Airport", "airport", 13.1567, -61.1499),
  L("vc", "st-vincent", "kingstown", "Kingstown town centre", "town", 13.156, -61.227),
  L("vc", "st-vincent", "kingstown-ferry", "Kingstown ferry terminal", "port", 13.1566, -61.2297),
  L("vc", "st-vincent", "arnos-vale", "Arnos Vale", "area", 13.143, -61.211),
  L("vc", "st-vincent", "villa", "Villa and Indian Bay", "beach", 13.1396, -61.2097),
  L("vc", "st-vincent", "calliaqua", "Calliaqua", "town", 13.13, -61.193),
  L("vc", "st-vincent", "mesopotamia", "Mesopotamia", "town", 13.18, -61.16),
  L("vc", "st-vincent", "layou", "Layou", "town", 13.2027, -61.2775),
  L("vc", "st-vincent", "barrouallie", "Barrouallie", "town", 13.235, -61.27),
  L("vc", "st-vincent", "georgetown", "Georgetown", "town", 13.28, -61.118),
  L("vc", "bequia", "port-elizabeth", "Port Elizabeth jetty", "port", 13.0082, -61.2369),
  L("vc", "bequia", "bequia-airport", "J. F. Mitchell Airport", "airport", 12.9884, -61.262),
  L("vc", "bequia", "lower-bay", "Lower Bay", "beach", 13.0024, -61.2415),
  L("vc", "bequia", "friendship-bay", "Friendship Bay", "beach", 12.993, -61.23),
  L("vc", "union-island", "clifton", "Clifton harbour", "port", 12.598, -61.418),
  L("vc", "union-island", "ashton", "Ashton", "town", 12.595, -61.437),
];
