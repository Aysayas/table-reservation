# Brand guide: Vencio's Garden

How the app should look and feel.

**This guide belongs to the frontend developer.** Since 2026-10-23 the lead has given her design freedom: colours, fonts, layout, logo use and motion are her choice, as long as every screen keeps its content, buttons, links and data from `docs/api.md`. When she changes the look, she updates this file, so the whole team knows the current palette, fonts and photo sources. The palette and fonts below are the starting point measured from the restaurant's printed menu.

## Personality

Vencio's Garden is a garden restaurant with its own aquaponics farm. It feels:

- **Warm and Filipino.** Home-style dishes, family bundles, merienda.
- **Fresh and green.** Leaves, garden, banana-leaf plates.
- **Festive and musical.** The menu sections are named like songs: Prelude, Rice Harmony, Vegetable Tunes, Soup Melodies, Seafood Serenade, Bayanihan Meals.
- **Friendly, not formal.** Short, cheerful words. No stiff or corporate tone.

Words on screens:

- Use the section names exactly as the menu writes them.
- Keep Filipino dish names in Filipino (Sinigang na Hipon, Bihon con Lechon).
- Buttons say what happens: "Add to Cart", "Reserve a Table", "Place Order".

## Colours

These are theme tokens in `frontend/src/index.css`, so every one has Tailwind classes (`bg-brand-charcoal`, `text-brand-maroon`, …).

**Current palette (since 2026-10-23): charcoal, gold, cream and red.** An elegant, dark-and-warm look for evening dining. Red and gold come from the restaurant's official logo.

| Token | Hex | Use it for |
|---|---|---|
| `brand-charcoal` | `#1C1917` | Dark sections, header, footer |
| `brand-red` | `#B3121B` | Main buttons ("Reserve"), accents, with white text |
| `brand-line` | `#D8C6A3` | Thin 1px borders on cream (map, cards, hours list, photo frame) |
| `brand-red-light` | `#EF5B5B` | Red text on charcoal (for example "served with heart." on Home); `brand-red` is too dark there |
| `brand-gold` | `#C5A059` | Lines, icons and text on charcoal; never text on white or cream |
| `brand-gold-deep` | `#8A6A2B` | Gold text on white or cream: small labels, the script name, highlights |
| `brand-cream` | `#F7F2E9` | Page background on screen 07 (About Us), soft panels |
| `brand-ink` | `#2B2522` | Body text (the default on `body`) |
| white | `#FFFFFF` | Page background, text on charcoal or red |

**Old palette, being phased out.** Screen 05 still uses these. Remove each token once no screen uses it.

| Token | Hex |
|---|---|
| `brand-maroon` | `#5C161A` |
| `brand-green` | `#385D05` |
| `brand-leaf` | `#678E24` |
| `brand-peach` | `#F0CB95` |
| `brand-sage` | `#8EA287` |
| `brand-brown` | `#6C422D` |

Shades of these (for example `bg-brand-green/90` for hover) are fine. New or replacement colours are fine too: add them as tokens in `index.css` and list them here. Don't write hex values in components.

### Text that is easy to read

Checked with the WCAG contrast formula. 4.5:1 or more is fine for any text; 3:1 is only for large or bold text (about 18px+, or 14px+ bold).

| Text | On | Contrast | OK for |
|---|---|---|---|
| `brand-ink` | white / cream | 15.1 / 13.5 | Any text |
| `brand-gold-deep` | white / cream | 5.0 / 4.5 | Any text |
| white / cream | `brand-charcoal` | 17.5 / 15.7 | Any text |
| white | `brand-red` | 7.0 | Any text |
| `brand-red-light` | `brand-charcoal` | 5.3 | Any text |
| `brand-red` | `brand-charcoal` | 2.5 | Never as text |
| `brand-gold` | `brand-red` | 2.8 | Decoration only, not text |
| `brand-gold` | `brand-charcoal` | 7.1 | Any text |
| `brand-charcoal` | `brand-gold` | 7.1 | Any text (gold buttons) |
| `brand-gold` | white / cream | 2.5 / 2.2 | Never |

## Tokens for spacing, corners and depth

So hover lifts, sliding pills and focus rings look the same everywhere (since 2026-11-05):

- **Letter-spacing:** `tracking-label` (0.14em) for small caps labels, table headers and chips, and `tracking-eyebrow` (0.25em) for eyebrows and Track headers. No `tracking-[…]` values.
- **Corners:** `rounded-lg` for buttons, inputs and selects. `rounded-xl` for cards and dialogs. `rounded-full` for pills, badges and avatars. `rounded-sm` only for the gold inset frames.
- **Shadows:** `shadow-soft` for resting cards and toggles, and `shadow-lift` for popovers, dialogs and hover lifts. Both are tinted with charcoal.
- **Focus:** every link and button shows a 2px `brand-gold-deep` outline on keyboard focus (fields keep the inset one).
- **Status colours:** green (`brand-green`) means paid, active or done, gold means pending, and red means failed or cancelled.

## Fonts

Installed with `@fontsource` (they work offline) and already set in `index.css`.

| Font | Class | Use it for |
|---|---|---|
| Montserrat 400, 600, 700 | `font-sans` (the default) | Body text, labels, buttons, forms, prices |
| Playfair Display 400, 400 italic, 700 | `font-serif` | Titles, the "Vencio's" part of the top bar name, quotes |
| Great Vibes 400 | `font-display` | Short handwritten touches only: "Vencio's Garden" under a title, "Garden" in the top bar, a thank-you line. Never for body text, buttons or small labels |

Suggested sizes:

| Use | Classes |
|---|---|
| Page title | `font-serif text-5xl text-brand-charcoal` |
| Section title | `font-serif text-4xl text-brand-charcoal` |
| Handwritten name | `font-display text-5xl text-brand-red` |
| Small label above a title | `text-xs font-bold tracking-[0.25em] uppercase text-brand-red` |
| Body text | `text-sm leading-7 text-brand-ink` |

## Logo

- File: `/logo.png` (in `frontend/public/`): the official Vencio's Garden Hotel & Restaurant logo, a gold emblem and gold name on red (since 2026-10-23; the old round green logo is in git history).
- Full logo: on large spots (login, splash), shown whole. Never stretch it or recolour it.
- Top bar: a 32px round badge zoomed in on the gold emblem, then the name in two styles: "Vencio's" in white serif and "Garden" in gold handwriting.
- Give it `alt="Vencio's Garden"`, or `alt=""` when the name is already written right next to it.

## Layout ideas from the menu

- A white page with lots of space.
- Full-width green banner bars with white uppercase text for section titles, like the menu's "PRELUDE" and "SOUP MELODIES".
- Dish name on the left, price on the right.
- Rounded cards (`rounded-xl`) in `brand-cream` for items and summaries.
- The menu's green-and-gold sunburst stripes can be a small accent (for example on the home hero). Never put text on top of them.

## Menu page

- A dark top band with the title, then a cream page.
- Laptop: a sticky sidebar of white cards (Search, Categories), each with a spaced uppercase heading and a dashed gold rule. The active category is red with a ▸ marker and shows its dish count. Phone: the categories are one sticky sideways row.
- Dishes are cards: a photo area, a gold "Best Seller" badge for recommended dishes, a red category tag, the name, two lines of description, and the price large in red Playfair.
- The QR note is a dark bar at the end of the dishes.
- The top band has a "Home / Menu" breadcrumb instead of a back button, and the title "Our Menu" with "Kain na!" above it in gold Great Vibes (approved by the lead).
- A Filters card under Search: a red Max price slider and a Best Seller tag (gold when on), with Clear filters while one is on. No category tags, since the Categories list already does that.

## Flourishes

Small gold details that make the pages feel dressed up without changing the palette or fonts. They are decoration only: screen readers skip them, and they never replace a heading or a label.

- **Gold corners** (`gold-corners` utility): thin gold L-brackets in the four corners of a dark band or a framed card, such as the Home and About heroes, the Menu title band and the Staff Login card. Use one framed area per screen.
- **Framed photo** (`FramedPhoto`): an offset gold line behind a hero or story photo.
- **Ornament** (`Ornament`): a gold rule with a small ◆, between sections. With a label, it is the section heading in spaced uppercase gold-deep (for example "Popular Dishes"); the heading text stays the same.
- **Track headers** (`TrackHeading`): menu categories read like songs, so each one shows "Track NN" above its name, with the last word in italic red over five thin staff lines. Used on 02 Menu and 08 Table Menu. "Popular" has no number.
- **Leader rows** (`LeaderRow`): label, a dotted gold leader, then the value, like a printed menu. Used for summaries and order lists, not for photo cards.

## Loading and feedback

- **Page loader** (`PageLoader`): the round logo in a slow gold ring, "Sandali lang…" in Great Vibes, and a small ornament. It waits 300 ms before showing, so quick loads don't flash. Pages load on demand (route `lazy`), and the first load shows it too.
- **Skeletons** (`Skeleton`): soft cream blocks in the shape of what's coming (cards, rows, stat tiles). They pulse gently, and stay still when reduce motion is on.
- **Dialogs** (`Modal`): the native `<dialog>`, so Escape, the focus trap, scroll lock and focus return work by default. A click on the dark backdrop closes it. Each has a Playfair title with a small ornament, and confirmations can use gold corners. It fades in, and fades out when closed with Escape, the backdrop or Cancel.
- **Toasts**: success is charcoal with a gold check and a gold left edge, info is charcoal with a gold bell, and an error is white with a red alert and a red edge. They show at the top of the screen, so they never cover the bottom buttons on phones.
- **Busy buttons** (`Spinner`): a small ring next to the same label while saving. The label never changes, so screen readers and tests still find it.
- **Empty states** (`EmptyState`): a gold-ringed icon, a Playfair line, a short sentence, and an optional next step.
- **Something went wrong**: a framed card with Try Again and Go Home. An unknown page inside the dashboards shows "Page not found" with Back to Dashboard.
- **Browser tab**: each page sets its tab title, for example "Menu · Vencio's Garden".
- **Live alerts**: a new kitchen order gets a gold ring for 4 seconds, an info toast and a screen-reader line. The kitchen can turn on a soft two-note chime, which is off by default. Guests get a toast when their order moves to Preparing, Ready or Served, and the current step pulses once.
- **Success**: a gold check draws in on a confirmed booking, and "Salamat!" fades in on the order status page.

## Mobile

Checked against the `mobile-app-ui-design` skill and Impeccable's adapt checklist. This guide wins where they disagree.

- **Header on phones:** the logo and name, Reserve, and the menu button only, 8px apart, each at least 44px tall. Nothing ever touches.
- **Profile:** on phones and on the table pages, the profile lives at the top of the menu: a gold initial, "Hi, {first name}", "Logged in as {name}", buttons for My Reservations and Profile, and Log Out at the bottom. From `xl` up, the gold circle with the first name stays in the header.
- **Tap size:** buttons and links that stand alone are at least 44px tall. Inline text links are exempt.
- **Spacing:** use the 4 and 8 scale (8, 12, 16, 24, 32 …). Related items sit close, and separate groups get about twice the gap.
- **Bottom bars:** main actions such as Add to Cart, Pay and Place Order sit in a bar at the bottom of the screen, within thumb reach, on a solid background, with the bottom safe-area inset.

## Motion

Gentle and slow, so it never makes anyone dizzy. Made with Tailwind only (no motion package yet).

- **Scroll reveal:** sections fade in and rise 16px over 0.7s as they scroll into view, once only. Wrap a section's content in `<Reveal>` (`src/components/Reveal.tsx`). The hero isn't wrapped, so the page never looks empty on open.
- **Hover:** photos zoom 5% inside their frame (0.7s); dish cards lift 4px and get a gold border; main buttons lift 2px; the numbered circles fill with gold.
- **Popular Dishes slider** (Home) and **Recommended for You** (screen 08): the dish cards slide slowly to the left in a loop (35s, `animate-marquee` in `src/index.css`), pause when the mouse is over them or a card has keyboard focus, and stand still in a normal grid with "reduce motion". No edge fade.
- **Press:** every enabled button shrinks to 97% while pressed (0.1s). Set once in `src/index.css`, so new buttons get it for free.
- **Dialogs:** every `role="dialog"` panel fades in and rises 8px (0.2s, `animate-dialog-in` in `src/index.css`). The backdrop appears at once.
- **Never:** parallax, fast or bouncing movement, anything else that moves on its own, or entrance animations that delay the content.
- **Reduce motion:** every animation uses Tailwind's `motion-safe:` (or sits inside `prefers-reduced-motion: no-preference` in `index.css`), so people who turn on "reduce motion" see everything at once with no movement.

## States

- **Couldn't load:** when a page's data fails to load, it shows `LoadError` (`src/components/LoadError.tsx`): a white card with "We couldn't load {what}", a hint and Try Again. It shows only when the first load fails; a failed refresh keeps the data already on screen.
- **Focus:** every input, select and textarea shows a 2px `brand-gold-deep` ring inside its border when focused (set once in `src/index.css`).
- **Smallest text:** `text-xs` (12px). The cart count in its small red circle is the only exception.
- **Placeholders:** `placeholder:text-brand-ink/65`, so hints stay readable.
- **Row actions:** a list row shows one filled charcoal button for its next step and a ⋯ button for the rest (`ReservationActions`). The ⋯ menu uses the browser's `popover`, so a scrolling table can't clip it; red text marks actions that cancel or delete. On touch screens both buttons are at least 44px.

## Mobile numbers

- Every field people type a mobile number into uses the shared `MobileInput`: a fixed cream `+63` box joined to the input, the placeholder `912 345 6789`, and the short error "Check your mobile number". Numbers that are only shown stay as `09…`.

## Customer accounts

- Log In, Create an Account, Forgot Password and Reset Password share `AccountCard`: a serif title on cream, then one white card. They use the same fields as screen 03, `MobileInput` and `PasswordInput`.
- My Reservations uses the same booking card and status chips as screen 06.

## Kitchen display

Screen 18 is read from across the kitchen, so it uses bigger text and buttons than the other staff screens.

- **Slim charcoal header, one row:** the title, live counts ("6 open · 1 late · avg 9 min", with the late count in light red), the waiting-time key as coloured dots (On time green, 10+ min gold, 15+ min red, from 1280 px), the clock, and Sound, Full screen and Log Out. Below 1024 px they show as icons only. Full screen is hidden where the browser can't do it (iPhone).
- **Full height from tablet width (768 px) up:** three columns fill the screen. Each column scrolls on its own, and its title and count stay pinned, so Ready is never pushed off. Below 768 px the columns stack.
- **Screen stays awake:** the screen won't sleep while the display is open (Wake Lock, where the browser supports it).
- **Tickets:** the table number is large in Playfair, with the order number under it and the waiting chip on the right. A thin bar fills over 15 minutes in the age colour, and a late ticket (15+ min) gets a red left edge.
- **Tick-off:** cooks can tap an item to tick it off (struck through and faded). Ticks stay on that screen only and clear when the ticket moves.
- **Notes** are red chips so the cook doesn't miss them.
- **Buttons** get stronger as the order moves: outline Start Preparing, charcoal Mark Ready, red Mark Served. A bump moves the ticket at once. Only that ticket's button waits while it saves, and the ticket goes back if the save fails.

## Admin

- **Sidebar groups:** admin links sit under small gold uppercase labels: Today, Menu & Tables, Sales and Setup. The active link is red with a thin gold bar on its left. Staff has only five links, so its sidebar isn't grouped.
- **Charts (Reports):** one data colour, charcoal. The highest point or bar is gold-deep. Red is kept for actions and warnings, not data. Tooltips are charcoal boxes with a gold label and white text. Axis text is ink at 70%.

## Photos

- Stock photos only from free-licence sites (Unsplash, Pexels). Nothing copied from other restaurants' or hotels' sites.
- Real photos of Vencio's Garden only when the restaurant provides them, with permission, and with no recognisable guests.
- **Dish photos (2026-11-04):** 73 of the 93 dishes have a free Pexels or Unsplash photo in `photos/dishes/`, listed below. None is the restaurant's own food. The other 20 have no honest match, or a photo dropped for a logo, watermark or wrong dish, and keep the no-photo card. Replace any stock photo with the restaurant's own on screen 21.
- **No-photo card**: the shared `DishPhoto` shows a cream panel with a thin gold inset frame and the dish's first letter in Playfair gold. On 09 a dish without a photo gets a shorter hero. The seed text "Short description of the dish." is hidden until real descriptions are entered.
- Store them in `frontend/public/` and list each one below.

| File | Source (link) | Licence |
|---|---|---|
| `logo.png` | Vencio's Garden Hotel & Restaurant official Facebook page ([facebook.com/venciosgardenhotel](https://www.facebook.com/venciosgardenhotel)) | The restaurant's own logo |
| `photos/vencios-dining.jpg` | Vencio's Garden Hotel & Restaurant official Facebook page ([facebook.com/venciosgardenhotel](https://www.facebook.com/venciosgardenhotel)) | The restaurant's own photo, used with its permission. No guests. Home, Our Story block |
| `photos/stock-sisig.jpg` | [Pexels: Cooked meat on black cast iron cookware, by Eiliv Aceron](https://www.pexels.com/photo/cooked-meat-on-black-cast-iron-cookware-6896281/) | Pexels licence (free to use). Stock photo, not Vencio's Garden's own dish. Home hero; dark background to match the site |
| `photos/stock-dish-sisig.jpg` | [Pexels: Sizzling sisig with steamed rice on hotplate, by Mark John Hilario](https://www.pexels.com/photo/sizzling-sisig-with-steamed-rice-on-hotplate-30355484/) | Pexels licence. Stock photo for Sizzling Sisig (Popular Dishes and the menus), not the restaurant's own dish |
| `photos/stock-dish-kare-kare.jpg` | [Pexels: Kare-kare, by Aril Alejandro](https://www.pexels.com/photo/kare-kare-27313072/) | Pexels licence. Stock photo for Crispy Pork Kare-Kare (Popular Dishes and the menus), not the restaurant's own dish. Dishes with no honest stock match keep the no-photo card |
| `photos/vencios-building.jpg` | Vencio's Garden Hotel & Restaurant official Facebook page ([facebook.com/venciosgardenhotel](https://www.facebook.com/venciosgardenhotel)) | The restaurant's own photo, used with its permission. No guests. About hero, faded on the right (1280 × 960) |
| `photos/vencios-counter.jpg` | Vencio's Garden Hotel & Restaurant official Facebook page ([facebook.com/venciosgardenhotel](https://www.facebook.com/venciosgardenhotel)) | The restaurant's own photo, used with its permission. No recognisable guests. About, Our Story block |
| `photos/dishes/hungarian-sausage-with-bread-and-egg.jpg` | [Pexels: Hungarian Sausage with Bread and Egg, by Helen Brudna](https://www.pexels.com/photo/delicious-breakfast-with-sausage-and-egg-32795473/) | Pexels licence. Stock photo for Hungarian Sausage with Bread and Egg, not the restaurant's own dish |
| `photos/dishes/tapa-with-dilis-and-banana-garlic-oleo.jpg` | [Pexels: Tapa with Dilis and Banana Garlic Oleo, by Elmer Domingo](https://www.pexels.com/photo/delicious-filipino-tapsilog-breakfast-bowl-36566222/) | Pexels licence. Stock photo for Tapa with Dilis and Banana Garlic Oleo, not the restaurant's own dish |
| `photos/dishes/smoked-salmon-egg-benedict.jpg` | [Unsplash: Smoked Salmon Egg Benedict, by Sunira Moses](https://unsplash.com/photos/two-eggs-benedict-with-smoked-salmon-and-hollandaise-sauce-ALq284QfyIc) | Unsplash licence. Stock photo for Smoked Salmon Egg Benedict, not the restaurant's own dish |
| `photos/dishes/scrambled-egg-3-pcs.jpg` | [Unsplash: Scrambled Egg (3 pcs.), by Imad 786](https://unsplash.com/photos/a-bowl-of-scrambled-eggs-next-to-a-slice-of-bread-qla1_604R4c) | Unsplash licence. Stock photo for Scrambled Egg (3 pcs.), not the restaurant's own dish |
| `photos/dishes/boiled-or-fried-egg.jpg` | [Unsplash: Boiled or Fried Egg, by Christian Cueni](https://unsplash.com/photos/a-fried-egg-on-a-white-plate-on-a-wooden-table-pvbKrbqN54g) | Unsplash licence. Stock photo for Boiled or Fried Egg, not the restaurant's own dish |
| `photos/dishes/toasted-garlic-bread-2-pcs-with-jam-butter.jpg` | [Unsplash: Toasted Garlic Bread (2 pcs.) with Jam/Butter, by Louis Hansel](https://unsplash.com/photos/garlic-bread-yl33be56sbg) | Unsplash licence. Stock photo for Toasted Garlic Bread (2 pcs.) with Jam/Butter, not the restaurant's own dish |
| `photos/dishes/kilawin-tanigue.jpg` | [Pexels: Kilawin Tanigue, by Jonathan Hidalgo](https://www.pexels.com/photo/fresh-ceviche-with-cucumber-and-red-onion-garnish-31339674/) | Pexels licence. Stock photo for Kilawin Tanigue, not the restaurant's own dish |
| `photos/dishes/nachos.jpg` | [Unsplash: Nachos, by Erick Su](https://unsplash.com/photos/nachos-on-oval-tray-WjBp05j8LXI) | Unsplash licence. Stock photo for Nachos, not the restaurant's own dish |
| `photos/dishes/lumpiang-shanghai.jpg` | [Unsplash: Lumpiang Shanghai, by Joshua Hoehne](https://unsplash.com/photos/fried-spring-rolls-broMfoJ0Emg) | Unsplash licence. Stock photo for Lumpiang Shanghai, not the restaurant's own dish |
| `photos/dishes/clubhouse-with-fries.jpg` | [Unsplash: Clubhouse with Fries, by Alberto Gasco](https://unsplash.com/photos/club-sandwich-and-french-fries-in-a-metal-basket-pdbdsuFYYmc) | Unsplash licence. Stock photo for Clubhouse with Fries, not the restaurant's own dish |
| `photos/dishes/fries-and-mojos.jpg` | [Unsplash: Fries and Mojos, by Fernanda Martinez](https://unsplash.com/photos/potato-fries-and-sliced-potato-on-white-ceramic-plate-H2RzlOijhlQ) | Unsplash licence. Stock photo for Fries and Mojos, not the restaurant's own dish |
| `photos/dishes/yang-chow-fried-rice.jpg` | [Unsplash: Yang Chow Fried Rice, by Christopher Alvarenga](https://unsplash.com/photos/fried-rice-with-peas-and-carrots-rQX9eVpSFz8) | Unsplash licence. Stock photo for Yang Chow Fried Rice, not the restaurant's own dish |
| `photos/dishes/plain-rice.jpg` | [Unsplash: Plain Rice, by Pille R. Priske](https://unsplash.com/photos/rice-in-bowl-xmuIgjuQG0M) | Unsplash licence. Stock photo for Plain Rice, not the restaurant's own dish |
| `photos/dishes/grilled-vegetable-pizza.jpg` | [Unsplash: Grilled Vegetable Pizza, by Laure Noverraz](https://unsplash.com/photos/pizza-with-green-and-red-bell-pepper-and-cheese-on-brown-wooden-table-gujFRz2nHVY) | Unsplash licence. Stock photo for Grilled Vegetable Pizza, not the restaurant's own dish |
| `photos/dishes/grilled-chicken-and-hummus-pizza.jpg` | [Pexels: Grilled Chicken & Hummus Pizza, by Shameel mukkath](https://www.pexels.com/photo/pizza-in-close-up-photography-5639547/) | Pexels licence. Stock photo for Grilled Chicken & Hummus Pizza, not the restaurant's own dish |
| `photos/dishes/hawaiian-pizza.jpg` | [Unsplash: Hawaiian Pizza, by bckfwd](https://unsplash.com/photos/baked-hawaiian-pizza-vc7DjXSry7g) | Unsplash licence. Stock photo for Hawaiian Pizza, not the restaurant's own dish |
| `photos/dishes/pansit-palabok-platter.jpg` | [Unsplash: Pansit Palabok Platter, by Eiliv Aceron](https://unsplash.com/photos/rice-noddles-with-eggs-0gQ8Fh1f54k) | Unsplash licence. Stock photo for Pansit Palabok Platter, not the restaurant's own dish |
| `photos/dishes/pansit-musiko.jpg` | [Pexels: Pansit Musiko, by Janet Ramos](https://www.pexels.com/photo/delicious-asian-stir-fried-noodles-on-a-plate-37262017/) | Pexels licence. Stock photo for Pansit Musiko, not the restaurant's own dish |
| `photos/dishes/bihon-con-lechon.jpg` | [Pexels: Bihon con Lechon, by Christian Moises Pahati](https://www.pexels.com/photo/pancit-with-mixed-vegetable-toppings-5724558/) | Pexels licence. Stock photo for Bihon con Lechon, not the restaurant's own dish |
| `photos/dishes/lasagna-with-garlic-bread.jpg` | [Unsplash: Lasagna with Garlic Bread, by Clare Andrews](https://unsplash.com/photos/freshly-baked-lasagna-with-a-basil-leaf-garnish-rBhXooUziZc) | Unsplash licence. Stock photo for Lasagna with Garlic Bread, not the restaurant's own dish |
| `photos/dishes/creamy-chicken-carbonara-with-toasted-bread.jpg` | [Unsplash: Creamy Chicken Carbonara with Toasted Bread, by Chris Weiher](https://unsplash.com/photos/spaghetti-carbonara-served-in-a-metal-pan-with-cheese-8sdRfiPf4Qo) | Unsplash licence. Stock photo for Creamy Chicken Carbonara with Toasted Bread, not the restaurant's own dish |
| `photos/dishes/fruit-platter.jpg` | [Unsplash: Fruit Platter, by Naveed Pervaiz](https://unsplash.com/photos/variety-of-sliced-fruits-on-tray-IlnF2g_3tpY) | Unsplash licence. Stock photo for Fruit Platter, not the restaurant's own dish |
| `photos/dishes/leche-flan.jpg` | [Pexels: Leche Flan, by Mar Larracas](https://www.pexels.com/photo/leche-flan-on-a-wooden-tray-4773405/) | Pexels licence. Stock photo for Leche Flan, not the restaurant's own dish |
| `photos/dishes/creamy-gelatin.jpg` | [Pexels: Creamy Gelatin, by Keverne Denahan](https://www.pexels.com/photo/close-up-of-cups-with-jelly-standing-on-a-tray-17565597/) | Pexels licence. Stock photo for Creamy Gelatin, not the restaurant's own dish |
| `photos/dishes/bibingka.jpg` | [Pexels: Bibingka, by Mico Medel](https://www.pexels.com/photo/traditional-rice-cakes-baking-in-oven-36038816/) | Pexels licence. Stock photo for Bibingka, not the restaurant's own dish |
| `photos/dishes/caesar-salad.jpg` | [Unsplash: Caesar Salad, by R. G](https://unsplash.com/photos/fresh-caesar-salad-with-grilled-chicken-and-crispy-croutons-5bAi3Cp9wBE) | Unsplash licence. Stock photo for Caesar Salad, not the restaurant's own dish |
| `photos/dishes/fresh-garden-salad.jpg` | [Unsplash: Fresh Garden Salad, by sina piryae](https://unsplash.com/photos/green-salad-on-a-black-bowl-bBzjWthTqb8) | Unsplash licence. Stock photo for Fresh Garden Salad, not the restaurant's own dish |
| `photos/dishes/chopsuey.jpg` | [Pexels: Chopsuey, by Naomi Fotografia](https://www.pexels.com/photo/close-up-of-a-meal-19885469/) | Pexels licence. Stock photo for Chopsuey, not the restaurant's own dish |
| `photos/dishes/talong-binagoongan.jpg` | [Pexels: Talong Binagoongan, by ENESFİLM](https://www.pexels.com/photo/cooked-food-on-white-ceramic-plate-9394526/) | Pexels licence. Stock photo for Talong Binagoongan, not the restaurant's own dish |
| `photos/dishes/bulalo.jpg` | [Pexels: Bulalo, by stillspiica](https://www.pexels.com/photo/delicious-beef-soup-with-vegetables-and-bone-marrow-30518060/) | Pexels licence. Stock photo for Bulalo, not the restaurant's own dish |
| `photos/dishes/sinigang-na-tanigue.jpg` | [Pexels: Sinigang na Tanigue, by Eiliv Aceron](https://www.pexels.com/photo/person-holding-white-ceramic-bowl-with-food-6896013/) | Pexels licence. Stock photo for Sinigang na Tanigue, not the restaurant's own dish |
| `photos/dishes/sinigang-na-hipon.jpg` | [Pexels: Sinigang na Hipon, by Anjelie Khan](https://www.pexels.com/photo/bowl-of-shrimps-8848733/) | Pexels licence. Stock photo for Sinigang na Hipon, not the restaurant's own dish |
| `photos/dishes/bean-soup-in-bread-bowl.jpg` | [Pexels: Bean Soup in Bread Bowl, by Nerfee Mirandilla](https://www.pexels.com/photo/photo-of-food-on-bowl-3186736/) | Pexels licence. Stock photo for Bean Soup in Bread Bowl, not the restaurant's own dish |
| `photos/dishes/mushroom-soup.jpg` | [Unsplash: Mushroom Soup, by David Todd McCarty](https://unsplash.com/photos/bowl-of-creamy-mushroom-soup-with-garnish-on-table-GjwUs-RRzYk) | Unsplash licence. Stock photo for Mushroom Soup, not the restaurant's own dish |
| `photos/dishes/lechon-kawali-or-crispy-pata.jpg` | [Pexels: Lechon Kawali or Crispy Pata, by Amanda Lim](https://www.pexels.com/photo/close-up-photo-of-a-delicious-filipino-food-8625451/) | Pexels licence. Stock photo for Lechon Kawali or Crispy Pata, not the restaurant's own dish |
| `photos/dishes/beef-caldereta.jpg` | [Pexels: Beef Caldereta, by Marcelo Verfe](https://www.pexels.com/photo/a-baked-dish-in-a-pot-16699417/) | Pexels licence. Stock photo for Beef Caldereta, not the restaurant's own dish |
| `photos/dishes/relyenong-bangus.jpg` | [Pexels: Relyenong Bangus, by Amanda Lim](https://www.pexels.com/photo/cooked-fish-on-green-banana-leaf-8178761/) | Pexels licence. Stock photo for Relyenong Bangus, not the restaurant's own dish |
| `photos/dishes/palagitik-hito.jpg` | [Pexels: Palagitik Hito, by Nadin Sh](https://www.pexels.com/photo/deep-fried-fish-wrapped-in-paper-and-served-on-a-white-plate-15954348/) | Pexels licence. Stock photo for Palagitik Hito, not the restaurant's own dish |
| `photos/dishes/sweet-and-sour-fish.jpg` | [Pexels: Sweet & Sour Fish, by Change C.C](https://www.pexels.com/photo/crispy-fish-in-sweet-and-sour-sauce-on-elegant-plate-36694551/) | Pexels licence. Stock photo for Sweet & Sour Fish, not the restaurant's own dish |
| `photos/dishes/fortune-hotpot.jpg` | [Pexels: Fortune Hotpot, by STUDIO LIMA](https://www.pexels.com/photo/food-in-pot-15177422/) | Pexels licence. Stock photo for Fortune Hotpot, not the restaurant's own dish |
| `photos/dishes/all-star-pizza-bundle.jpg` | [Pexels: All Star Pizza Bundle, by Simge](https://www.pexels.com/photo/delicious-assorted-pizzas-with-fresh-ingredients-32763320/) | Pexels licence. Stock photo for All Star Pizza Bundle, not the restaurant's own dish |
| `photos/dishes/signature-pamilya-bundle.jpg` | [Pexels: Signature Pamilya Bundle, by Lucille Conde](https://www.pexels.com/photo/festive-filipino-feast-with-lechon-centerpiece-38191082/) | Pexels licence. Stock photo for Signature Pamilya Bundle, not the restaurant's own dish |
| `photos/dishes/fisherman-s-choice.jpg` | [Pexels: Fisherman's Choice, by Roman Odintsov](https://www.pexels.com/photo/delicious-seafood-in-a-ceramic-plate-4869328/) | Pexels licence. Stock photo for Fisherman's Choice, not the restaurant's own dish |
| `photos/dishes/tsokolate-de-batirol.jpg` | [Unsplash: Tsokolate de Batirol, by Giancarlo Duarte](https://unsplash.com/photos/RtHw0PWCLhw) | Unsplash licence. Stock photo for Tsokolate de Batirol, not the restaurant's own dish |
| `photos/dishes/cafe-latte.jpg` | [Unsplash: Cafe Latte, by Jonas Jacobsson](https://unsplash.com/photos/RFHFV7lVQBY) | Unsplash licence. Stock photo for Cafe Latte, not the restaurant's own dish |
| `photos/dishes/cappuccino.jpg` | [Unsplash: Cappuccino, by Lex Sirikiat](https://unsplash.com/photos/J-4ozdP9EQ0) | Unsplash licence. Stock photo for Cappuccino, not the restaurant's own dish |
| `photos/dishes/espresso.jpg` | [Unsplash: Espresso, by Adi Goldstein](https://unsplash.com/photos/xKS-1DP4g7A) | Unsplash licence. Stock photo for Espresso, not the restaurant's own dish |
| `photos/dishes/ice-tea-or-cucumber-pitcher.jpg` | [Unsplash: Ice Tea or Cucumber Pitcher, by bady abbas](https://unsplash.com/photos/-C_0QOELNVw) | Unsplash licence. Stock photo for Ice Tea or Cucumber Pitcher, not the restaurant's own dish |
| `photos/dishes/cucumber-and-pineapple-detox.jpg` | [Pexels: Cucumber and Pineapple Detox, by Kübra Doğu](https://www.pexels.com/photo/detox-juice-on-glass-cup-8755965/) | Pexels licence. Stock photo for Cucumber and Pineapple Detox, not the restaurant's own dish |
| `photos/dishes/buko-shake.jpg` | [Unsplash: Buko Shake, by Nature Zen](https://unsplash.com/photos/tgwi1-IPkXY) | Unsplash licence. Stock photo for Buko Shake, not the restaurant's own dish |
| `photos/dishes/coke-in-can.jpg` | [Pexels: Coke in Can, by Ron Lach](https://www.pexels.com/photo/a-glass-of-iced-cola-8879617/) | Pexels licence. Stock photo for Coke in Can, not the restaurant's own dish |
| `photos/dishes/cucumber-juice.jpg` | [Pexels: Cucumber Juice, by Timur Weber](https://www.pexels.com/photo/water-with-slices-of-cucumber-in-drinking-glass-8679633/) | Pexels licence. Stock photo for Cucumber Juice, not the restaurant's own dish |
| `photos/dishes/ice-tea-juice.jpg` | [Unsplash: Ice Tea Juice, by Roberto Rendon](https://unsplash.com/photos/l2ZWn-MLvxE) | Unsplash licence. Stock photo for Ice Tea Juice, not the restaurant's own dish |
| `photos/dishes/affogato-coffee.jpg` | [Pexels: Affogato Coffee, by Domenik drz](https://www.pexels.com/photo/close-up-shot-of-a-glass-of-affogato-12914800/) | Pexels licence. Stock photo for Affogato Coffee, not the restaurant's own dish |
| `photos/dishes/matcha-ube-latte.jpg` | [Unsplash: Matcha Ube Latte, by Frank Huang](https://unsplash.com/photos/Sbs1vytqNnI) | Unsplash licence. Stock photo for Matcha Ube Latte, not the restaurant's own dish |
| `photos/dishes/matcha-pistachio-latte.jpg` | [Unsplash: Matcha Pistachio Latte, by Liana S](https://unsplash.com/photos/U4kneR_s7bU) | Unsplash licence. Stock photo for Matcha Pistachio Latte, not the restaurant's own dish |
| `photos/dishes/salted-caramel-macchiato.jpg` | [Unsplash: Salted Caramel Macchiato, by Keith Brian de Leon](https://unsplash.com/photos/1EV6hDgDpFM) | Unsplash licence. Stock photo for Salted Caramel Macchiato, not the restaurant's own dish |
| `photos/dishes/fruit-in-season-shake.jpg` | [Unsplash: Fruit in Season Shake, by Fanny Gustafsson](https://unsplash.com/photos/71z7eCLS4Uo) | Unsplash licence. Stock photo for Fruit in Season Shake, not the restaurant's own dish |
| `photos/dishes/iced-latte-cappuccino.jpg` | [Unsplash: Iced Latte / Cappuccino, by Demi DeHerrera](https://unsplash.com/photos/L-sm1B4L1Ns) | Unsplash licence. Stock photo for Iced Latte / Cappuccino, not the restaurant's own dish |
| `photos/dishes/spanish-latte.jpg` | [Unsplash: Spanish Latte, by Cristian Guillen](https://unsplash.com/photos/utdcuLvaOW0) | Unsplash licence. Stock photo for Spanish Latte, not the restaurant's own dish |
| `photos/dishes/iced-americano.jpg` | [Unsplash: Iced Americano, by Jason An](https://unsplash.com/photos/iOemT3Ufv0o) | Unsplash licence. Stock photo for Iced Americano, not the restaurant's own dish |
| `photos/dishes/fundador-light-1l.jpg` | [Pexels: Fundador Light 1L, by Eva Bronzini](https://www.pexels.com/photo/close-up-photograph-of-glass-with-whiskey-7254755/) | Pexels licence. Stock photo for Fundador Light 1L, not the restaurant's own dish |
| `photos/dishes/alfonso-light-1l.jpg` | [Pexels: Alfonso Light 1L, by Marta Dzedyshko](https://www.pexels.com/photo/cognac-on-cut-glass-bottom-placed-on-table-6341420/) | Pexels licence. Stock photo for Alfonso Light 1L, not the restaurant's own dish |
| `photos/dishes/emperador-light-1l.jpg` | [Pexels: Emperador Light 1L, by Marianne Rixhon](https://www.pexels.com/photo/close-up-of-liquor-on-glasses-7135958/) | Pexels licence. Stock photo for Emperador Light 1L, not the restaurant's own dish |
| `photos/dishes/san-miguel-light-330-ml.jpg` | [Unsplash: San Miguel Light 330 mL, by Timothy Dykes](https://unsplash.com/photos/Lq1rOaigDoY) | Unsplash licence. Stock photo for San Miguel Light 330 mL, not the restaurant's own dish |
| `photos/dishes/red-horse-330-ml.jpg` | [Unsplash: Red Horse 330 mL, by Story Ninety-Four](https://unsplash.com/photos/L4KR3M8Hb14) | Unsplash licence. Stock photo for Red Horse 330 mL, not the restaurant's own dish |
| `photos/dishes/san-miguel-pilsen-330-ml.jpg` | [Unsplash: San Miguel Pilsen 330 mL, by engin akyurt](https://unsplash.com/photos/3ORoQEJY9LA) | Unsplash licence. Stock photo for San Miguel Pilsen 330 mL, not the restaurant's own dish |
| `photos/dishes/mango-daiquiri.jpg` | [Pexels: Mango Daiquiri, by Marcelo Verfe](https://www.pexels.com/photo/mango-cocktail-with-ice-cubes-and-mint-leaves-12954679/) | Pexels licence. Stock photo for Mango Daiquiri, not the restaurant's own dish |
| `photos/dishes/mojito.jpg` | [Unsplash: Mojito, by Sakshi Ranjan](https://unsplash.com/photos/Vy-_h7EnJZc) | Unsplash licence. Stock photo for Mojito, not the restaurant's own dish |
| `photos/dishes/margarita.jpg` | [Unsplash: Margarita, by Hybrid Storytellers](https://unsplash.com/photos/ATV7tTHXNZE) | Unsplash licence. Stock photo for Margarita, not the restaurant's own dish |
| `photos/dishes/shirley-temple.jpg` | [Pexels: Shirley Temple, by Taha Samet Arslan](https://www.pexels.com/photo/bright-red-cocktail-with-cherry-and-straw-7624615/) | Pexels licence. Stock photo for Shirley Temple, not the restaurant's own dish |

## Do and don't

| Do | Don't |
|---|---|
| Use the `brand-*` classes | Write hex values or `bg-[#...]` in components |
| Keep text in ink or deep gold on light backgrounds; white, cream or gold on charcoal; white on red | Put bright gold text on white, cream or red |
| Use Dancing Script for one big title at a time | Use Dancing Script for paragraphs or buttons |
| Leave white space around the logo | Squash, recolour or crop the logo |

The source menu pages are kept in the project vault (`Assets/menu/`), not in the repo.
