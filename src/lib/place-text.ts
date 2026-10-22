/*
 * Tidy a place name or address for display: drop Google "plus codes" (like GH49+3GH), which mean
 * nothing to people, and tidy the commas left behind.
 */
const PLUS_CODE = /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{0,3}\b/gi;

export function cleanPlace(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(PLUS_CODE, "")
    .replace(/\s*,\s*(,\s*)+/g, ", ")
    .replace(/^\s*,\s*|\s*,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** "Dover Government School, Bogles" + "Carriacou" → "Dover Government School, Bogles, Carriacou". */
export function placeWithIsland(place: string | null | undefined, island: string | null | undefined): string {
  let p = cleanPlace(place).replace(/,\s*(Grenada|St\.? Vincent and the Grenadines|Saint Vincent and the Grenadines)$/i, "");
  if (island && !p.toLowerCase().includes(island.toLowerCase())) p = p ? `${p}, ${island}` : island;
  return p;
}
