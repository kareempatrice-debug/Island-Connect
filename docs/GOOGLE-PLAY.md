# Publishing Island Connect on Google Play

A step-by-step guide for a first-time publisher. Work through it in order; each part tells you what to click and what to type. Checked October 2026. Google changes its screens from time to time, so a button may be worded slightly differently, but the steps stay the same.

**What you're publishing.** The Android app is a "Trusted Web Activity": a real Play Store app that opens islandconnect.cc full screen, with no browser bar, using the same code you deploy to Netlify. You build it with a free website called PWABuilder; no coding or Android Studio is needed. Once it's live, anything you deploy to the website appears in the app straight away. You only upload a new Android build when you change the app's name, icon, colours or package settings.

**Realistic timeline**

| Stage | Time |
|---|---|
| Developer account and identity checks | 1 to 3 days (organisation accounts: longer, see Part 1) |
| Building the app and filling in the store listing | 2 to 3 hours |
| Internal test on your own phone | 30 minutes |
| Closed test with 12 testers (personal accounts only) | 14 days, unbroken |
| Google's review | Usually a few days; can be longer for new accounts |

---

## Before you start: checklist

Have these ready before you open the Play Console.

- [ ] The latest Island Connect zip is **deployed** and islandconnect.cc works.
- [ ] Netlify has these settings (Part 6 tells you when to add the second one):
  - `ANDROID_PACKAGE_NAME` = `cc.islandconnect.app`
  - `ANDROID_SHA256_FINGERPRINTS` = *(added in Part 6)*
- [ ] **App icon:** `play-app-icon-512.png` (supplied with this guide, 512 × 512 px).
- [ ] **Feature graphic:** `play-feature-graphic-1024x500.png` (supplied with this guide).
- [ ] **Screenshots:** at least 4 phone screenshots (Part 5 explains which).
- [ ] **Privacy policy link:** `https://islandconnect.cc/privacy`
- [ ] **Account deletion link:** `https://islandconnect.cc/delete-account`
- [ ] **Support email:** `hello@islandconnect.cc`
- [ ] **A reviewer test account:** a normal Island Connect customer account Google can sign in with (create one with a spare email; don't use your admin account).
- [ ] **12 people** willing to test for 14 days, if you use a personal account (Part 7).
- [ ] A safe place to store files permanently (two places, such as iCloud Drive and an external drive).

---

## Part 1: Choose your account type

You need a Google Play developer account. There's a one-time registration fee (currently US$25). Choose the type carefully, because it can't easily be changed later.

| | Personal account | Organisation account |
|---|---|---|
| Who it's for | An individual | A registered company |
| What you need | Government ID, phone number | Company registration details and a **D-U-N-S number** (free from Dun & Bradstreet, can take a few weeks) |
| Testing before launch | **Required:** closed test with at least 12 testers for 14 days in a row | Not required |
| Name shown in the store | Your personal name | Your company name |

**My recommendation:** if the Island Connect company is already registered, or will be within a few weeks, use an **organisation account**. It shows a business name customers trust, skips the 14-day test, and Apple will need the same D-U-N-S number later. If the company isn't registered yet and you want to launch sooner, use a personal account and plan for the 14-day test.

---

## Part 2: Create the developer account

1. Go to **play.google.com/console** and sign in with the Google account that will own the app. Use a business Gmail or Google Workspace account you'll keep, not a personal one you might close.
2. Choose **Yourself** (personal) or **An organisation or business**.
3. Fill in the developer name shown on the store: **Island Connect** (organisation) or your name (personal).
4. Add a contact email (`hello@islandconnect.cc`), phone number and website (`https://islandconnect.cc`).
5. Pay the registration fee.
6. Complete **identity verification** (upload ID; organisations also give the D-U-N-S number). Wait for the confirmation email before continuing.

---

## Part 3: Build the Android app with PWABuilder

1. Go to **pwabuilder.com**.
2. In the box, type exactly `https://islandconnect.cc` (no "www", because that's the site's main address) and click **Start**.
3. Wait for the report card. It may show suggestions; you can ignore minor ones.
4. Click **Package For Stores**, then under **Android** click **Generate Package**.
5. Choose **Google Play** (not "Other Android") and open **All settings**. Fill in exactly:

| Setting | Value |
|---|---|
| Package ID | `cc.islandconnect.app` (**permanent, can never change**) |
| App name | `Island Connect` |
| Launcher name | `Island Connect` |
| App version | `1.0.0` |
| App version code | `1` |
| Host | `islandconnect.cc` |
| Start URL | `/` |
| Theme colour | `#063E44` |
| Background colour | `#FFFFFF` |
| Navigation colour | `#063E44` |
| Display mode | Standalone |
| Notification delegation | **On** (so ride offers and messages arrive as Android notifications) |
| Location delegation | **On** (so "Use my current location" and Go online work) |
| Google Play billing | Off |
| Signing key | **Create new** |

6. For the signing key details, enter your name, "Island Connect" as the organisation, and your country. PWABuilder creates the passwords for you.
7. Click **Download Package**. You get a zip file.
8. **Unzip it and save these two files permanently, in two separate safe places:**
   - `signing.keystore`
   - `signing-key-info.txt` (contains the passwords and the key's SHA-256 fingerprint)

> ⚠️ **This is the most important step in the whole guide.** Every future update must be signed with this key. If you lose it, you have to ask Google to reset it, which takes days and is a hassle. Never email it or put it in GitHub.

The zip also contains `app-release-bundle.aab`, which is the file you upload to Google Play, and an `assetlinks.json` file. You **don't** need to upload `assetlinks.json` anywhere: Island Connect already serves its own, from the Netlify settings in Part 6.

---

## Part 4: Create the app in the Play Console

1. In the Play Console, click **Create app**.
2. Fill in:
   - **App name:** Island Connect
   - **Default language:** English (United Kingdom) or English (United States)
   - **App or game:** App
   - **Free or paid:** Free
3. Tick the declarations (developer programme policies and US export laws) and click **Create app**.

You'll now see the app's **Dashboard**, with a checklist of set-up tasks. Parts 5 to 8 work through them.

---

## Part 5: Store listing and app content

### 5a. Main store listing

Go to **Grow users → Store presence → Main store listing**.

**App name:** Island Connect

**Short description** (maximum 80 characters):
> Taxis at official fares and trusted local services in SVG and Grenada

**Full description** (paste as it is; it's within the 4,000-character limit):

> Island Connect brings St Vincent and the Grenadines and Grenada together in one app: rides, local businesses and the practical guides people usually have to piece together from word of mouth.
>
> Book a taxi the way you would anywhere else. Choose where you're going, see cars nearby on the map, and on popular routes see the official fare before you book, including the published airport fares and Carriacou's taxi list. On other routes, approved drivers send their prices and you choose. You can book now or reserve up to six months ahead, book for a family member, and share your trip so someone you trust can follow it live on a map, with your driver's name, car and number plate.
>
> Find the right local business without guesswork. Browse electricians, builders, accountants, restaurants, guest houses, tours, boat trips, trucking and much more, with opening hours, locations and photos. Message businesses directly in the app, or call or WhatsApp them in one tap.
>
> Plan the bigger moves with clear, checked guides on starting a business, buying property and returning home, written for each country and reviewed against official sources.
>
> Drivers and businesses can join for free. Approved drivers go online, receive ride offers and get paid directly by their customers.
>
> Island Connect is built in and for the Caribbean, starting with St Vincent and the Grenadines and Grenada.

**Graphics**
- **App icon:** upload `play-app-icon-512.png`.
- **Feature graphic:** upload `play-feature-graphic-1024x500.png`.
- **Phone screenshots:** upload 4 to 8. Take them on your phone with the app open (you can use islandconnect.cc in Chrome or Safari for now), in this order:
  1. Grenada or SVG home page
  2. Booking a ride: map with pick-up, destination and the official fare showing
  3. A business listing
  4. The Services page
  5. A shared trip with the live map (optional)
  6. A guide page (optional)

  Screenshots must be between 320 and 3,840 pixels on each side. Normal phone screenshots are fine. Take them with the preview banner absent and real content showing.

Click **Save**.

### 5b. Store settings

Go to **Grow users → Store presence → Store settings**.
- **App category:** Travel & Local
- **Tags:** pick up to five that fit, such as Ride hailing, Local services, Travel guide
- **Contact details:** email `hello@islandconnect.cc`, website `https://islandconnect.cc`

### 5c. App content (Policy and programmes → App content)

Complete each card. Here's exactly what to answer for Island Connect.

**Privacy policy:** `https://islandconnect.cc/privacy`

**App access:** choose **All or some functionality is restricted**, then **Add instructions**:
- Name: Customer account
- Username: *(your reviewer test account's email)*
- Password: *(its password)*
- Instructions: "Open the menu at the top right, then Sign in. Booking a ride, messaging businesses and Your account need sign-in; browsing, guides and fares do not."

**Ads:** No, the app doesn't contain ads.

**Content rating:** start the questionnaire.
- Category: **All other app types** (it's not a game, social network or news app).
- Answer honestly. The questions that matter for Island Connect:
  - Users can interact with each other or exchange information (messaging businesses and drivers): **Yes**
  - Shares the user's location with other users (drivers see pick-up points; shared trips show the car): **Yes**
  - Violence, sexual content, gambling, drugs: **No**
  - Allows purchases of digital goods: **No**
- Submit. You'll get ratings for each region automatically.

**Target audience and content:** choose **18 and over** only. The app arranges rides with adult drivers and messaging with strangers, so it shouldn't be marketed to children. Answer **No** to "Could your app unintentionally appeal to children?" (it doesn't use cartoon characters or child-oriented themes).

**News app:** No.

**COVID-19, government, financial, health apps:** No to each.

**Data safety:** this one takes the longest. Answer as follows.

*Overview questions*
- Does your app collect or share any of the required user data types? **Yes**
- Is all user data encrypted in transit? **Yes**
- Do you provide a way for users to request that their data is deleted? **Yes**, and give `https://islandconnect.cc/delete-account`

*Data types: tick these, and for each answer "Collected: Yes · Shared: No · Processed ephemerally: No · Required or optional" as shown*

| Data type | Required or optional | Purposes to tick |
|---|---|---|
| Personal info → Name | Required | Account management, App functionality |
| Personal info → Email address | Required | Account management, App functionality, Developer communications |
| Personal info → Phone number | Optional (needed to book rides) | App functionality |
| Location → Approximate location | Optional | App functionality |
| Location → Precise location | Optional | App functionality |
| Messages → Other in-app messages | Optional | App functionality |
| Photos and videos → Photos | Optional (businesses and drivers only) | App functionality |
| Files and docs | Optional (driver licence and insurance documents) | App functionality, Fraud prevention, security and compliance |
| App activity → App interactions | Required | Analytics |
| App info and performance → Crash logs and Diagnostics | Required | App functionality, Analytics |

Notes for honesty:
- **"Shared" means passed to a third party for their own use.** Showing a customer's pick-up point and phone number to the driver they booked is part of the service you provide, which Google treats as not "sharing". Your providers (Supabase, Netlify, Google Maps, Sentry, email) act on your behalf, which is also not "sharing".
- Page view counts are collected without personal data; "App interactions" covers them conservatively.
- If you haven't switched Sentry on, you can untick crash logs, but leaving them ticked is safer if you plan to.

**Account deletion:** Google asks for a link where users can request deletion: `https://islandconnect.cc/delete-account`. It explains both in-app deletion and email requests, as Google requires.

**Location permissions:** the app uses location only while open, through the browser engine, so you don't need the background-location declaration. If Google asks about it, answer that location is used only while the app is in use.

---

## Part 6: First upload, and linking the app to the website

### 6a. Internal test (just you, no review)

1. Go to **Test and release → Testing → Internal testing**, then **Create new release**.
2. If asked about **Play App Signing**, choose **Use Google-generated key** (recommended, and the default). Your PWABuilder key becomes your "upload key".
3. Upload `app-release-bundle.aab` from the PWABuilder zip.
4. Release name: `1.0.0 (1)`. Release notes: "First release."
5. Click **Next**, then **Save and publish**.
6. Open the **Testers** tab, create an email list with your own Google account's email, and save. Copy the **Join on the web** link, open it on your Android phone and accept, then install Island Connect from the Play Store link.

### 6b. Remove the browser bar (link the app to islandconnect.cc)

The first time you open the app, you'll probably see a thin browser address bar at the top. That's normal until this step is done.

1. In the Play Console, go to **Test and release → App integrity → App signing** (sometimes listed under **Setup → App integrity**).
2. Copy the **SHA-256 certificate fingerprint** under **App signing key certificate**. It looks like `AB:CD:12:…` (32 pairs).
3. Open `signing-key-info.txt` from the PWABuilder zip and copy its **SHA-256** fingerprint too (that's your upload key).
4. In **Netlify → Project configuration → Environment variables**, add:
   - `ANDROID_PACKAGE_NAME` = `cc.islandconnect.app`
   - `ANDROID_SHA256_FINGERPRINTS` = both fingerprints, separated by a comma, with Google's first. For example: `AB:CD:…:EF,12:34:…:56`
   - Leave **Contains secret values** unticked (these are public by design).
5. **Deploys → Trigger deploy → Deploy project.**
6. Check it worked: open `https://islandconnect.cc/.well-known/assetlinks.json` in a browser. You should see your package name and both fingerprints.
7. On your phone, **uninstall** Island Connect, then install it again from the Play Store. The browser bar should be gone.

If the bar is still there after an hour, see Troubleshooting.

### 6c. Check everything on the phone

Run through: sign in, book a test ride, Use my current location, turn on notifications (Your account → Notifications) and send a test, message a business, and Go online if you're a driver. Everything should behave exactly as on the website.

---

## Part 7: Closed test, 12 testers for 14 days (personal accounts only)

Skip this part if you have an organisation account.

1. Go to **Test and release → Testing → Closed testing**, then **Create track** (or use the default "Closed testing - Alpha").
2. **Create new release** and upload the **same** `app-release-bundle.aab`. Save and send it for review (the first closed test is reviewed by Google, usually within a few days).
3. **Testers:** the easiest way is a **Google Group**:
   - Go to **groups.google.com**, create a group called "Island Connect testers", and set **Who can join** to "Anyone on the web can ask" or invite members directly.
   - Add the group's email in the Play Console's **Testers** tab.
4. Recruit **at least 15 people**, so that if one or two drop out, you stay above 12. Good candidates: family, Raydon, Glean and other drivers, friends in Grenada and SVG. Each person needs an Android phone and a Google account.
5. Send them the **opt-in link** from the Testers tab, with this message:

   > "Please help me launch Island Connect on Google Play. Tap this link, choose **Become a tester**, then install the app from the Play Store. Please keep it installed and open it a few times over the next two weeks. Don't leave the test until I say, as Google needs 12 testers for 14 days in a row."

6. The 14-day clock starts once **12 or more testers have opted in** and the release is live. If you drop below 12, the count restarts, so check the **Testers** tab every few days.
7. Collect a little feedback from testers. Google asks about it in the next step.

---

## Part 8: Release to the public

### Personal accounts: apply for production access
After 14 days with 12 or more testers, an **Apply for production** button appears on the Dashboard. Google asks a few questions about your test. Answer plainly, for example:
- How did you recruit testers? "Family, business partners and local taxi drivers in Grenada and SVG."
- How engaged were they? "They booked test rides, browsed listings and sent messages; we fixed a fare-display issue and improved the booking screen based on feedback."
- Is the app ready? "Yes, the core flows (booking, messaging, business listings) have been tested on several Android devices."

Approval usually takes a few days.

### Everyone: create the production release
1. Go to **Test and release → Production → Countries / regions**, then **Add countries / regions**. Start with **St Vincent and the Grenadines** and **Grenada**. Add the **United Kingdom**, **United States**, **Canada** and **Trinidad and Tobago** if you want the diaspora to find it.
2. **Create new release**, choose **Add from library**, select the same `1.0.0 (1)` build, and add release notes:
   > "Welcome to Island Connect: book rides at official fares, find trusted local businesses and read practical guides for SVG and Grenada."
3. **Next**, then **Save**, then **Go to overview**, then **Send for review**.
4. Google's review typically takes a few days. You'll get an email when it's live, usually with a link like `play.google.com/store/apps/details?id=cc.islandconnect.app`.

---

## After launch

**Website updates:** keep deploying through GitHub and Netlify as normal. The app shows them straight away.

**When you do need a new Android build:** only if you change the app name, icon, colours, package settings, or add a new permission.
1. On PWABuilder, repeat Part 3 with the **same Package ID**, choose **Use mine** for the signing key, and upload your saved `signing.keystore` with the passwords from `signing-key-info.txt`.
2. Increase **App version** (e.g. `1.0.1`) and **App version code** (e.g. `2`). Google rejects a build whose version code isn't higher than the last.
3. Upload the new `.aab` as a new **Production** release.

**Ratings and reviews:** reply to reviews from **Quality → Ratings and reviews**. Polite replies to problems lift ratings over time.

**Add the store link to the site:** once live, add a "Get it on Google Play" badge to the home page and your partner QR cards.

---

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| **A browser address bar shows at the top of the app** | The website doesn't yet confirm the app. Check `https://islandconnect.cc/.well-known/assetlinks.json` shows `cc.islandconnect.app` and **Google's** App signing fingerprint (Part 6b). After fixing, uninstall and reinstall the app; Android caches the check |
| **"You uploaded an APK or Android App Bundle that is signed with a different key"** | You used a new signing key. Rebuild in PWABuilder with **Use mine** and your saved `signing.keystore` |
| **"Version code 1 has already been used"** | Increase the version code in PWABuilder and rebuild |
| **Rejected: Data safety doesn't match the app** | Re-check Part 5c. The most common misses are location, phone number and photos |
| **Rejected: account deletion** | Make sure the Data safety form includes `https://islandconnect.cc/delete-account`, and that the page opens without signing in |
| **Rejected: app access, reviewer couldn't sign in** | Check the test account's email and password still work, and that the instructions in App access are clear |
| **Rejected as "low functionality" or "just a website"** | Reply to the review email listing the app's features: ride booking with live maps, push notifications, driver dispatch, in-app messaging, location services. This is rare for an app as complete as Island Connect |
| **Notifications don't arrive in the app** | Check Notification delegation was **On** in PWABuilder. In the app, go to Your account → Notifications → Turn on, then Send a test |
| **Production access refused (personal account)** | Google usually says why, often not enough tester engagement. Keep testers active for another 14 days and ask them to use the app a few times a week, then apply again |

---

## What this version can't do yet

The Play Store version runs the website inside Android's browser engine, so drivers' location only updates while the app is open on screen, as on the website. Full background location for drivers (Uber-style tracking with the screen off) needs the native app built with Capacitor, which is the next stage when you're ready. Everything else in the app works fully.
