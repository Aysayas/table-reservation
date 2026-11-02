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
| 01 | Home | 🟦 | Her mockup with all approved extras, phone and laptop. Real dining-room photo in; dish photos still placeholders. Footer is now the shared `SiteFooter`. Photos and the logo saved locally by the API (`/uploads/...`) now load on every screen through `fileUrl()` in the services |
| 02 | Menu | 🟦 | Phone and laptop. Popular plus one section per category, search, category buttons (sticky on phones), QR note. Popular shows the recommended dishes. Lead-approved extras: Home / Menu breadcrumb, "Our Menu" with "Kain na!", Max price slider and Best Seller tag with Clear filters |
| 03 | Reserve a Table | 🟦 | Phone and laptop. Pre-fills date, time and guests from Home. Booking pretends to succeed and opens `/reserve/payment?code=RSV-…` for screen 04. Reschedule mode (`/reserve?reschedule=RSV-…`, the lead's decision on #75): guests fixed from the booking, new date and time, moves the booking and opens 05. Mobile Number is the fixed +63 field (10 digits, pasted 0/63/+63 numbers cleaned, sent as 09…). When no time is free for the chosen guests (for example more than the biggest table), it says so and gives the phone number. Keeps choices and draft on refresh; clear API-failure, not-found and big-group states |
| 04 | Deposit Payment | 🟦 | Phone and laptop. Loads the booking from `?code=` with `getReservationByCode`; Pay pretends to succeed and opens screen 05. Sample `deposit_per_guest` is ₱100 (lead's note on #104); new bookings pay ₱100 per guest. A paid, cancelled or no-show booking shows a message and View Reservation instead of Pay |
| 05 | Reservation Confirmation | 🟦 | Phone and laptop with all approved extras (Save pass was declined), the charcoal ticket card, red "reserved." and Home's footer. Heading and deposit label follow the API: cancelled and no-show bookings say so, and an unpaid deposit shows as Deposit Due |
| 06 | Find Reservation | 🟦 | Phone and laptop. Find by code and mobile, Cancel (asks first), Reschedule opens 03 in reschedule mode with the mobile filled in. Mobile Number is the fixed +63 field (10 digits, pasted 0/63/+63 numbers cleaned, sent as 09…). A failed lookup (for example too many tries) now shows an error message |
| 07 | About Us | 🟦 | Final mockup with the approved extras (hero buttons, 4 values, new story text, Home's footer), phone and laptop. The restaurant's own photos are in |
| 08 | Table Menu | 🟦 | Phone width. Table pill and cart count in the top bar, search, categories, Recommended for You, + Add, View Cart bar. Cart kept in sessionStorage (zustand); QR token `?t=` saved for screen 11. Recommended for You now comes from `getRecommendations()` (cart dishes sent, up to 4) |
| 09 | Item Details | 🟦 | Phone width. Photo, name, price, description, quantity 1–99, notes up to 255, Often Ordered With (same category for now), Add to Cart opens 10. Often Ordered With comes from `getRecommendations` (like `GET /recommendations`) |
| 10 | Cart | 🟦 | Phone width. Lines with note, − / + (1–99), Remove, You Might Also Like (recommended, not in the cart), Subtotal, Service Charge from settings, Total, Proceed to Checkout. Empty cart links to the menu. You Might Also Like comes from `getRecommendations` with the cart dishes. A dish that became unavailable is flagged in red and blocks Proceed to Checkout and Place Order |
| 11 | Checkout | 🟦 | Phone width. Order Summary and Total, Pay Now or Pay at the Counter, optional name (60), Place Order via `createOrder` with the table QR token; Pay Now pretends to pay until the API is live; then opens 12 with `?order=`. Trying again after a failed Pay Now reuses the same order instead of making a new one |
| 12 | Order Status | 🟦 | Phone width. Order number and time, Received → Preparing → Ready → Served, Your Items and Total, Payment, Order More. Loads `?order=` with the table QR token and checks again every 15 s until real-time updates exist |
| 13 | Staff Login | 🟦 | Approved subtitle and show-password button are in #51. Login pretends to succeed until the API is live |
| 14 | Staff Dashboard | 🟦 | 1440 × 900. New charcoal sidebar and top bar (shared by staff and admin, page title from the sidebar item), 4 numbers, Upcoming Reservations, Active Orders, View all links. Sample data now has bookings for today and 2 more active orders. The staff and admin layout now checks the signed-in role: kitchen users go to `/kitchen`, staff users opening `/admin` go to `/staff`. The name and avatar in the top bar load again after the login token is refreshed |
| 15 | Today's Reservations | 🟦 | 1440 × 900. Search (all days), Day (Today / Upcoming / Past / Cancelled) and Status filters, 9 columns, Arrived / No-show / Assign Table with the API's rules, 8 per page |
| 16 | Table Status | 🟦 | 1440 × 900. Filters with counts, a card per table: Available, Occupied (order, seated time, View Order), Reserved (next booking, Mark Arrived). Sample tables now match the bookings and orders. Free Table on occupied tables with nothing left to serve or pay (lead-approved). An available table with an open order shows as Occupied with the order and View Order. Sample T9 (8 seats, available) added, as in `seed.sql` |
| 17 | Orders and Payments | 🟦 | 1440 × 900. All / Unpaid / Paid, order list, detail with items and totals, Cash Received and Change, Mark as Paid (Cash), Print Receipt (her 80 mm receipt design, print only). All and Paid show today's orders (`date_from` = today); Unpaid shows every unpaid order |
| 18 | Kitchen Display | 🟦 | 1440 × 900 (also stacks on tablet and phone). Received, Preparing and Ready columns with counts, order cards with table, order number, waiting time chip, items and notes, Start Preparing → Mark Ready → Mark Served, clock, Log Out (her kitchen design). Log Out now signs out (calls `logout()` like `DashboardLayout`) |
| 19 | Admin Dashboard | 🟦 | 1440 × 900. Sales Today, Orders Today, Reservations Today, No-show Rate, Sales (Last 7 Days) line chart (recharts), Best Sellers top 5, Recent Orders with View all to 25. Six past sample orders added for the chart |
| 20 | Menu Management | 🟦 | 1440 × 900. Search, All Categories filter, + Add Menu Item to 21, table with image (icon if none), name, category, price, Available switch, Edit to 21, Delete (asks first; an ordered dish shows the 409 message), 8 a page with Showing and page buttons |
| 21 | Add / Edit Menu Item | 🟦 | 1440 × 900. `/admin/menu/new` and `/admin/menu/:id/edit`: Menu / Add (Edit) Menu Item breadcrumb, Item Name, Category, Price (₱), Description, Available and Show in Recommendations switches, Photo (drag or Upload Photo, JPG or PNG up to 2 MB, preview), Save Item and Cancel back to 20. Page title per route; Menu stays highlighted. Saving again after a failed photo upload updates the same item instead of adding a copy |
| 22 | Categories | 🟦 | 1440 × 900. Table with Order, Category Name, Items (dish count) and Edit / Delete; Add Category card with Category Name, Display Order (next number filled in) and Save Category. Edit uses the same card (Edit Category, Cancel Edit). Names are unique; Delete asks first and keeps a category that still has dishes (the API's 409) |
| 23 | Tables and QR Codes | 🟦 | 1440 × 900. "N tables", Print All QR, + Add Table; a card per table with its QR (`qrcode.react`, opens `/table/{id}?t={qr_token}`), seats, Download (PNG), Print (that table only), Edit, Delete. Add / Edit dialog with Table Number and Seats (unique number, 1–50, not below a booking); Delete asks first and keeps a table with orders or bookings |
| 24 | Reservations | 🟦 | 1440 × 900. Search, Upcoming / Today / Past / Cancelled tabs, table with Ref Code, Date, Time, Name, Guests, Table, Status, 8 a page. Edit on pending and confirmed bookings (Date, Time, Guests, Table, like `PUT /reservations/{id}`), plus the same status actions as screen 15. Reservation Settings moved to screen 29 |
| 25 | Order History | 🟦 | 1440 × 900. Search (order # or table), Date Range, All Status, All Payments, Clear filters, Export (CSV made in the browser); table with Order #, Date and time, Table, Items, Total, Payment, Method, Status, View (order details window); 8 a page |
| 26 | Payments | 🟦 | 1440 × 900. Total Collected, Online, Cash and Deposits cards (paid only, in the date range); Search (PAY-ID, order #, ref code, reference), Date Range, All Methods, All Status, Clear filters; table with Payment ID, Date, For (order or deposit), Method, Reference, Amount, Status; 8 a page |
| 27 | Reports | 🟦 | 1440 × 900. Daily / Weekly / Monthly with From – To (defaults: 7 days, 8 weeks, 6 months), Export PDF (print, report only); Sales Over Time line chart, Best-Selling Items top 10, Reservations per Day, Summary (Total Sales, Total Orders, Average Order Value, Reservations, No-shows, Busiest Hour) |
| 28 | Staff Accounts | 🟦 | 1440 × 900. Search (name or email), All Roles, + Add Staff; table with Name, Email, Role, Status (Active / Disabled), Last Login, Actions (Edit, plus Disable or Enable; your own row has only Edit). Add / Edit window: Full Name, Email, Role (locked on your own account), Password (optional on Edit). No Delete button (not in the wireframe) |
| 29 | Settings | 🟦 | 1440 × 900. Restaurant Information: Restaurant Name, Address, Contact Number (MobileInput, +63, saved as `0918 957 2855`), Email, Facebook Page, Logo preview with Upload Logo (PNG or JPG up to 2 MB, sent on save). Opening Hours: Monday to Sunday with open and close times and an open switch, note "Toggle off to mark a day as closed." Reservation Settings (moved from screen 24): Opening Time for Booking, Time Slot Length, Max Guests, Require Deposit, Deposit Amount per guest. One Save Changes saves all three cards (`PUT /settings`, `PUT /opening-hours`, `POST /settings/logo`) |

## Customer accounts (lead, not in the wireframes)

| Screen | Status |
|---|---|
| Log In `/login` | 🟦 |
| Create an Account `/register` | 🟦 |
| Forgot Password `/forgot-password` | 🟦 |
| Reset Password `/reset-password` | 🟦 |
| My Reservations `/my-reservations` | 🟦 |
| Profile `/profile` | 🟦 |

## Changes from the wireframes (lead's decision, 2026-11-01)

These differ from the 29 approved wireframes on purpose, to remove redundant steps and confusing flows:

- **Deposit (04):** no payment method choice, because PayMongo asks for it on the next screen.
- **Home (01):** no Time field in the booking form, and "Find a Table" is now "Check Availability".
- **Reserve (03):** no step indicator.
- **Confirmation (05):** no SMS claims, and the page changes with the booking and deposit status.
- **Accounts:** an account menu in the header, plus Profile `/profile`.
- **Staff login (13) and top bar:** no Remember me, and no top bar menu.
- **Staff (15, 16, 17):** Cancel, Undo No-show, Change Table, Seat Guests and Free Table added. An order must be picked before taking payment.
- **Admin (24, 29):** Reservation Settings moved from 24 to 29, and 24 gets search and status actions.
- **Reservations (15, 24):** an Added column shows when each booking was made.

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
| 03 | Reserve a Table | ✅ | `GET /reservations/availability`, `POST /reservations`. Keeps choices and draft on refresh; clear API-failure, not-found and big-group states |
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
