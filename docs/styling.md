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

## Black and white

Match the wireframes: black, white and greys only.

| Use | Classes |
|---|---|
| Text | `text-black`, `text-neutral-500` for secondary text |
| Backgrounds | `bg-white`, `bg-neutral-100` for subtle areas, `bg-black` for primary buttons and active items |
| Borders | `border-neutral-200`, `border-black` |

Don't add brand colours or colour legends.

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
| Food photos | A grey box (`bg-neutral-200`) |

## Code comments

Keep source files free of explanatory comments. Put explanations in these docs instead.
