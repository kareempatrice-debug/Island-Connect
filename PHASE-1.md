# Phase 1: Foundation, Country Editions and Working Directory

## Goal

A deployed, working application in which a visitor can choose Grenada or St. Vincent and the Grenadines, browse and search real businesses in that country, contact them, request quotes and book appointments; businesses can register, be verified and manage their listings and bookings; and an administrator can run the platform. It must work end to end, on a phone, with no fake data presented as real.

Phase 1 is deliberately narrow. A marketplace is only as valuable as what is listed on it, so this phase builds the foundation that lets real listings be added and verified quickly. Taxis, restaurants, accommodation, retail and payments come later.

Read `CLAUDE.md` first. Its rules apply to everything here.

## Build order

Work through these in order. Each step should be working and tested before the next begins.

### 1. Project setup
- Next.js, TypeScript (strict), Tailwind, shadcn/ui, Supabase client, ESLint, Prettier, Vitest, Playwright.
- Design tokens from `CLAUDE.md` Section 5 as CSS variables, with light and dark themes.
- `.env.example`, `README.md`, `PROGRESS.md`.
- Supabase migrations kept in the repository; never edit the production database by hand.

### 2. Countries and geography
- Tables: `countries`, `islands`, `parishes` (name them generically, e.g. `districts`, with a per-country display label such as "Parish").
- Seed Grenada and SVG from a single seed file using the configuration in `CLAUDE.md` Section 2. Mark every seeded geographic fact with its source in a comment; flag anything uncertain in `PROGRESS.md`.
- Country-prefixed routing (`/gd`, `/vc`), first-visit country picker, persistent header switcher, cookie and profile persistence, equivalent-page switching.
- Per-country formatting helpers: currency (EC$), local time, phone numbers (accept local 7-digit numbers and international formats; store in E.164).

### 3. Categories
- Hierarchical categories (category → subcategory) managed by admins without code changes.
- A category can be enabled or disabled per country.
- Seed the launch set: Transport; Home & Construction; Professional Services; Tourism & Hospitality; Retail & Everyday; Health & Wellness; Education & Childcare; Events & Entertainment. Use the subcategory lists from the original brief where sensible.
- Each category has a booking model setting: `enquiry_only`, `request_quote`, `appointment`, or a combination.

### 4. Authentication and roles
- Supabase Auth with email (magic link and password). Phone sign-in is deferred.
- Roles: `customer`, `merchant_owner`, `merchant_staff`, `admin`, `content_editor`.
- Browsing, searching and viewing profiles require no account. Sign-in is requested only when an action needs it (enquiry needing a reply, quote request, booking, review, saving).

### 5. Businesses and profiles
- Tables: `businesses`, `business_locations` (each tied to a country, island and district, with lat/lng and a landmark description), `business_members` (owner and staff), `business_categories`, `services` (name, description, price or price range, currency, duration, booking model), `opening_hours`, `media`.
- A business can have locations in more than one country and can list islands it serves (supports cross-Grenadines operators).
- Public profile page: name, logo, cover, description, gallery, categories, map pin and landmark directions, island and parish, phone, WhatsApp button, email, website and social links, hours (shown in local time with "open now"), services and prices, payment methods accepted, cancellation policy, verification status, reviews.
- Verification states: `unverified`, `pending`, `verified`, `rejected`. Only `verified` shows a badge. Licences and qualifications are displayed only once an admin has verified the document.

### 6. Business registration and claiming
- Self-service registration wizard: business details, country and location (map pin plus landmark text), categories, services, hours, contact details, booking preferences, accepted payment methods, verification documents.
- Listings stay in `draft` or `pending_review` until approved by an admin.
- Claim flow: an owner can claim an existing unclaimed listing by submitting evidence; an admin approves before control transfers.

### 7. Search and browse
- Country-scoped home page: search bar ("What are you looking for?"), category shortcuts, featured (labelled) and recently added verified businesses, and links into the information centre.
- Search across business names, categories, services and descriptions, using Postgres full-text search. Tolerate common misspellings where practical.
- Filters: island, parish, category, verified only, open now, minimum rating, price range.
- List and map views.
- Meaningful empty states that offer to post a quote request instead.

### 8. Enquiries, quotes and appointments
- **Enquiry:** message to a business, stored in-app, with an email notification to the business. WhatsApp button shown alongside.
- **Request a quote:** customer chooses category, location, describes the job, uploads photos, marks routine or urgent, and sends to one business or to all verified businesses in that category serving that area. Businesses respond with a price, notes and validity date. Customer compares and accepts one; others are notified. Lifecycle: `requested → quoted → accepted → scheduled → completed`, plus `declined`, `expired`, `cancelled`.
- **Appointment booking:** businesses define availability (weekly hours, exceptions, slot length, capacity). Customers pick a real available slot. Lifecycle: `requested → confirmed → completed`, plus `cancelled_by_customer`, `cancelled_by_business`, `no_show`. Merchants choose whether bookings auto-confirm.
- Double booking prevented by a database constraint, not only application logic.
- Payment on these records is recorded as `pay_business_directly` or `pay_on_arrival` only.

### 9. Customer account
- Profile, preferred country, saved businesses, upcoming and past bookings, quote requests and responses, enquiries, reviews written, notifications, privacy settings, data export, account deletion.

### 10. Merchant dashboard
- Separate area from the customer interface.
- Overview (profile views, enquiries, quotes, bookings, upcoming appointments), profile editing, services and prices, availability calendar, bookings management (confirm, reschedule, cancel), quote inbox, enquiries, reviews with replies, staff invitations and permissions, notification settings.

### 11. Reviews
- Only customers with a completed booking or accepted quote can review that business. One review per transaction. Businesses can reply once. Admins can moderate. Reviews show the date and whether they are linked to a verified booking.

### 12. Information centre (structure only)
- Per-country hub with three sections: **Returning Home**, **Property & Investment**, **Start a Business**.
- Content stored as articles with full provenance fields (see `CLAUDE.md` Section 3) and an editorial workflow for `content_editor` and `admin` roles.
- Do not write substantive government, legal or tax content. Build the structure, editor, review workflow and public pages, and show a clear "Guide in preparation" state until verified content is supplied by the owner.
- Each article can link to relevant directory categories (e.g. customs brokers, lawyers) so readers can contact providers.

### 13. Admin dashboard
- Approve or reject businesses and claims, review verification documents, manage users and roles, manage categories and per-country enablement, manage featured placements, moderate reviews, manage articles and their review dates, view an audit log, view basic platform analytics by country.

### 14. Notifications
- In-app notification centre plus transactional email for: enquiry received, quote received, quote accepted, booking requested, booking confirmed, booking cancelled, business approved or rejected, review received. Email templates in plain, natural language.

### 15. Demonstration data
- A seed script that creates clearly labelled demo businesses (`is_demo = true`, visible "Demo listing" badge) across both countries so the app can be shown before real listings exist, and a single command to remove them all.

## Tests required before Phase 1 is complete

End-to-end (Playwright), on a mobile viewport:
- First visit country picker; switching country keeps the user on the equivalent page.
- A Grenada search never returns SVG-only businesses, and vice versa; a cross-border business appears in both where it serves.
- Customer sign-up and sign-in.
- Business registration through to admin approval and public listing.
- Listing claim and approval.
- Search and every filter.
- Quote request sent to multiple providers, quotes returned, one accepted, others notified.
- Appointment booking, merchant confirmation, customer cancellation.
- Two customers attempting the same last slot: only one succeeds.
- Review allowed only after a completed booking.
- Admin-only pages inaccessible to customers and merchants.

Database (SQL tests):
- Row Level Security: customers see only their own bookings, quotes and enquiries; merchants see only their own business data; staff see only what their permissions allow; verification documents are private.

Build:
- `npm run build` succeeds with no TypeScript errors; lint passes.

## Out of scope for Phase 1

Payments and checkout, taxi booking and dispatch, restaurant reservations, accommodation, retail ordering and delivery, property listings and investment calculators, business-for-sale listings, subscriptions, SMS and WhatsApp APIs, push notifications, native apps. The architecture should accommodate them, but do not build them.

## Phase 2 preview (do not build yet)

The first transactional vertical will be **pre-booked transfers and tours** (airport transfers, inter-island and Grenadines transfers, day tours), including fixed-date and private-quote experiences. Design the booking tables so this can be added without restructuring.

## Definition of done

Deployed to Netlify against a hosted Supabase project; all tests passing; `README.md` explains setup, environment variables and deployment in plain English; `PROGRESS.md` contains the end-of-phase summary described in `CLAUDE.md` Section 9.
