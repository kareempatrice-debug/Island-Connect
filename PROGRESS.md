# Progress

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
