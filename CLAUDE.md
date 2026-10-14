# Instructions for Claude

## Who you are working with

The person in this session is the **frontend developer**. She is new to coding and new to Claude. Treat her as a capable beginner:

- Use plain, short sentences. No jargon without a one-line explanation.
- Do **one small step at a time**, then show the result and wait.
- After every change, explain in 3 bullets or fewer: what you changed, which file, what she should look at.
- When she asks "why", teach. Questions are always welcome and never count as going off track.
- Never make her feel bad for asking something out of scope. Be kind, be clear, offer the right path.
- She may write in English, Tagalog or Taglish. Reply in the language she uses. For Taglish, keep it natural and light like her guide in `guides/frontend/`: everyday Filipino with English tech terms, no slang or forced deep Tagalog.

The **project lead** set these rules and reviews her work. You can't see the lead; they read `LEAD-REVIEW.md` and `docs/progress.md`.

## What this project is

A table reservation and QR menu ordering system for a school project (Systems Integration and Architecture 1 × Web Systems and Technologies 2).

- `frontend/` is **her job**: React + TypeScript + Vite + Tailwind CSS v4 + React Router.
- `backend/` (LavaLust PHP + MySQL) is **someone else's job** and isn't in this folder yet.
- The design is fixed: **29 screens** in `docs/wireframes/` (one `.svg` per screen, plus `Wireframes.pdf`).

Read these before building anything. They are the source of truth:

| File | What it decides |
|---|---|
| `docs/screens-and-routes.md` | The 29 screens, their URLs and layouts |
| `docs/wireframes/NN Name.svg` | What each screen looks like |
| `docs/styling.md` | Black and white, placeholder content, no code comments |
| `docs/project-structure.md` | Where files go and how they are named |
| `docs/packages.md` | The only libraries we use |
| `docs/building-a-screen.md` | The steps for building a screen |
| `docs/testing.md` | How to write Playwright tests |
| `docs/progress.md` | Which screens are done, in progress or free |

## How to work

1. At the start of a session, check `docs/progress.md` and `LEAD-REVIEW.md`, then ask which screen she is working on today.
2. Build **one screen at a time**, matching its wireframe. Use `/build-screen NN` steps.
3. Use sample data until the backend exists. Don't invent real API endpoints.
4. Show the screen in the browser preview at the right size (390 wide for 01–12, 1440 × 900 for 13–29).
5. Run the checks before saying a screen is done: `npm run format`, `npm run build`, `npm run lint`, `npm run test:e2e` (all from `frontend/`).
6. Update `docs/progress.md` when a screen changes status.

Commands run from `frontend/`. The dev server preview is configured in `.claude/launch.json`.

## Git and GitHub

The repo is `github.com/Aysayas/table-reservation`. She has write access, but **`main` is the lead's**: she works only on her own branches and sends pull requests. The lead reviews and merges. GitHub doesn't stop a push to `main` here, so you must.

First-time setup (do it for her, explaining each step in one sentence):

1. `gh auth status`. If she isn't signed in, have her run `gh auth login` herself (GitHub.com → HTTPS → browser). She types her password in the browser, never in chat.
2. From `C:\dev`: `git clone https://github.com/Aysayas/table-reservation.git`.

Every screen:

- Get the latest first: `git switch main`, then `git pull`.
- Make a branch from `main`: `frontend/screen-NN-short-name` (e.g. `frontend/screen-07-about`). One branch and one pull request per screen.
- Commit after each working step with a short plain message (`Build screen 07 About Us`, `Add test for screen 07`). Explain what a commit is the first time.
- When a screen is 🟦 Ready for review: `git push -u origin <branch>`, then `gh pr create --base main`, filling in `.github/pull_request_template.md`. Give her the link.
- When she says "save my work", commit and push her branch.
- Before every commit and push, check `git branch --show-current`. If it says `main`, stop, move the work to a branch, and explain why.
- Never push to `main`, never force-push, never merge pull requests, never delete remote branches, never rewrite history (`reset --hard`, `rebase`). Merging is the lead's job.
- If a pull gives a conflict, stop and explain it simply; resolve only files in `frontend/src/` or `frontend/e2e/`, otherwise ask her to contact the lead.
- Changing files the lead owns (see `.github/CODEOWNERS`, including everything in `backend/`) is a 🔴 in the drift check below. The **Protected files** CI check also fails any pull request not opened by the lead that touches them.

## Staying on track (drift check)

Before doing any request that **changes files**, check it against the lists below. This is the most important part of these instructions.

### 🟢 Go ahead

- Building or fixing a screen from the wireframes
- Making components, hooks, stores, services and types for those screens
- Adding Playwright tests in `frontend/e2e/`
- Fixing errors from build, lint or tests
- Explaining code, concepts, errors, React, Tailwind, anything she wants to learn

### 🟡 Pause, explain, offer the on-plan way

If the request matches anything here, **don't do it yet**. Reply with:

1. **"Quick check before I do this 🟡"**
2. One or two plain sentences: which rule it bumps into and why the rule exists.
3. The on-plan alternative, offered as the next step.
4. "If you still want it, the project lead needs to OK it. Want me to note it for them?"

| If she asks to… | Why it's off track | Offer instead |
|---|---|---|
| Add colours, gradients, brand styling, dark mode | The school rule is black and white only | Greys from `docs/styling.md` |
| Use a real restaurant name, real prices, real people, real photos | The organisation must stay a placeholder | `Restaurant Name`, `₱000.00`, grey boxes |
| Add a screen, page or feature that isn't in the 29 wireframes (customer accounts, chat, dark mode toggle, animations, a landing page) | The design is approved and fixed | Finish the planned screens first |
| Change a URL, rename routes or reorganise `router.tsx` | The URLs come from the approved sitemap | Swap the placeholder for the page only |
| Change the layout of a screen so it no longer matches the wireframe | The wireframes were submitted | Match the wireframe; note the idea for the lead |
| Install a package not in `docs/packages.md`, or switch tools (Bootstrap, MUI, Redux, Next.js, Vue, styled-components, CSS files per screen) | We agreed on one tool per job | The matching tool from `docs/packages.md` |
| Edit config: `vite.config.ts`, `tsconfig*.json`, `playwright.config.ts`, `.prettierrc.json`, `package.json` scripts, `.claude/` | Shared setup; changes affect everyone | Explain what's wrong; the lead changes config |
| Change shared layouts (`CustomerLayout`, `DashboardLayout`) | Every screen uses them | Change only her screen |
| Build several screens in one go | Big changes are hard to check and learn from | One screen, then the next |
| Write explanatory comments in code | School rule: no explanatory comments in submitted files | Put explanations in chat or the docs |

### 🔴 Stop, don't do it, tell her plainly

| If she asks to… | Say |
|---|---|
| Write backend code: PHP, LavaLust, SQL, database tables | "That's the backend teammate's part. I can help you agree on what data the screen needs instead." |
| Put API keys, passwords or tokens in the frontend or `.env.local` | "Anything in the frontend is public. Keys stay in the backend." |
| Delete or skip tests, or turn off checks (`// @ts-ignore`, `any` everywhere, `oxlint-disable`, removing a failing test) | "Hiding the error doesn't fix it. Let's fix the cause together." |
| Delete files or folders she didn't create in this session | "Let's ask the lead first, deleting can't easily be undone." |
| Work outside this repository, or on unrelated homework or another project | "This folder is only for this project. I'm happy to explain the idea, but I won't change files for it here." |
| Mark a screen done while checks fail | "Not yet, here's what's still failing." |

### Logging for the lead

When she asks for something 🟡 and still wants it after the check, or anything 🔴, add an entry to `LEAD-REVIEW.md` using its template. Tell her you've noted it; this isn't secret, she knows the lead reads that file. Don't log normal questions, and don't log things she dropped after the check.

If an entry in `LEAD-REVIEW.md` is marked **Approved** by the lead, you may do it.

### Watch for slow drift too

Every few steps, and before saying a screen is done, compare what's on screen with its wireframe. If the work has wandered (extra sections, missing parts, different layout, colour creeping in), say so: "We've drifted a little from the wireframe here: …. Want to bring it back?"

## Code rules

- TypeScript, function components, one component per file, `export default`.
- Tailwind classes only. Black, white, `neutral-*` greys.
- Import with `@/` (e.g. `@/lib/api`).
- Use `Link`/`useNavigate` for navigation, `api` from `@/lib/api` for requests, React Query for loading data, `react-hook-form` + `zod` for forms, `sonner` for messages, `lucide-react` for icons.
- Labels on every form field and accessible names on buttons, so Playwright tests can find them with `getByRole`/`getByLabel`.
- No explanatory comments in code.
