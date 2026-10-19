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

/** Country calling codes offered for customers' contact numbers (visitors included). */
export const CALLING_CODES = [
  { code: "+1473", label: "Grenada (+1 473)" },
  { code: "+1784", label: "St Vincent and the Grenadines (+1 784)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+1", label: "United States or Canada (+1)" },
  { code: "+1868", label: "Trinidad and Tobago (+1 868)" },
  { code: "+1246", label: "Barbados (+1 246)" },
  { code: "+1758", label: "St Lucia (+1 758)" },
  { code: "+1876", label: "Jamaica (+1 876)" },
  { code: "+1268", label: "Antigua and Barbuda (+1 268)" },
  { code: "+1767", label: "Dominica (+1 767)" },
  { code: "+1869", label: "St Kitts and Nevis (+1 869)" },
  { code: "+592", label: "Guyana (+592)" },
  { code: "+353", label: "Ireland (+353)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+31", label: "Netherlands (+31)" },
  { code: "+41", label: "Switzerland (+41)" },
  { code: "+46", label: "Sweden (+46)" },
  { code: "+39", label: "Italy (+39)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+971", label: "United Arab Emirates (+971)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "other", label: "Another country" },
] as const;

/**
 * A customer's number from anywhere in the world. Accepts a full international number
 * (starting + or 00), or a national number with the chosen country code, dropping a
 * leading 0 as most countries do (UK 07835 028032 becomes +44 7835 028032).
 * NANP codes (+1 473, +1 784, …) also accept seven-digit local numbers.
 */
export function toE164International(raw: string | null | undefined, callingCode: string): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  let digits = s.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) {
    if (/^\+[1-9]\d{6,14}$/.test(digits)) return digits;
    throw new Error(`“${s}” doesn’t look like an international number. Check the country code and number.`);
  }
  if (callingCode === "other") throw new Error("Type your full number starting with + and the country code, e.g. +44 7835 028032.");
  const bare = digits;
  if (callingCode.startsWith("+1") && callingCode.length === 5) {
    // Caribbean and other NANP areas: local 7 digits, or the full 10 / 11 digits.
    if (/^\d{7}$/.test(bare)) return `${callingCode}${bare}`;
    if (/^1\d{10}$/.test(bare)) return `+${bare}`;
    if (/^\d{10}$/.test(bare)) return `+1${bare}`;
  } else if (callingCode === "+1") {
    if (/^1\d{10}$/.test(bare)) return `+${bare}`;
    if (/^\d{10}$/.test(bare)) return `+1${bare}`;
  } else {
    const national = bare.replace(/^0/, "");
    const full = `${callingCode}${national}`;
    if (/^\+[1-9]\d{6,14}$/.test(full) && national.length >= 6) return full;
  }
  throw new Error(`“${s}” doesn’t look like a number for the country you chose. Check both, or type the full number starting with +.`);
}
