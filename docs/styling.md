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

The frontend developer chooses the colours. The wireframes show layout, not colour.

- Define every colour once as a theme token in `src/index.css`, inside `@theme` (for example `--color-primary`). Tailwind then makes classes like `bg-primary` and `text-primary`.
- Use those theme classes on screens. Don't hard-code hex values (`#1a2b3c`, `bg-[#1a2b3c]`) in components.
- Keep text readable: enough contrast between text and its background.

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
