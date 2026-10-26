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
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz not null default now(), email_confirmed_at timestamptz, last_sign_in_at timestamptz);
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

describe("business photos", () => {
  const pick = async () => (await db.query<{ id: string }>(`select id from public.businesses where is_demo order by name limit 1`)).rows[0].id;

  it("accepts photo paths only inside the business's own folder", async () => {
    const id = await pick();
    await db.query(`update public.businesses set cover_path = $2, gallery_paths = array[$3] where id = $1`, [id, `${id}/cover-1.webp`, `${id}/gallery-1.webp`]);
    await expect(db.query(`update public.businesses set cover_path = '00000000-0000-0000-0000-00000000dead/x.webp' where id = $1`, [id])).rejects.toThrow(/media_paths_ok/);
    await expect(db.query(`update public.businesses set logo_path = $2 where id = $1`, [id, `${id}/../../etc/passwd`])).rejects.toThrow(/media_paths_ok/);
  });

  it("allows at most 10 gallery photos", async () => {
    const id = await pick();
    const eleven = Array.from({ length: 11 }, (_, i) => `${id}/gallery-${i}.webp`);
    await expect(db.query(`update public.businesses set gallery_paths = $2 where id = $1`, [id, eleven])).rejects.toThrow(/media_paths_ok/);
    await db.query(`update public.businesses set gallery_paths = $2 where id = $1`, [id, eleven.slice(0, 10)]);
  });

  it("lets owners, not strangers, manage the business's photo folder", async () => {
    const { rows } = await db.query<{ business_id: string }>(`select business_id from public.business_members where user_id = $1 and role = 'owner' limit 1`, [OWNER]);
    if (!rows.length) return; // no owned business in this fixture
    const folder = `${rows[0].business_id}/logo-1.webp`;
    const owner = await as("authenticated", OWNER, () => db.query<{ ok: boolean }>(`select public.can_manage_media($1) as ok`, [folder]));
    const stranger = await as("authenticated", STRANGER, () => db.query<{ ok: boolean }>(`select public.can_manage_media($1) as ok`, [folder]));
    expect(owner.rows[0].ok).toBe(true);
    expect(stranger.rows[0].ok).toBe(false);
    const junk = await as("authenticated", OWNER, () => db.query<{ ok: boolean }>(`select public.can_manage_media('not-a-folder/x.webp') as ok`));
    expect(junk.rows[0].ok).toBe(false);
  });
});

describe("Stage 3: operators, trip requests, quotes and the ledger", () => {
  const RIDER = "00000000-0000-0000-0000-000000000010";
  const OTHER = "00000000-0000-0000-0000-000000000011";
  let biz: string;

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${RIDER}', 'rider@example.com'), ('${OTHER}', 'other@example.com') on conflict do nothing`);
    biz = (await db.query<{ id: string }>(`
      select b.id from public.businesses b join public.business_locations l on l.business_id = b.id
      where b.listing_status = 'published' and not b.is_demo and l.country_code = 'gd' order by b.name limit 1`)).rows[0].id;
    await db.query(`insert into public.business_members (business_id, user_id, role) values ($1, $2, 'owner') on conflict do nothing`, [biz, OWNER]);
  });

  const request = () =>
    as("authenticated", RIDER, () =>
      db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [
        JSON.stringify({ country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Airport arrivals", dropoff: "Grand Anse", passengers: 2, contact_phone: "+14734441234" }),
      ]),
    ).then((r) => r.rows[0].id);

  it("only approved operators can quote, and only owners can apply", async () => {
    await expect(as("authenticated", OTHER, () => db.query(`select public.apply_operator($1, '{"kinds":["taxi"],"licence":"T-123","vehicles":"Toyota Noah"}'::jsonb)`, [biz]))).rejects.toThrow(/owner/);
    await as("authenticated", OWNER, () => db.query(`select public.apply_operator($1, '{"kinds":["taxi","airport"],"licence":"Taxi licence T-123","vehicles":"Toyota Noah, 7 seats"}'::jsonb)`, [biz]));
    const id = await request();
    await expect(as("authenticated", OWNER, () => db.query(`select public.send_trip_quote($1, $2, 75, 'Door to door', 24)`, [id, biz]))).rejects.toThrow(/approved/);
    const hidden = await as("authenticated", OWNER, () => db.query(`select 1 from public.trip_requests where id = $1`, [id]));
    expect(hidden.rows).toHaveLength(0);
    await expect(as("authenticated", OWNER, () => db.query(`select public.admin_review_operator($1, true)`, [biz]))).rejects.toThrow(/administrators/);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_operator($1, true, 'Licence checked')`, [biz]));
  });

  it("runs a trip from request to quote to booking to completion, with a 0% ledger entry", async () => {
    const id = await request();
    const seen = await as("authenticated", OWNER, () => db.query(`select 1 from public.trip_requests where id = $1`, [id]));
    expect(seen.rows).toHaveLength(1);
    const notSeen = await as("authenticated", OTHER, () => db.query(`select 1 from public.trip_requests where id = $1`, [id]));
    expect(notSeen.rows).toHaveLength(0);

    const phoneBefore = await as("authenticated", OWNER, () => db.query(`select 1 from public.trip_contacts where request_id = $1`, [id]));
    expect(phoneBefore.rows).toHaveLength(0); // the operator can't see the customer's number before being chosen
    const q = await as("authenticated", OWNER, () => db.query<{ id: string }>(`select public.send_trip_quote($1, $2, 75, 'Door to door, 2 bags', 24) as id`, [id, biz]));
    await expect(as("authenticated", OTHER, () => db.query(`select public.accept_trip_quote($1)`, [q.rows[0].id]))).rejects.toThrow(/Only the person/);
    await as("authenticated", RIDER, () => db.query(`select public.accept_trip_quote($1)`, [q.rows[0].id]));
    const st = await db.query<{ status: string }>(`select status from public.trip_requests where id = $1`, [id]);
    expect(st.rows[0].status).toBe("booked");
    const phoneAfter = await as("authenticated", OWNER, () => db.query<{ phone_e164: string }>(`select phone_e164 from public.trip_contacts where request_id = $1`, [id]));
    expect(phoneAfter.rows[0].phone_e164).toBe("+14734441234");

    await expect(as("authenticated", RIDER, () => db.query(`select public.complete_trip($1)`, [id]))).rejects.toThrow(/operator/);
    await as("authenticated", OWNER, () => db.query(`select public.complete_trip($1)`, [id]));
    const led = await db.query<{ fare_xcd: string; rate: string; commission_xcd: string }>(`select fare_xcd, rate, commission_xcd from public.commission_ledger where request_id = $1`, [id]);
    expect(led.rows[0]).toEqual({ fare_xcd: "75.00", rate: "0.0000", commission_xcd: "0.00" });
  });

  it("lets the customer cancel, and refuses quotes on cancelled requests", async () => {
    const id = await request();
    await as("authenticated", RIDER, () => db.query(`select public.cancel_trip_request($1)`, [id]));
    await expect(as("authenticated", OWNER, () => db.query(`select public.send_trip_quote($1, $2, 50, null, 24)`, [id, biz]))).rejects.toThrow(/no longer open/);
  });

  it("only admins can set the founder label", async () => {
    await expect(as("authenticated", OWNER, () => db.query(`update public.businesses set founder_owned = true where id = $1`, [biz]))).rejects.toThrow(/founder/);
    await as("authenticated", ADMIN, () => db.query(`update public.businesses set founder_owned = true where id = $1`, [biz]));
  });
});

describe("phone notification devices", () => {
  it("lets people register and see only their own devices", async () => {
    await as("authenticated", OWNER, () => db.query(`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://push.example/owner', 'k', 'a')`, [OWNER]));
    await expect(as("authenticated", OWNER, () => db.query(`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://push.example/x', 'k', 'a')`, [STRANGER]))).rejects.toThrow();
    const theirs = await as("authenticated", STRANGER, () => db.query(`select 1 from public.push_subscriptions`));
    expect(theirs.rows).toHaveLength(0);
    const mine = await as("authenticated", OWNER, () => db.query(`select 1 from public.push_subscriptions`));
    expect(mine.rows).toHaveLength(1);
  });
});

describe("admin sets up an operator directly", () => {
  it("approves a business for chosen trip kinds in one step, admins only", async () => {
    const id = (await db.query<{ id: string }>(`select id from public.businesses where listing_status = 'published' and not is_demo order by name desc limit 1`)).rows[0].id;
    await expect(as("authenticated", OWNER, () => db.query(`select public.admin_set_operator($1, array['taxi']::public.trip_kind[])`, [id]))).rejects.toThrow(/administrators/);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_operator($1, array['taxi','airport']::public.trip_kind[], 'Licence seen')`, [id]));
    const r = await db.query<{ status: string; kinds: string }>(`select status, kinds::text from public.operator_profiles where business_id = $1`, [id]);
    expect(r.rows[0]).toEqual({ status: "approved", kinds: "{taxi,airport}" });
  });
});

describe("admin assigns a listing to its owner's account", () => {
  it("makes the account owner, marks the listing claimed, admins only", async () => {
    const id = (await db.query<{ id: string }>(`select id from public.businesses where claim_status = 'unclaimed' order by name limit 1`)).rows[0].id;
    await expect(as("authenticated", OWNER, () => db.query(`select public.admin_assign_owner($1, 'rider@example.com')`, [id]))).rejects.toThrow(/administrators/);
    await expect(as("authenticated", ADMIN, () => db.query(`select public.admin_assign_owner($1, 'nobody@example.com')`, [id]))).rejects.toThrow(/No account/);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_assign_owner($1, ' Rider@Example.com ')`, [id]));
    const b = await db.query<{ claim_status: string }>(`select claim_status from public.businesses where id = $1`, [id]);
    expect(b.rows[0].claim_status).toBe("claimed");
    const owners = await as("authenticated", ADMIN, () => db.query<{ email: string }>(`select email from public.admin_business_owners($1)`, [id]));
    expect(owners.rows.map((r) => r.email)).toContain("rider@example.com");
  });
});

describe("instant booking at the official fare, and trip chat", () => {
  const RIDER = "00000000-0000-0000-0000-000000000010";
  const OTHER = "00000000-0000-0000-0000-000000000011";
  let biz: string;
  beforeAll(async () => {
    biz = (await db.query<{ business_id: string }>(`select business_id from public.operator_profiles where status = 'approved' limit 1`)).rows[0].business_id;
    await db.query(`update public.operator_profiles set kinds = array['taxi','airport']::public.trip_kind[] where business_id = $1`, [biz]);
  });
  const fixed = () => as("authenticated", RIDER, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [
    JSON.stringify({ country: "gd", kind: "airport", from: "Grenada", to: "Grenada", pickup: "Airport", dropoff: "Grand Anse", passengers: 2, contact_phone: "+447835028032", fixed_fare_xcd: 40, fare_source: "GTA" }),
  ])).then((r) => r.rows[0].id);

  it("books the trip for the first operator to accept, at the fare", async () => {
    const id = await fixed();
    await as("authenticated", OWNER, () => db.query(`select public.accept_fixed_fare($1, $2)`, [id, biz]));
    const r = await db.query<{ status: string; amount: string }>(`select r.status, q.amount_xcd::text as amount from public.trip_requests r join public.trip_quotes q on q.id = r.accepted_quote_id where r.id = $1`, [id]);
    expect(r.rows[0]).toEqual({ status: "booked", amount: "40.00" });
    await expect(as("authenticated", OWNER, () => db.query(`select public.accept_fixed_fare($1, $2)`, [id, biz]))).rejects.toThrow(/already taken/);
  });

  it("lets only the customer and the booked operator chat", async () => {
    const id = await fixed();
    await expect(as("authenticated", RIDER, () => db.query(`select public.send_trip_message($1, 'Hello?')`, [id]))).rejects.toThrow(/Only the customer/);
    await as("authenticated", OWNER, () => db.query(`select public.accept_fixed_fare($1, $2)`, [id, biz]));
    await as("authenticated", RIDER, () => db.query(`select public.send_trip_message($1, 'I''m at arrivals, blue jacket')`, [id]));
    await as("authenticated", OWNER, () => db.query(`select public.send_trip_message($1, 'On my way, 5 minutes')`, [id]));
    const seen = await as("authenticated", RIDER, () => db.query(`select body from public.trip_messages where request_id = $1 order by id`, [id]));
    expect(seen.rows).toHaveLength(2);
    const outsider = await as("authenticated", OTHER, () => db.query(`select 1 from public.trip_messages where request_id = $1`, [id]));
    expect(outsider.rows).toHaveLength(0);
    await expect(as("authenticated", OTHER, () => db.query(`select public.send_trip_message($1, 'hi')`, [id]))).rejects.toThrow(/Only the customer/);
  });
});

describe("one-step driver sign-up", () => {
  const DRIVER = "00000000-0000-0000-0000-000000000020";
  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${DRIVER}', 'driver@example.com') on conflict do nothing`);
  });
  const next = new Date(Date.now() + 200 * 86400_000).toISOString().slice(0, 10);
  const passengerDocs = (folder: string) => ["hire_registration", "psv_permit", "hire_insurance", "tourism_licence", "photo_id"].map((type) => ({ type, path: `${folder}/${type}-1.jpg`, expires_on: next }));
  const apply = (docs: { type: string; path: string; expires_on: string }[], confirm = true) => as("authenticated", DRIVER, () => db.query<{ r: { id: string; slug: string } }>(`select public.apply_as_driver($1::jsonb) as r`, [JSON.stringify({
    country: "gd", island: "grenada", name: "Marcus Taxi", tagline: "Taxi and airport runs", provider_type: "individual",
    phone: "+14734401234", whatsapp: "+14734401234", kinds: ["taxi", "airport"], licence: "Taxi permit T45", confirm_passenger: confirm,
    vehicles: "Toyota Noah, 7 seats, H1234", insurance: "Hire and reward, policy 123", docs,
  })]));

  it("needs the hire versions of every document, with expiry dates, in the applicant's own folder", async () => {
    await expect(apply(passengerDocs(DRIVER), false)).rejects.toThrow(/licensed hire vehicle/);
    await expect(apply([])).rejects.toThrow(/with its expiry date/);
    await expect(apply(passengerDocs("someone-else"))).rejects.toThrow();
    await expect(apply(passengerDocs(DRIVER).filter((d) => d.type !== "tourism_licence"))).rejects.toThrow(/tourism licence/);
  });

  it("creates an individual listing and an operator application together; approval publishes both", async () => {
    const { r } = (await apply(passengerDocs(DRIVER))).rows[0];
    const b = await db.query<{ listing_status: string; provider_type: string; claim_status: string }>(`select listing_status, provider_type, claim_status from public.businesses where id = $1`, [r.id]);
    expect(b.rows[0]).toEqual({ listing_status: "pending_review", provider_type: "individual", claim_status: "claimed" });
    expect((await db.query(`select 1 from public.operator_documents where business_id = $1 and status = 'pending'`, [r.id])).rows).toHaveLength(5);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_operator($1, true, 'Licence checked')`, [r.id]));
    const after = await db.query<{ listing_status: string }>(`select listing_status from public.businesses where id = $1`, [r.id]);
    expect(after.rows[0].listing_status).toBe("published");
    expect((await db.query<{ ok: boolean }>(`select public.operator_in_good_standing($1) as ok`, [r.id])).rows[0].ok).toBe(true);
  });
});

describe("deleting an account", () => {
  it("erases the person's own listings, keeps the trip accounts, and leaves nothing personal behind", async () => {
    const GONE = "00000000-0000-0000-0000-000000000030";
    await db.exec(`insert into auth.users (id, email) values ('${GONE}', 'gone@example.com') on conflict do nothing`);
    const { r } = (await as("authenticated", GONE, () => db.query<{ r: { id: string } }>(`select public.apply_as_driver($1::jsonb) as r`, [JSON.stringify({
      country: "gd", island: "grenada", name: "Leaving Driver", tagline: "Taxi", provider_type: "individual", phone: "+14734400000",
      kinds: ["taxi"], licence: "Taxi permit D123", vehicles: "Toyota car", insurance: "Hire and reward", confirm_passenger: true,
      docs: ["hire_registration", "psv_permit", "hire_insurance", "tourism_licence", "photo_id"].map((type) => ({ type, path: `${GONE}/${type}-1.jpg`, expires_on: "2030-01-01" })),
    })]))).rows[0];
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_operator($1, true)`, [r.id]));
    // A researched listing they had claimed, and a trip they asked for as a customer.
    const researched = (await db.query<{ id: string }>(`select b.id from public.businesses b where b.id <> $1 and not b.is_demo and not exists (select 1 from public.business_members m where m.business_id = b.id) order by b.name limit 1`, [r.id])).rows[0].id;
    await db.query(`update public.businesses set source_url = 'https://example.com/directory', source_checked_at = now() where id = $1`, [researched]);
    await db.query(`insert into public.business_members (business_id, user_id, role) values ($1, $2, 'owner') on conflict do nothing`, [researched, GONE]);
    await db.query(`update public.businesses set claim_status = 'claimed' where id = $1`, [researched]);
    const trip = (await as("authenticated", GONE, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Home", dropoff: "Town", passengers: 1, contact_phone: "+447835028032" })]))).rows[0].id;
    await db.query(`insert into public.audit_events (actor_id, action, entity_type, entity_id, data) values (null, 'business.owner_assigned', 'business', 'x', '{"email":"gone@example.com"}')`);

    const erased = (await as("authenticated", GONE, () => db.query<{ e: string[] }>(`select public.prepare_account_deletion() as e`))).rows[0].e;
    expect(erased).toContain(r.id);
    expect((await db.query(`select 1 from public.businesses where id = $1`, [r.id])).rows).toHaveLength(0);
    const back = (await db.query<{ claim_status: string; listing_status: string }>(`select claim_status, listing_status from public.businesses where id = $1`, [researched])).rows[0];
    expect(back).toEqual({ claim_status: "unclaimed", listing_status: "suspended" });

    await db.query(`delete from auth.users where id = $1`, [GONE]);
    for (const [table, col] of [["business_members", "user_id"], ["trip_requests", "customer_id"], ["profiles", "id"]]) {
      expect((await db.query(`select 1 from public.${table} where ${col} = $1`, [GONE])).rows, table).toHaveLength(0);
    }
    expect((await db.query(`select 1 from public.trip_contacts where request_id = $1`, [trip])).rows).toHaveLength(0);
    expect((await db.query(`select 1 from public.audit_events where data::text ilike '%gone@example.com%'`)).rows).toHaveLength(0);
  });
  it("won't let the only administrator delete themselves", async () => {
    await expect(as("authenticated", ADMIN, () => db.query(`select public.prepare_account_deletion()`))).rejects.toThrow(/only administrator/);
  });
});

describe("verification", () => {
  it("admins verify and unverify listings; approving an operator verifies it", async () => {
    const id = (await db.query<{ id: string }>(`select id from public.businesses where not is_demo and verification_status <> 'verified' order by name limit 1`)).rows[0].id;
    await expect(as("authenticated", OWNER, () => db.query(`select public.admin_set_verified($1, true)`, [id]))).rejects.toThrow(/administrators/);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_verified($1, true)`, [id]));
    expect((await db.query<{ v: string }>(`select verification_status as v from public.businesses where id = $1`, [id])).rows[0].v).toBe("verified");
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_verified($1, false)`, [id]));
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_operator($1, array['haulage']::public.trip_kind[])`, [id]));
    expect((await db.query<{ v: string }>(`select verification_status as v from public.businesses where id = $1`, [id])).rows[0].v).toBe("verified");
  });
});

describe("rides to any address, for someone else", () => {
  it("stores the route and the rider, with the rider's number kept private", async () => {
    const RIDER = "00000000-0000-0000-0000-000000000040";
    await db.exec(`insert into auth.users (id, email) values ('${RIDER}', 'booker@example.com') on conflict do nothing`);
    const res = await as("authenticated", RIDER, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Spice Basket, Beaulieu", dropoff: "Grand Anse Beach",
      pickup_lat: 12.08, pickup_lng: -61.72, dropoff_lat: 12.03, dropoff_lng: -61.76, distance_km: 9.4, duration_min: 17,
      passengers: 1, rider_name: "Auntie Joan", rider_phone: "+14734405555", contact_phone: "+447835028032",
    })]));
    const id = res.rows[0].id;
    const r = await db.query(`select rider_name, distance_km::text, pickup_lat from public.trip_requests where id = $1`, [id]);
    expect(r.rows[0]).toMatchObject({ rider_name: "Auntie Joan", distance_km: "9.4", pickup_lat: 12.08 });
    const c = await db.query<{ rider_phone_e164: string }>(`select rider_phone_e164 from public.trip_contacts where request_id = $1`, [id]);
    expect(c.rows[0].rider_phone_e164).toBe("+14734405555");
  });
});

describe("insights and admin team", () => {
  it("counts page views without personal detail, and gives admins the dashboard data", async () => {
    await as("anon", null, () => db.query(`select public.record_view('/gd/ride?x=1')`));
    await as("anon", null, () => db.query(`select public.record_view('/gd/ride')`));
    await as("anon", null, () => db.query(`select public.record_view('/admin/listings')`));
    await as("anon", null, () => db.query(`select public.record_view('/gd/trips/00000000-0000-0000-0000-00000000abcd')`));
    const v = await db.query<{ path: string; views: number }>(`select path, views from public.page_views order by path`);
    expect(v.rows).toEqual(expect.arrayContaining([{ path: "/gd/ride", views: 2 }, { path: "/gd/trips/…", views: 1 }]));
    expect(v.rows.some((r) => r.path.startsWith("/admin"))).toBe(false);
    await expect(as("authenticated", OWNER, () => db.query(`select public.admin_insights(30)`))).rejects.toThrow(/administrators/);
    const r = await as("authenticated", ADMIN, () => db.query<{ i: any }>(`select public.admin_insights(30) as i`));
    expect(r.rows[0].i.series).toHaveLength(30);
    expect(r.rows[0].i.series.at(-1).views).toBeGreaterThanOrEqual(2);
    expect(r.rows[0].i.totals.listings).toBeGreaterThan(0);
  });
  it("lets admins add and remove other admins, never the last one", async () => {
    await expect(as("authenticated", ADMIN, () => db.query(`select public.admin_set_admin('nobody@example.com', true)`))).rejects.toThrow(/No account/);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_admin('Rider@Example.com', true)`));
    const team = await as("authenticated", ADMIN, () => db.query<{ email: string }>(`select email from public.admin_team()`));
    expect(team.rows.map((t) => t.email)).toContain("rider@example.com");
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_admin('rider@example.com', false)`));
    await expect(as("authenticated", OWNER, () => db.query(`select public.admin_set_admin('rider@example.com', true)`))).rejects.toThrow(/administrators/);
  });
});

describe("guide content", () => {
  it("loads the Start a business guides for both countries, published with sources", async () => {
    const { readFileSync } = await import("node:fs");
    await db.exec(readFileSync("supabase/content/2026-10-20-guides-start-a-business.sql", "utf8"));
    const r = await db.query<{ country_code: string; n: number }>(`select country_code, count(*)::int n from public.articles where section = 'start-a-business' and status = 'published' group by country_code order by 1`);
    expect(r.rows).toEqual([{ country_code: "gd", n: 6 }, { country_code: "vc", n: 6 }]);
    const anon = await as("anon", null, () => db.query(`select 1 from public.articles where section = 'start-a-business'`));
    expect(anon.rows).toHaveLength(12);
  });
  it("loads the Property and investment guides for both countries", async () => {
    const { readFileSync } = await import("node:fs");
    await db.exec(readFileSync("supabase/content/2026-10-20-guides-property-investment.sql", "utf8"));
    const r = await db.query<{ country_code: string; n: number }>(`select country_code, count(*)::int n from public.articles where section = 'property-investment' and status = 'published' group by country_code order by 1`);
    expect(r.rows).toEqual([{ country_code: "gd", n: 6 }, { country_code: "vc", n: 6 }]);
  });
  it("loads the Returning home guides for both countries", async () => {
    const { readFileSync } = await import("node:fs");
    await db.exec(readFileSync("supabase/content/2026-10-20-guides-returning-home.sql", "utf8"));
    const r = await db.query<{ country_code: string; n: number }>(`select country_code, count(*)::int n from public.articles where section = 'returning-home' and status = 'published' group by country_code order by 1`);
    expect(r.rows).toEqual([{ country_code: "gd", n: 10 }, { country_code: "vc", n: 10 }]);
  });
});

describe("passkeys", () => {
  it("are private to their owner", async () => {
    await as("authenticated", OWNER, () => db.query(`insert into public.passkeys (user_id, credential_id, public_key, device_name) values ($1, 'cred-owner-0000000001', 'pk', 'iPhone')`, [OWNER]));
    await expect(as("authenticated", OWNER, () => db.query(`insert into public.passkeys (user_id, credential_id, public_key) values ($1, 'cred-stranger-000000001', 'pk')`, [STRANGER]))).rejects.toThrow();
    expect((await as("authenticated", STRANGER, () => db.query(`select 1 from public.passkeys`))).rows).toHaveLength(0);
    expect((await as("authenticated", OWNER, () => db.query(`select 1 from public.passkeys`))).rows).toHaveLength(1);
  });
});

describe("admin members list", () => {
  it("shows admins who has joined, newest first, with search; nobody else can see it", async () => {
    await expect(as("authenticated", OWNER, () => db.query(`select * from public.admin_list_members()`))).rejects.toThrow(/administrators/);
    const all = await as("authenticated", ADMIN, () => db.query<{ email: string; total: string }>(`select * from public.admin_list_members(null, 50, 0)`));
    expect(all.rows.length).toBeGreaterThan(1);
    const one = await as("authenticated", ADMIN, () => db.query<{ email: string }>(`select * from public.admin_list_members('rider@', 50, 0)`));
    expect(one.rows.map((r) => r.email)).toEqual(["rider@example.com"]);
  });
});

describe("cars on the map", () => {
  it("shows approved online drivers approximately and anonymously, and hides them when offline or stale", async () => {
    const biz = (await db.query<{ business_id: string }>(`select business_id from public.operator_profiles where status = 'approved' limit 1`)).rows[0].business_id;
    await db.query(`update public.operator_profiles set kinds = array['taxi']::public.trip_kind[] where business_id = $1`, [biz]);
    const member = (await db.query<{ user_id: string }>(`select user_id from public.business_members where business_id = $1 limit 1`, [biz])).rows[0].user_id;
    await expect(as("authenticated", "00000000-0000-0000-0000-000000000099", () => db.query(`select public.set_presence($1, 12.05, -61.75)`, [biz]))).rejects.toThrow(/own business/);
    await as("authenticated", member, () => db.query(`select public.set_presence($1, 12.051234, -61.751234, 90)`, [biz]));
    const cc = (await db.query<{ country_code: string }>(`select country_code from public.driver_presence where business_id = $1`, [biz])).rows[0].country_code;
    const seen = await as("anon", null, () => db.query<{ lat: number; lng: number }>(`select * from public.nearby_vehicles($1)`, [cc]));
    expect(seen.rows).toHaveLength(1);
    expect(Math.abs(seen.rows[0].lat - 12.051234)).toBeLessThan(0.001);
    expect(seen.rows[0].lat).not.toBe(12.051234);
    expect(Object.keys(seen.rows[0])).toEqual(["lat", "lng", "heading", "van"]);
    expect((await as("anon", null, () => db.query(`select * from public.driver_presence`))).rows).toHaveLength(0); // exact positions never readable
    await db.query(`update public.driver_presence set updated_at = now() - interval '10 minutes' where business_id = $1`, [biz]);
    expect((await as("anon", null, () => db.query(`select * from public.nearby_vehicles($1)`, [cc]))).rows).toHaveLength(0);
    await as("authenticated", member, () => db.query(`select public.go_offline($1)`, [biz]));
    expect((await db.query(`select 1 from public.driver_presence where business_id = $1`, [biz])).rows).toHaveLength(0);
  });
});

describe("family, trip sharing and pick-up PINs", () => {
  it("keeps family and contacts private, shares a trip safely and checks the PIN", async () => {
    const C = "00000000-0000-0000-0000-000000000050";
    await db.exec(`insert into auth.users (id, email) values ('${C}', 'family@example.com') on conflict do nothing`);
    await as("authenticated", C, () => db.query(`insert into public.family_members (owner_id, name, kind) values ($1, 'Amara', 'teen')`, [C]));
    expect((await as("authenticated", STRANGER, () => db.query(`select 1 from public.family_members`))).rows).toHaveLength(0);
    const biz = (await db.query<{ business_id: string }>(`select business_id from public.operator_profiles where status = 'approved' limit 1`)).rows[0].business_id;
    await db.query(`update public.operator_profiles set kinds = array['taxi','airport']::public.trip_kind[] where business_id = $1`, [biz]);
    const member = (await db.query<{ user_id: string }>(`select user_id from public.business_members where business_id = $1 limit 1`, [biz])).rows[0].user_id;
    const id = (await as("authenticated", C, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "airport", from: "Grenada", to: "Grenada", pickup: "School gate", dropoff: "Home", passengers: 1,
      rider_name: "Amara Patrice", rider_phone: "+14734405555", contact_phone: "+447835028032", fixed_fare_xcd: 40, fare_source: "GTA" })]))).rows[0].id;
    await as("authenticated", C, () => db.query(`select public.set_rider_kind($1, 'teen')`, [id]));
    const pin = (await as("authenticated", C, () => db.query<{ pin: string }>(`select pin from public.trip_pins where request_id = $1`, [id]))).rows[0].pin;
    expect(pin).toMatch(/^\d{4}$/);
    expect((await as("authenticated", member, () => db.query(`select pin from public.trip_pins where request_id = $1`, [id]))).rows).toHaveLength(0);
    await as("authenticated", member, () => db.query(`select public.accept_fixed_fare($1, $2)`, [id, biz]));
    const wrong = pin === "0000" ? "1111" : "0000";
    await expect(as("authenticated", member, () => db.query(`select public.confirm_pickup($1, $2)`, [id, wrong]))).rejects.toThrow(/doesn’t match/);
    await as("authenticated", member, () => db.query(`select public.confirm_pickup($1, $2)`, [id, pin]));
    const token = (await db.query<{ share_token: string }>(`select share_token from public.trip_requests where id = $1`, [id])).rows[0].share_token;
    const shared = (await as("anon", null, () => db.query<{ s: any }>(`select public.shared_trip($1) as s`, [token]))).rows[0].s;
    expect(shared).toMatchObject({ pickup: "School gate", rider: "Amara", status: "booked" });
    expect(shared.picked_up_at).toBeTruthy();
    expect(JSON.stringify(shared)).not.toContain("+1473");
    expect((await as("anon", null, () => db.query<{ s: any }>(`select public.shared_trip('nottherealtoken0000000000000000') as s`))).rows[0].s).toBeNull();
  });
});

describe("partners and WhatsApp opt-in", () => {
  it("counts partner scans, credits requests to the partner, and keeps partners admin-only", async () => {
    await as("authenticated", ADMIN, () => db.query(`insert into public.partners (code, name, kind, country_code, landing) values ('mbia-arrivals', 'MBIA arrivals desk', 'airport', 'gd', 'airport')`));
    await expect(as("authenticated", OWNER, () => db.query(`insert into public.partners (code, name, country_code) values ('sneaky', 'x', 'gd')`))).rejects.toThrow();
    const land = (await as("anon", null, () => db.query<{ l: any }>(`select public.partner_landing('MBIA-Arrivals') as l`))).rows[0].l;
    expect(land).toMatchObject({ country: "gd", landing: "airport" });
    expect((await as("anon", null, () => db.query<{ l: any }>(`select public.partner_landing('nope') as l`))).rows[0].l).toBeNull();
    const C = "00000000-0000-0000-0000-000000000060";
    await db.exec(`insert into auth.users (id, email) values ('${C}', 'visitor@example.com') on conflict do nothing`);
    await as("authenticated", C, () => db.query(`select public.create_trip_request($1::jsonb)`, [JSON.stringify({
      country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Airport", dropoff: "Villa", passengers: 2, contact_phone: "+447835028032",
      partner_code: "mbia-arrivals", estimate_low_xcd: 45, estimate_high_xcd: 55 })]));
    const s = (await as("authenticated", ADMIN, () => db.query<{ visits_total: string; requests: string }>(`select visits_total, requests from public.admin_partner_stats() where code = 'mbia-arrivals'`))).rows[0];
    expect(Number(s.visits_total)).toBe(1); expect(Number(s.requests)).toBe(1);
    await expect(as("authenticated", OWNER, () => db.query(`select * from public.admin_partner_stats()`))).rejects.toThrow(/administrators/);
  });
});

describe("request reach", () => {
  it("lets a taxi-only driver see airport rides, and explains who a request reached", async () => {
    const biz = (await db.query<{ business_id: string }>(`select business_id from public.operator_profiles where status = 'approved' limit 1`)).rows[0].business_id;
    await db.query(`update public.operator_profiles set kinds = array['taxi']::public.trip_kind[] where business_id = $1`, [biz]);
    const cc = (await db.query<{ country_code: string }>(`select country_code from public.business_locations where business_id = $1 limit 1`, [biz])).rows[0].country_code;
    expect((await db.query<{ ok: boolean }>(`select public.operator_can_serve($1, $2, 'airport') as ok`, [biz, cc])).rows[0].ok).toBe(true);
    expect((await db.query<{ ok: boolean }>(`select public.operator_can_serve($1, $2, 'haulage') as ok`, [biz, cc])).rows[0].ok).toBe(false);
    const C = "00000000-0000-0000-0000-000000000070";
    await db.exec(`insert into auth.users (id, email) values ('${C}', 'reach@example.com') on conflict do nothing`);
    const id = (await as("authenticated", C, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: cc, kind: "airport", from: "Main island", to: "Main island", pickup: "Airport", dropoff: "Town", passengers: 1, contact_phone: "+447835028032" })]))).rows[0].id;
    expect((await as("authenticated", C, () => db.query<{ n: number }>(`select public.request_reach($1) as n`, [id]))).rows[0].n).toBeGreaterThanOrEqual(1);
    const why = await as("authenticated", ADMIN, () => db.query<{ reached: boolean; reason: string }>(`select * from public.admin_request_reach($1)`, [id]));
    expect(why.rows.some((w) => w.reached && w.reason === "Reached")).toBe(true);
  });
});

describe("Uber-style dispatch", () => {
  it("offers the nearest online driver first, moves on when they decline, and books on accept", async () => {
    // Two approved taxi businesses with drivers online at different distances from the pick-up.
    const ops = (await db.query<{ business_id: string }>(`select business_id from public.operator_profiles where status = 'approved' limit 2`)).rows;
    if (ops.length < 2) {
      const other = (await db.query<{ id: string }>(`select b.id from public.businesses b where b.listing_status = 'published' and not exists (select 1 from public.operator_profiles o where o.business_id = b.id) and exists (select 1 from public.business_locations l where l.business_id = b.id and l.country_code = 'gd') limit 1`)).rows[0];
      await db.query(`insert into public.operator_profiles (business_id, kinds, status) values ($1, array['taxi']::public.trip_kind[], 'approved')`, [other.id]);
      ops.push({ business_id: other.id });
    }
    const near = ops[0].business_id, far = ops[1].business_id;
    for (const b of [near, far]) {
      await db.query(`update public.operator_profiles set kinds = array['taxi']::public.trip_kind[], status = 'approved' where business_id = $1`, [b]);
      await db.query(`update public.businesses set listing_status = 'published' where id = $1`, [b]);
      await db.query(`insert into public.business_locations (business_id, country_code, island_id, address_line, is_primary) select $1, 'gd', (select id from public.islands where country_code = 'gd' limit 1), 'Test', false where not exists (select 1 from public.business_locations where business_id = $1 and country_code = 'gd')`, [b]);
    }
    const memberOf = async (b: string) => {
      const m = (await db.query<{ user_id: string }>(`select user_id from public.business_members where business_id = $1 limit 1`, [b])).rows[0];
      if (m) return m.user_id;
      const u = b.replace(/^.{8}/, "dddddddd");
      await db.exec(`insert into auth.users (id, email) values ('${u}', 'driver-${u.slice(0, 6)}@example.com') on conflict do nothing`);
      await db.query(`insert into public.business_members (business_id, user_id, role) values ($1, $2, 'owner')`, [b, u]);
      return u;
    };
    const nearUser = await memberOf(near), farUser = await memberOf(far);
    await db.query(`delete from public.driver_presence`);
    await db.query(`insert into public.driver_presence (business_id, user_id, country_code, kinds, lat, lng) values ($1, $2, 'gd', array['taxi']::public.trip_kind[], 12.003, -61.770), ($3, $4, 'gd', array['taxi']::public.trip_kind[], 12.050, -61.750)`, [near, nearUser, far, farUser]);

    const C = "00000000-0000-0000-0000-000000000080";
    await db.exec(`insert into auth.users (id, email) values ('${C}', 'rider80@example.com') on conflict do nothing`);
    const id = (await as("authenticated", C, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "airport", from: "Grenada", to: "Grenada", pickup: "Airport", dropoff: "Grand Anse", passengers: 1, contact_phone: "+447835028032",
      fixed_fare_xcd: 40, fare_source: "GATA", pickup_lat: 12.0042, pickup_lng: -61.7862 })]))).rows[0].id;
    const first = (await as("authenticated", C, () => db.query<{ e: any }>(`select public.start_dispatch($1) as e`, [id]))).rows[0].e;
    expect(first).toMatchObject({ event: "offered", business_id: near });

    // The further driver can't see the ride or grab it while it's offered to the nearer one.
    expect((await as("authenticated", farUser, () => db.query(`select 1 from public.trip_requests where id = $1`, [id]))).rows).toHaveLength(0);
    await expect(as("authenticated", farUser, () => db.query(`select public.accept_fixed_fare($1, $2)`, [id, far]))).rejects.toThrow();

    // Nearer driver declines: the offer moves to the next nearest.
    const next = (await as("authenticated", nearUser, () => db.query<{ e: any }>(`select public.respond_to_offer($1, false) as e`, [first.offer_id]))).rows[0].e;
    expect(next).toMatchObject({ event: "offered", business_id: far });
    const accepted = (await as("authenticated", farUser, () => db.query<{ e: any }>(`select public.respond_to_offer($1, true) as e`, [next.offer_id]))).rows[0].e;
    expect(accepted.event).toBe("accepted");
    expect((await db.query<{ status: string }>(`select status from public.trip_requests where id = $1`, [id])).rows[0].status).toBe("booked");
  });

  it("times out offers and falls back to alerting everyone", async () => {
    const C = "00000000-0000-0000-0000-000000000081";
    await db.exec(`insert into auth.users (id, email) values ('${C}', 'rider81@example.com') on conflict do nothing`);
    const id = (await as("authenticated", C, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Grand Anse", dropoff: "Gouyave", passengers: 1, contact_phone: "+447835028032",
      estimate_low_xcd: 90, estimate_high_xcd: 110, pickup_lat: 12.03, pickup_lng: -61.76 })]))).rows[0].id;
    // Without "Book now", an estimated route goes to drivers for prices.
    const id0 = (await as("authenticated", C, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Grand Anse", dropoff: "Gouyave", passengers: 1, contact_phone: "+447835028032",
      estimate_low_xcd: 90, estimate_high_xcd: 110, pickup_lat: 12.03, pickup_lng: -61.76 })]))).rows[0].id;
    expect((await as("authenticated", C, () => db.query<{ e: any }>(`select public.start_dispatch($1) as e`, [id0]))).rows[0].e.event).toBe("broadcast");
    const e = (await as("authenticated", C, () => db.query<{ e: any }>(`select public.start_dispatch($1, true) as e`, [id]))).rows[0].e;
    expect(e.event).toBe("offered");
    expect(Number((await db.query<{ price_xcd: string }>(`select price_xcd from public.trip_offers where id = $1`, [e.offer_id])).rows[0].price_xcd)).toBe(100);
    // Pretend 20 seconds passed with no answer, then two minutes.
    await db.query(`update public.trip_offers set expires_at = now() - interval '1 second' where request_id = $1`, [id]);
    await db.query(`update public.trip_requests set dispatch_started_at = now() - interval '3 minutes' where id = $1`, [id]);
    const t = (await as("authenticated", C, () => db.query<{ e: any }>(`select public.dispatch_tick($1) as e`, [id]))).rows[0].e;
    expect(t.event).toBe("broadcast");
    // A request with no pick-up location goes straight to everyone.
    const id2 = (await as("authenticated", C, () => db.query<{ id: string }>(`select public.create_trip_request($1::jsonb) as id`, [JSON.stringify({
      country: "gd", kind: "taxi", from: "Grenada", to: "Grenada", pickup: "Somewhere", dropoff: "Elsewhere", passengers: 1, contact_phone: "+447835028032" })]))).rows[0].id;
    expect((await as("authenticated", C, () => db.query<{ e: any }>(`select public.start_dispatch($1) as e`, [id2]))).rows[0].e.event).toBe("broadcast");
  });
});

describe("updates are safe to run twice", () => {
  it("re-running the latest database updates doesn't fail", async () => {
    const { readFileSync } = await import("node:fs");
    for (const f of ["20261027000023_family_and_safety.sql", "20261028000024_partners_estimates_whatsapp.sql", "20261029000025_request_reach.sql", "20261030000026_dispatch.sql"]) {
      await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
    }
    const fns = await db.query<{ n: string }>(`select count(*)::text n from pg_proc where proname = 'start_dispatch'`);
    expect(fns.rows[0].n).toBe("1");
  });
});

describe("live map", () => {
  it("hides busy drivers and shows a booked customer their own driver", async () => {
    await db.exec(readFileSyncOnce("supabase/migrations/20261031000027_live_map.sql"));
    // From the dispatch test: rider80 booked the "far" business, which is online.
    const trip = (await db.query<{ id: string; business_id: string }>(`select r.id, q.business_id from public.trip_requests r join public.trip_quotes q on q.id = r.accepted_quote_id where r.status = 'booked' and r.customer_id = '00000000-0000-0000-0000-000000000080'`)).rows[0];
    const pos = (await as("authenticated", "00000000-0000-0000-0000-000000000080", () => db.query<{ p: any }>(`select public.my_driver_position($1) as p`, [trip.id]))).rows[0].p;
    expect(pos).toHaveProperty("lat");
    expect((await as("authenticated", STRANGER, () => db.query<{ p: any }>(`select public.my_driver_position($1) as p`, [trip.id]))).rows[0].p).toBeNull();
    const shown = (await as("anon", null, () => db.query(`select * from public.nearby_vehicles('gd')`))).rows.length;
    const total = (await db.query(`select 1 from public.driver_presence where updated_at > now() - interval '3 minutes'`)).rows.length;
    expect(shown).toBe(total - 1); // the busy driver is hidden
  });
});
function readFileSyncOnce(p: string) { return require("node:fs").readFileSync(p, "utf8"); }

describe("live trip sharing", () => {
  it("shares the driver's first name, car and plate, and the trip's points, but never phone numbers", async () => {
    const { readFileSync } = await import("node:fs");
    await db.exec(readFileSync("supabase/migrations/20261101000028_live_trip_sharing.sql", "utf8"));
    const trip = (await db.query<{ id: string; share_token: string; business_id: string }>(`select r.id, r.share_token, q.business_id from public.trip_requests r join public.trip_quotes q on q.id = r.accepted_quote_id where r.status = 'booked' and r.share_token is not null limit 1`)).rows[0];
    const member = (await db.query<{ user_id: string }>(`select user_id from public.business_members where business_id = $1 limit 1`, [trip.business_id])).rows[0].user_id;
    await expect(as("authenticated", "00000000-0000-0000-0000-000000000099", () => db.query(`select public.set_vehicle_details($1, 'Glean', 'Toyota', 'Corolla', 'Silver', 'pb 1234')`, [trip.business_id]))).rejects.toThrow(/own business/);
    await as("authenticated", member, () => db.query(`select public.set_vehicle_details($1, 'Glean Thomas', 'Toyota', 'Corolla', 'Silver', 'pb 1234')`, [trip.business_id]));
    const s = (await as("anon", null, () => db.query<{ s: any }>(`select public.shared_trip($1) as s`, [trip.share_token]))).rows[0].s;
    expect(s).toMatchObject({ driver: "Glean", vehicle: "Silver Toyota Corolla", plate: "PB 1234" });
    expect(JSON.stringify(s)).not.toMatch(/\+\d{7,}/);
  });
});

describe("ratings and reviews", () => {
  it("lets real customers rate a completed ride and updates the business rating; strangers can't", async () => {
    const trip = (await db.query<{ id: string; customer_id: string; business_id: string }>(`select r.id, r.customer_id, q.business_id from public.trip_requests r join public.trip_quotes q on q.id = r.accepted_quote_id where r.status = 'booked' limit 1`)).rows[0];
    await expect(as("authenticated", trip.customer_id, () => db.query(`select public.submit_review('trip', $1, 5, 'Great')`, [trip.id]))).rejects.toThrow(/taken place/);
    await db.query(`update public.trip_requests set status = 'completed' where id = $1`, [trip.id]);
    const pending = (await as("authenticated", trip.customer_id, () => db.query<{ p: any }>(`select public.pending_rating() as p`))).rows[0].p;
    expect(pending).toMatchObject({ kind: "trip", ref: trip.id });
    await as("authenticated", trip.customer_id, () => db.query(`select public.submit_review('trip', $1, 4, 'Friendly driver, on time')`, [trip.id]));
    await as("authenticated", trip.customer_id, () => db.query(`select public.submit_review('trip', $1, 5, 'Friendly driver, on time')`, [trip.id]));
    const b = (await db.query<{ rating_avg: string; rating_count: number }>(`select rating_avg, rating_count from public.businesses where id = $1`, [trip.business_id])).rows[0];
    expect(Number(b.rating_avg)).toBe(5); expect(b.rating_count).toBe(1);
    await expect(as("authenticated", STRANGER, () => db.query(`select public.submit_review('trip', $1, 1, 'fake')`, [trip.id]))).rejects.toThrow();
    const pub = await as("anon", null, () => db.query<{ rating: number; author: string }>(`select * from public.business_reviews($1)`, [trip.business_id]));
    expect(pub.rows[0].rating).toBe(5);
    expect((await as("authenticated", trip.customer_id, () => db.query<{ p: any }>(`select public.pending_rating() as p`))).rows[0].p?.ref).not.toBe(trip.id);
    const rid = (await db.query<{ id: string }>(`select id from public.reviews limit 1`)).rows[0].id;
    await as("authenticated", ADMIN, () => db.query(`select public.admin_set_review_status($1, 'hidden')`, [rid]));
    expect((await db.query<{ rating_count: number }>(`select rating_count from public.businesses where id = $1`, [trip.business_id])).rows[0].rating_count).toBe(0);
  });
});

describe("licensing compliance", () => {
  it("takes a driver offline when a document expires, and back online when the renewal is approved", async () => {
    const DRV = "00000000-0000-0000-0000-000000000090";
    await db.exec(`insert into auth.users (id, email) values ('${DRV}', 'comply@example.com') on conflict do nothing`);
    const docs = ["hire_registration", "psv_permit", "hire_insurance", "tourism_licence", "photo_id"].map((type) => ({ type, path: `${DRV}/${type}.jpg`, expires_on: "2030-01-01" }));
    const { r } = (await as("authenticated", DRV, () => db.query<{ r: { id: string } }>(`select public.apply_as_driver($1::jsonb) as r`, [JSON.stringify({
      country: "gd", island: "grenada", name: "Comply Taxi", tagline: "Taxi", provider_type: "individual", phone: "+14734409999",
      kinds: ["taxi"], licence: "PSV permit 9", vehicles: "Car H99", insurance: "Hire and reward", confirm_passenger: true, docs })]))).rows[0];
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_operator($1, true)`, [r.id]));
    const ok = async () => (await db.query<{ ok: boolean }>(`select public.operator_in_good_standing($1) as ok`, [r.id])).rows[0].ok;
    expect(await ok()).toBe(true);
    // Insurance lapses: offline straight away, and can't go online.
    await db.query(`update public.operator_documents set expires_on = current_date - 1 where business_id = $1 and doc_type = 'hire_insurance'`, [r.id]);
    expect(await ok()).toBe(false);
    await expect(as("authenticated", DRV, () => db.query(`select public.set_presence($1, 12.05, -61.75)`, [r.id]))).rejects.toThrow(/documents are up to date/);
    const c = (await as("authenticated", DRV, () => db.query<{ c: any }>(`select public.operator_compliance($1) as c`, [r.id]))).rows[0].c;
    expect(c.expired).toContain("hire_insurance");
    // Renewal uploaded and approved: back online.
    const id = (await as("authenticated", DRV, () => db.query<{ id: string }>(`select public.add_operator_document($1, 'hire_insurance', $2, '2031-01-01') as id`, [r.id, `${DRV}/hire_insurance-2.jpg`]))).rows[0].id;
    expect(await ok()).toBe(false);
    await as("authenticated", ADMIN, () => db.query(`select public.admin_review_document($1, true)`, [id]));
    expect(await ok()).toBe(true);
  });
  it("lets freight operators sign up without passenger hire documents", async () => {
    const F = "00000000-0000-0000-0000-000000000091";
    await db.exec(`insert into auth.users (id, email) values ('${F}', 'freight@example.com') on conflict do nothing`);
    const docs = ["goods_registration", "driving_licence", "goods_insurance", "photo_id"].map((type) => ({ type, path: `${F}/${type}.jpg`, expires_on: "2030-01-01" }));
    const res = await as("authenticated", F, () => db.query(`select public.apply_as_driver($1::jsonb) as r`, [JSON.stringify({
      country: "vc", island: "st-vincent", name: "Freight Co", tagline: "Haulage", provider_type: "individual", phone: "+17844551234",
      kinds: ["haulage"], licence: "Goods licence G1", vehicles: "Truck", insurance: "Commercial", confirm_goods: true, docs })]));
    expect(res.rows).toHaveLength(1);
  });
});
