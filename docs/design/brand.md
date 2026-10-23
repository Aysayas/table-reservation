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

**Current palette (since 2026-10-23): charcoal, gold, cream and maroon.** An elegant, dark-and-warm look for evening dining. Maroon comes from the restaurant's menu.

| Token | Hex | Use it for |
|---|---|---|
| `brand-charcoal` | `#1C1917` | Dark sections, header, main buttons, footer |
| `brand-gold` | `#C5A059` | Accent buttons, small labels, lines and icons, only on charcoal or maroon |
| `brand-cream` | `#F7F2E9` | Soft section backgrounds, cards and panels |
| `brand-maroon` | `#5C161A` | Headings, prices, strong labels, accent |
| `brand-ink` | `#2B2522` | Body text (the default on `body`) |
| white | `#FFFFFF` | Page background, text on charcoal or maroon |

**Old palette, being phased out.** Screens 05 and 07 still use these. Remove each token once no screen uses it.

| Token | Hex |
|---|---|
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
| `brand-maroon` | white / cream | 13.3 / 11.9 | Any text |
| white / cream | `brand-charcoal` | 17.5 / 15.7 | Any text |
| white | `brand-maroon` | 13.3 | Any text |
| `brand-gold` | `brand-charcoal` | 7.1 | Any text |
| `brand-charcoal` | `brand-gold` | 7.1 | Any text (gold buttons) |
| `brand-gold` | white / cream | 2.5 / 2.2 | Never |

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

- File: `/logo.png` (in `frontend/public/`): the official Vencio's Garden Hotel & Restaurant logo, a gold emblem and gold name on red (since 2026-10-23; the old round green logo is in git history).
- Full logo: on large spots (login, splash), shown whole. Never stretch it or recolour it.
- Top bar: a 32px round badge zoomed in on the gold emblem, with the restaurant name written next to it.
- Give it `alt="Vencio's Garden"`, or `alt=""` when the name is already written right next to it.

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
| `logo.png` | Vencio's Garden Hotel & Restaurant official Facebook page ([facebook.com/venciosgardenhotel](https://www.facebook.com/venciosgardenhotel)) | The restaurant's own logo |

## Do and don't

| Do | Don't |
|---|---|
| Use the `brand-*` classes | Write hex values or `bg-[#...]` in components |
| Keep text in ink or maroon on light backgrounds; white, cream or gold on charcoal | Put gold text on white or cream |
| Use Dancing Script for one big title at a time | Use Dancing Script for paragraphs or buttons |
| Leave white space around the logo | Squash, recolour or crop the logo |

The source menu pages are kept in the project vault (`Assets/menu/`), not in the repo.
