# Testing

We use [Playwright](https://playwright.dev) to test the app in a real Chrome browser. Each test opens a page, clicks and types like a user, and checks what appears.

## Running tests

From `frontend/`:

| Command | What it does |
|---|---|
| `npm run test:e2e` | Run every test in the terminal |
| `npm run test:e2e:ui` | Open the visual runner to watch tests step by step |
| `npm run test:e2e:report` | Open the report from the last run, with screenshots of failures |

You don't need to start `npm run dev` first. Playwright starts the dev server if it isn't running.

### First time on a new computer

Download the test browser once:

```bash
npx playwright install chromium
```

## Where tests live

```
frontend/e2e/
├── customer.spec.ts   screens 01-07
├── table.spec.ts      screens 08-12
├── staff.spec.ts      screens 13-18 (add when built)
└── admin.spec.ts      screens 19-29
```

Files with `customer` or `table` in the name run at phone size (390 × 844). All others run at desktop size (1440 × 900). This is set in `playwright.config.ts`.

## Writing a test

```ts
import { expect, test } from '@playwright/test'

test('reserving a table shows the confirmation', async ({ page }) => {
  await page.goto('/reserve')
  await page.getByLabel('Name').fill('Customer Name')
  await page.getByLabel('Mobile number').fill('09000000000')
  await page.getByRole('button', { name: 'Reserve' }).click()
  await expect(page.getByText('Reservation confirmed')).toBeVisible()
})
```

Find elements the way a user would see them:

| Use | For |
|---|---|
| `getByRole('button', { name: 'Reserve' })` | Buttons, links, headings |
| `getByLabel('Mobile number')` | Form fields with a `<label>` |
| `getByText('Your cart is empty')` | Plain text |

Avoid finding elements by CSS class. Classes change when styling changes and break the test.

## Recording a test instead of writing it

Playwright can write the test for you while you click through the app:

```bash
npx playwright codegen http://localhost:5173
```

Copy the generated code into a file in `e2e/`, then tidy the names.

## When to add tests

Add or update a test when you build a screen. At minimum, cover the main flows:

1. Reserve a table → deposit → confirmation (03 → 04 → 05)
2. Find and cancel a reservation (06)
3. Scan table QR → add item → cart → checkout → order status (08 → 12)
4. Staff login → mark a reservation as arrived (13 → 15)
5. Admin adds a menu item and it appears on the customer menu (21 → 02)

Tests that need the backend should wait until the API exists, or use [`page.route`](https://playwright.dev/docs/mock) to fake its responses.

## Using AI to write tests

When asking an AI assistant for a test, give it:

- the screen number and URL from [Screens and routes](screens-and-routes.md)
- the steps a user takes and what should appear at the end
- this page, so it follows the same file names and `getByRole` / `getByLabel` style

Run `npm run test:e2e` on whatever it writes. Don't keep a test you haven't seen pass.
