# Island Connect

A marketplace and information platform for Grenada and St. Vincent and the Grenadines. Visitors choose a country and see that country's businesses, services and guides; they can switch country at any time.

This is the first build increment of Phase 1. See `PROGRESS.md` for exactly what works, what is demonstration only, and what comes next.

## How the project is organised

| Folder or file | What it does |
|---|---|
| `src/app/` | The pages. Each folder is a web address: `src/app/[country]/explore` is `/gd/explore` or `/vc/explore`. |
| `src/components/` | Reusable building blocks: business cards, the country switcher, navigation, the island map. |
| `src/lib/data/` | Where the app gets its data. `supabase.ts` reads the real database; `demo.ts` serves invented example listings when no database is connected. |
| `src/data/` | The starting countries, islands, parishes, categories and demo listings. One source of truth for both the demo and the database seed. |
| `supabase/migrations/` | The database structure and security rules. |
| `supabase/seed.sql` | Countries, islands, parishes and categories. Generated; do not edit by hand. |
| `supabase/demo.sql` | Demo listings. Optional. Remove them with `supabase/remove-demo.sql`. |
| `supabase/tests/`, `tests/` | Automated tests. |
| `public/brand/`, `public/images/places/` | Logo artwork and licensed destination photographs. Credits live in `src/data/photos.ts` and appear on `/credits`. |
| `CLAUDE.md`, `PHASE-1.md`, `DESIGN.md` | The standing project rules, the Phase 1 scope and the design system. |

## Run it on your computer

You need Node.js 22 or later.

```
npm install
npm run dev
```

Open http://localhost:3000. With no database connected, the site runs in **demo mode**: a banner says so and every listing is labelled as a demo.

## Connect the real database (Supabase)

1. Create a free project at supabase.com. Choose a region close to the Caribbean (US East).
2. In the Supabase dashboard, open **SQL Editor** and run these files in order, pasting the contents of each:
   1. `supabase/migrations/20261017000001_foundation.sql`
   2. `supabase/seed.sql`
   3. `supabase/demo.sql` (optional; skip it if you only want real listings)
3. Open **Project Settings > API** and copy the Project URL and the `anon` public key.
4. Copy `.env.example` to `.env.local` and paste the two values in.
5. Restart `npm run dev`. The demo banner disappears and data now comes from Supabase.

The `anon` key is designed to be public. What it can read and write is controlled by the security rules in the migration. Never put the `service_role` key in this project's environment variables.

Run the migration files in order (`20261017000001_foundation.sql`, `20261017000002_accounts_registration_claims.sql`, `20261017000003_dashboard_enquiries.sql`), then `seed.sql`. To load researched businesses into your review queue, run the files in `supabase/research/`.

### Sign-in settings in Supabase

1. **Authentication > URL Configuration:** set *Site URL* to your Netlify address, and add `https://YOUR-SITE.netlify.app/auth/callback` (and `http://localhost:3000/auth/callback` for testing) under *Redirect URLs*.
2. **Authentication > Emails:** Supabase’s built-in email sender is limited to a small number of emails per hour and is meant for testing. Before launch, connect your own email provider under *SMTP Settings* so confirmation and sign-in emails arrive reliably and come from your own address.

### Make yourself an administrator

Create an account on the site, then run this in the SQL Editor with your email:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Deploy to Netlify

1. Push this folder to a new GitHub repository.
2. In Netlify, choose **Add new site > Import an existing project** and pick the repository. Netlify detects Next.js automatically.
3. Under **Site configuration > Environment variables**, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (leave unset for demo mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key (leave unset for demo mode) |
| `NEXT_PUBLIC_SITE_URL` | Your site address, e.g. `https://islandconnect.netlify.app` |

4. Deploy. Every push to GitHub redeploys automatically.

## Tests and checks

```
npm test            # database, search, security and formatting tests
npm run typecheck   # TypeScript
npm run lint        # code quality
npm run build       # production build
```

The database tests run the real migration inside an in-memory Postgres, so they check the actual security rules without needing a Supabase account.

## Changing countries, islands, parishes or categories

Edit the files in `src/data/`, then run `npm run seed:generate` to regenerate `supabase/seed.sql` and `supabase/demo.sql`, and run the new seed in Supabase. Seeds are safe to re-run. Once the admin dashboard exists, categories will be managed there instead.

## Photographs and logo

Destination photos are registered in `src/data/photos.ts` with their author and licence. To replace one, put the new file in `public/images/places/`, update its entry (including the credit) and check `/credits`. Business images are never taken from this set.

The logo files in `public/brand/` are cut from the supplied raster artwork. When a production SVG is available, replace `ic-mark.png` and `ic-lockup.png` and update `components/wordmark.tsx`.

## Adding businesses from research

Google, TripAdvisor and similar sites are useful for *finding* businesses, but their terms forbid copying their content, and their reviews, ratings and photos must never be reused. For each business you find:

1. Confirm the basic facts (name, what it does, where it is, public phone, WhatsApp, email or website) on the business’s **own** website or social page, an official directory (tourism authority, chamber of commerce, association member list), or by calling it.
2. Add it at `/admin/add-listing`, with the link you checked and the date. It goes live as an unclaimed listing.
3. Only use contact details the business publishes for customers. If a sole trader’s only number is a personal one shared somewhere else, leave it off.
4. If a business asks to be removed, remove it promptly (set it to suspended or delete it).
