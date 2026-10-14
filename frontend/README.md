# Frontend

React + TypeScript app built with Vite. Full guides are in [`../docs/`](../docs/).

## Commands

| Command                   | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm install`             | Install dependencies (run once, and after pulling changes to `package.json`) |
| `npm run dev`             | Start the dev server at http://localhost:5173                                |
| `npm run build`           | Type-check and build for production into `dist/`                             |
| `npm run preview`         | Serve the production build locally                                           |
| `npm run lint`            | Check the code with oxlint                                                   |
| `npm run format`          | Format all files with Prettier                                               |
| `npm run test:e2e`        | Run the Playwright browser tests                                             |
| `npm run test:e2e:ui`     | Open Playwright's visual test runner                                         |
| `npm run test:e2e:report` | Open the report from the last test run                                       |

Before you share your work, run `npm run format`, `npm run build`, `npm run lint` and `npm run test:e2e`. All must pass.

## Environment

Copy `.env.example` to `.env.local` and set `VITE_API_URL` to the backend address. `.env.local` is ignored by Git, so each person keeps their own.
