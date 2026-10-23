# Screen progress

| Status | Meaning |
|---|---|
| ⬜ Not started | Still a placeholder |
| 🟨 In progress | Being built |
| 🟦 Ready for review | Built, all checks pass, waiting for the lead |
| ✅ Done | Lead approved |

Change the status when you start, finish, or get approval. Claude updates it too.

## Suggested order

Start with simple screens to learn, then the forms, then the bigger flows:

1. **Warm-up (just text and layout):** 07 About Us, 05 Reservation Confirmation, 13 Staff Login
2. **Customer pages:** 01 Home, 02 Menu, 06 Find Reservation, 03 Reserve a Table, 04 Deposit Payment
3. **QR ordering flow:** 08 Table Menu, 09 Item Details, 10 Cart, 11 Checkout, 12 Order Status
4. **Staff and kitchen:** 14, 15, 16, 17, 18
5. **Admin:** 19 to 29

## Screens

| # | Screen | Status | Notes |
|---|---|---|---|
| 01 | Home | 🟨 | |
| 02 | Menu | ⬜ | |
| 03 | Reserve a Table | ⬜ | |
| 04 | Deposit Payment | ⬜ | |
| 05 | Reservation Confirmation | 🟦 | Still the old green look; needs the new look and a laptop layout |
| 06 | Find Reservation | ⬜ | |
| 07 | About Us | 🟦 | Phone and laptop layouts done with all approved extras. Real restaurant photo still to come (stock photo for now) |
| 08 | Table Menu | ⬜ | |
| 09 | Item Details | ⬜ | |
| 10 | Cart | ⬜ | |
| 11 | Checkout | ⬜ | |
| 12 | Order Status | ⬜ | |
| 13 | Staff Login | 🟦 | Subtitle and show-password button waiting for the lead (LEAD-REVIEW.md). Login pretends to succeed until the API is live |
| 14 | Staff Dashboard | ⬜ | |
| 15 | Today's Reservations | ⬜ | |
| 16 | Table Status | ⬜ | |
| 17 | Orders and Payments | ⬜ | |
| 18 | Kitchen Display | ⬜ | |
| 19 | Admin Dashboard | ⬜ | |
| 20 | Menu Management | ⬜ | |
| 21 | Add / Edit Menu Item | ⬜ | |
| 22 | Categories | ⬜ | |
| 23 | Tables and QR Codes | ⬜ | |
| 24 | Reservations | ⬜ | |
| 25 | Order History | ⬜ | |
| 26 | Payments | ⬜ | |
| 27 | Reports | ⬜ | |
| 28 | Staff Accounts | ⬜ | |
| 29 | Settings | ⬜ | |

## Backend progress

Updated 2026-10-22. Full endpoint details are in [api.md](api.md). Every screen keeps using `sampleData.ts` until the lead deploys the backend and says the API is live. ✅ means the endpoint is ready for that switch.

| Status | Meaning |
|---|---|
| ✅ | Endpoint works. Switch the service to it once the API is live |
| 🟨 | Partly works: reads work, saves or payments don't yet |
| ⬜ | Not built yet (the route answers 501) |

### API per screen

| # | Screen | API | Endpoints |
|---|---|---|---|
| 01 | Home | ✅ | `GET /menu-items`, `/settings`, `/opening-hours` |
| 02 | Menu | ✅ | `GET /categories`, `/menu-items` |
| 03 | Reserve a Table | ✅ | `GET /reservations/availability`, `POST /reservations` |
| 04 | Deposit Payment | 🟨 | `GET /reservations/code/{code}` works; paying waits for the payment gateway |
| 05 | Reservation Confirmation | ✅ | `GET /reservations/code/{code}` |
| 06 | Find Reservation | ✅ | `POST /reservations/find`, `/cancel`, `/reschedule` |
| 07 | About Us | ✅ | `GET /settings`, `/opening-hours` |
| 08 | Table Menu | ✅ | `GET /menu-items`, `GET /tables/{id}` |
| 09 | Item Details | ✅ | `GET /menu-items/{id}` |
| 10 | Cart | ✅ | No API needed. The cart stays in the browser |
| 11 | Checkout | 🟨 | `POST /orders` works; `/orders/{id}/pay` waits for the payment gateway |
| 12 | Order Status | ✅ | `GET /orders/{id}` |
| 13 | Staff Login | ✅ | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| 14 | Staff Dashboard | ✅ | `GET /dashboard/staff` |
| 15 | Today's Reservations | ✅ | `GET /reservations`, `PATCH /reservations/{id}/status` |
| 16 | Table Status | ✅ | `GET /tables`, `PATCH /tables/{id}/status` |
| 17 | Orders and Payments | ✅ | `GET /orders`, `PATCH /orders/{id}/status`, `POST /payments` |
| 18 | Kitchen Display | ✅ | `GET /orders`, `PATCH /orders/{id}/status` |
| 19 | Admin Dashboard | ✅ | `GET /dashboard/admin` |
| 20 | Menu Management | ✅ | `GET /menu-items`, `PATCH /menu-items/{id}/availability`, `DELETE /menu-items/{id}` |
| 21 | Add Edit Menu Item | ✅ | `POST`/`PUT /menu-items`, `POST /menu-items/{id}/image` |
| 22 | Categories | ✅ | `GET`/`POST /categories`, `PUT`/`DELETE /categories/{id}` |
| 23 | Tables and QR Codes | ✅ | `GET`/`POST /tables`, `PUT`/`DELETE /tables/{id}` |
| 24 | Reservations | ✅ | `GET /reservations?view=`, `PUT /reservations/{id}`, `PUT /settings` (reservation fields) |
| 25 | Order History | ✅ | `GET /orders?page=` (search, dates, status, payment); export is a CSV made in the browser |
| 26 | Payments | ✅ | `GET /payments`, `GET /payments/{id}` |
| 27 | Reports | ✅ | `GET /reports`; Export PDF is the browser's print |
| 28 | Staff Accounts | ✅ | `GET`/`POST /users`, `PUT`/`DELETE /users/{id}` |
| 29 | Settings | ✅ | `GET`/`PUT /settings`, `POST /settings/logo`, `GET`/`PUT /opening-hours` |

Every staff, kitchen and admin route already checks the login token and role, so it answers 401 or 403 before 501.

### Foundation

| Part | Status |
|---|---|
| Database tables and seed data (`backend/database/`) | ✅ |
| One model per table (`backend/app/models/`) | ✅ |
| Login with tokens, roles (staff, kitchen, admin) | ✅ |
| Database test pages (`/dev/db`, development only) | ✅ |
| Database migrations | ⬜ planned for the last dev PR, before production |

### Integrations

| Integration | Status |
|---|---|
| Payment gateway | ⬜ provider not chosen (needed for deposit and order payment) |
| SMS notification | ⬜ provider not chosen |
| Real-time messaging (kitchen and order status) | ⬜ |
| Cloud storage (menu and logo images) | ⬜ |
| Recommendation engine | ⬜ approach not decided |

### Deployment

| Item | Status |
|---|---|
| Render Blueprint (`render.yaml`) | ✅ written, not deployed yet |
| Hosted MySQL with SSL | ⬜ |
| MySQL time zone set to Asia/Manila | ✅ set on every connection from `APP_TIMEZONE` |
| Real client address behind Render's proxy (for the login limit) | ⬜ |
