---
name: e2e
description: Write or fix the Playwright end-to-end test for one screen (01-29), one spec file per screen, and report which screens still have no test. Use when the frontend developer types /e2e followed by a screen number, /e2e with nothing, or asks to add, write, fix or check a test for a screen.
---

# Test a screen

The argument is a screen number like `07`. With no argument, do step 1 only: show the coverage list and ask which screen she wants.

Keep every message short and friendly. She is a beginner. Wait for her reply at each ⏸.

## 1. Coverage

Each screen gets its own spec file in `frontend/e2e/`, named by area, number and short name:

| Screens | File name | Runs at |
|---|---|---|
| 01–07 | `customer-NN-short-name.spec.ts` | phone, 390 × 844 |
| 08–12 | `table-NN-short-name.spec.ts` | phone, 390 × 844 |
| 13–18 | `staff-NN-short-name.spec.ts` | desktop, 1440 × 900 |
| 19–29 | `admin-NN-short-name.spec.ts` | desktop, 1440 × 900 |

`playwright.config.ts` picks the size from the name: files whose name starts with `customer` or `table` run in the `mobile` project, all others in `desktop`. A file with the wrong word in its name runs at the wrong size.

Read `docs/progress.md` and list `frontend/e2e/`. Show:

```
Screens with a test: 07, 13
Built but no test yet: 05 (🟦)
Not built yet: the other 26
```

A screen that is 🟦 or ✅ without its spec file is not ready. `customer.spec.ts`, `table.spec.ts` and `admin.spec.ts` are shared navigation tests: keep them passing, but they don't count as a screen's test.

## 2. Check

- Read the screen's row in `docs/screens-and-routes.md` for its URL.
- Read the wireframe `docs/wireframes/NN *.svg` (labels are in `<text>` elements).
- Read the page file in `frontend/src/pages/`. If the screen is still a `Placeholder`, stop: "This screen isn't built yet. Want to build it first with `/build-screen NN`?"
- Skim `docs/testing.md`.
- Run `git branch --show-current`. If it says `main`, run `git pull`, then `git switch -c frontend/test-NN-short-name`. If she is on the screen's own branch (`frontend/screen-NN-…`), stay on it so the test goes in the same pull request.

## 3. Look at the screen first

Explore the running screen before writing anything, so the test uses what is really on the page:

1. Start the preview (`frontend` in `.claude/launch.json`), or run `npm run dev` in `frontend/`.
2. With the Playwright MCP (`browser_resize`, `browser_navigate`, `browser_snapshot`): resize to the screen's size, open `http://localhost:5173` plus its URL, and take a snapshot. The snapshot lists every heading, link, button and field with the name `getByRole` and `getByLabel` will use.
3. Click through the main flow the same way (`browser_click`, `browser_type`) and snapshot after each step.

If the Playwright MCP tools aren't available, use the browser preview and `read_page`, or `npx playwright codegen http://localhost:5173`.

If a field has no label or a button has no name, the test can't find it the way a user does. Point it out and offer to fix the page, not the test.

## 4. Plan in plain words ⏸

List what the test will check as a short numbered list:

1. The page opens and shows its heading
2. Each main part of the wireframe is there
3. The main flow works (fill the form, press the button, see the next screen)

Ask: "Is that what this screen should do? Shall I write it?"

## 5. Write

```ts
import { expect, test } from '@playwright/test'

test('reserve a table goes to the deposit page', async ({ page }) => {
  await page.goto('/reserve')
  await page.getByLabel('Name').fill('Customer Name')
  await page.getByRole('button', { name: 'Reserve' }).click()
  await expect(page).toHaveURL('/reserve/payment')
})
```

- One `test()` per behaviour, named in plain words.
- Find things with `getByRole`, `getByLabel`, `getByText`. Never CSS classes or `nth-child`.
- Expected data comes from `frontend/src/services/sampleData.ts`: `Hungarian Sausage with Bread and Egg` (item 1, ₱285.00), `Breakfast Corner`, `T1`, `RSV-000001`, `Customer Name`, `09000000000`, `admin@placeholder-domain.com`. Import from `@/services/sampleData` instead of copying values when the list is long.
- Typed values are placeholders too: `Customer Name`, `09000000000`, `customer@placeholder-domain.com`.
- Actions that need the backend pretend to succeed, so check the next screen opens. Don't call real endpoints; use `page.route` only for endpoints listed in `docs/api.md`.
- No comments, no `test.skip`, no `.only`, no `waitForTimeout`.

## 6. Run ⏸

From `frontend/`:

1. `npx playwright test e2e/<file>.spec.ts --reporter=list`
2. When it passes, the whole suite: `npm run test:e2e`
3. `npm run format` and `npm run lint`

If a test fails, open `npm run test:e2e:report` and explain the failure in one sentence. Decide with her whether the page or the test is wrong: fix the page if it doesn't match the wireframe, fix the test if it looked for the wrong thing. Never delete or skip a failing test. Watch it fail once on purpose (change one expected word), then put it back, so she sees the test really checks something.

## 7. Wrap up

- In `docs/progress.md`, write `e2e` in the screen's Notes column.
- Commit (`Add test for screen NN`). If this is its own branch, `git push -u origin <branch>` and `gh pr create --base main` with `.github/pull_request_template.md`, then give her the link. If CI turns red, read it with `gh pr checks` and fix it with her.
- Tell her in 3 bullets: what the test checks, which file, one Playwright idea she used (a locator, `expect`, or a user flow), explained simply.
- Show the updated coverage list from step 1 and suggest the next screen without a test.
