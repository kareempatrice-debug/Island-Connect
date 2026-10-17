/*
 * Database tests. These run the real migration, seed and demo SQL inside an
 * in-memory Postgres (PGlite), with a minimal stand-in for Supabase's auth
 * schema, then check search behaviour, country isolation and security rules.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

let db: PGlite;

const AUTH_STUB = `
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;
const GRANTS = `
  grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon, authenticated;
  grant insert, update, delete on all tables in schema public to authenticated;
`;

const OWNER = "00000000-0000-0000-0000-000000000001";
const STRANGER = "00000000-0000-0000-0000-000000000002";
const ADMIN = "00000000-0000-0000-0000-000000000003";

async function as<T>(role: "anon" | "authenticated", userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${userId ?? ""}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

async function search(country: string, opts: Record<string, unknown> = {}) {
  const res = await db.query<{ slug: string }>(
    `select b.slug from public.search_businesses($1, $2, $3, $4, $5, $6, null, 'relevance', 100) s
     join public.businesses b on b.id = s.business_id`,
    [country, opts.q ?? null, opts.category ?? null, opts.island ?? null, opts.district ?? null, opts.verifiedOnly ?? false],
  );
  return res.rows.map((r) => r.slug);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(AUTH_STUB);
  for (const file of readdirSync("supabase/migrations").sort()) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  }
  await db.exec(GRANTS);
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  await db.exec(readFileSync("supabase/demo.sql", "utf8"));
  await db.exec(`
    insert into auth.users (id, email) values ('${OWNER}', 'owner@example.com'), ('${STRANGER}', 'x@example.com'), ('${ADMIN}', 'admin@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
    insert into public.businesses (slug, name, listing_status) values ('draft-co', 'Draft Co', 'draft');
    insert into public.business_locations (business_id, country_code, island_id, is_primary)
      select b.id, 'gd', i.id, true from public.businesses b, public.islands i where b.slug = 'draft-co' and i.slug = 'grenada';
    insert into public.business_members (business_id, user_id, role)
      select id, '${OWNER}', 'owner' from public.businesses where slug = 'draft-co';
  `);
});

describe("seed data", () => {
  it("loads both launch countries with six parishes on each main island", async () => {
    const r = await db.query<{ code: string; n: number }>(
      `select c.code, count(d.*)::int as n from public.countries c
       join public.districts d on d.country_code = c.code join public.islands i on i.id = d.island_id and i.is_main
       group by c.code order by c.code`,
    );
    expect(r.rows).toEqual([{ code: "gd", n: 6 }, { code: "vc", n: 5 }]);
  });

  it("enables every category in both countries", async () => {
    const r = await db.query<{ n: number }>(`select count(*)::int n from public.country_categories where not is_enabled`);
    expect(r.rows[0].n).toBe(0);
  });
});

describe("search and country isolation", () => {
  it("never returns SVG-only businesses in Grenada", async () => {
    const gd = await search("gd");
    expect(gd).toContain("harbourline-electrical");
    expect(gd).not.toContain("kingstown-cool-air");
    expect(gd).not.toContain("bequia-blue-dive");
  });

  it("never returns Grenada-only businesses in SVG", async () => {
    const vc = await search("vc");
    expect(vc).toContain("kingstown-cool-air");
    expect(vc).not.toContain("harbourline-electrical");
  });

  it("shows a cross-border business in both countries", async () => {
    expect(await search("gd")).toContain("grenadines-link-water-taxi");
    expect(await search("vc")).toContain("grenadines-link-water-taxi");
  });

  it("matches free-text queries against categories and services", async () => {
    expect(await search("gd", { q: "electrician" })).toEqual(["harbourline-electrical"]);
    expect(await search("vc", { q: "dive" })).toContain("bequia-blue-dive");
  });

  it("treats a parent category as including its children", async () => {
    const r = await search("gd", { category: "home-construction" });
    expect(r).toContain("harbourline-electrical");
    expect(r).not.toContain("nutmeg-ridge-hikes");
  });

  it("filters by island, including islands a business serves", async () => {
    const r = await search("gd", { island: "carriacou" });
    expect(r).toEqual(expect.arrayContaining(["carriacou-island-hauling", "lagoon-road-accounting", "grenadines-link-water-taxi"]));
    expect(r).not.toContain("harbourline-electrical");
  });

  it("excludes demo listings from verified-only results", async () => {
    expect(await search("gd", { verifiedOnly: true })).toEqual([]);
  });

  it("does not return draft listings", async () => {
    expect(await search("gd", { q: "Draft" })).not.toContain("draft-co");
  });
});

describe("integrity rules", () => {
  it("refuses to mark a demo listing as verified", async () => {
    await expect(
      db.exec(`update public.businesses set verification_status = 'verified' where slug = 'harbourline-electrical'`),
    ).rejects.toThrow(/demo_never_verified/);
  });

  it("refuses to publish an article without sources and verification", async () => {
    await expect(
      db.exec(`insert into public.articles (country_code, section, slug, title, status) values ('gd', 'returning-home', 'x', 'X', 'published')`),
    ).rejects.toThrow(/article_publish_requires_provenance/);
  });

  it("refuses an article with no country unless it is marked regional", async () => {
    await expect(
      db.exec(`insert into public.articles (section, slug, title) values ('returning-home', 'y', 'Y')`),
    ).rejects.toThrow(/article_country_scope/);
  });
});

describe("row level security", () => {
  it("hides draft listings from the public", async () => {
    const r = await as("anon", null, () => db.query(`select slug from public.businesses where slug = 'draft-co'`));
    expect(r.rows).toHaveLength(0);
  });

  it("shows a draft listing to its owner", async () => {
    const r = await as("authenticated", OWNER, () => db.query(`select slug from public.businesses where slug = 'draft-co'`));
    expect(r.rows).toHaveLength(1);
  });

  it("hides a draft listing from other signed-in users", async () => {
    const r = await as("authenticated", STRANGER, () => db.query(`select slug from public.businesses where slug = 'draft-co'`));
    expect(r.rows).toHaveLength(0);
  });

  it("lets an owner edit their description but not verify themselves", async () => {
    await as("authenticated", OWNER, () =>
      db.exec(`update public.businesses set description = 'Updated' where slug = 'draft-co'`),
    );
    await expect(
      as("authenticated", OWNER, () =>
        db.exec(`update public.businesses set verification_status = 'verified' where slug = 'draft-co'`),
      ),
    ).rejects.toThrow(/Only administrators/);
  });

  it("silently blocks a stranger from editing someone else's listing", async () => {
    await as("authenticated", STRANGER, () =>
      db.exec(`update public.businesses set name = 'Hijacked' where slug = 'harbourline-electrical'`),
    );
    const r = await db.query<{ name: string }>(`select name from public.businesses where slug = 'harbourline-electrical'`);
    expect(r.rows[0].name).toBe("Harbourline Electrical");
  });

  it("stops users promoting themselves to admin", async () => {
    await expect(
      as("authenticated", STRANGER, () => db.exec(`update public.profiles set role = 'admin' where id = '${STRANGER}'`)),
    ).rejects.toThrow(/Only administrators/);
  });

  it("lets an admin publish a listing", async () => {
    await as("authenticated", ADMIN, () =>
      db.exec(`update public.businesses set listing_status = 'published' where slug = 'draft-co'`),
    );
    const r = await as("anon", null, () => db.query(`select slug from public.businesses where slug = 'draft-co'`));
    expect(r.rows).toHaveLength(1);
  });

  it("hides the audit log from non-admins", async () => {
    await db.exec(`insert into public.audit_events (action, entity_type) values ('test', 'test')`);
    const r = await as("authenticated", STRANGER, () => db.query(`select * from public.audit_events`));
    expect(r.rows).toHaveLength(0);
  });
});
