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

These are already theme tokens in `frontend/src/index.css`, so every one has Tailwind classes (`bg-brand-green`, `text-brand-brown`, `border-brand-leaf`, …). The values were measured from the menu photos.

| Token | Hex | Use it for |
|---|---|---|
| `brand-green` | `#385D05` | Section banners, header bars, main buttons, active sidebar item |
| `brand-leaf` | `#678E24` | Logo ring colour, icons, accents, hover on green |
| `brand-gold` | `#E0C326` | Badges ("Best seller"), highlights, the script title colour |
| `brand-peach` | `#F0CB95` | Soft fills, chips, selected filters |
| `brand-cream` | `#F9F3CC` | Cards and panels on the white page |
| `brand-sage` | `#8EA287` | Dividers and decoration only |
| `brand-brown` | `#6C422D` | Dish names, headings |
| `brand-maroon` | `#5C161A` | Prices, strong labels |
| `brand-ink` | `#3A4B2E` | Body text (the default on `body`) |
| white | `#FFFFFF` | Page background, text on green or maroon |

Shades of these (for example `bg-brand-green/90` for hover) are fine. New or replacement colours are fine too: add them as tokens in `index.css` and list them here. Don't write hex values in components.

### Text that is easy to read

Checked with the WCAG contrast formula. 4.5:1 or more is fine for any text; 3:1 is only for large or bold text (about 18px+, or 14px+ bold).

| Text | On | Contrast | OK for |
|---|---|---|---|
| `brand-ink` | white / cream / peach | 9.4 / 8.4 / 6.2 | Any text |
| `brand-brown` | white / cream / peach | 8.6 / 7.6 / 5.6 | Any text |
| `brand-maroon` | white / cream | 13.3 / 11.8 | Any text |
| `brand-green` | white / cream | 7.7 / 6.8 | Any text |
| white | `brand-green` / `brand-maroon` | 7.7 / 13.3 | Any text |
| `brand-ink` | `brand-gold` | 5.4 | Any text (badges) |
| white | `brand-leaf` | 3.8 | Large or bold text only |
| `brand-gold` | `brand-green` | 4.4 | Large or bold text only |
| `brand-gold` | white | 1.8 | Never |
| any text | `brand-sage` | below 3.5 | Never |

## Fonts

Installed with `@fontsource` (they work offline) and already set in `index.css`.

| Font | Class | Use it for |
|---|---|---|
| Montserrat 400, 600, 700 | `font-sans` (the default) | Everything: body, headings, prices, buttons, forms |
| Dancing Script 700 | `font-display` | Only big titles: the restaurant name, a section banner like "Signature Presto Pizza". Never for body text, buttons or small labels |

Suggested sizes:

| Use | Classes |
|---|---|
| Restaurant name / page hero | `font-display text-4xl text-brand-green` |
| Section banner | `bg-brand-green text-white font-bold uppercase tracking-wide text-xl` |
| Dish name | `font-bold text-brand-brown` |
| Description | `text-sm text-brand-ink` |
| Price | `font-bold text-brand-maroon` |

## Logo

- File: `/logo.png` (in `frontend/public/`), round.
- Show it on white or cream. Never stretch it, recolour it or put it on a busy background.
- At least 40px wide; in headers 40–56px.
- Always give it `alt="Vencio's Garden"`.

## Layout ideas from the menu

- A white page with lots of space.
- Full-width green banner bars with white uppercase text for section titles, like the menu's "PRELUDE" and "SOUP MELODIES".
- Dish name on the left, price on the right.
- Rounded cards (`rounded-xl`) in `brand-cream` for items and summaries.
- The menu's green-and-gold sunburst stripes can be a small accent (for example on the home hero). Never put text on top of them.

## Photos

- Stock photos only from free-licence sites (Unsplash, Pexels). Nothing copied from other restaurants' or hotels' sites.
- Real photos of Vencio's Garden only when the restaurant provides them, with permission, and with no recognisable guests.
- Store them in `frontend/public/` and list each one below.

| File | Source (link) | Licence |
|---|---|---|

## Do and don't

| Do | Don't |
|---|---|
| Use the `brand-*` classes | Write hex values or `bg-[#...]` in components |
| Keep text in ink, brown, maroon or green | Put gold text on white, or any text on sage |
| Use Dancing Script for one big title at a time | Use Dancing Script for paragraphs or buttons |
| Leave white space around the logo | Squash, recolour or crop the logo |

The source menu pages are kept in the project vault (`Assets/menu/`), not in the repo.
