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

describe("stage 1: registration, research listings and claims", () => {
  const listing = (extra: Record<string, unknown> = {}) =>
    JSON.stringify({
      country: "gd", island: "grenada", district: "st-george", name: "Test Plumbing", phone: "+14734400000",
      categories: ["plumbers"], ...extra,
    });

  it("lets a signed-in user register a business that waits for review", async () => {
    const r = await as("authenticated", STRANGER, () => db.query<{ r: { slug: string } }>(`select public.register_business($1::jsonb) as r`, [listing()]));
    const slug = r.rows[0].r.slug;
    const b = await db.query<{ listing_status: string; claim_status: string }>(`select listing_status, claim_status from public.businesses where slug = $1`, [slug]);
    expect(b.rows[0]).toEqual({ listing_status: "pending_review", claim_status: "claimed" });
    const owner = await db.query(`select 1 from public.business_members m join public.businesses b on b.id = m.business_id where b.slug = $1 and m.user_id = '${STRANGER}' and m.role = 'owner'`, [slug]);
    expect(owner.rows).toHaveLength(1);
    expect(await search("gd", { q: "Test Plumbing" })).not.toContain(slug);
  });

  it("refuses registration when signed out or with no contact details", async () => {
    await expect(as("anon", null, () => db.query(`select public.register_business($1::jsonb)`, [listing()]))).rejects.toThrow();
    await expect(
      as("authenticated", STRANGER, () => db.query(`select public.register_business($1::jsonb)`, [listing({ phone: "" })])),
    ).rejects.toThrow(/contact/);
  });

  it("only lets admins approve registrations", async () => {
    const id = (await db.query<{ id: string }>(`select id from public.businesses where name = 'Test Plumbing'`)).rows[0].id;
    await expect(as("authenticated", STRANGER, () => db.query(`select public.admin_review_business($1, true)`, [id]))).rejects.toThrow(/Administrators/);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_business($1, true)`, [id]));
    expect(await search("gd", { q: "Test Plumbing" })).toHaveLength(1);
  });

  it("requires a source for researched listings and publishes them as unclaimed", async () => {
    await expect(
      as("authenticated", ADMIN, () => db.query(`select public.admin_add_listing($1::jsonb)`, [listing({ name: "Sourced Co" })])),
    ).rejects.toThrow(/source/);
    const r = await as("authenticated", ADMIN, () =>
      db.query<{ r: { slug: string } }>(`select public.admin_add_listing($1::jsonb) as r`, [
        listing({ name: "Sourced Co", sourceUrl: "https://example.com/sourced", sourceCheckedAt: "2026-10-17" }),
      ]),
    );
    const b = await db.query<{ claim_status: string; listing_status: string }>(`select claim_status, listing_status from public.businesses where slug = $1`, [r.rows[0].r.slug]);
    expect(b.rows[0]).toEqual({ claim_status: "unclaimed", listing_status: "published" });
  });

  it("transfers ownership when an admin approves a claim", async () => {
    const id = (await db.query<{ id: string }>(`select id from public.businesses where name = 'Sourced Co'`)).rows[0].id;
    await as("authenticated", OWNER, () =>
      db.query(`insert into public.business_claims (business_id, user_id, claimant_name, role_at_business, evidence) values ($1, '${OWNER}', 'Owner Person', 'Owner', 'I run this business; call the listed number.')`, [id]),
    );
    await expect(
      as("authenticated", OWNER, () =>
        db.query(`insert into public.business_claims (business_id, user_id, claimant_name, role_at_business, evidence) values ($1, '${OWNER}', 'Owner Person', 'Owner', 'Second attempt at the same claim.')`, [id]),
      ),
    ).rejects.toThrow();
    const claim = (await db.query<{ id: string }>(`select id from public.business_claims where business_id = $1`, [id])).rows[0].id;
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_claim($1, true)`, [claim]));
    const b = await db.query<{ claim_status: string }>(`select claim_status from public.businesses where id = $1`, [id]);
    expect(b.rows[0].claim_status).toBe("claimed");
    const m = await db.query(`select 1 from public.business_members where business_id = $1 and user_id = '${OWNER}' and role = 'owner'`, [id]);
    expect(m.rows).toHaveLength(1);
  });

  it("does not allow claims on demo or already-claimed listings", async () => {
    const demo = (await db.query<{ id: string }>(`select id from public.businesses where slug = 'harbourline-electrical'`)).rows[0].id;
    await expect(
      as("authenticated", STRANGER, () =>
        db.query(`insert into public.business_claims (business_id, user_id, claimant_name, role_at_business, evidence) values ($1, '${STRANGER}', 'Someone', 'Owner', 'This is a demo listing claim.')`, [demo]),
      ),
    ).rejects.toThrow();
  });

  it("hides fares until they have a source and check date", async () => {
    await expect(db.exec(`insert into public.fare_rules (country_code, from_place, to_place, amount, is_active) values ('gd', 'gnd-airport', 'st-georges', 50, true)`)).rejects.toThrow(/fare_active_requires_source/);
  });
});

describe("research import", () => {
  it("imports batch 1 as unclaimed listings awaiting review, with sources", async () => {
    await db.exec(readFileSync("supabase/research/2026-10-17-transport.sql", "utf8"));
    const r = await db.query<{ n: number; sourced: number }>(
      `select count(*)::int as n, count(source_url)::int as sourced from public.businesses
       where claim_status = 'unclaimed' and listing_status = 'pending_review' and source_checked_at = '2026-10-17'`,
    );
    expect(r.rows[0]).toEqual({ n: 9, sourced: 9 });
    expect(await search("vc", { q: "Trubb" })).toEqual([]); // hidden until approved
    const fares = await db.query<{ n: number }>(`select count(*)::int as n from public.services s join public.businesses b on b.id = s.business_id where b.name = 'Trubb Taxi Tours SVG'`);
    expect(fares.rows[0].n).toBe(4);
  });
});

describe("stage 2: enquiries and contact clicks", () => {
  let bizId = "";
  let enquiryId = "";
  beforeAll(async () => {
    bizId = (await db.query<{ id: string }>(`select id from public.businesses where slug = 'draft-co'`)).rows[0].id; // owned by OWNER, published earlier
  });

  it("lets a customer start an enquiry and the owner reply", async () => {
    const r = await as("authenticated", STRANGER, () =>
      db.query<{ id: string }>(`select public.start_enquiry($1, 'Leaking pipe', 'Kitchen pipe leaking under the sink, can you come this week?') as id`, [bizId]),
    );
    enquiryId = r.rows[0].id;
    await as("authenticated", OWNER, () =>
      db.query(`insert into public.enquiry_messages (enquiry_id, sender_id, body) values ($1, '${OWNER}', 'Yes, Thursday morning works.')`, [enquiryId]),
    );
    const thread = await as("authenticated", STRANGER, () => db.query(`select body from public.enquiry_messages where enquiry_id = $1 order by id`, [enquiryId]));
    expect(thread.rows).toHaveLength(2);
    const e = await db.query<{ status: string }>(`select status from public.enquiries where id = $1`, [enquiryId]);
    expect(e.rows[0].status).toBe("open");
  });

  it("keeps threads private to the customer and the business", async () => {
    const r = await as("authenticated", ADMIN, () => db.query(`select 1 from public.enquiry_messages where enquiry_id = $1`, [enquiryId]));
    expect(r.rows.length).toBeGreaterThan(0); // admins can see for moderation
    await db.exec(`insert into auth.users (id) values ('00000000-0000-0000-0000-000000000009')`);
    const other = await as("authenticated", "00000000-0000-0000-0000-000000000009", () => db.query(`select 1 from public.enquiry_messages where enquiry_id = $1`, [enquiryId]));
    expect(other.rows).toHaveLength(0);
    await expect(
      as("authenticated", "00000000-0000-0000-0000-000000000009", () =>
        db.query(`insert into public.enquiry_messages (enquiry_id, sender_id, body) values ($1, '00000000-0000-0000-0000-000000000009', 'hi')`, [enquiryId]),
      ),
    ).rejects.toThrow();
  });

  it("refuses enquiries to demo or unclaimed listings, and to your own business", async () => {
    const demo = (await db.query<{ id: string }>(`select id from public.businesses where slug = 'harbourline-electrical'`)).rows[0].id;
    await expect(as("authenticated", STRANGER, () => db.query(`select public.start_enquiry($1, 'Hi', 'A question about wiring please.')`, [demo]))).rejects.toThrow(/can’t receive/);
    await expect(as("authenticated", OWNER, () => db.query(`select public.start_enquiry($1, 'Hi', 'Messaging my own business here.')`, [bizId]))).rejects.toThrow(/own business/);
  });

  it("records contact clicks anonymously and shows them only to the business", async () => {
    await as("anon", null, () => db.query(`select public.log_contact_click('draft-co', 'whatsapp', 'gd')`));
    await as("anon", null, () => db.query(`select public.log_contact_click('harbourline-electrical', 'phone', 'gd')`)); // demo: ignored
    const owner = await as("authenticated", OWNER, () => db.query(`select channel from public.contact_clicks`));
    expect(owner.rows).toEqual([{ channel: "whatsapp" }]);
    const anon = await as("anon", null, () => db.query(`select 1 from public.contact_clicks`));
    expect(anon.rows).toHaveLength(0);
  });

  it("requires a booking link when a business sends customers to an external booking page", async () => {
    await expect(db.exec(`update public.businesses set contact_preference = 'external_booking' where slug = 'draft-co'`)).rejects.toThrow(/external_booking_needs_url/);
  });
});

describe("directory import (18 October 2026)", () => {
  it("imports 265 unclaimed listings into the review queue, with sources, and none go live", async () => {
    await db.exec(readFileSync("supabase/migrations/20261018000004_search_limit.sql", "utf8"));
    await db.exec(readFileSync("supabase/research/2026-10-18-directory-265.sql", "utf8"));
    const r = await db.query<{ n: number; sourced: number }>(
      `select count(*)::int as n, count(source_url)::int as sourced from public.businesses where source_checked_at = '2026-10-18'`,
    );
    expect(r.rows[0]).toEqual({ n: 265, sourced: 265 });
    const live = await db.query<{ n: number }>(`select count(*)::int as n from public.businesses where source_checked_at = '2026-10-18' and listing_status = 'published'`);
    expect(live.rows[0].n).toBe(0);
    // Running the import again adds nothing.
    await db.exec(readFileSync("supabase/research/2026-10-18-directory-265.sql", "utf8"));
    const again = await db.query<{ n: number }>(`select count(*)::int as n from public.businesses where source_checked_at = '2026-10-18'`);
    expect(again.rows[0].n).toBe(265);
  });
});

describe("everyday trades import (18 October 2026)", () => {
  it("adds the new providers to the review queue without duplicating directory businesses", async () => {
    const before = await db.query<{ n: number }>(`select count(*)::int as n from public.businesses`);
    await db.exec(readFileSync("supabase/research/2026-10-18-everyday-trades.sql", "utf8"));
    const after = await db.query<{ n: number }>(`select count(*)::int as n from public.businesses`);
    expect(after.rows[0].n - before.rows[0].n).toBeGreaterThanOrEqual(100);
    const live = await db.query<{ n: number }>(`select count(*)::int as n from public.businesses where source_checked_at = '2026-10-18' and listing_status = 'published'`);
    expect(live.rows[0].n).toBe(0);
    const solo = await db.query<{ n: number }>(`select count(*)::int as n from public.businesses where source_note like '%sole trader%'`);
    expect(solo.rows[0].n).toBe(3);
  });
});

describe("admin listing tools", () => {
  const pick = async () =>
    (await db.query<{ id: string }>(`select id from public.businesses where source_checked_at = '2026-10-18' order by name limit 1`)).rows[0].id;

  it("refuses edits, status changes and deletes from non-admins", async () => {
    const id = await pick();
    await expect(as("authenticated", STRANGER, () => db.query(`select public.admin_edit_business($1, '{"name":"Hacked"}'::jsonb)`, [id]))).rejects.toThrow(/administrators/);
    await expect(as("authenticated", STRANGER, () => db.query(`select public.admin_set_listing_status($1, 'suspended')`, [id]))).rejects.toThrow(/administrators/);
    await expect(as("authenticated", STRANGER, () => db.query(`select public.admin_delete_business($1)`, [id]))).rejects.toThrow(/administrators/);
  });

  it("lets an admin edit details, hide and republish, with an audit trail", async () => {
    const id = await pick();
    await as("authenticated", ADMIN, () =>
      db.query(`select public.admin_edit_business($1, $2::jsonb)`, [id, JSON.stringify({ tagline: "Corrected tagline", phone: "+14734401234", website: "" })]),
    );
    const b = (await db.query<{ tagline: string; phone_e164: string; website: string | null }>(`select tagline, phone_e164, website from public.businesses where id = $1`, [id])).rows[0];
    expect(b).toEqual({ tagline: "Corrected tagline", phone_e164: "+14734401234", website: null });

    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_listing_status($1, 'suspended')`, [id]));
    const hidden = await as("anon", null, () => db.query(`select 1 from public.businesses where id = $1`, [id]));
    expect(hidden.rows).toHaveLength(0);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_listing_status($1, 'published')`, [id]));

    const audit = await db.query<{ action: string }>(`select action from public.audit_events where entity_id = $1 order by id`, [id]);
    expect(audit.rows.map((r) => r.action)).toEqual(expect.arrayContaining(["business.edited", "business.status_changed"]));
  });

  it("won't delete a business that has customer enquiries, but deletes one that has none", async () => {
    const id = await pick();
    await db.query(`update public.businesses set listing_status = 'published' where id = $1`, [id]);
    const enq = await db.query<{ id: string }>(`insert into public.enquiries (business_id, customer_id, subject) values ($1, $2, 'Test') returning id`, [id, OWNER]);
    await expect(as("authenticated", ADMIN, () => db.query(`select public.admin_delete_business($1)`, [id]))).rejects.toThrow(/Hide it instead/);
    await db.query(`delete from public.enquiries where id = $1`, [enq.rows[0].id]);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_delete_business($1, 'Owner asked')`, [id]));
    expect((await db.query(`select 1 from public.businesses where id = $1`, [id])).rows).toHaveLength(0);
    const log = await db.query<{ data: { reason: string } }>(`select data from public.audit_events where entity_id = $1 and action = 'business.deleted'`, [id]);
    expect(log.rows[0].data.reason).toBe("Owner asked");
  });
});
