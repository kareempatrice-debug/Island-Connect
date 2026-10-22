# Island Connect: setup guide

Everything you need to switch on the optional services, in one place. Each service is off until you add its settings in Netlify, and the site works normally without it. After adding or changing any setting in Netlify, go to **Deploys → Trigger deploy → Deploy project**, because settings only take effect after a new deploy.

To check what is switched on, open **https://islandconnect.cc/api/health** at any time.

---

## 1. Google Maps (ride booking map, address search and routes)

**Time:** about 15 minutes. **Cost:** free monthly allowance for each service; a budget alert protects you.

1. Go to **console.cloud.google.com** and sign in with the Google account that should own this.
2. Click the project picker at the top → **New project** → name it `Island Connect` → **Create**. Make sure it is selected.
3. Go to **Billing** and link a card. Google requires one even for free use.
4. Go to **APIs & Services → Library** and **Enable** each of these four:
   - **Maps JavaScript API** (the map)
   - **Places API (New)** (address suggestions)
   - **Routes API** (driving route, distance and time)
   - **Geocoding API** (naming a spot tapped on the map)
5. Go to **APIs & Services → Credentials → Create credentials → API key**. Copy the key (it starts `AIza`).
6. Click the key's name to restrict it. This step is essential:
   - **Application restrictions:** choose **Websites** and add `https://islandconnect.cc/*`, `https://*.islandconnect.cc/*` and `https://islandconnect.netlify.app/*`.
   - **API restrictions:** choose **Restrict key** and tick only the four services above.
   - **Save.** Changes can take up to five minutes.
7. Go to **Billing → Budgets & alerts → Create budget**: US$10 a month, alerts at 50%, 90% and 100%.
8. In **Netlify → Project configuration → Environment variables → Add a variable**:
   - Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: your `AIza…` key
   - Leave **Contains secret values** unticked (map keys are designed to be visible; the website restriction protects it).
9. Optional but recommended: in **Google Cloud → Google Maps Platform → Map management**, create a **Map ID** (JavaScript, Vector) and add it in Netlify as `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`. It controls the map's style and lets it follow the phone's light or dark setting.
10. Trigger a deploy. The health page should show `"googleMaps": "on, with Map ID"`.

**If the map doesn't appear**

| What you see | Fix |
|---|---|
| The old map still shows | Trigger a deploy after adding the key |
| "This page can't load Google Maps correctly" | Billing not set up, or a service not enabled (steps 3 and 4) |
| Map but no address suggestions | Places API (New) not enabled or not ticked in the key |
| Suggestions but no route line | Routes API not enabled or not ticked |
| Nothing works on islandconnect.cc | Website restriction mistyped; it must include `https://islandconnect.cc/*` |

---

## 2. WhatsApp alerts for drivers (WhatsApp Business Platform)

Drivers who opt in receive each new trip request on WhatsApp, as well as by email and phone notification. Drivers turn this on or off in their dashboard's **Trips** tab, and it is ticked by default on the driver application form.

**Time:** about an hour, plus Meta's approval of your business and message template (usually one to a few days). **Cost:** Meta charges per message for business-initiated "utility" messages; check current rates for Grenada and SVG on Meta's WhatsApp pricing page before switching on.

**You will need:** a phone number that is **not** already used on the WhatsApp or WhatsApp Business app (a new SIM or a landline that can receive a call or text for verification), and your Meta (Facebook) business account.

1. Go to **business.facebook.com** and create or open your business portfolio for Island Connect. Start **Business verification** (Settings → Business info); it helps your display name get approved.
2. Go to **developers.facebook.com → My Apps → Create app**. Choose the **Business** type, name it `Island Connect`, and connect it to your business portfolio.
3. In the app, add the **WhatsApp** product. Under **WhatsApp → API Setup**, add your phone number and verify it. Set the display name to `Island Connect`.
4. Copy the **Phone number ID** shown on the API Setup page.
5. Create a **permanent access token**:
   - In **business.facebook.com → Settings → Users → System users**, add a system user (Admin).
   - **Assign assets:** give it your app and your WhatsApp account with full control.
   - **Generate new token**, choose your app, tick `whatsapp_business_messaging` and `whatsapp_business_management`, and set it to never expire. Copy the token and keep it safe.
6. Create the message template. In **WhatsApp Manager → Message templates → Create template**:
   - **Category:** Utility. **Name:** `new_trip_request`. **Language:** English.
   - **Body:**
     `New {{1}} request on Island Connect: {{2}}, {{3}}. {{4}}.`
     Sample values for Meta's review: `Taxi`, `Maurice Bishop International Airport to Grand Anse Beach`, `As soon as possible`, `Official fare EC$40, first driver to accept`.
   - **Button:** Call to action → **Visit website** → text `Open my trips` → type **Dynamic** → URL `https://islandconnect.cc/{{1}}`.
     Sample value: `gd/dashboard/sample-taxi?tab=trips`.
   - Submit and wait for approval.
7. In **Netlify → Environment variables**, add:
   - `WHATSAPP_TOKEN`: the permanent token (**tick Contains secret values**)
   - `WHATSAPP_PHONE_NUMBER_ID`: the Phone number ID
   - Optional: `WHATSAPP_TEMPLATE_NEW_TRIP` if you named the template something else, and `WHATSAPP_TEMPLATE_LANG` if not `en`.
8. Trigger a deploy. The health page should show `"whatsappAlerts": "on"`.
9. Test: make sure a test driver's listing has a WhatsApp number and **WhatsApp alerts on** in the Trips tab, then send a request from a customer account.

**Rules worth knowing:** only message drivers who have opted in (the app already enforces this), and don't send promotional messages with this template; it's approved for trip alerts only.

---

## 3. Error monitoring (Sentry)

When something breaks for a user, Sentry emails you with the details, usually before anyone reports it.

**Time:** 10 minutes. **Cost:** Sentry's free Developer plan is enough to start.

1. Go to **sentry.io**, sign up and create an organisation (`Island Connect`).
2. **Create project → Next.js**. Name it `island-connect`. Set alerts to **Alert me on every new issue**.
3. Copy the **DSN** (it looks like `https://…@….ingest.sentry.io/…`). If you skip past it, it's under **Settings → Projects → island-connect → Client Keys (DSN)**.
4. In **Netlify → Environment variables**, add `NEXT_PUBLIC_SENTRY_DSN` with the DSN (not secret; it's designed to be public).
5. Trigger a deploy. The health page should show `"errorMonitoring": "on"`.

Error reports describe the technical problem only (page, browser and error); the privacy policy already says so.

---

## 4. Uptime checker (UptimeRobot)

Checks the site every five minutes and emails or texts you if it goes down.

**Time:** 5 minutes. **Cost:** free plan.

1. Go to **uptimerobot.com** and create a free account.
2. **Add New Monitor**:
   - **Monitor type:** Keyword
   - **Friendly name:** Island Connect
   - **URL:** `https://islandconnect.cc/api/health`
   - **Keyword:** `"status":"up"` and alert when the keyword **does not exist**
   - **Interval:** 5 minutes
3. Under **Alert contacts**, add your email (and your phone for SMS or the mobile app if you like). Add Raydon too.
4. Optional: add a second **HTTP(s)** monitor for `https://islandconnect.cc/` to catch problems with the pages themselves.

The health page reports `"status": "down"` (with an error code) whenever the site can't reach its database, which is the most common cause of a real outage.

---

## 5. Partners: QR codes for villas, hotels and the airport

1. In **Admin → Partners → Add a partner**, enter the name, type, country and what scanning opens:
   - **Book a ride from the airport** (for arrivals desks and airport partners)
   - **Book a ride** (for villas and hotels)
   - **Island Connect home page** (for welcome packs that cover more than rides)
2. Each partner gets a link (`islandconnect.cc/p/their-name`) and a QR code.
3. **Print cards** gives four A6 cards on an A4 sheet: print on card stock at 100% scale and cut into four. **Download QR code** gives an SVG for designers (welcome packs, posters, table tents).
4. The Partners page shows each partner's scans and the ride requests and bookings that came through them, so you can see which partnerships work and reward the best ones.

**Ideas for placements:** arrivals hall at Maurice Bishop and Argyle, villa welcome folders, hotel reception and rooms, ferry terminals in Kingstown and Bequia, cruise port information desks.

---

## 6. If the site is blocked on some Wi-Fi networks (Fortinet)

Some offices, hotels and public Wi-Fi networks use Fortinet filtering, which can block new domains and shows a "This connection is not private" warning instead of the site.

1. Go to **fortiguard.com/webfilter** and look up `islandconnect.cc`.
2. Use the form on that page to request a new category (**Business** or **Travel**) with a short description: "Business directory and transport booking platform for Grenada and St Vincent and the Grenadines."
3. Fortinet usually reviews within a few working days.

Never tap "visit this website" on that warning; it only opens the filter's block page.

---

## 7. Deploying an update

1. Run any new SQL files in **Supabase → SQL Editor**, one at a time, in the order given in the chat. Running SQL is permanent the moment it says "Success"; saving the query is optional.
2. Unzip the latest `island-connect.zip` over your project folder, then **commit and push** in GitHub Desktop.
3. Wait for Netlify to show **Published**, then check **https://islandconnect.cc/api/health**.
4. If Netlify's build fails, send a screenshot of the deploy log; the live site keeps running the previous version until a build succeeds.

---

## 8. Ride dispatch timer (pg_cron)

Taxi rides with an official fare or an estimate are offered to the nearest online driver first, with 20 seconds to accept, then the next nearest. The customer's and driver's screens keep this moving, and a database timer acts as a backstop when nobody has the app open.

1. In **Supabase → Database → Extensions**, search for **pg_cron** and switch it on.
2. Then run `island-connect-update-dispatch.sql` in the SQL Editor. It sets up the timer to run every 15 seconds.
3. To check it's running: **Database → Cron Jobs** (or **Integrations → Cron**) should list `island-connect-dispatch`.

If pg_cron isn't switched on, dispatch still works whenever the customer or driver has the app open.
