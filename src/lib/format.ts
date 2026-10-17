import type { OpeningHours, Service } from "./types";

const CURRENCY_PREFIX: Record<string, string> = { XCD: "EC$", USD: "US$", BBD: "BBD$", TTD: "TT$" };

export function formatMoney(amount: number, currency = "XCD"): string {
  const prefix = CURRENCY_PREFIX[currency] ?? `${currency} `;
  const value = Number.isInteger(amount) ? amount.toLocaleString("en") : amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${prefix}${value}`;
}

/** "From EC$150 per visit", "EC$900–2,200", "Price on request". */
export function priceLabel(s: Pick<Service, "priceMin" | "priceMax" | "currency" | "priceUnit">): string {
  const unit = s.priceUnit ? ` per ${s.priceUnit}` : "";
  if (s.priceMin != null && s.priceMax != null && s.priceMax !== s.priceMin) {
    return `${formatMoney(s.priceMin, s.currency)}–${s.priceMax.toLocaleString("en")}${unit}`;
  }
  if (s.priceMin != null) return `From ${formatMoney(s.priceMin, s.currency)}${unit}`;
  return "Price on request";
}

/** Formats NANP numbers as +1 (473) 440-1234; other numbers are returned unchanged. */
export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export function whatsappLink(e164: string, text?: string): string {
  const base = `https://wa.me/${e164.replace(/^\+/, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Current weekday (0–6) and minutes since midnight in a given IANA time zone. */
export function localClock(timeZone: string, now = new Date()): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { weekday, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function isOpenNow(hours: OpeningHours[], timeZone: string, now = new Date()): boolean {
  const { weekday, minutes } = localClock(timeZone, now);
  return hours.some((h) => h.weekday === weekday && minutes >= toMinutes(h.opens) && minutes < toMinutes(h.closes));
}

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

/** Groups opening hours into one line per weekday, Monday first. */
export function weeklyHours(hours: OpeningHours[]): { day: string; label: string }[] {
  return [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const slots = hours.filter((h) => h.weekday === d).sort((a, b) => a.opens.localeCompare(b.opens));
    return {
      day: WEEKDAYS[d],
      label: slots.length ? slots.map((s) => `${formatTime(s.opens)} – ${formatTime(s.closes)}`).join(", ") : "Closed",
    };
  });
}

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  mobile_money: "Mobile money",
};

/** Path for the same page in another country, or that country's home when there is no equivalent. */
export function equivalentPath(pathname: string, search: string, targetCountry: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1);
  const section = rest[0];
  const keep = ["explore", "services", "guides"];
  if (!section || !keep.includes(section)) return `/${targetCountry}`;
  // Search filters for islands and parishes are country-specific, so drop them.
  const params = new URLSearchParams(search);
  params.delete("island");
  params.delete("district");
  const qs = params.toString();
  return `/${targetCountry}/${rest.join("/")}${qs ? `?${qs}` : ""}`;
}
