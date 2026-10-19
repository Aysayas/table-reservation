---
name: build-screen
description: Build one wireframe screen (01-29) step by step with the frontend developer. Use when she types /build-screen followed by a screen number, or asks to start, build or make a screen.
---

# Build a screen

The argument is a screen number like `07`. If it's missing, show the next ⬜ screen from the suggested order in `docs/progress.md` and ask which one she wants.

Keep every message short and friendly. She is a beginner. Wait for her reply at each ⏸.

## 1. Check

- Read `docs/progress.md`. If the screen is 🟨 or 🟦 and she didn't start it, say so and ask if a teammate is already on it.
- Read `docs/screens-and-routes.md` for the URL and layout.
- Read the wireframe `docs/wireframes/NN *.svg`. The `<text>` elements show the labels; rectangles show boxes, inputs and buttons.
- Skim `docs/styling.md` and `docs/building-a-screen.md`.

- Run `git status` and `git branch --show-current`. If she's on `main`, run `git pull`, then `git switch -c frontend/screen-NN-short-name`. Tell her in one sentence: "I made you a branch, your own copy for this screen."

## 2. Plan in plain words ⏸

Tell her what's on the screen, top to bottom, as a short numbered list (e.g. "1. Page title, 2. Opening hours list, 3. Contact box"). Say which files you'll make. Ask: "Does this match what you see in the wireframe? Shall I start?"

Mark the screen 🟨 in `docs/progress.md`.

## 3. Build

- Page file in `frontend/src/pages/<area>/`. Pieces used on other screens go in `frontend/src/components/`.
- Sample data inside the file until the backend exists. Placeholder content only (`Restaurant Name`, `₱000.00`, `placeholder-domain.com`).
- Swap the `Placeholder` for the page in `frontend/src/router.tsx`. Don't change any `path`.
- Follow every rule in `CLAUDE.md`, including the drift check.

## 4. Show it ⏸

Start the preview (`frontend` in `.claude/launch.json`), set the size (390 × 844 for 01–12, 1440 × 900 for 13–29), open the screen's URL and take a screenshot. Compare it with the wireframe and list any differences honestly. Ask her to look at it too and tell you what to change.

## 5. Test

Follow `/e2e NN` to add the screen's own spec file in `frontend/e2e/` that opens the screen and checks its main parts and buttons. Use `getByRole` and `getByLabel`.

## 6. Check

From `frontend/`, run `npm run format`, `npm run build`, `npm run lint`, `npm run test:e2e`. Fix anything that fails and explain the fix in one sentence. Never hide an error.

## 7. Wrap up

- Mark the screen 🟦 Ready for review in `docs/progress.md`.
- Commit (`Build screen NN Name`), `git push -u origin <branch>`, and open a pull request with `gh pr create --base main` using `.github/pull_request_template.md`, with the checklist ticked. Give her the link and say the lead will review it. If the CI check turns red, read it with `gh pr checks` and fix it with her.
- Tell her in 3 bullets: what was built, which files, one thing she learned (a React or Tailwind idea used on this screen, explained simply).
- Suggest the next screen from the suggested order.
