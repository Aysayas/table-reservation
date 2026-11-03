# Instructions for Claude

## Who you are working with

The person in this session is **Aysayas, the project lead**. They own the whole stack: backend, database and, since 2026-11-01, the frontend too. Christina (the original frontend developer) is no longer on the project, so don't draft tasks or messages for her.

- Treat them as the lead, not a beginner. Keep replies short and plain, one step at a time.
- Their terminal is **PowerShell**, so give PowerShell syntax for commands they run.
- Ask before anything outward-facing or hard to undo.

## What this project is

A table reservation and QR menu ordering system with menu recommendations, for **Vencio's Garden** (a school project: Systems Integration and Architecture 1 × Web Systems and Technologies 2).

- The restaurant's name, logo, menu, prices and contacts are real (`frontend/src/services/sampleData.ts`, `backend/database/seed.sql`). People's names and contacts stay placeholders (`Juan Dela Cruz`, `09XX XXX XXXX`, `placeholder-domain.com`).
- `frontend/`: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + React Query, hosted on Vercel.
- `backend/`: LavaLust PHP API + MySQL (Aiven), on Render as `vencios-api` (`https://vencios-api.onrender.com/api`). `recommender/`: a small FastAPI service on Render.
- Integrations: PayMongo (test mode, for good), Cloudinary (photos), Pusher (live orders), iProg SMS (texts), a Google Apps Script relay (email, `docs/email-relay.gs`).

## Source of truth

| File | What it decides |
|---|---|
| `docs/screens-and-routes.md` | The 29 screens, their URLs and layouts |
| `docs/wireframes/` | What each screen shows and does (`png/`, `.svg`, `Wireframes.pdf`) |
| `docs/design/navigation.md` | Where every button and link goes |
| `docs/design/brand.md` | The look: colours, fonts, flourishes, loading and feedback, mobile, kitchen, photo credits |
| `docs/styling.md`, `docs/project-structure.md`, `docs/packages.md` | Theme, file layout, the only libraries we use |
| `docs/testing.md` | Playwright tests |
| `docs/api.md` | Every endpoint, SMS and email behaviour |
| `docs/progress.md` | Screen status and every deliberate change from the wireframes |
| `backend/README.md` | Backend setup, env vars, migrations, integrations |

Screens keep their URL, buttons, links and the data in `docs/api.md`. The look is ours to polish.

## Design direction

Keep the current look: charcoal, gold, cream and red; Playfair Display, Montserrat and Great Vibes; plus the gold flourishes, loaders, dialogs and toasts in `brand.md`. **Polish only, no redesigns.** Show a mockup in chat before any visual round. The Impeccable skill (`.claude/skills/impeccable`, untracked) is for audits and polish; the `mobile-app-ui-design` skill is installed at user level.

## How to work

- **Start from `origin/main`.** Run `git fetch` first. The main checkout at `C:\dev\table-reservation` may be behind: read from `origin/main` and never switch branches in it or change it.
- **One worktree per PR** (`git worktree add ../tr-<name> -b <branch> origin/main`), removed when done (`git worktree remove`).
- **One PR at a time**, on `frontend/<name>`, `backend/<name>` or `docs/<name>`. Never push to `main`, force-push, `reset --hard`, rebase or delete branches.
- **The lead merges** in PowerShell: give them `gh pr merge <n> --merge` (merge commits, never squash). When they say "merged", check the state. Don't merge, close, approve or comment on GitHub without their OK.
- **Bigger rounds:** build shared pieces first, then let parallel agents work on separate files in their own worktrees, merge them with `git merge`, run the checks once, and have a review agent read the diff before the PR. Push a backup tag (`backup/pre-<round>-<date>`) before big visual work.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. PR bodies end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)` and fill in `.github/pull_request_template.md`.
- At a checkpoint, update the Obsidian vault (`C:\SecondBrain\02-Projects\Vencios-Garden-Table-Reservation`: `HANDOFF.md` and a dated note in `Progress/`).

## Checks before a PR

- Frontend, from `frontend/`: `npm run format`, `npm run build`, `npm run lint` (0 warnings), `npm run test:e2e`. Read both the **passed and failed** counts in the summary. The tests run in sample mode (`VITE_USE_SAMPLE=true`) on port 5174; if that port is taken, change it in `playwright.config.ts` locally and never commit that.
- Show changed screens in the browser preview: 390 × 844 and 1440 × 900 (customer 01–07 at both, table 08–12 at 390, staff and admin 13–29 at 1440 plus a phone).
- Backend: `php -l` on changed files, and curl tests in a **throwaway** Docker project, never the lead's running containers.

## Safety

- Never paste or ask for secrets, and never put keys in the frontend (everything `VITE_` is public). `PUSHER_SECRET` never goes on Vercel.
- Never type the production password: the lead logs in themself.
- Never import `seed.sql` into production, and never run Reset DB.
- Temporary changes to `backend/.env` get restored.
- `backend/database/schema.sql` is the frozen baseline read by migration 001: schema changes go in a new numbered migration (`backend/app/migrations/00N_*.php`).

## Code rules

- TypeScript function components, one per file, `export default`. Import with `@/`.
- Tailwind classes only, theme colours from `src/index.css` (no hex in TSX).
- No explanatory comments. A known limit gets one line: `// shortcut: <the limit>, <when to upgrade>`.
- Screens get data only through `frontend/src/services/`; each service function has a sample branch (`sampleData.ts`, field names from the ERD) and a live branch (`api`, endpoint from `docs/api.md`).
- Labels on every field and accessible names on buttons, so Playwright finds them by role. Tap targets are at least 44px on touch (`pointer-coarse:min-h-11`).
- No new app packages without asking (any `@fontsource/*` font is fine).

## Decisions not to reopen

- PayMongo stays in test mode.
- Android is tested by emulation only.
- SMS goes through iProg when `IPROG_SMS_TOKEN` is set; no token or `SMS_MODE=fake` means fake (logged only). The switch stays a Render env var, no admin toggle. No custom sender name (₱3,000), so Smart and TNT guests rely on email.
- Booking emails go through the Apps Script relay; the 2-hour reminder is SMS only. No per-message toggles in admin.
- The old skills `/build-screen`, `/check-my-work` and `/e2e` and the file `LEAD-REVIEW.md` were written for Christina. They still work but speak to a beginner.
