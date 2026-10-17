# Island Connect: Project Instructions for Claude Code

This file is read at the start of every session. It holds the standing context, rules and standards for the project. The current build scope lives in `PHASE-1.md` (and later phase files). Progress lives in `PROGRESS.md`, which you must keep up to date.

## 1. What we are building

Island Connect is a multi-country marketplace and information platform for the Eastern Caribbean. People use it to find, contact and book local businesses, services and experiences, and to read trustworthy, country-specific guidance on relocating, buying property and starting a business.

Tagline: People · Places · Services.

Launch countries: **Grenada** (including Carriacou and Petite Martinique) and **St. Vincent and the Grenadines**. The platform must be built so a third country can be added through data and configuration, without code changes.

Audiences:
1. Residents looking for everyday goods and services.
2. Visitors looking for transport, accommodation, food and activities.
3. Nationals living overseas, especially those planning to return home.
4. Local businesses and professionals who want customers and bookings.
5. Investors and entrepreneurs interested in property and business.

The owner is not a developer. Make sensible engineering decisions independently, explain important ones in plain English in `PROGRESS.md`, and prefer the simplest approach that is secure and maintainable.

## 2. The country model (central requirement)

The user chooses a country, and everything they see is filtered to that country: listings, categories, featured content, guides, regulations, contact details and formatting. Switching country is a first-class, always-visible action.

Rules:
- **Country is a top-level entity in the database.** Geography is `country → island → parish/district → optional locality/landmark`.
- **URLs are country-prefixed** using lowercase ISO 3166-1 codes: `/gd/...` for Grenada, `/vc/...` for St. Vincent and the Grenadines. A country page must be shareable and indexable on its own.
- **First visit:** show a simple country picker. Remember the choice in a cookie and, for signed-in users, on their profile. Never auto-redirect without letting the user change it.
- **Country switcher** sits in the header on every page. Switching keeps the user on the equivalent page where one exists (e.g. `/gd/services/electricians` → `/vc/services/electricians`), otherwise goes to that country's home page.
- **Per-country configuration** lives in the `countries` table, not in code: name, ISO code, currency code, time zone, dialling code, enabled categories, enabled modules, support contacts, legal entity text, and branding accents.
- **Businesses belong to a country** through their locations. A business may have locations in more than one country (e.g. a ferry or logistics operator serving both).
- **Every information article is tied to one country** (or explicitly marked "regional" when genuinely identical in both). Never show one country's regulations, programmes or fees under another country.
- **Cross-border is a feature, not an edge case.** The Grenadines straddle both countries (Carriacou and Petite Martinique in Grenada; Union Island, Bequia and others in SVG). Design search and listings so a business can be tagged as serving islands in both countries.

Known launch configuration (verify against official sources before publishing; flag any discrepancy):

| | Grenada | St. Vincent and the Grenadines |
|---|---|---|
| Code / URL prefix | GD / `/gd` | VC / `/vc` |
| Currency | XCD | XCD |
| Time zone | America/Grenada | America/St_Vincent |
| Dialling code | +1 473 | +1 784 |
| Islands | Grenada, Carriacou, Petite Martinique | St. Vincent, Bequia, Mustique, Canouan, Mayreau, Union Island, and smaller islands |
| Parishes | St. Andrew, St. David, St. George, St. John, St. Mark, St. Patrick (plus Carriacou and Petite Martinique as a dependency) | Charlotte, St. Andrew, St. David, St. George, St. Patrick, Grenadines |

Keep a `currency` field on every price even though both launch countries use XCD.

## 3. Non-negotiable rules

- **No invented facts.** Never invent real businesses, government programmes, fees, tax rates, eligibility rules, licensing requirements or legal procedures. Never present demonstration data as real or verified.
- **Information articles carry provenance.** Every government, legal, tax or regulatory article stores: country, official source URL(s), date verified, verified by, next review date, and status (`draft`, `in_review`, `published`, `needs_update`). Published pages display the source and verification date. Articles past their review date show a visible notice.
- **No legal advice or official decisions.** Eligibility guides help users identify what may apply and point to the official source. They never state that a user qualifies.
- **Demonstration data is clearly labelled** in the UI and in the database (`is_demo = true`), and can be removed with a single script.
- **Honest empty states.** If there are no providers, slots or drivers, say so plainly and offer an alternative (e.g. "No electricians listed in St. Patrick yet. Request a quote and we'll notify providers in nearby parishes.").
- **No fake buttons.** Every visible control does something real or is not shown.
- **No fake payments.** Until a gateway is approved and configured, there is no checkout. Payment code exists only as an interface (see Section 6).
- **No scraping** of Airbnb, Booking.com, Google or any other platform. External inventory only via authorised agreements or official APIs.
- **Do not claim an integration works** unless it has been configured and tested.
- **Ask before deciding** anything that materially affects security, legal compliance, cost, data ownership or the commercial model. Decide everything else yourself and record the decision in `PROGRESS.md`.

## 4. Technology stack

- **Frontend:** Next.js (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui.
- **Backend:** Supabase: PostgreSQL, Auth, Storage, Row Level Security on every table. Server-side logic in Next.js server actions / route handlers or Postgres functions. No microservices.
- **Maps:** Leaflet with a configurable tile provider that permits commercial use on a free tier (do not rely on the public OpenStreetMap tile servers for production traffic). Keep map display, geocoding and routing as separate, swappable modules. Support manual pin-dropping, because many locations are described by landmarks rather than street addresses.
- **Messaging:** WhatsApp click-to-chat links (`wa.me`) in Phase 1. No paid messaging APIs until approved.
- **Email:** transactional email through a single provider behind an interface; credentials in environment variables only.
- **Deployment:** Netlify for the app; Supabase hosted separately. Document every environment variable in `README.md` and `.env.example`.
- **Testing:** Playwright for end-to-end user journeys; Vitest for logic; SQL tests for Row Level Security policies.
- **PWA:** installable, with a manifest and icons, and sensible offline behaviour for previously viewed pages.

Avoid unnecessary dependencies. Before adding a library, check whether the stack already covers the need.

## 5. Design system

The full design system, including specifications for future booking, property and merchant interfaces, is in `DESIGN.md`. The rules below are the non-negotiable parts.

The interface should feel like a premium consumer marketplace with a Caribbean identity: photography, confident typography and restrained colour, not decoration.

Colour tokens (defined once in `src/app/globals.css`, mapped in `tailwind.config.ts`):

| Token | Hex | Use |
|---|---|---|
| `deep` | #064F56 | Header, navigation, premium surfaces, footer |
| `primary` | #087F75 | Primary buttons and active elements (white text passes AA at 4.9:1) |
| `link` | #064F56 | Text links (the brighter green fails AA as text on ivory) |
| `gold` | #F5AE32 | Highlights, selected states, featured placements; never as text on white |
| `coral` | #E85B43 | Occasional promotional accent |
| `surface` | #F6F4EF | Warm ivory page background |
| `raised` | #FFFFFF | Cards and content surfaces |
| `ink` | #1E2933 | Headings and important text |

Rules:
- Red and coral are never call-to-action colours. Validation errors use the separate `danger` token.
- All text meets WCAG 2.2 AA contrast in both light and dark themes.
- Typography: Bricolage Grotesque for headings, Figtree for interface and body text. Headings are semibold; bold is used sparingly.
- Mobile first: design at 375px and 390px, then scale up.
- **Photography rules.** Destination photos come only from licensed sources and are registered in `src/data/photos.ts` with their credit, which must appear on `/credits`. Business pages show only images the business uploaded; when there are none, use the branded category cover. Never put stock photography on a business's behalf.
- Every visible control works. Planned features (Bookings, Saved, merchant tools) are not shown until they function.
- Sponsored or featured placements are always visibly labelled; ratings appear only when real reviews exist.

## 6. Payments (architecture only for now)

Build a `PaymentProvider` interface that separates customer charges, platform fees, merchant settlements, refunds, provider fees and failed or disputed payments. Do not implement a live gateway or a demonstration checkout. Bookings in Phase 1 support "pay the business directly" and "pay on arrival" only, chosen by the merchant.

When a gateway is later approved: hosted checkout only, server-side verification through signed callbacks, idempotency keys on every charge, and no card data ever touching our servers.

## 7. Security and privacy

- Row Level Security on every table, with tests proving customers, merchants, staff and admins can only see what they should.
- Admin functions behind role checks on the server, never only in the UI.
- Validate all input on the server (Zod schemas shared with the client).
- File uploads: type and size limits, private buckets for verification documents, signed URLs for access.
- Rate limiting on sign-up, login, enquiries, quote requests and reviews.
- No secrets in client code. Only `NEXT_PUBLIC_` variables may reach the browser, and none of those may be secret.
- Database constraints to prevent double bookings, not just application checks.
- Audit log for significant admin and merchant actions.
- Account deletion and data export for users.
- Data protection, consumer protection and sector licensing rules differ between Grenada and SVG. Do not assume one country's rules apply to the other. Flag anything that needs legal review in `PROGRESS.md`.

## 8. Writing standards for in-app copy

Copy should sound like a capable local business, not a template. Plain, warm, specific. Avoid marketing clichés, exclamation marks, filler such as "seamless" or "unlock", and over-explaining. Use the user's language: "parish", "EC$", "WhatsApp". Error messages say what went wrong and what to do next.

## 9. How to work

1. Read `PHASE-1.md` (or the current phase file) before starting work.
2. Build complete user journeys, not isolated screens.
3. After each feature: run type-checking, linting and the relevant tests, and fix failures before moving on.
4. Preserve working functionality. Never remove a working feature to make a new one pass.
5. Keep `PROGRESS.md` current with: completed features, work in progress, decisions made and why (in plain English), known issues, and anything needing the owner's input or third-party credentials.
6. Diagnose the underlying cause of errors rather than stacking patches.
7. At the end of each phase, write a plain-English summary covering: what was built, what is fully working, what is demonstration only, what needs credentials, what needs testing, how to run and deploy it, and what to build next.
