---
name: check-my-work
description: Run all checks on the frontend and scan for anything that has drifted from the project rules, then report in plain words. Use when the frontend developer types /check-my-work or asks if her work is okay, finished, or ready.
---

# Check my work

Report results as a simple traffic light list. She is a beginner, so explain each problem in one plain sentence and offer to fix it.

## 1. Run the checks

From `frontend/`:

1. `npm run format`
2. `npm run build`
3. `npm run lint`
4. `npm run test:e2e`

## 2. Scan for drift

Search `frontend/src/` and `frontend/e2e/` for:

| Look for | Rule |
|---|---|
| Colour classes other than black, white, `neutral-*`, `gray-*` (e.g. `red-`, `blue-`, `green-`, `amber-`, hex colours, `rgb(`) | Black and white only |
| `//` or `/* */` comments in `.tsx`/`.ts` files | No explanatory comments |
| `@ts-ignore`, `@ts-expect-error`, `: any`, `as any`, `oxlint-disable`, `test.skip`, `.only(` | Don't hide errors or skip tests |
| `key`, `secret`, `token`, `password` with a real-looking value | No secrets in the frontend |
| New `.css` files other than `index.css` | Tailwind classes only |
| Imports from packages not in `docs/packages.md` | Agreed packages only |
| Real names, prices other than `₱000.00`, real domains | Placeholder content only |
| `path:` values in `router.tsx` that differ from `docs/screens-and-routes.md` | URLs are fixed |

Also check that `package.json` dependencies match `docs/packages.md`, and that the screens marked 🟦 in `docs/progress.md` still match their wireframes in `docs/wireframes/`.

## 3. Report

```
✅ Format, build, lint, tests: all passing
🟡 Screen 07 uses text-blue-600 in About.tsx line 12 (black and white only). Fix it?
🔴 A test is skipped in customer.spec.ts line 8. Let's fix the test instead.
```

End with one line: either "Everything looks good, ready for the lead to review." or "N things to fix. Want me to fix them one by one?"

Log anything 🔴 in `LEAD-REVIEW.md` only if she chooses not to fix it.
