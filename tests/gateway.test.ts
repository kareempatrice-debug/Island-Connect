import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { journeys, services, serviceBySlug } from "@/data/gateway";

const migration = readFileSync("supabase/migrations/20261111000031_gateway.sql", "utf8");

describe("Gateway content", () => {
  it("links every step to a real service and agency in the same country", () => {
    for (const [country, list] of Object.entries(journeys)) {
      for (const j of list) for (const s of j.steps) {
        if (s.service) expect(serviceBySlug(s.service)?.country, `${country}/${j.slug}/${s.id}`).toBe(country);
        if (s.agency) { expect(s.agency.startsWith(`${country}-`)).toBe(true); expect(migration).toContain(`'${s.agency}'`); }
      }
    }
    for (const svc of services) expect(migration).toContain(`'${svc.agency}'`);
  });
  it("offers both countries the same three journeys", () => {
    expect(journeys.gd.map((j) => j.slug)).toEqual(journeys.vc.map((j) => j.slug));
  });
});
