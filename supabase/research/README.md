# Research batches

Each SQL file adds businesses found through research as **unclaimed** listings **awaiting review**. Run a file in the Supabase SQL Editor, then open `/admin`: each business appears in the review queue with its source. Check it (a call or WhatsApp message is best), then approve or reject.

## Batch 1: taxi and airport transfers (17 October 2026)

| Business | Island | Contact recorded | Source | Check before approving |
|---|---|---|---|---|
| Grenada Airport Taxi Association | Grenada | Phone, website | Grenada Tourism Authority directory | Directory entry is about 18 months old |
| Sweet Grenada Tours, Taxi and Rentals | Grenada | Phone, WhatsApp, website | Own website | |
| Jeffrey Taxi | Grenada | Phone/WhatsApp, website | Own website | |
| Ace Ventura Taxi & Tours | Grenada | Phone, email, website | Own website | Parish not stated |
| Land and Sea Grenada Tours | Grenada | Phone, website | Own website | Trading name (site also says "Grenada Tours"); parish |
| See Grenada Tours | Grenada | Website only | Own website | Add phone/WhatsApp from the site |
| Trubb Taxi Tours SVG | St. Vincent | Phone, email, website, four published airport rates | Own website | Rates are the operator’s own, not official fares |
| Caricommute St. Vincent Premium Taxi & Tours | St. Vincent | Phone, email, website | Business Facebook page | |
| Stefano Taxi Service & Tours | St. Vincent | Phone, email | Business Facebook page | |

Found but not added, because no website or page of their own turned up: Topdawg Taxi and Tours, Sky Blue Taxi Tours SVG and Sammy Taxi and Tours (St. Vincent; seen only on booking sites). Bequia, Carriacou and Union Island operators mostly have no web presence and need collecting locally. The Bequia Tourism Association office in Port Elizabeth reportedly hands out a taxi rate card, which is a good lead for the fixed-fare table.

## Batch 2: business directory, 265 listings (18 October 2026)

Run `2026-10-18-directory-265.sql` (or the combined update file) after re-running `seed.sql`. All 265 arrive in `/admin` as unclaimed registrations awaiting review.

To publish a group in one step after you’ve checked it, for example every hotel and guest house on Bequia, run in the SQL Editor:

```sql
update public.businesses b set listing_status = 'published'
from public.business_locations l join public.islands i on i.id = l.island_id
where l.business_id = b.id and i.slug = 'bequia'
  and b.source_checked_at = '2026-10-18' and b.listing_status = 'pending_review';
```

The database itself asks for operating status and phone numbers to be confirmed before launch; a quick call or WhatsApp is the best check.
