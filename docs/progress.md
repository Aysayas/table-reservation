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
| 01 | Home | 🟦 | Her mockup with all approved extras, phone and laptop. Real dining-room photo in; dish photos still placeholders. Footer is now the shared `SiteFooter` |
| 02 | Menu | 🟦 | Phone and laptop. Popular plus one section per category, search, category buttons (sticky on phones), QR note. Popular shows the recommended dishes |
| 03 | Reserve a Table | 🟦 | Phone and laptop. Pre-fills date, time and guests from Home. Booking pretends to succeed and opens `/reserve/payment?code=RSV-…` for screen 04. Reschedule mode (`/reserve?reschedule=RSV-…`, the lead's decision on #75): guests fixed from the booking, new date and time, moves the booking and opens 05 |
| 04 | Deposit Payment | 🟦 | Phone and laptop. Loads the booking from `?code=` with `getReservationByCode`; Pay pretends to succeed and opens screen 05. Shows ₱0.00 until the lead sets `deposit_per_guest` |
| 05 | Reservation Confirmation | 🟦 | Phone and laptop with all approved extras (Save pass was declined), the charcoal ticket card, red "reserved." and Home's footer |
| 06 | Find Reservation | 🟦 | Phone and laptop. Find by code and mobile, Cancel (asks first), Reschedule opens 03 in reschedule mode with the mobile filled in |
| 07 | About Us | 🟦 | Final mockup with the approved extras (hero buttons, 4 values, new story text, Home's footer), phone and laptop. The restaurant's own photos are in |
| 08 | Table Menu | 🟦 | Phone width. Table pill and cart count in the top bar, search, categories, Recommended for You, + Add, View Cart bar. Cart kept in sessionStorage (zustand); QR token `?t=` saved for screen 11 |
| 09 | Item Details | 🟦 | Phone width. Photo, name, price, description, quantity 1–99, notes up to 255, Often Ordered With (same category for now), Add to Cart opens 10 |
| 10 | Cart | 🟦 | Phone width. Lines with note, − / + (1–99), Remove, You Might Also Like (recommended, not in the cart), Subtotal, Service Charge from settings, Total, Proceed to Checkout. Empty cart links to the menu |
| 11 | Checkout | 🟦 | Phone width. Order Summary and Total, Pay Now or Pay at the Counter, optional name (60), Place Order via `createOrder` with the table QR token; Pay Now pretends to pay until the API is live; then opens 12 with `?order=` |
| 12 | Order Status | 🟦 | Phone width. Order number and time, Received → Preparing → Ready → Served, Your Items and Total, Payment, Order More. Loads `?order=` with the table QR token and checks again every 15 s until real-time updates exist |
| 13 | Staff Login | 🟦 | Approved subtitle and show-password button are in #51. Login pretends to succeed until the API is live |
| 14 | Staff Dashboard | 🟦 | 1440 × 900. New charcoal sidebar and top bar (shared by staff and admin, page title from the sidebar item), 4 numbers, Upcoming Reservations, Active Orders, View all links. Sample data now has bookings for today and 2 more active orders |
| 15 | Today's Reservations | 🟦 | 1440 × 900. Search (all days), Day (Today / Upcoming / Past / Cancelled) and Status filters, 9 columns, Arrived / No-show / Assign Table with the API's rules, 8 per page |
| 16 | Table Status | 🟦 | 1440 × 900. Filters with counts, a card per table: Available, Occupied (order, seated time, View Order), Reserved (next booking, Mark Arrived). Sample tables now match the bookings and orders |
| 17 | Orders and Payments | 🟦 | 1440 × 900. All / Unpaid / Paid, order list, detail with items and totals, Cash Received and Change, Mark as Paid (Cash), Print Receipt (her 80 mm receipt design, print only) |
| 18 | Kitchen Display | 🟦 | 1440 × 900 (also stacks on tablet and phone). Received, Preparing and Ready columns with counts, order cards with table, order number, waiting time chip, items and notes, Start Preparing → Mark Ready → Mark Served, clock, Log Out (her kitchen design) |
| 19 | Admin Dashboard | 🟦 | 1440 × 900. Sales Today, Orders Today, Reservations Today, No-show Rate, Sales (Last 7 Days) line chart (recharts), Best Sellers top 5, Recent Orders with View all to 25. Six past sample orders added for the chart |
| 20 | Menu Management | 🟦 | 1440 × 900. Search, All Categories filter, + Add Menu Item to 21, table with image (icon if none), name, category, price, Available switch, Edit to 21, Delete (asks first; an ordered dish shows the 409 message), 8 a page with Showing and page buttons |
| 21 | Add / Edit Menu Item | 🟦 | 1440 × 900. `/admin/menu/new` and `/admin/menu/:id/edit`: Menu / Add (Edit) Menu Item breadcrumb, Item Name, Category, Price (₱), Description, Available and Show in Recommendations switches, Photo (drag or Upload Photo, JPG or PNG up to 2 MB, preview), Save Item and Cancel back to 20. Page title per route; Menu stays highlighted |
| 22 | Categories | 🟦 | 1440 × 900. Table with Order, Category Name, Items (dish count) and Edit / Delete; Add Category card with Category Name, Display Order (next number filled in) and Save Category. Edit uses the same card (Edit Category, Cancel Edit). Names are unique; Delete asks first and keeps a category that still has dishes (the API's 409) |
| 23 | Tables and QR Codes | ⬜ | |
| 24 | Reservations | ⬜ | |
| 25 | Order History | ⬜ | |
| 26 | Payments | ⬜ | |
| 27 | Reports | ⬜ | |
| 28 | Staff Accounts | ⬜ | |
| 29 | Settings | ⬜ | |

## Backend progress

Updated 2026-10-25. Full endpoint details are in [api.md](api.md). Every screen keeps using `sampleData.ts` until the lead deploys the backend and says the API is live. ✅ means the endpoint is ready for that switch.

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
| 04 | Deposit Payment | ✅ | `GET /reservations/code/{code}`, `POST /reservations/code/{code}/deposit` (PayMongo checkout) |
| 05 | Reservation Confirmation | ✅ | `GET /reservations/code/{code}` |
| 06 | Find Reservation | ✅ | `POST /reservations/find`, `/cancel`, `/reschedule` |
| 07 | About Us | ✅ | `GET /settings`, `/opening-hours` |
| 08 | Table Menu | ✅ | `GET /menu-items`, `GET /tables/{id}` |
| 09 | Item Details | ✅ | `GET /menu-items/{id}` |
| 10 | Cart | ✅ | No API needed. The cart stays in the browser |
| 11 | Checkout | ✅ | `POST /orders`, `POST /orders/{id}/pay` (PayMongo checkout) |
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
| Payment gateway | ✅ PayMongo (test mode), deposits and order payments |
| SMS notification | 🟨 built in fake mode (texts logged, reminders scheduled); no provider yet |
| Real-time messaging (kitchen and order status) | ✅ Pusher: backend sends events; screens 12, 17, 18 subscribe with `pusher-js` |
| Cloud storage (menu and logo images) | ✅ Cloudinary (local disk without keys) |
| Recommendation engine | ✅ Python service (`recommender/`) behind `GET /recommendations`, with a fallback when it sleeps |

### Deployment

| Item | Status |
|---|---|
| Render Blueprint (`render.yaml`) | ✅ written, not deployed yet |
| Hosted MySQL with SSL | ⬜ |
| MySQL time zone set to Asia/Manila | ✅ set on every connection from `APP_TIMEZONE` |
| Real client address behind Render's proxy (for the login limit) | ⬜ |
