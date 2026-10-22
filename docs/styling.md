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

The colours come from Vencio's Garden's menu. They are already theme tokens in `src/index.css`, and [the brand guide](design/brand.md) says what each one is for. The wireframes show layout, not colour.

- Use the brand classes: `bg-brand-green`, `text-brand-brown`, `bg-brand-cream`, and so on.
- Shades of them are fine (for example `hover:bg-brand-green/90`). Don't add new colours.
- Don't hard-code hex values (`#1a2b3c`, `bg-[#1a2b3c]`) in components.
- Keep text readable. The brand guide lists which text and background pairs are safe.

## Fonts

Montserrat is the default font (`font-sans`) for everything. Dancing Script (`font-display`) is only for one big title at a time, like the restaurant name or a section banner. Both are already loaded in `src/index.css`.

## Screen sizes

| Area | Designed at | Notes |
|---|---|---|
| Customer and QR ordering (01-12) | 390px wide | `CustomerLayout` already limits the width |
| Staff, kitchen and admin (13-29) | 1440 × 900 | Sidebar is 240px wide |

## Real and placeholder content

The restaurant is **Vencio's Garden**. These are real, so use them:

| What | Where |
|---|---|
| Restaurant name | `Vencio's Garden` |
| Logo | `/logo.png` (in `frontend/public/`) |
| Menu categories, items, descriptions and prices | `sampleData.ts`, later the API |

Everything else stays a placeholder:

| Instead of | Write |
|---|---|
| Real people | Generic names, e.g. `Juan Dela Cruz`, `Customer Name` |
| Real phone numbers | `09XX XXX XXXX` |
| Real domain or email | `placeholder-domain.com` |
| Food photos | A plain placeholder box |

## Code comments

Keep source files free of explanatory comments. Put explanations in these docs instead.
