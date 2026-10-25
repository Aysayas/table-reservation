# Lead review

Claude adds an entry here when the frontend developer asks for something outside the project plan and still wants it after Claude explains the rule. The project lead reads this file and decides.

**For the lead:** change `Status` to `Approved` or `Declined` and add a note. Claude will act on `Approved` entries.

## Template

```
### YYYY-MM-DD: short title
- Level: 🟡 off plan / 🔴 not allowed
- Asked for: what she wanted, in her words
- Rule it bumps into: which rule from CLAUDE.md
- What Claude did instead: the on-plan alternative, if any
- Status: Waiting for lead
- Lead note:
```

## Entries

### 2026-10-22: Real contact details on screen 07 About Us
- Level: 🟡 off plan
- Asked for: use Vencio's Garden's real contact details from the official menu: address `#08 Nautical Highway, Tawiran, Calapan City, Oriental Mindoro`, phone `0918 957 2855`, email `venciosgarden@yahoo.com`, Facebook `https://www.facebook.com/venciosgardenhotel`
- Rule it bumps into: CLAUDE.md, only the restaurant's name, logo, menu and prices are real; phone numbers, emails and contacts stay placeholders
- What Claude did instead: built screen 07 with the placeholders from `seed.sql`. If approved, only `sampleSettings` in `frontend/src/services/sampleData.ts` changes (and `seed.sql` on the backend side). Opening hours were set to the menu's 7:00 AM – 9:00 PM every day, which `seed.sql` still has as 10:00–22:00
- Status: Approved
- Lead note: Approved (2026-10-23): use the restaurant's real business contacts (address, phone, email, Facebook) in `sampleSettings`; the rule and `seed.sql` are updated. People's names and contacts stay placeholders. Opening hours stay 10:00 AM – 10:00 PM every day to match the backend, so set `sampleOpeningHours` back to `10:00:00`–`22:00:00` and update `e2e/customer-07-about.spec.ts` for the new contacts and hours.

### 2026-10-23: Luxury black, red and white restyle with new fonts and motion
- Level: 🟡 off plan
- Asked for: a luxurious, editorial look based on a design prompt (Bellagio and "eatery" template inspo): replace the brand colours with black, red (`#C1272D`) and white; new fonts Cormorant Garamond (titles), Jost (body) and Caveat (handwritten notes); scroll and page animations; a new navbar style; template food photos
- Rule it bumps into: CLAUDE.md and `docs/design/brand.md`, colours and fonts come from the restaurant's menu; new font packages change `package.json`; animations are not in the approved design; `CustomerLayout` is shared; food photos stay placeholders. Parts of the prompt also asked for PHP views and code comments, which Claude declined (🔴 / school rule)
- What Claude did instead: restyled screen 07 only, with the existing brand colours and fonts: small uppercase eyebrow labels with a gold dash, larger section titles instead of green bars, hairline dividers, 8-point spacing, 6px corners, round back button
- Status: Approved
- Lead note: Approved (2026-10-23). The look of the app is yours to design: colours, fonts, layout, shared layouts, motion and logo use. Keep the 29 screens, their URLs, their buttons and links, and the data each screen shows, so everything still fits the backend endpoints in `docs/api.md`. A motion library (`motion`) and `@fontsource/*` fonts are allowed. Template food photos only from free-licence sites (Unsplash, Pexels), with the source noted in `docs/design/brand.md`; nothing copied from other restaurants' or hotels' sites. Keep `docs/design/brand.md` up to date with the look you choose.

### 2026-10-23: Real restaurant interior photo on screen 07 About Us
- Level: 🟡 off plan
- Asked for: replace the "Restaurant photo" placeholder on screen 07 with a real photo of Vencio's Garden's dining area (wooden screens, red floral sofas, curved ceiling). Source not given yet
- Rule it bumps into: CLAUDE.md, only the restaurant's name, logo, menu, prices and business contacts are real; photos stay placeholders. The photo also shows identifiable customers, and its source and permission to use it are unknown
- What Claude did instead: kept the grey placeholder box. If approved, the image goes in `frontend/public/` and the placeholder in `About.tsx` becomes an `<img>` with alt text
- Status: Approved
- Lead note: Approved with conditions (2026-10-23): only a photo the restaurant itself provides, with permission to use it, and with no recognisable guests (crop or blur them). Note the source in `docs/design/brand.md`. Until all three are true, keep the placeholder.

### 2026-10-23: More design freedom for the frontend (colours, fonts, styling)
- Level: 🟡 off plan
- Asked for: it's hard on my side to wait for approval every time I want to change a colour, font or design. For example, right now I want to change the colours and the design, and I'm on hold. My request: can I make the frontend design decisions myself (colours and fonts in `src/index.css`, `docs/design/brand.md`, and new `@fontsource` font packages), and you review them in the pull request instead of approving them first? I won't touch the backend or any other part that's yours.
- Rule it bumps into: CLAUDE.md, colours and fonts come from the brand guide and need the lead's approval; `package.json` and `.claude/` are lead-owned (CODEOWNERS)
- What Claude did instead: no rules or config changed. If approved, the lead would update CLAUDE.md (the drift check) and `brand.md`, and decide whether she may add font packages.
- Status: Approved
- Lead note: Approved (2026-10-23). Done in #43: the design is yours (colours, fonts in `src/index.css`, new `@fontsource` packages, `motion`, `docs/design/brand.md`), reviewed in your pull requests, no approval needed first. Keep each screen's content, links and data from `docs/api.md`.

### 2026-10-23: Responsive desktop layout para sa customer screens 01–07
- Level: 🟡 off plan
- Asked for: gawing responsive ang customer website. Since web app siya, dapat nag-a-adjust ang layout depende sa gadget ng customer. Sa cellphone, pareho pa rin ang itsura gaya ng wireframes. Pero sa tablet o laptop, lalapad ang layout para magamit ang space (halimbawa mas malaking photo, o magkatabi ang mga section). Sa ngayon, naka-lock sa 390px ang lahat ng customer pages sa `CustomerLayout`, kaya sa laptop makitid na column lang sa gitna ang makikita, at mukhang kakaiba 'yon. Ang QR ordering screens 08–12, phone width pa rin, kasi sa table naman ginagamit 'yon ng customers.
- Rule it bumps into: CLAUDE.md, 390px lang ang screens 01–12 sa wireframes, kaya wala pa sa approved design ang desktop layout ng 01–07. Kailangan ding baguhin ang `CustomerLayout`, na shared ng lahat ng customer screens.
- What Claude did instead: tuloy pa rin sa 390px para tugma sa wireframes. Kung ma-approve: babaguhin ang `CustomerLayout` para lumapad ang 01–07 sa malalaking screen, tapos dadagdagan ng `md:`/`lg:` Tailwind classes isa-isa bawat screen. Hindi magbabago ang phone view, kaya walang masasayang na work.
- Status: Approved
- Lead note: Approved (2026-10-23). Make customer screens 01–07 responsive: the phone view stays as the wireframes; tablet and laptop may use a wider layout. Screens 08–12 stay phone width. Changing `CustomerLayout` for this is fine. Keep the routes, buttons, links and data the same. Check 01–07 in the preview at 390 × 844 and at 1440 × 900; the e2e tests stay at phone size.

### 2026-10-23: Install two fonts for the new look
- Level: 🟡 off plan
- Asked for: her About Us mockup (charcoal, red, gold and cream) uses two free fonts: Playfair Display (titles and the top bar name) and Great Vibes (handwritten touches like "Vencio's Garden"). Please install them: `npm install @fontsource/playfair-display @fontsource/great-vibes` in `frontend/`. (This replaces her earlier ask for Cormorant Garamond, Jost and Caveat.)
- Rule it bumps into: fonts are allowed since 2026-10-23, but `frontend/package.json` and `package-lock.json` are lead-owned, so the Protected files check fails her pull request if she installs them
- What Claude did instead: built the look with the fonts we have: the system serif (`font-serif`) for titles and Dancing Script (`font-display`) for handwriting. Once installed, she imports them in `src/index.css`, points `--font-serif` and `--font-display` at them, and lists them in `docs/packages.md` and `docs/design/brand.md`
- Status: Approved
- Lead note: Approved (2026-10-23). The lead installs `@fontsource/playfair-display` and `@fontsource/great-vibes` in a separate pull request (they change `package.json`). After it's merged, pull `main`, import them in `src/index.css`, point the font tokens at them, and list them in `docs/design/brand.md`.

### 2026-10-23: Screen 07 About Us extras from her mockup
- Level: 🟡 off plan
- Asked for: three parts of her About Us mockup that the wireframe doesn't have: (1) rename the "Our Story" title to "A Taste Handed Down"; (2) replace the back button bar with a "Home / About Us" breadcrumb; (3) a "Get Directions" button under the address that opens Google Maps directions
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's labels, buttons and links; (2) removes the wireframe's back button
- What Claude did instead: built the rest of the mockup (cream page, serif titles, arch photo, drop cap, quote card, black Opening Hours band with today highlight, contact cards) and kept "Our Story", the back button, and no directions button
- Status: Approved
- Lead note: Approved (2026-10-23): all three. Rename "Our Story" to "A Taste Handed Down", use the "Home / About Us" breadcrumb instead of the back button (the ☰ menu still gets around), and add the "Get Directions" button that opens Google Maps directions. Also, about the photo: it's a Pexels photo of another restaurant, so don't present it as Vencio's Garden's own dining room. Rename `photos/restaurant-interior.jpg` to something neutral (for example `photos/stock-dining.jpg`), update `brand.md`, and use a neutral alt text (for example "Restaurant dining area"). Swap it for a real photo once the restaurant sends one (see the interior photo entry above). Give the Google map `<iframe>` a `title` (for example "Map to Vencio's Garden") so screen readers can name it.

### 2026-10-23: "Salamat" footer on screen 07 About Us
- Level: 🟡 off plan
- Asked for: a black footer at the bottom of screen 07 from her mockup: "Salamat, and see you soon!" in gold handwriting, a red "RESERVE A TABLE" button (to `/reserve`) and "© 2026 Vencio's Garden"
- Rule it bumps into: CLAUDE.md, the wireframe for screen 07 has no footer; it adds a button and a line the screen doesn't show
- What Claude did instead: kept a plain black strip at the bottom of screen 07
- Status: Approved
- Lead note: Approved (2026-10-23): the black footer with "Salamat, and see you soon!", the red RESERVE A TABLE button to `/reserve`, and "© 2026 Vencio's Garden".

### 2026-10-23: Screen 05 Reservation Confirmation mockup and extras
- Level: 🟡 off plan
- Asked for: a new design for screen 05 from her mockup. The look (red check circle, "ticket" card for the reference code with side notches, details in 2 columns, green "CONFIRMED" status badge, dates like "Thu, Jan 1, 2026", "4 people", red and black buttons) only restyles the wireframe's parts. These parts are new: (1) title "Salamat! / Your table is reserved" instead of "Reservation Confirmed"; (2) a "Copy code" button that copies the reference code and shows a "Code copied" message; (3) a "Calendar" button that downloads a calendar (.ics) file for the reservation, made in the browser; (4) a "Directions" button that opens Google Maps directions, like on screen 07; (5) a "Save pass" button (a wallet pass); (6) a "What happens next" section with 3 steps: check your SMS, arrive and show your code, scan the table QR code and order
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's labels, buttons and links; (1) changes a wireframe label, (2)–(6) add buttons and a section the wireframe doesn't show. (5) also needs the backend: a real Apple or Google Wallet pass has to be created and signed on the server, so Claude suggests leaving it out
- What Claude did instead: nothing from the mockup is built yet; she asked to wait for your answer. Screen 05 currently has the screen 07 style (cream page, Playfair title, black reference code box, white details card, red and black buttons) with the wireframe's content
- Status: Approved (except Save pass)
- Lead note: Approved (2026-10-23): (1) the title "Salamat! / Your table is reserved" (update the e2e heading check); (2) Copy code with a "Code copied" message (sonner); (3) Calendar: an .ics file made in the browser from the reservation's date, time and guests; (4) Directions, the same Google Maps link as screen 07; (6) "What happens next" with the 3 steps. Not approved: (5) Save pass. A wallet pass has to be signed on the server, and there's no endpoint for it. The data stays the same as `GET /reservations/{code}` in `docs/api.md`, and the "Back to Home" and "Manage Reservation" links stay. Build these in your next pull request, with tests.

### 2026-10-23: Screen 13 Staff Login subtitle, show-password button, forgot password
- Level: 🟡 off plan
- Asked for: from her Staff Login mockup: (1) change the subtitle "Sign in to continue" to "Sign in to manage today's reservations."; (2) an eye button inside the password box to show or hide the password. Also a question from Claude: (3) "Forgot password?" has no screen or endpoint, so it currently shows a message "Ask an admin to reset your password." Is that okay?
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's labels and buttons; (1) changes a label, (2) adds a button
- What Claude did instead: built the rest of the card from her mockup (logo on the top edge of the card, "STAFF PORTAL" label, Playfair title, gold-bordered fields, red checkbox and button) and kept "Sign in to continue" with no eye button. Her mockup's pink "Incorrect email or password" box comes when the API is live, because the login pretends to succeed until then
- Status: Approved
- Lead note: Approved (2026-10-23): (1) the subtitle "Sign in to manage today's reservations." (update the test if it checks the old text); (2) the eye button to show or hide the password, with an accessible name that changes ("Show password" / "Hide password"); (3) keep "Forgot password?" showing "Ask an admin to reset your password.", which is true: there's no reset endpoint, and admins change passwords on screen 28. Build (1) and (2) in your next pull request. The build's 500 kB chunk warning is fine for now; the lead will look at it before the final deploy.

### 2026-10-23: Screen 01 Home mockup and extras
- Level: 🟡 off plan
- Asked for: her Home mockup copied exactly. The look (dark hero with "Mabuhay!" in gold handwriting, dark Popular Dishes with gold prices, black footer with "Quick links") only restyles the wireframe's parts and is being built now. These parts are new and need your OK:
  1. Hero title "Home-style Filipino, served with heart." (the last part in red) instead of the restaurant name, with the paragraph "Family recipes, cooked the way they were taught to us, on the Nautical Highway in Calapan City." (the name stays in the top bar)
  2. A round "Open daily 10 AM – 10 PM" badge on the hero photo, from `GET /opening-hours`
  3. A strip of 4 features: Fresh seafood ("Straight from Mindoro waters"), Family recipes, Filipino flavour, Made with heart. These describe the real restaurant, so the wording should be true
  4. An "Our Story" block ("More than a meal, it's our heritage.") with a dining-room photo and "Read our story →" to `/about`
  5. A red reservation bar "Good food deserves great company." with Date, Time, Guests and "Find a table" going to `/reserve`. Screen 03 would need to read those values (for example `/reserve?date=…&time=…&pax=…`), which isn't decided yet
  6. Top bar (shared `CustomerLayout`, all customer screens): links HOME, MENU, ABOUT, FIND MY RESERVATION, with HOME underlined in gold on the Home page, and the button text "Reserve a Table" instead of "Reserve"
  7. A bigger footer with a Menu link, the hours, the address and "Get directions", and the page without its separate Opening Hours and Location (map) sections. That removes a wireframe part
  8. A red "+" button on each dish card. Home isn't an ordering page (ordering is screens 08–12), so Claude suggests leaving it out or making it open `/menu`
- Photos: she will gather a signature-dish photo, a dining-room photo and 4 dish photos from Vencio's Garden's Facebook page, used only with the restaurant's permission and with no recognisable guests, sources noted in `docs/design/brand.md`
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's labels, buttons, links and parts; (1) changes the main heading, (2)–(5) and (8) add parts, (6) changes the shared top bar, (7) removes the map section
- What Claude did instead: building only the look now, on `frontend/screen-01-home`, with the wireframe's content
- Status: Approved
- Lead note: Approved (2026-10-23), all 8 and the photos: (1) the hero title and paragraph; (2) the open-hours badge, read from `GET /opening-hours` so it stays true; (3) the 4 features as written; (4) the Our Story block with "Read our story →" to `/about`; (5) the reservation bar: "Find a table" goes to `/reserve?date=…&time=…&pax=…`, and screen 03 pre-fills its form from those values when it's built (same availability endpoint, no new one); (6) the top bar links HOME, MENU, ABOUT, FIND MY RESERVATION and "Reserve a Table" in `CustomerLayout`, keeping the ☰ menu on phones and 08–12 unchanged; (7) the bigger footer with the hours, address and Get directions in place of the Opening Hours and Location sections, keeping the wireframe's footer links (About Us, Find My Reservation, Staff Login, ©); (8) the red "+" on dish cards opens `/menu` (no ordering on Home). Photos: the restaurant has given permission, so dish and dining-room photos from Vencio's Garden's Facebook page are fine, with no recognisable guests and each source listed in `docs/design/brand.md`. Keep the data the same as `docs/api.md`, and add tests for the new links.

### 2026-10-23: Screen 07 About Us final mockup
- Level: 🟡 off plan
- Asked for: her final About mockup, built with the same fonts as Home (Playfair Display, Great Vibes, Montserrat). The look only restyles the wireframe's parts and is being built now: dark hero with the dining-room photo faded on the right, the breadcrumb "Home / About Us", "Our Heritage" in handwriting, "A Taste Handed Down." in the hero, a cream Our Story block (title, text, quote with a gold bar, photo), and a dark "Plan Your Visit" section with 3 matching cards: Opening Hours (with the TODAY row), Location (map, address, Get Directions) and Contact (phone, email, Facebook). These parts are new and need your OK:
  1. RESERVE A TABLE (to `/reserve`) and VIEW MENU (to `/menu`) buttons in the hero
  2. A strip of 4 values under the hero: Patience ("Cooked slowly, the way it was taught"), Respect ("For the recipes and the hands that kept them"), Pride ("In every Filipino flavour we serve"), and a fourth one. Her mockup says "Family recipes", which Home's strip already has, so Claude suggests a different fourth value she picks. These describe the real restaurant, so the wording should be true
  3. New story wording: heading "We cook them the way they were taught to us." and the paragraph "At Vencio's Garden, we cook them the way they were taught to us, with patience, with respect, and with pride in every Filipino flavour." ("A Taste Handed Down" moves up to the hero)
  4. The red "Good food deserves great company." reservation bar, the same as Home's (Date, Time, Guests, Find a table to `/reserve?date=…&time=…&pax=…`)
  5. Home's big footer (Quick links, Hours, Location, ©) on About, replacing the approved "Salamat, and see you soon!" footer, so both pages end the same way
- Left out on purpose (design advice she accepted): a RESERVE A TABLE button inside the Contact card (Reserve would appear 5 times on the page) and a second "Get directions →" link at the top of "Plan Your Visit" (the Location card already has the button)
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's labels, buttons, links and parts; (1), (2) and (4) add parts, (3) changes text, (5) replaces an approved footer
- What Claude did instead: building only the look now, on `frontend/screen-01-home` (PR #54 also changes About), with the current content
- Status: Approved (partly)
- Lead note: (2026-10-23) (1) Yes, both hero buttons. (2) Yes; the fourth value must differ from Home's and be true, e.g. "Hospitality". (3) Yes, but no repeat: heading "We cook our recipes the way they were taught to us.", paragraph "At Vencio's Garden, every dish is made with patience, with respect, and with pride in every Filipino flavour." (4) No, Reserve already appears enough on the page. (5) Yes, use Home's footer; "Salamat, and see you soon!" may stay as a line in it. Add tests for the new links.

### 2026-10-23: Screen 05 Reservation Confirmation footer
- Level: 🟡 off plan
- Asked for: Home's big footer (Quick links, Hours, Location, ©) on screen 05, so Home, About and screen 05 end the same way. Her second screen 05 mockup also restyles parts that are already there, which needs no OK: the ticket card in charcoal instead of white (gold label, white code, dark COPY CODE pill), and the word "reserved." in red with a short gold line under the title. Everything else on screen 05 stays as it is (Calendar and Directions only, no Save pass)
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's parts; the footer is a part the screen 05 wireframe doesn't show
- What Claude did instead: nothing built yet; the look changes and the footer will be built together
- Status: Approved
- Lead note: Approved (2026-10-25). Use Home's footer on screen 05 too, so Home, About and 05 end the same way. The charcoal ticket and the red "reserved." are restyles and need no OK. Add a test for the footer links.

### 2026-10-25: Bigger building photo from another website for screen 07 About
- Level: 🟡 off plan
- Asked for: replace the About hero photo (`photos/vencios-exterior.png`, the restaurant's night photo from its Facebook page, only 345 × 234 so it looks blurry) with a bigger copy of the same photo, `vencio-s-garden-seafood.jpg` (550 × 367), which she found through a Google image search. It shows the restaurant's own building (the "Vencio's" sign is visible), but the site that hosts it and who took it are unknown; the file name suggests a listing site
- Rule it bumps into: CLAUDE.md and the screen 01 approval, real photos of Vencio's Garden only from the restaurant (its Facebook page), with the source noted in `docs/design/brand.md`
- What Claude did instead: kept the current photo and limited how much it stretches on wide screens (at most 34rem wide, faded on both sides on very wide screens), so the blur shows less. If approved, only the `src` in `About.tsx` and the row in `brand.md` change. Even the new copy isn't HD; a copy of 1,200 px or more (for example from the restaurant directly) would look sharp
- Status: No longer needed. She found a sharp daytime photo of the building (1280 × 960) on the restaurant's Facebook page, which is already approved, and it replaced the night photo. The Google photo is not used
- Lead note:

### 2026-10-25: Four more dishes in Popular Dishes on screen 01 Home
- Level: 🟡 off plan
- Asked for: show Beef Biryani, Salmon with Grilled Potato and Broccoli, Crispy Fried Chicken Steak, and Baby Back Ribs in Home's Popular Dishes, with photos. She says these are on Vencio's Garden's real menu, but they aren't in `sampleData.ts` or `seed.sql` yet. The restaurant has no clear photos of them, so she found photos on recipe websites
- Rule it bumps into: CLAUDE.md, the menu data must match `backend/database/seed.sql` (Popular Dishes shows the first 4 available `is_recommended` items), and photos must be the restaurant's own or free-licence stock with the source noted. The recipe-site photos have no licence (one has a site watermark), so Claude didn't use them
- What Claude did instead: kept the current 4 recommended dishes with icon placeholders. If approved: the lead adds the 4 dishes (with real prices and categories) to `seed.sql` and marks them recommended; Claude mirrors them in `sampleData.ts` and uses free Unsplash or Pexels photos for them, with each source in `docs/design/brand.md`
- Update (2026-10-25): she still prefers her 4 recipe-site photos and asked to use them now "just for sample". Claude didn't, because they have no licence (one shows another site's watermark) and the dishes aren't in the data yet. Meanwhile the current 4 recommended dishes show free Pexels photos (PR #70). Please decide: (a) may she use her photos as samples, or must they be free-licence stock; (b) will you add the 4 dishes to `seed.sql`?
- Status: Replaced by the entry "Popular Dishes: her 4 picks from the current menu" below (she now picks 4 dishes that are already in the data)
- Lead note: (2026-10-25) Photos: no recipe-site photos, see the lead note on "Popular Dishes: her 4 picks from the current menu". The 4 dishes stay out of `seed.sql`, since she now picks dishes already on the menu.

### 2026-10-25: Notes from screens 01, 03 and 07 (for your information)
- Level: ℹ️ notes, nothing off plan
- Notes:
  1. **Deposit is ₱0 in the sample data.** `sampleSettings` has `deposit_required: true` but `deposit_per_guest: 0`, so screen 04 will show ₱0.00. What should the amount per guest be (and is it in `seed.sql`)?
  2. **How screen 03 hands the booking to 04.** After booking it opens `/reserve/payment?code=RSV-…`. The path stays the same; the code rides in the query so 04 can call `GET /reservations/code/{code}`. OK? (PR #65)
  3. **Home hero dishes photo** (`photos/vencios-dishes.png`): she says it's from the restaurant's Facebook page. It looks professionally shot and shows dishes that may not be on the menu (pasta), so you may want to double-check it.
  4. **Photo files are heavy PNGs:** building 1.9 MB, counter 0.96 MB, dining 0.79 MB, dishes 2.0 MB. Converting to JPG or WebP would load faster; there's no image tool on her machine.
  5. **`photos/stock-dining.jpg` is no longer used** but was kept. OK to delete it?
  6. **`overscroll-behavior: none` on `html`** in `src/index.css` stops the white bounce at the page ends. It applies to every screen, staff and admin too.
- Status: Waiting for lead
- Lead note:

### 2026-10-25: Popular Dishes: her 4 picks from the current menu
- Level: 🟡 off plan (data and photos)
- Asked for: show these 4 dishes in Home's Popular Dishes: (1) Palagitik Native Duck, (2) Crispy Pork Kare-Kare, (3) Sinigang na Tanigue, (4) Sizzling Sisig. All 4 are already on the menu (`sampleData.ts` and `seed.sql`). She will provide their photos. Her note for you: Vencio's Garden has no clear photos of these dishes, and the ones that exist aren't suitable for the website
- Rule it bumps into: which dishes are recommended is menu data (`is_recommended`, default 1 for every item in `schema.sql`, set by the admin on screens 20–21), and the frontend's sample data should match the backend. Photos must be the restaurant's own or free-licence stock with the source in `docs/design/brand.md`
- What Claude did: in `sampleData.ts`, only these 4 are `is_recommended` now (before, every item was), so Popular Dishes shows them, in menu order: Sinigang na Tanigue, Palagitik Native Duck, Sizzling Sisig, Crispy Pork Kare-Kare. The cards show the icon until photos arrive; the earlier Pexels breakfast photos were removed. When she sends photos, Claude checks where they're from: the restaurant's own, or free-licence (Unsplash, Pexels) with the source noted; anything else waits for your OK. (PR #70)
- Update (2026-10-25): she changed her picks to (1) Crispy Pork Kare-Kare, (2) Sizzling Sisig, (3) Relyenong Bangus, (4) Chicken Tinupig, all on the menu. `sampleData.ts` now marks these 4 as recommended; in menu order the cards show Chicken Tinupig, Sizzling Sisig, Crispy Pork Kare-Kare, Relyenong Bangus. She sent a photo for each, found on Pinterest or Google (photographer and licence unknown). Claude didn't add them, so the cards still show the icon
- Please decide: (a) set `is_recommended` to only these 4 in `seed.sql` (or the admin does it on screen 20 once the API is live)? (b) may she use her Pinterest/Google photos, or must they be free-licence stock (Unsplash, Pexels) since the restaurant has no suitable photos?
- Status: (b) Declined; (a) waiting for lead
- Lead note: (2026-10-25) (b) Food photos come from Pexels or Unsplash only, with the photographer and link in `docs/design/brand.md` and a neutral alt text (for example "Sizzling sisig", not "Vencio's Garden sisig"), since they aren't the restaurant's own dishes. No photos from Pinterest, Google Images or other websites, anywhere on the site: being able to view or download a photo isn't permission to publish it, and the site is public. Show the icon when there's no fitting photo, and swap in the restaurant's own photos when it sends them. This also answers PR #83 ("Allow food photos from Pinterest, Google and other sites"), which can be closed. (a) is still open.

### 2026-10-25: Screen 02 Menu mockup extras
- Level: 🟡 off plan
- Asked for: her Menu mockup. The look only restyles the wireframe's parts and is built (PR #79): a dark top band with the title, a laptop sidebar with Search and Categories (with dish counts), a card grid with a gold Best Seller badge (`is_recommended`) and a red category tag, large red prices, and a dark "Dining in? Scan the QR code on your table to order." bar. These parts are new and need your OK:
  1. "Add to order" buttons on each dish. Ordering is the QR flow (08–12) and the wireframe says to scan the table's QR code to order, so these buttons would have nowhere to go
  2. A price range slider and "popular tags" filters (Best Seller, Seafood, Good for 3–4, Pinoy, Spicy). There are no tags in the data or API
  3. A tagline on each card ("Good for 2–3", "Single order", "Whole pizza", "House special"). Only a few descriptions have "Good for 3-4 pax" or "Single order"; the rest would be made up
  4. A "Home / Menu" breadcrumb instead of the back button, and the title "Our Menu" with "Kain na!" in handwriting instead of "Menu"
  5. Pagination (pages 01–10) instead of the Popular and category sections the wireframe shows
- Rule it bumps into: CLAUDE.md, each screen keeps the wireframe's labels, buttons, links, parts and data; (1) adds a flow, (2) and (3) add data that doesn't exist, (4) changes labels and removes the back button, (5) removes the sections
- What Claude did instead: built the look with the wireframe's content: the back button, the title "Menu", search, category filter, the Popular section and one section per category, no add buttons
- Status: Waiting for lead
- Lead note:

### 2026-10-25: What should "Often Ordered With" show on screen 09?
- Level: ℹ️ question, nothing off plan
- Notes: the screen 09 wireframe has "Often Ordered With" (2 dishes with "+ Add"), but `docs/progress.md` says the recommendation engine's approach isn't decided and `docs/api.md` has no endpoint for it. For now it shows 2 other available dishes from the same category, from the menu data. When you decide (for example dishes most often in the same order, from `order_items`), the screen only needs the list from a service. (PR for screen 09)
- Status: Waiting for lead
- Lead note:

### 2026-10-25: How does a table become available again on screen 16?
- Level: ℹ️ question, nothing off plan
- Notes: the screen 16 wireframe gives occupied tables only "View Order" and reserved tables only "Mark Arrived". There's no way to set a table back to Available after the guests leave, though `PATCH /tables/{id}/status` allows any change ("for example, freeing a table after guests leave"). Should screen 16 get a small "Free table" button on occupied tables (for example only when the order is served and paid), or does something else free it (screen 17 after payment, or the backend)? (PR for screen 16)
- Status: Waiting for lead
- Lead note:
