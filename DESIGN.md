# Island Connect design system

This document describes the visual system introduced in the October 2026 redesign, and specifies interfaces that are planned but not yet built. Build planned interfaces from these specifications when the underlying feature exists; do not ship them as inactive screens.

## Principles

1. **Photography carries the brand.** Places are shown with real, licensed photographs of the islands. Businesses are shown with their own images or a branded cover, never stock imagery.
2. **Restraint with colour.** Deep teal frames the experience, tropical green marks the next action, gold marks what's selected or featured. Coral appears rarely.
3. **Every section has a job and a look.** Tourism content is image-led and immersive; everyday services are compact, practical rows; guides are calm and editorial; the business area is plain and business-like.
4. **Honesty is part of the design.** Demo, featured and verified states are always visible and always reflect data. Empty states explain what's missing and what to do next.

## Tokens

Colours, radii and shadows are defined in `src/app/globals.css` (as CSS variables, with dark-mode values) and `tailwind.config.ts`.

| Token | Value | Notes |
|---|---|---|
| Radius `card` | 1.25rem | Business cards, info panels |
| Radius `panel` | 1.75rem | Large surfaces, image cards, banners |
| Shadow `card` | soft two-layer | Resting cards |
| Shadow `lift` | deeper two-layer | Hover, overlapping panels |
| Shadow `dock` | wide, dark | The hero search dock |
| Container | 76rem max, 20px / 32px gutters | `Container` component |

Category tones: each top-level category group has one icon and one tone (teal, green, gold or coral), inherited by its subcategories. See `src/components/visuals.tsx`.

## Components

| Component | File | Use |
|---|---|---|
| `Container`, `Section`, `Chip`, `btn`, `input` | `components/ui.tsx` | Layout, section headings with "View all", filter chips, buttons |
| `Wordmark` | `components/wordmark.tsx` | Logo; uses `public/brand/ic-mark.png` until a production SVG exists |
| `PlacePhoto` | `components/photo.tsx` | Licensed destination photo with optional credit |
| `BusinessCard`, `BusinessGrid`, `CardSkeleton` | `components/business-card.tsx` | Listings everywhere |
| `BusinessCover`, `BusinessLogo` | `components/business-cover.tsx` | Business imagery with branded fallbacks |
| `ListingBadges`, `TrustNote` | `components/badges.tsx` | Demo / Verified / Featured labels and plain-English trust explanation |
| `OpenStatus` | `components/open-status.tsx` | Open now, computed in the country's time zone |
| `SearchForm`, `HeroSearch` | `components/search-form.tsx` | Compact search and the homepage what/where dock |
| `EmptyState` | `components/empty-state.tsx` | No-results and not-yet-available states |
| `CountrySwitcher`, `DesktopNav`, `BottomNav` | `components/` | Navigation |

## Navigation

Mobile bottom navigation is defined once in `components/nav.tsx`. The long-term structure is Home · Explore · Bookings · Saved · More. Add an item to the list with `live: true` only when its page works; the grid adapts to the number of items.

## Planned interfaces (specifications only)

### Transport booking
A single mobile-first sheet over a map: pickup and destination fields with recent places and landmarks, date and time (defaulting to "now"), passengers and luggage, vehicle options as horizontally scrolling cards showing capacity and an estimated fare range labelled as an estimate, then a confirmation step showing the operator's name, licence status and cancellation terms. Requires: operator onboarding, fare rules per country, availability, and a licensed map provider. Never show drivers or fares that are not real.

### Tours and activities
Image-led detail page with a gallery, a short "what you'll do" description, meeting point, duration, included items, and a sticky booking panel: date picker showing only real availability, participant steppers, a running total, and the operator's cancellation policy. Visually distinct from directory listings: full-bleed imagery and a date-first layout.

### Property listings
Card: photo with count badge, asking price in EC$ (with optional indicative conversion clearly labelled), property type, bedrooms, bathrooms, land area, location to parish level, listing agent. Detail page: gallery, key facts table, description, map, buying-costs explainer linking to the Property guide, and a viewing-request form. Categories: residential, commercial, land, rentals, investment. Requires real listing data from registered agents.

### Merchant dashboard
A calmer interface than the consumer site: white surfaces, deep teal side navigation, no photography. Sections: Overview, Business profile, Services and products, Bookings, Enquiries, Quotes, Customers, Analytics, Reviews, Settings. Overview shows profile completion, new enquiries and upcoming appointments as real counts. Charts appear only once there is data to plot. Requires authentication and the merchant data model.
