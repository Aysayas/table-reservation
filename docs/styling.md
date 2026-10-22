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

## Placeholder content

The organisation is a placeholder. On every screen use:

| Instead of | Write |
|---|---|
| The real restaurant name | `Restaurant Name` |
| Real domain or email | `placeholder-domain.com` |
| Prices and amounts | `₱000.00` |
| Real people | Generic names, e.g. `Customer Name` |
| Food photos | A plain placeholder box |

## Code comments

Keep source files free of explanatory comments. Put explanations in these docs instead.
