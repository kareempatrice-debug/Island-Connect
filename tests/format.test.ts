import { describe, expect, it } from "vitest";
import { equivalentPath, formatMoney, formatPhone, isOpenNow, priceLabel, weeklyHours } from "@/lib/format";

describe("money and prices", () => {
  it("formats EC dollars", () => {
    expect(formatMoney(150)).toBe("EC$150");
    expect(formatMoney(2200)).toBe("EC$2,200");
    expect(formatMoney(12.5)).toBe("EC$12.50");
  });
  it("describes price ranges and missing prices", () => {
    expect(priceLabel({ priceMin: 150, priceMax: null, currency: "XCD", priceUnit: "visit" })).toBe("From EC$150 per visit");
    expect(priceLabel({ priceMin: 900, priceMax: 2200, currency: "XCD", priceUnit: null })).toBe("EC$900–2,200");
    expect(priceLabel({ priceMin: null, priceMax: null, currency: "XCD", priceUnit: null })).toBe("Price on request");
  });
});

describe("phone numbers", () => {
  it("formats Grenada and SVG numbers", () => {
    expect(formatPhone("+14734401234")).toBe("+1 (473) 440-1234");
    expect(formatPhone("+17844561234")).toBe("+1 (784) 456-1234");
  });
  it("leaves other formats alone", () => {
    expect(formatPhone("+447700900123")).toBe("+447700900123");
  });
});

describe("opening hours", () => {
  const hours = [{ weekday: 1, opens: "08:00", closes: "17:00" }];
  // Monday 19 October 2026, 13:00 UTC = 09:00 in Grenada (UTC-4, no daylight saving).
  const mondayMorning = new Date("2026-10-19T13:00:00Z");
  const mondayNight = new Date("2026-10-19T23:00:00Z");
  it("uses the country's local time", () => {
    expect(isOpenNow(hours, "America/Grenada", mondayMorning)).toBe(true);
    expect(isOpenNow(hours, "America/Grenada", mondayNight)).toBe(false);
  });
  it("lists closed days", () => {
    const week = weeklyHours(hours);
    expect(week[0]).toEqual({ day: "Monday", label: "8am – 5pm" });
    expect(week[6]).toEqual({ day: "Sunday", label: "Closed" });
  });
});

describe("country switching", () => {
  it("keeps the visitor on the equivalent page", () => {
    expect(equivalentPath("/gd/services/electricians", "", "vc")).toBe("/vc/services/electricians");
    expect(equivalentPath("/gd/guides/returning-home", "", "vc")).toBe("/vc/guides/returning-home");
  });
  it("keeps the search but drops island and parish filters", () => {
    expect(equivalentPath("/gd/explore", "q=plumber&island=carriacou&district=st-george", "vc")).toBe("/vc/explore?q=plumber");
  });
  it("goes to the home page when there is no equivalent", () => {
    expect(equivalentPath("/gd/business/harbourline-electrical", "", "vc")).toBe("/vc");
    expect(equivalentPath("/gd", "", "vc")).toBe("/vc");
  });
});

import { categoryArt } from "@/data/category-art";
import { categories } from "@/data/categories";

describe("category placeholders", () => {
  it("has artwork for every top-level group", () => {
    const groups = categories.filter((c) => !c.parentSlug).map((c) => c.slug);
    expect(groups.every((g) => categoryArt[g])).toBe(true);
    expect(Object.keys(categoryArt)).toHaveLength(8);
  });
});

import { officialFare } from "@/data/fares";
import { landmarks } from "@/data/landmarks";
import roadRoutes from "@/data/road-routes.json";

describe("official fares and road routes", () => {
  const L = (id: string) => landmarks.find((l) => l.id === id)!;
  it("finds the published fare in either direction", () => {
    expect(officialFare(L("gnd-airport"), L("grand-anse"))?.row.xcd).toBe(40);
    expect(officialFare(L("grand-anse"), L("gnd-airport"))?.row.xcd).toBe(40);
    expect(officialFare(L("argyle-airport"), L("kingstown"))?.row.xcd).toBe(91);
    expect(officialFare(L("kingstown"), L("layou"))?.row.xcd).toBe(72);
  });
  it("doesn't invent a fare for places the source doesn't list", () => {
    expect(officialFare(L("gnd-airport"), L("morne-rouge"))).toBeNull();
    expect(officialFare(L("grand-anse"), L("gouyave"))).toBeNull();
  });
  it("has a road route for every pair of points on the same island, running from the alphabetically first point", () => {
    const routes = roadRoutes as unknown as Record<string, { path: [number, number][] }>;
    for (const a of landmarks) for (const b of landmarks) {
      if (a.island !== b.island || a.id >= b.id) continue;
      const r = routes[`${a.id}|${b.id}`];
      expect(r, `${a.id}|${b.id}`).toBeTruthy();
      const [start, end] = [r.path[0], r.path[r.path.length - 1]];
      const near = (p: [number, number], l: { lng: number; lat: number }) => Math.hypot(p[0] - l.lng, p[1] - l.lat);
      // Starting near a and ending near b fits better than the reverse.
      expect(near(start, a) + near(end, b)).toBeLessThan(near(start, b) + near(end, a));
    }
  });
});

import { officialFareForText } from "@/data/fares";
import { decodePolyline } from "@/lib/geo";

describe("official fares for any address", () => {
  it("prices popular routes typed or picked from Google", () => {
    expect(officialFareForText("gd", "Maurice Bishop International Airport, Point Salines", "St. George's, Grenada")?.row.xcd).toBe(50);
    expect(officialFareForText("gd", "Grand Anse Beach, St George's, Grenada", "Maurice Bishop International Airport")?.row.xcd).toBe(40);
    expect(officialFareForText("vc", "Argyle International Airport", "Kingstown, St Vincent")?.row.xcd).toBe(91);
    expect(officialFareForText("vc", "Kingstown", "Layou")?.row.xcd).toBe(72);
  });
  it("leaves unlisted routes to the driver", () => {
    expect(officialFareForText("gd", "Grand Anse", "Gouyave")).toBeNull();
    expect(officialFareForText("vc", "Kingstown", "Union Island")).toBeNull();
  });
  it("decodes route lines", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }, { lat: 43.252, lng: -126.453 }]);
  });
});

import { photoForCategory, typePhotos } from "@/data/category-photos";

describe("category pictures", () => {
  it("gives every category a picture, and the right one for the ones that used to be wrong", () => {
    for (const c of categories) {
      const group = (c as { parentSlug?: string | null }).parentSlug ?? c.slug;
      expect(photoForCategory(c.slug, group), c.slug).toBeTruthy();
    }
    expect(typePhotos.hardware.src).toContain("home-construction");
    expect(typePhotos["trucking-haulage"].src).toContain("haulage");
    expect(typePhotos.vets.src).toContain("vets");
    expect(typePhotos.events.src).toContain("events-venues");
    expect(typePhotos["salons-barbers"].src).toContain("barber");
  });
  it("only points at pictures that exist", async () => {
    const { existsSync } = await import("node:fs");
    for (const v of Object.values(typePhotos)) expect(existsSync(`public${v.src}`), v.src).toBe(true);
  });
});

import { estimateFare } from "@/lib/estimate";

describe("fare estimates", () => {
  it("lands close to the official fares it was fitted to", () => {
    const gd = estimateFare("gd", 9.6)!; // airport to St George's, official EC$50
    expect(gd.low).toBeLessThanOrEqual(50); expect(gd.high).toBeGreaterThanOrEqual(50);
    const vc = estimateFare("vc", 16.9)!; // Argyle to Kingstown, official EC$91
    expect(vc.low).toBeLessThanOrEqual(91); expect(vc.high).toBeGreaterThanOrEqual(91);
  });
  it("adds SVG's extra-passenger charge and refuses silly distances", () => {
    expect(estimateFare("vc", 10, 5)!.low).toBeGreaterThan(estimateFare("vc", 10, 3)!.low);
    expect(estimateFare("gd", 0)).toBeNull();
    expect(estimateFare("gd", 500)).toBeNull();
    expect(estimateFare("xx", 10)).toBeNull();
  });
});

import { cleanPlace } from "@/lib/place-text";

describe("place text", () => {
  it("removes plus codes and tidies commas", () => {
    expect(cleanPlace("Dover Government School, GH49+3GH, Bogles, Grenada")).toBe("Dover Government School, Bogles, Grenada");
    expect(cleanPlace("FG59+4G8, Argyle, Grenada")).toBe("Argyle, Grenada");
    expect(cleanPlace("Grand Anse Beach")).toBe("Grand Anse Beach");
    expect(cleanPlace("Lot 22+ Main Road")).toBe("Lot 22+ Main Road");
  });
});

import { placeWithIsland } from "@/lib/place-text";
describe("place with island", () => {
  it("adds the island once, without the country or plus code", () => {
    expect(placeWithIsland("Dover Government School, GH49+3GH, Bogles, Grenada", "Carriacou")).toBe("Dover Government School, Bogles, Carriacou");
    expect(placeWithIsland("Hillsborough jetty, Carriacou", "Carriacou")).toBe("Hillsborough jetty, Carriacou");
  });
});
