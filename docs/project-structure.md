# Project structure

```
table-reservation/
├── README.md                 Start here
├── guides/frontend/          Frontend developer guide (Taglish)
├── docs/                     Technical guides
├── render.yaml               Render deploy settings for the backend
├── backend/                  LavaLust API (lead), see backend/README.md
│   ├── app/                  Routes, controllers, models, config
│   ├── database/schema.sql   All tables from the ERD
│   └── docker/               Docker and Render server config
├── .github/                  Code owners and pull request template
└── frontend/
    ├── .env.example          Copy to .env.local
    ├── .prettierrc.json      Formatting rules
    ├── index.html            Page shell
    ├── vite.config.ts        Vite, Tailwind and the @ shortcut
    ├── playwright.config.ts  Browser test settings
    ├── e2e/                  Playwright tests
    ├── public/               Files served as-is (favicon, sitemap.xml later)
    └── src/
        ├── main.tsx          Starts React, the router, React Query and pop-up messages
        ├── router.tsx        Every URL and the screen it shows
        ├── index.css         Tailwind import and base styles
        ├── env.d.ts          Types for VITE_ settings
        ├── components/       Pieces reused on several screens
        ├── hooks/            Custom React hooks
        ├── layouts/
        │   ├── CustomerLayout.tsx    Mobile frame for screens 01-12
        │   └── DashboardLayout.tsx   Sidebar for staff and admin screens
        ├── lib/
        │   ├── api.ts        axios client for the backend
        │   └── queryClient.ts  React Query settings
        ├── pages/
        │   ├── Placeholder.tsx   Stand-in for screens not built yet
        │   ├── customer/     01-07
        │   ├── table/        08-12
        │   ├── staff/        13-17
        │   ├── kitchen/      18
        │   └── admin/        19-29
        ├── services/         Backend calls grouped by feature
        ├── stores/           zustand stores for shared state
        └── types/            Shared TypeScript types
```

Empty folders hold a `.gitkeep` file so Git keeps them. Delete it once the folder has real files.

## Where new code goes

| You are adding | Put it in | Example |
|---|---|---|
| A full screen | `src/pages/<area>/` | `src/pages/customer/Home.tsx` |
| A piece reused on several screens | `src/components/` | `src/components/MenuItemCard.tsx` |
| A page frame (header, sidebar) | `src/layouts/` | `src/layouts/CustomerLayout.tsx` |
| Backend calls for one feature | `src/services/` | `src/services/reservations.ts` |
| A custom hook | `src/hooks/` | `src/hooks/useMenuItems.ts` |
| State shared across screens | `src/stores/` | `src/stores/cartStore.ts` |
| Shared TypeScript types | `src/types/` | `src/types/menu.ts` |
| A browser test | `e2e/` | `e2e/customer-03-reserve-a-table.spec.ts` |

## The @ shortcut

`@/` means `src/`, so imports look the same from any folder:

```tsx
import { api } from '@/lib/api'
import MenuItemCard from '@/components/MenuItemCard'
```

## Naming

- Components and pages: `PascalCase.tsx` (`ReserveTable.tsx`)
- Hooks: `useSomething.ts` (`useCart.ts`)
- Stores: `somethingStore.ts` (`cartStore.ts`)
- Everything else: `camelCase.ts` (`formatPrice.ts`)
- Tests: `area-NN-short-name.spec.ts` in `e2e/` (area is `customer`, `table`, `staff` or `admin`; see `testing.md`)
- One component per file, exported as `default`
