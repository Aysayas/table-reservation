# Styling rules

## Tailwind CSS

We style with [Tailwind CSS v4](https://tailwindcss.com/docs) utility classes written directly on elements:

```tsx
<button className="rounded border border-black px-4 py-2 text-sm hover:bg-black hover:text-white">
  Reserve a Table
</button>
```

- Don't make new `.css` files for single screens. Use classes.
- Shared base styles go in `src/index.css` only.
- If the same long list of classes repeats, make a component instead of copying it.

## Colours

The frontend developer designs the look: colours, fonts, layout and motion. The wireframes fix what each screen shows, not how it looks. The starting palette came from Vencio's Garden's menu; she may change it.

- Define every colour once as a theme token in `src/index.css` (`@theme`), then use its classes (`bg-…`, `text-…`).
- Don't hard-code hex values (`#1a2b3c`, `bg-[#1a2b3c]`) in components.
- Keep text readable: enough contrast between text and its background.
- Write down the palette and what each colour is for in [the brand guide](design/brand.md).

## Fonts

Fonts come from `@fontsource/*` packages (they work offline), imported once in `src/index.css` and set as theme tokens (`--font-sans`, `--font-display`, …). Record which font is for what in [the brand guide](design/brand.md).

## Screen sizes

| Area | Designed at | Notes |
|---|---|---|
| Customer (01-07) | 390px wide on phones, wider on tablet and laptop | Responsive: the phone view matches the wireframes; larger screens may use the space (`md:`, `lg:` classes) |
| QR ordering (08-12) | 390px wide | Phone only, used at the table |
| Staff, kitchen and admin (13-29) | 1440 × 900 | Sidebar is 240px wide |

## Real and placeholder content

The restaurant is **Vencio's Garden**. These are real, so use them:

| What | Where |
|---|---|
| Restaurant name | `Vencio's Garden` |
| Logo | `/logo.png` (in `frontend/public/`) |
| Menu categories, items, descriptions and prices | `sampleData.ts`, later the API |
| The restaurant's address, phone, email and Facebook page | `sampleSettings` in `sampleData.ts`, later `GET /settings` |

Everything else stays a placeholder:

| Instead of | Write |
|---|---|
| Real people (customers, staff) | Generic names, e.g. `Juan Dela Cruz`, `Customer Name` |
| A person's phone number | `09XX XXX XXXX` |
| A person's email or other domains | `placeholder-domain.com` |
| Real food or restaurant photos | Free-licence stock photos (Unsplash, Pexels) with the source noted in `design/brand.md`, or a placeholder box. Real restaurant photos only with the lead's OK |

## Code comments

Keep source files free of explanatory comments. Put explanations in these docs instead.
