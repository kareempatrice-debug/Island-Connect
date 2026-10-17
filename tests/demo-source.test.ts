import { describe, expect, it } from "vitest";
import { demoSource } from "@/lib/data/demo";
import { parseFilters } from "@/lib/filters";

const slugs = async (country: string, f = {}) => (await demoSource.searchBusinesses(country, f)).map((b) => b.slug);

describe("demo data source", () => {
  it("keeps countries separate", async () => {
    const gd = await slugs("gd");
    const vc = await slugs("vc");
    expect(gd).toContain("harbourline-electrical");
    expect(gd).not.toContain("kingstown-cool-air");
    expect(vc).toContain("kingstown-cool-air");
    expect(vc).not.toContain("harbourline-electrical");
  });

  it("shows cross-border businesses in both countries", async () => {
    expect(await slugs("gd")).toContain("grenadines-link-water-taxi");
    expect(await slugs("vc")).toContain("grenadines-link-water-taxi");
  });

  it("matches search terms loosely", async () => {
    expect(await slugs("gd", { q: "electrician" })).toEqual(["harbourline-electrical"]);
    expect(await slugs("vc", { q: "diving" })).toContain("bequia-blue-dive");
  });

  it("never treats demo listings as verified", async () => {
    expect(await slugs("gd", { verifiedOnly: true })).toEqual([]);
    const all = await demoSource.searchBusinesses("gd", {});
    expect(all.every((b) => b.isDemo && b.verificationStatus !== "verified" && !b.phone && !b.whatsapp)).toBe(true);
  });

  it("ships no guidance articles", async () => {
    expect(await demoSource.getArticles("gd")).toEqual([]);
  });
});

describe("search parameter validation", () => {
  it("ignores malformed values", () => {
    const f = parseFilters({ q: "  plumber ", category: "DROP TABLE", sort: "evil", open: "1", verified: "yes" });
    expect(f).toEqual({ q: "plumber", category: undefined, island: undefined, district: undefined, verifiedOnly: false, openNow: true, sort: undefined });
  });
});
