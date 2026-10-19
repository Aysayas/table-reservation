# Table Reservation and QR Menu Ordering System

A table reservation and QR menu ordering system with menu recommendations.

| Part | Folder | Stack | Status |
|---|---|---|---|
| Frontend | [`frontend/`](frontend/) | React, TypeScript, Vite, Tailwind CSS, React Router, axios | Set up; screens are placeholders |
| Backend | [`backend/`](backend/) | LavaLust (PHP) JSON API, MySQL | Lead adds from template |

## Quick start (frontend)

```bash
git clone https://github.com/Aysayas/table-reservation.git
cd table-reservation/frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Building the frontend with Claude

- **Frontend developer:** start with the [frontend guide](guides/frontend/) (Taglish, step by step).
- **Progress:** [docs/progress.md](docs/progress.md) tracks all 29 screens.
- **Lead:** check [LEAD-REVIEW.md](LEAD-REVIEW.md) for requests that need your approval.
- **Claude's rules:** [CLAUDE.md](CLAUDE.md) (read automatically by Claude), plus the `/build-screen` and `/check-my-work` commands in `.claude/skills/`.
- **Wireframes:** [docs/wireframes/](docs/wireframes/), one SVG per screen plus the full PDF.

## Guides

Read these in order if you are new to the project:

1. [Getting started](docs/getting-started.md): install the tools and run the app
2. [Project structure](docs/project-structure.md): where things live
3. [Screens and routes](docs/screens-and-routes.md): all 29 screens and their URLs
4. [Building a screen](docs/building-a-screen.md): turning a placeholder into a real page
5. [Styling rules](docs/styling.md): Tailwind, black and white, placeholder content
6. [Calling the API](docs/api.md): talking to the LavaLust backend
7. [Packages](docs/packages.md): what each installed library is for
8. [Testing](docs/testing.md): Playwright browser tests

## Design references

- [`docs/wireframes/`](docs/wireframes/): all 29 screens (SVG each, plus `Wireframes.pdf`)
- [`docs/design/Sitemap.pdf`](docs/design/Sitemap.pdf): sitemap and use case diagram
- [`docs/design/ERD.pdf`](docs/design/ERD.pdf): database design

## Working together

- `main` always works. Nobody pushes to it directly.
- Everyone pushes their own branches here and opens a pull request. Nobody pushes to `main` directly; only the lead merges.
- One branch and one pull request per screen or feature (`frontend/screen-07-about`).
- GitHub Actions runs the checks on every pull request (`.github/workflows/ci.yml`). Pull requests not opened by the lead fail the **Protected files** check if they change lead-owned files (`backend/`, config, Claude rules).
- The lead reviews and merges. `.github/CODEOWNERS` makes the lead the reviewer for backend, config and Claude files.
- Every pull request uses the checklist in `.github/pull_request_template.md`.
