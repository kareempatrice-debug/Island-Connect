/**
 * Normalises a phone number to E.164. Local seven-digit numbers get the
 * country's dialling code (+1473 Grenada, +1784 SVG). Returns null if empty,
 * and throws if the number can't be understood.
 */
export function toE164(raw: string | null | undefined, diallingCode: string): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const digits = s.replace(/[^\d+]/g, "");
  if (/^\+[1-9]\d{6,14}$/.test(digits)) return digits;
  const bare = digits.replace(/^\+/, "");
  if (/^\d{7}$/.test(bare)) return `${diallingCode}${bare}`;
  if (/^1\d{10}$/.test(bare)) return `+${bare}`;
  if (/^\d{10}$/.test(bare)) return `+1${bare}`;
  throw new Error(`“${s}” doesn’t look like a phone number. Include the area code, e.g. 473 440 1234.`);
}
