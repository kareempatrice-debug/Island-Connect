# Progress

## Increment 9 (18 October 2026): category placeholder artwork

- Eight approved illustrations, one per category group (`src/data/category-art.ts`), replace the plain colour-and-icon covers wherever a business has no photo of its own: cards and storefront banners. Each type uses its group’s illustration; a business’s own photo always takes priority.
- Photos: Grenada Start a Business guide now uses the supplied “Opening Soon” shopfront image.
- Tests: 57 passing.

## Increment 8 (18 October 2026): everyday trades and two supplied photos

- **Everyday trades:** 109 new providers from the supplied research pack (hardware, electricians, plumbers, mechanics, contractors, dentists, salons and more), in `src/data/directory-2026-10-18-trades.json` and `supabase/research/2026-10-18-everyday-trades.sql`. Imported unclaimed and pending review; twelve already in the directory were skipped. Three are individual sole traders: they are in the review queue with a note to get consent first, and are left out of the preview. The pack’s contractor outreach list (names from a government contracts record) is deliberately not imported, as its README instructs.
- **New categories:** Marine services and repairs, Security services, Vets and animal care.
- **Photos supplied by the owner:** Maurice Bishop International Airport arrivals (Grenada Returning Home guide only) and a modern villa with pool (Grenada Property and Investment guide). Credited on /credits as supplied by Island Connect.
- Tests: 56 passing.

## Increment 7 (18 October 2026): business directory of 265 listings

- **Source:** the supplied Island Connect Business Database (265 public-source records from the Grenada and SVG tourism authority directories and trade directories), stored as `src/data/directory-2026-10-18.json`.
- **Live site:** `supabase/research/2026-10-18-directory-265.sql` imports every record as **unclaimed** and **pending review**, matching the database’s status (“Hold: merchant verification and consent pending”). Nothing goes live until approved in `/admin`. Re-running it adds nothing twice.
- **Not imported:** images (the database says their rights are not cleared) and the database’s indicative business size.
- **New reference data:** Palm Island and Petit St Vincent; categories Banks and finance, Printing and office supplies, Utilities and telecoms, Local food, drink and products, Gifts, jewellery and duty-free, Colleges and universities.
- **Mapping:** each source category mapped to up to three Island Connect categories; parishes taken from the address where it names one (42 St Vincent and 4 Grenada records have no parish).
- **Long lists:** explore and category pages show 24 at a time with “Show more”; search now allows up to 500 results (migration `20261018000004`).
- **Labels:** directory listings carry an “Unclaimed” label and a note explaining they come from public information.
- Nine records were found only via Google Maps searches; their review notes say to confirm with the business before approving.
- Tests: 55 passing.

## Increment 6 (18 October 2026): join on the welcome page, all transport types, new look

- **Look:** palette and fonts from the master brief (deep teal #063E44, primary #07565A, gold #F4B846, coral #EB6955; Manrope headings, DM Sans body).
- **Joining and signing in** moved to the welcome page (`/`) and a new `/join` page. Country pages no longer carry an account button. People choose why they’re joining (find services, list a business, drive or haul) and are sent to the right next step. The old `/[country]/sign-in` redirects to `/join`.
- **Ride hub** (`/[country]/ride`) for both countries: taxi, airport transfer, minivan and groups (fixed or driver’s fare), plus boat and water taxi, trucking and haulage, and freight to the Grenadines (custom quote from the operator). The taxi flow moved to `/[country]/ride/taxi`.
- **Custom quotes** (`/[country]/ride/quote?type=freight|haulage|boat`): route across both countries (customs notice when it crosses the border), cargo or passengers, date, validation; then the operators covering that route, with the request written out for WhatsApp or a call. Nothing is booked until a price is agreed. In-app quotes (operators reply in the app, customer accepts) need the trips/quotes tables in Stage 3.
- **Operators page** (`/[country]/ride/operate`) explaining what’s available now and what’s next.
- New demo operator: Kingstown Island Freight (St. Vincent, serves Bequia, Union Island and Carriacou).
- Tests: 53 passing; build, type-check and lint clean.

## Increment 5 (17 October 2026): research batch 1 and Stage 2

### Research batch 1: taxi and airport-transfer operators
`supabase/research/2026-10-17-transport.sql` adds nine operators (six in Grenada, three on St. Vincent) as unclaimed listings awaiting review, each with its source and check date. `supabase/research/README.md` lists them with what to check. Trubb Taxi Tours SVG includes its own published airport rates as services. Bequia, Carriacou and Union Island operators need collecting locally.

### Stage 2: business tools
- **Contact preference.** Each business chooses how customers reach it: enquiries on Island Connect, WhatsApp, phone, its website, or its own booking page. The storefront’s main button follows that choice.
- **Enquiries with conversations.** Signed-in customers send an enquiry (subject, optional service and date, message). Both sides continue the conversation in a thread (`/[country]/messages/[id]`). Limits: ten new enquiries per customer per day; no enquiries to demo or unclaimed listings, or to your own business. Threads are private to the customer and the business (admins can see them for moderation).
- **Business dashboard** (`/[country]/dashboard/[slug]`): overview of enquiries and contact taps in the last 30 days; enquiries inbox; profile and contact preference; services and prices; opening hours.
- **Contact-click tracking.** Taps on WhatsApp, call, email, website, booking and directions buttons are counted per business (no personal data), for the dashboard and for future paid plans.
- Admin queue now shows the source of researched listings.
- Migration `20261017000003`. Tests: 53 passing (34 database).

### Not yet built in Stage 2
- **Email or WhatsApp alerts** for new enquiries and replies. Businesses currently see enquiries when they open the dashboard. Needs an email provider (and later the WhatsApp Business API); this is the next item, because unanswered enquiries are the fastest way to lose both sides.
- **Quotes and appointment booking** with availability. The enquiry thread covers both for now.
- **Photo uploads** for logos, covers and galleries (needs a Supabase Storage bucket and upload rules).

## Increment 4 (17 October 2026): Stage 1, accounts, registration, claims and admin

### Built and tested
- **Accounts** (`/[country]/sign-in`, `/[country]/account`): create an account with email and password, sign in with a password or an emailed link, sign out. Sessions are kept fresh by `src/middleware.ts`. The header shows an account icon once Supabase is connected.
- **Business registration** (`/[country]/for-business/register`): four-step form (business and up to three categories, location, contact, about). Server-side validation, phone numbers normalised to international format, at most three registrations awaiting review per person. New listings stay hidden until approved.
- **Researched listings** (`/admin/add-listing`): you add businesses found through research. Each needs a source link and the date it was checked, and goes live as **unclaimed**. Only facts the business publishes itself; no reviews, ratings or photos from other sites.
- **Claims** (`/[country]/business/[slug]/claim`): unclaimed listings show “Is this your business?”. The owner submits how to confirm them; you approve; ownership transfers and any competing claims close.
- **Admin panel** (`/admin`): counts, registration queue and claims queue with approve/reject and a note to the applicant. Every decision is written to the audit log.
- **Fixed fares table** (`fare_rules`) for Stage 3: a fare can only be switched on once its source and check date are recorded.
- Database: migration `20261017000002`. All writes go through database functions or Row Level Security; admins are checked inside the database, not only in the page.
- Tests: 47 passing (28 database, including registration, research listings, claims, permissions and fares). Type-check, lint and build clean.

### Can only be tested once Supabase is connected
Sign-up emails, email links, sign-in sessions and the admin screens run against the live project. In demo mode these pages explain that the database is needed.

### Next
Stage 2: business dashboard (edit listing, services, prices, hours), enquiries, quote requests, bookings or redirect-out per business, click tracking. Then Stage 3: drivers, pre-booked and on-demand trips, fixed and driver-entered fares, commission ledger at 0% until charging starts.

## Increment 3 (17 October 2026): ride requests

### Working
- **`/[country]/ride`**, an Uber-style ride request flow, linked from the bottom navigation (new **Ride** tab), the homepage hero ("Get a ride") and the Ride quick-access tile.
- Step 1, *Where to?*: island tabs, pickup and destination chosen from landmarks (by list or by tapping the map), swap, directions for the driver, now or scheduled, passenger count.
- Step 2, *Choose a ride*: car (up to 4) or minivan (up to 8). The van is selected automatically above four passengers.
- Step 3, *Send your request*: trip summary and the taxi and airport-transfer operators listed for that island. "Request on WhatsApp" opens a chat with the trip details already written; "Call" dials the operator. Demo operators are labelled and cannot receive requests.
- Map: drawn from simplified OpenStreetMap coastlines (credited on `/credits`), zooms to the trip once both ends are chosen. It is schematic; it draws no road route.

### Deliberately not built
- **Fares.** No official fare table for either country was found from a primary source, and published secondary figures disagree, so the app shows no price and tells riders the driver confirms the fare. Add a fare table per country, with source and date, when one is verified (for example from the airport authority or tourism board).
- **Live dispatch, driver accounts, trip status and tracking, payments.** These need operator sign-up, authentication and a trip data model (`requested → accepted → en route → arrived → in progress → completed`, plus cancelled and disputed). Requests go to operators by WhatsApp until then.
- **Inter-island trips.** Pickup and destination must be on the same island; water taxis stay in the directory.

### Needs the owner
- Real taxi and transfer operators with WhatsApp numbers, per island. Without them the final step shows an empty state.
- Confirmation of each country's taxi licensing rules, so only licensed operators are listed in this flow.
- Landmark coordinates in `src/data/landmarks.ts` are approximate and should be checked on the ground.

## Increment 2 (17 October 2026): visual redesign

All five redesign milestones are complete. No database schema, security policy, routing or data-access code changed, apart from reading business logo and cover URLs that the schema already had.

### What changed
- **Design foundation.** New colour system (deep teal, tropical green, sunshine gold, warm coral, ivory), Bricolage Grotesque and Figtree typography, shared radius and shadow tokens, light and dark themes, reusable primitives (`components/ui.tsx`). See `DESIGN.md`.
- **Brand.** The supplied Island Connect artwork is cut out into `public/brand/ic-mark.png` and `ic-lockup.png` and used in the header, footer, picker and app icons. It is not redrawn.
- **Header and navigation.** Sticky deep-teal header with logo, desktop navigation with a gold active marker, a search shortcut and the country switcher. The mobile bottom bar is defined in one list so Bookings and Saved can be added when they work.
- **Country picker.** Full-height photographic destination cards, with the island-chain map moved into a supporting panel.
- **Homepage.** Photographic hero with a what/where search dock, popular searches, eight quick-access categories, "Discover local favourites", an image-led "Explore by experience" grid including cross-border discovery, an "Everyday help" section with real listing counts, guide cards, and a business section.
- **Services.** Category search, gradient category tiles, popular types, and an expandable full directory. Category pages have a branded banner, in-category search and type chips.
- **Explore.** Search band, sticky filter panel on desktop, collapsible filters on phones, removable active-filter chips.
- **Business cards and storefronts.** Image-led cards with logo, category, location, open status and starting price from the business's own service list. Storefronts have a cover, logo, section navigation, service cards with duration, hours with today highlighted, location, payment and cancellation, a trust explanation, and a mobile action bar when the business has contact details.
- **Guides.** Photographic banners, a provenance notice, planned-topic cards, property and business help areas linking into the directory, and a "Find help" panel with real counts.
- **New pages:** `/[country]/for-business` (what exists and what's planned), `/[country]/about`, `/credits` (photo licences).
- **Footer.** Multi-column, linking only to pages that exist.
- **Polish.** Loading skeletons on explore and category pages, skip link, focus styles, reduced-motion support.

### Verified working after the redesign
Country routes and switching (equivalent-page links), remembered country, search, all filters, cross-border listings, open-now, contact links, demo labelling, guide provenance rules, dark mode, PWA manifest. 36 automated tests pass; type-check, lint and production build are clean; pages checked in a browser at 390px and 1366px in light and dark mode.

### Photography
Eleven destination photographs from Wikimedia Commons under CC BY and CC BY-SA licences, registered with credits in `src/data/photos.ts` and listed on `/credits`. The credits page must stay while they are used. They are photographs of places only. Replace them with owned or commissioned photography when available; there is no food, transport-service or trades photography yet, so those areas use branded tiles.

### Deliberately not built
- Booking, quote, saved-listing and merchant-dashboard interfaces. `DESIGN.md` specifies them; they will be built alongside the features, not before.
- A map view. It needs a commercially licensed tile provider.
- Privacy, terms, help and accessibility pages. They need content the owner must approve; the footer gets the links once the pages exist.

### Needs the owner
- A production SVG of the logo (the current mark is cut from a raster image).
- Owned destination photography, especially food, transport and trades.
- Verified guide content, privacy policy and terms.

## Increment 1 (17 October 2026): foundation, country editions and browsing

### Working
- Next.js, TypeScript (strict), Tailwind, light and dark themes following the device setting, installable as a PWA.
- Country model: `/gd` and `/vc` editions, first-visit picker with a map of the island chain drawn from real coordinates, remembered choice, header switcher that keeps you on the equivalent page.
- Database schema for countries, islands, parishes, categories (enabled per country), user profiles and roles, businesses, locations, islands served, services, opening hours, guidance articles and an audit log.
- Row Level Security on every table, with database-level guards: owners cannot verify or feature themselves, users cannot promote themselves, demo listings can never be marked verified, and articles cannot be published without sources, a verification date and a review date.
- Search across names, categories, services and descriptions, with filters for category, island, parish, open now, verified only and sort order. Cross-border businesses (e.g. Grenadines water taxis) appear in both countries.
- Business profiles: services and indicative prices, opening hours in local time with open-now status, location with landmark directions and a maps link, islands served, payment methods, cancellation policy, and real call, WhatsApp, email and website buttons when a business provides them.
- Guides hub for each country with three sections (Returning home, Property and investment, Start a business), country-specific article pages that show their official sources and check date, and a "Guide in preparation" state until verified content exists.
- 36 automated tests passing; production build, type-check and lint clean.

### Demonstration only
- Twelve invented listings across both countries, all labelled, unverified, with no contact details. Remove with `supabase/remove-demo.sql`.
- The mark in the header and the app icons are placeholders until vector logo files are supplied.

### Decisions
- **Demo mode without a database.** If Supabase is not configured, the app reads the invented listings from code. This lets the site be deployed and shown immediately. Both modes go through one interface, so pages don't care which is in use.
- **Search filters use plain web forms.** They work without JavaScript and on slow connections.
- **No booking, quote or enquiry buttons yet.** They will appear when those features work, not before.
- **Server and dashboard work runs as a "trusted context".** Database guards allow changes made without a signed-in user (SQL Editor, migrations, future server jobs). Anonymous visitors still cannot write anything, because Row Level Security blocks them first.

### Needs the owner
- Verify the parish lists, island list and time zones in `src/data/geography.ts` against official government sources.
- Supply vector logo files (SVG) and a simplified icon.
- Supply verified guidance content, with official source links, for each country.
- Check that "Island Connect" is available as a domain and registrable as a trademark in both countries.

### Next increment
1. Sign-in (email magic link and password) and customer accounts.
2. Business registration wizard, listing claims, and the admin approval queue.
3. Merchant dashboard: edit profile, services, prices and hours.
4. Enquiries and quote requests, with email notifications.
5. Appointment booking with double-booking prevention.
6. Saved businesses and reviews.
7. Map view with a licensed tile provider.
8. End-to-end browser tests (Playwright) for each journey.
