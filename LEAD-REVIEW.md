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
- Status: Waiting for lead
- Lead note:
