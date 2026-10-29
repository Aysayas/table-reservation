# Calling the API

The frontend talks to the LavaLust (PHP) backend in `backend/`, which returns JSON. Every endpoint lives under `/api`. Running it locally needs Docker; see `backend/README.md`.

## Setting the backend address

In `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000/api
VITE_USE_SAMPLE=true
```

`VITE_USE_SAMPLE=true` makes every service return `src/services/sampleData.ts` (daily work and the Playwright tests, which always run this way on port 5174). `false` makes the services call `VITE_API_URL`: local Docker (`http://localhost:8000/api`) or, on purpose, the live API (`https://vencios-api.onrender.com/api`, which writes to the real database). Restart `npm run dev` after changing it. Only settings that start with `VITE_` reach the browser, and anything in them is public, so **never put API keys or passwords in the frontend**. Keys for payments, SMS, storage and real-time messaging belong in the backend.

## Making requests

Always use the shared client in `src/lib/api.ts`. It adds the backend address and the staff login token for you.

```tsx
import { api } from '@/lib/api'

const { data } = await api.get('/menu-items')
await api.post('/reservations', { name, mobile, date, time, pax })
await api.put(`/menu-items/${id}`, item)
await api.delete(`/menu-items/${id}`)
```

Group calls for one feature in a file under `src/services/`:

```ts
// src/services/reservations.ts
import { api } from '@/lib/api'

export async function createReservation(input: NewReservation) {
  const { data } = await api.post('/reservations', input)
  return data
}
```

## Loading and errors

Every screen that loads data should show a loading state and an error message:

```tsx
const [items, setItems] = useState<MenuItem[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
  api.get('/menu-items')
    .then((res) => setItems(res.data))
    .catch(() => setError('Could not load the menu.'))
    .finally(() => setLoading(false))
}, [])
```

## Staff login

After a successful login, save the token so later requests send it:

```ts
import { api, setToken } from '@/lib/api'

const { data } = await api.post('/auth/login', { email, password })
setToken(data.access_token)
```

Call `setToken(null)` on Log Out.

## Building before the backend exists

Screens never call the API directly. They call a function in `src/services/`, which has both branches:

```ts
export async function getMenuItems(category_id?: number) {
  if (USE_SAMPLE) {
    return sampleMenuItems.filter((m) => category_id === undefined || m.category_id === category_id)
  }
  const res = await api.get('/menu-items', { params: { category_id } })
  return res.data.data
}
```

- Sample data lives in `src/services/sampleData.ts`, typed by `src/types/db.ts`. Keep it shaped like the API responses, since the tests run on it.
- Field names match the database exactly. The API already sends numbers and true/false typed like `db.ts`, so no `Number()` conversions.
- A new service function gets both branches. Error messages from the API (`{ "error": "..." }`) reach the screen as `error.message`, so `toast.error(e.message)` shows the API's own text.
- Login stores the tokens; a 401 refreshes once through `/auth/refresh`, then sends staff and admin pages to `/staff/login`.

## Agree with the backend team on

## Endpoints that exist now

| Method | URL | Returns |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` when the API is up |
| GET | `/health/db` | `{ "status": "ok", "database": "connected" }`, or 503 if the database is down |
| GET | `/categories` | `{ "data": Category[] }` by `sort_order`, each with `item_count` (its number of menu items). Screens 02, 08, 20, 22 |
| GET | `/menu-items` | `{ "data": MenuItem[] }`. Optional filters `?category_id=1&is_available=1`; a non-number gives 422. Screens 01, 02, 08, 20 |
| GET | `/menu-items/{id}` | `{ "data": MenuItem }`, or 404. Screens 09, 21 |
| GET | `/recommendations` | Optional `item_ids` (comma separated, up to 50) and `limit` (1–12, default 4). `{ "data": MenuItem[], "meta": { "source" } }`. With `item_ids` (the cart, or the table's order) it suggests dishes often ordered together with them; without, the most-ordered dishes. Only available items with `is_recommended` true, never the ones you sent. `source` is `together`, `popular`, `flagged` (no orders yet) or `fallback` (the recommendation service was asleep: best sellers, then flagged items). Answers within about 2 seconds even when the service is asleep. 422 for bad input, 429 after 60 a minute. Screens 01, 02 (no items), 08 ("Recommended for You"), 10 ("You Might Also Like") |
| POST | `/categories` | Admin. Body `name` (required, up to 50, unique) and `sort_order` (optional whole number, 0 or more; default is one after the last). 201 `{ "data": Category }`, 422 with `errors`. Screen 22 |
| PUT | `/categories/{id}` | Admin. Body `name` and optional `sort_order` (kept if left out). Same checks. `{ "data": Category }`, 404 or 422. Screen 22 |
| DELETE | `/categories/{id}` | Admin. `{ "data": { "message": "Deleted" } }`. 409 while it still has menu items, 404 if missing. Screen 22 |
| POST | `/menu-items` | Admin. Body `category_id` (an existing category), `name` (required, up to 100), `price` (number, 0 to 99999999.99), `description` (optional, up to 1000), `is_available` and `is_recommended` (optional true or false, default true). 201 `{ "data": MenuItem }`, 422 with `errors`. Screen 21 |
| PUT | `/menu-items/{id}` | Admin. Same body and checks as adding; `is_available` and `is_recommended` keep their values if left out. Doesn't change the photo. `{ "data": MenuItem }`, 404 or 422. Screen 21 |
| PATCH | `/menu-items/{id}/availability` | Admin. Body `{ "is_available": true }`. `{ "data": MenuItem }`, 404 or 422. Screen 20 |
| POST | `/menu-items/{id}/image` | Admin. Multipart form with a `photo` file: JPG or PNG, up to 2 MB. Sets `image_url` to a full Cloudinary address (`https://res.cloudinary.com/...`) on the deployed API, or to `/uploads/menu/<random>.jpg` locally without Cloudinary keys (served by the backend; put the API's host in front, without `/api`). Use `image_url` as it is when it starts with `https://`. Removes the old photo. `{ "data": MenuItem }`, 404, 422 with the reasons, or 502 if Cloudinary is down. Save the item first, then upload. Screen 21 |
| DELETE | `/menu-items/{id}` | Admin. Deletes the item and its photo: `{ "data": { "message": "Deleted" } }`. 409 if it has ever been ordered (mark it unavailable instead), 404 if missing. Screen 20 |
| GET | `/settings` | `{ "data": RestaurantSettings }`, including `slot_minutes`, `max_pax`, `deposit_required` and `booking_open_time` (`"10:00:00"` or `null`). Screens 01, 07, 24, 29 |
| GET | `/opening-hours` | `{ "data": OpeningHours[] }`, all 7 days, `day_of_week` 0 to 6. Screens 01, 07, 29 |
| POST | `/auth/login` | Body `{ "email", "password" }`. `{ "data": { access_token, refresh_token, expires_in, token_type, user } }`. 401 for a wrong email or password, 422 with an `errors` list if a field is missing or the email is invalid, 429 after 10 tries a minute. 403 "This account is disabled" for a disabled account with the right password. Sets the user's `last_login_at`. Screen 13 |
| POST | `/auth/refresh` | Body `{ "refresh_token" }`. Same shape as login, with a new pair of tokens. The old refresh token stops working. 401 if expired or already used |
| POST | `/auth/logout` | Needs the access token. Body `{ "refresh_token" }`. `{ "data": { "message": "Logged out" } }` |
| GET | `/auth/me` | Needs the access token. `{ "data": User }` without the password, with `is_active` and `last_login_at`. 401 if the account was disabled |
| GET | `/reservations/availability?date=&pax=` | `{ "data": [{ "time": "18:00:00", "available": true }] }`. Hourly slots from that day's opening hours, or from `booking_open_time` when that is later (`null` changes nothing; at or after closing gives `[]`); past slots today are left out; a closed day gives `[]`. A slot is available while fewer active bookings exist at that time than tables seating `pax`. 422 for a past or invalid date, or pax under 1. Screen 03 |
| POST | `/reservations` | Body `full_name`, `mobile_number` (`09` + 9 digits), `email` (optional), `reservation_date` (YYYY-MM-DD), `reservation_time` (`18:00` or `18:00:00`, must be a slot, so a time before `booking_open_time` is rejected), `pax`, `special_request` (optional). A booking with a mobile already on file under a different name gets its own customer record, so earlier bookings keep their name. 201 `{ "data": Reservation }` with status `pending`, a `reference_code` like `RSV-7K3M9Q`, and `deposit_amount` = pax × `deposit_per_guest`. 422 with `errors`, 409 if the slot just filled. Screen 03 |
| GET | `/reservations/code/{code}` | `{ "data": Reservation }`, or 404. Screens 04, 05 |
| POST | `/reservations/find` | Body `reference_code`, `mobile_number`. `{ "data": Reservation }`, or 404 if either doesn't match. Screen 06 |
| POST | `/reservations/code/{code}/cancel` | Body `mobile_number`. Sets `cancelled`. 404 if the mobile doesn't match, 409 unless `pending` or `confirmed`. Screen 06 |
| POST | `/reservations/code/{code}/reschedule` | Body `mobile_number`, `reservation_date`, `reservation_time`. Same checks as booking (a time before `booking_open_time` is rejected like a non-slot); clears `table_id`. 404, 409 or 422 as above. Screen 06 |
| GET | `/tables/{id}` | `{ "data": { table_id, table_number, capacity, status } }`, or 404. Never returns `qr_token`. Screens 08–12 |
| GET | `/reservations` | Staff, admin. Either `view` = `upcoming` (after today, pending or confirmed, soonest first), `today`, `past` (before today, not cancelled, newest first) or `cancelled` (newest first), or `reservation_date` (YYYY-MM-DD, default today). Also `status`, `search` (ref code or customer name, across all days unless a `view` or `reservation_date` is also given) and `page` (8 per page). `{ "data": Reservation[], "meta": { total, page, per_page } }`. 422 for a bad filter. Screens 15, 24 |
| GET | `/reservations/{id}` | Staff, admin. `{ "data": Reservation }`, or 404. Screen 15 |
| PATCH | `/reservations/{id}/status` | Staff, admin. Body `status` and/or `table_id`. Moves: pending → confirmed, no_show or cancelled; confirmed → arrived, no_show or cancelled. Giving a table to a pending reservation confirms it. The table must exist and seat `pax` (422), and must not hold another active booking at that time (409). Arrived needs a table (409). Any other move, or a change to an arrived, no-show or cancelled reservation, gives 409. The table follows: assigned → `reserved` (if it was available), arrived → `occupied`, no_show or cancelled → `available` (if it was reserved). Screens 15, 16 |
| GET | `/tables` | Staff, admin. Filter `status`. `{ "data": [{ table_id, table_number, capacity, status, current_order, next_reservation }] }`. `current_order` is the newest order not yet served or not yet paid (`{ order_id, status, payment_status, total_amount, created_at }`), or null. `next_reservation` is today's first pending or confirmed booking for that table (`{ reservation_id, reference_code, full_name, reservation_time, status }`), or null. For admins each table also has `qr_token`; staff never see it. Screens 16, 23 |
| PATCH | `/tables/{id}/status` | Staff, admin. Body `status`: `available`, `occupied` or `reserved`. Any change is allowed (for example, freeing a table after guests leave). Returns the same shape as `GET /tables`. Screen 16 |
| POST | `/tables` | Admin. Body `table_number` (required, up to 10, unique) and `capacity` (whole number 1–50). The backend makes a 64-character `qr_token`; status starts `available`. 201 with the same shape as an admin's `GET /tables`. 422 with `errors`. Screen 23 |
| PUT | `/tables/{id}` | Admin. Same body and checks; the `qr_token` stays the same. 409 if a pending or confirmed booking from today on has more guests than the new capacity; 404, 422. Screen 23 |
| DELETE | `/tables/{id}` | Admin. `{ "data": { "message": "Deleted" } }`. 409 if the table has any orders or pending or confirmed bookings from today on; 404. Screen 23 |
| PUT | `/reservations/{id}` | Admin. Body `reservation_date`, `reservation_time`, `pax`, and optional `table_id` (a number or `null`) and `special_request` (kept if left out). Only pending or confirmed bookings (409 otherwise). An unpaid deposit is recalculated from the new `pax`; a paid one stays as it is. Same checks as booking (a time before `booking_open_time` is rejected like a non-slot): an open slot today or later (409 if full), `pax` within `max_pax` and the biggest table, and the table must exist, seat `pax` (422) and be free at that time (409). Moving tables frees the old one and reserves the new one. Status changes still go through `PATCH /reservations/{id}/status`. Screen 24 |
| PUT | `/settings` | Admin. A partial update of any of: `restaurant_name` (up to 100, not empty), `address` (up to 255), `contact_number` (up to 15), `email` (valid), `facebook_url` (up to 255), `service_charge_percent` (0–100), `slot_minutes` (15–240), `max_pax` (1–100), `booking_open_time` (`HH:MM`, `HH:MM:SS` or `null` to clear; 422 otherwise), `deposit_required` (true or false), `deposit_per_guest` (0 or more). An empty string clears the optional text fields. Returns the settings. 422 with `errors`. Screens 24, 29 |
| POST | `/settings/logo` | Admin. Multipart form with a `logo` file: PNG or JPG, up to 2 MB. Sets `logo_url` the same way as menu photos: a full Cloudinary `https://` address on the deployed API, or `/uploads/logo/<random>.png` locally. Removes the old logo. Returns the settings. 422 with the reasons, 502 if Cloudinary is down. Show `logo_url` when it's set, otherwise the built-in `/logo.png`. Screen 29 |
| PUT | `/opening-hours` | Admin. Body: a list of all 7 days, each once: `{ day_of_week (0 Sunday – 6 Saturday), is_open, open_time, close_time }`. Times are `HH:MM` or `HH:MM:SS`; an open day needs `open_time` before `close_time`; a closed day may send `null` times. Saved together, returns the 7 days. Booking times follow at once. 422 with `errors`. Screen 29 |
| GET | `/users` | Admin. Filters `role` (`admin`, `staff`, `kitchen`), `status` (`active`, `disabled`), `search` (name or email). `{ "data": User[] }` by name, never with the password. Screen 28 |
| POST | `/users` | Admin. Body `full_name` (up to 100), `email` (valid, unique), `role`, `password` (8–72 characters). 201 `{ "data": User }`. 422 with `errors`. Screen 28 |
| PUT | `/users/{id}` | Admin. Body `full_name`, `email`, `role`, and optional `password` (sets a new one) and `is_active` (Enable / Disable). You can't change your own role or disable yourself (409). Disabling locks the person out at once: their open sessions stop working on the next request. 404, 422. Screen 28 |
| DELETE | `/users/{id}` | Admin. `{ "data": { "message": "Deleted" } }`. 409 for your own account, the last active admin, or an account that recorded payments (disable it instead); 404. Screen 28 |
| POST | `/orders` | Body `table_id`, `qr_token`, `customer_name` (optional, up to 60), `items`: 1 to 50 of `{ item_id, quantity (1–99), notes (optional, up to 255) }`. The server sets `unit_price` from the menu and works out `total_amount` = subtotal plus `service_charge_percent` from settings; prices sent by the browser are ignored. 201 `{ "data": Order }` with status `received` and `payment_status` `unpaid`, whether the customer picked Pay Now or Pay at the Counter. 403 if `qr_token` doesn't match the table, 422 with `errors` for bad input or an unknown or unavailable item, 429 after 10 orders a minute. Screen 11 |
| GET | `/orders/{id}?qr_token=` | `{ "data": Order }`, or 404 if the order doesn't exist or `qr_token` isn't that order's table. 60 a minute. Screen 12 |
| GET | `/orders` | Staff, kitchen, admin. Filters: `table_id`, `status` (comma list, e.g. `received,preparing,ready` for the kitchen), `payment_status`, `date_from`, `date_to` (YYYY-MM-DD), `search` (order number like `12` or `#12`, or a table number). Without `page`: every match, newest first (kitchen and staff lists). With `page`: 8 per page plus `meta { total, page, per_page }` (Order History). Each order has `payment_method` (`cash`, `online` or `null` while unpaid). 422 for a bad filter. Screens 17, 18, 25 |
| PATCH | `/orders/{id}/status` | Staff, kitchen, admin. Body `status`, one step forward only: received → preparing → ready → served. Skipping, going back or changing a served order gives 409. Screens 17, 18 |
| POST | `/payments` | Staff, admin. Records a cash payment. Body: exactly one of `order_id` or `reservation_id`, and `amount`, which must equal the order's `total_amount` or the reservation's `deposit_amount` (422 otherwise). 409 if already paid, if there's nothing to pay, or if the reservation is no-show or cancelled. 201 `{ "data": Payment }`; an order becomes `payment_status` `paid`. Any open online checkout for the same order or deposit is cancelled (marked `failed` and expired at PayMongo), so the guest can't pay twice. Cash Received and Change are worked out on the screen. Screen 17 |
| POST | `/reservations/code/{code}/deposit` | Starts the online deposit payment (PayMongo: GCash, Maya or card). No body. `{ "data": { payment_id, checkout_url } }`: send the customer to `checkout_url`. After paying, PayMongo sends them back to `/reserve/confirmation/{code}`; cancelling goes back to `/reserve/payment?code={code}`. Read the result from `GET /reservations/code/{code}` (`deposit_status`), never from the return URL, and expect a few seconds' delay. Calling it again reuses the open checkout. 404, 409 if already paid, nothing to pay, or the reservation isn't pending or confirmed, 502 if PayMongo is down, 429 after 20 a minute. Screen 04 |
| POST | `/orders/{id}/pay` | Starts the online payment for an order. Body `qr_token`. `{ "data": { payment_id, checkout_url } }`; PayMongo returns to `/table/{table_id}/orders?order={id}` whether the guest paid or cancelled (Order Status shows paid or unpaid). Read `payment_status` from `GET /orders/{id}`. 404 (also for a wrong `qr_token`), 409 if already paid or nothing to pay, 502, 429 after 10 a minute. Screen 11 |
| POST | `/payments/webhook` | PayMongo only. Checks the `Paymongo-Signature` header (401 if wrong), then marks the payment `paid` with `paid_at` on `checkout_session.payment.paid`, and the order `payment_status` `paid`. Repeats change nothing. If the order or deposit was already paid another way (cash), the late online payment is not counted and is logged as needing a refund. Not for the frontend |
| POST | `/realtime/auth` | Staff, kitchen, admin. Pusher calls this for you when a staff screen subscribes to `private-orders` (set `channelAuthorization: { endpoint: <API>/realtime/auth, headers: { Authorization: 'Bearer <token>' } }` in `pusher-js`). Form fields `socket_id`, `channel_name`. `{ "auth": "..." }`; 401, 403 for any other channel, 503 if Pusher isn't set up |
| POST | `/notifications/reminders` | The scheduled GitHub Action only (header `X-Cron-Secret`). Texts a reminder for each pending or confirmed booking that starts within 2 hours and hasn't had one, then sets `reminder_sent_at`. `{ "data": { "reminders_sent" } }`; 401, 503 if not set up. Not for the frontend |
| GET | `/diagnostics/{service}` | Admin. `service` is `paymongo`, `recommender`, `cloudinary` or `pusher`. A read-only check of that outside service: `{ "data": { service, status, ms, detail } }`, `status` is `ok`, `warning` (works but something is off, e.g. no enabled webhook for this API), `fake` (no keys) or `failed` (with `detail.message`). The page `/diagnostics.html` on the API's address runs all four after an admin sign-in. Not for the frontend |
| POST | `/diagnostics/paymongo/payment` | Admin. Creates a 1-guest test booking (customer "Diagnostics Test", `09000000000`, the next open day's first slot) and starts its deposit. 201 `{ "data": { payment_id, checkout_url, reference_code, amount, fake } }`; 409 if `deposit_per_guest` is 0. Not for the frontend |
| GET | `/diagnostics/paymongo/payment/{id}` | Admin. The test payment's database row and its booking (`payments_row`, `reservation`). Once paid, the test booking is cancelled. 404 for any payment that isn't a test one. Not for the frontend |
| POST | `/diagnostics/cloudinary/photo` | Admin. Multipart `photo` (JPG or PNG, 2 MB), same checks as menu photos, uploaded to `vencios-garden/diagnostics`. 201 `{ "data": { url, bytes_sent } }`, or `fake: true` without keys; 422, 502. Not for the frontend |
| DELETE | `/diagnostics/cloudinary/photo` | Admin. Body `url`; only URLs in `vencios-garden/diagnostics` (422 otherwise). `{ "data": { deleted } }`. Not for the frontend |
| POST | `/diagnostics/sms` | Admin. Sends one test text to the customer "Diagnostics Test" (`09000000000`) and saves it in `notifications`. 201 `{ "data": { message, length, status, mode } }`, `mode` is `fake` while no SMS provider is set (texts are only logged). Not for the frontend |
| GET | `/diagnostics/sms/latest` | Admin. The 10 newest `notifications` rows: `{ "data": [ { notification_id, customer, mobile, message, status, sent_at } ] }`, mobiles masked as `09XX XXX 4567` except the test number. Not for the frontend |
| GET | `/dashboard/staff` | Staff, admin. `{ "data": { reservations_today, guests_arrived, active_orders, available_tables, total_tables, upcoming_reservations, active_orders_list } }`. Today's pending, confirmed and arrived bookings are counted; `guests_arrived` adds up `pax` of arrived ones. `upcoming_reservations`: up to 7 pending or confirmed from now on, by time (`reservation_id, reference_code, reservation_time, full_name, pax, table_number, status`). `active_orders_list`: up to 7 orders not yet served, newest first (`order_id, table_number, item_count, total_amount, status`); `item_count` adds up quantities. Screen 14 |
| GET | `/payments` | Admin. Filters: `method` (`online`, `cash`), `status` (`pending`, `paid`, `failed`, `refunded`), `date_from`, `date_to` (by `paid_at`), `search` (payment ID like `PAY-12` or `12`, order number, deposit ref code, provider reference), `page` (8 per page). `{ "data": Payment[], "totals": { total_collected, online, cash, deposits }, "meta": { total, page, per_page } }`. Each payment has `for` (`{ type: "order", order_id }` or `{ type: "deposit", reservation_id, reference_code }`) and `received_by` (`{ user_id, full_name }` or null). Totals are paid payments in the date range. Payments without `paid_at` (pending, failed) only show when no date filter is set. Screen 26 |
| GET | `/payments/{id}` | Admin. `{ "data": Payment }` in the same shape, or 404. Screen 26 |
| GET | `/dashboard/admin` | Admin. `{ "data": { sales_today, orders_today, reservations_today, no_show_rate, sales_last_7_days: [{ date, total }], best_sellers: [{ item_id, name, quantity }], recent_orders } }`. Sales are paid order payments by `paid_at` (deposits not counted). `no_show_rate` is a percent over the last 30 days (no-shows ÷ arrived + no-shows). Best sellers: top 5 from paid orders in the last 30 days. `recent_orders`: the 5 newest (`order_id, created_at, table_number, item_count, total_amount, payment_status, payment_method, status`). Screen 19 |
| GET | `/reports` | Admin. Query `period` (`daily` default, `weekly`, `monthly`), optional `from`, `to` (YYYY-MM-DD, at most a year). Defaults: the last 7 days, 8 weeks (from Monday) or 6 months. `{ "data": { period, from, to, sales_over_time: [{ start, total }], best_sellers (top 10), reservations_per_day: [{ date, count }], summary: { total_sales, total_orders, average_order_value, reservations, no_shows, no_show_rate, busiest_hour } } }`. `start` is a date for daily and weekly, `YYYY-MM` for monthly; missing days count as 0. 422 for a bad period or range. Screen 27 (the screen's Export PDF is the browser's print) |

Login: save `access_token` with `setToken()` from `src/lib/api.ts`, which then sends it on every request. It lasts 15 minutes (`expires_in` is 900 seconds). When a request returns 401, call `/auth/refresh` with the `refresh_token`, which lasts 7 days. Routes for the wrong role return 403. A disabled account gets 401 on every request, even with a token that was still valid.

Reservations from these routes also carry `customer: { full_name, mobile_number }`, `table_number` (or null) and `deposit_status` (`paid` or `unpaid`). Public routes mask the mobile as `09XX XXX 4567`; staff routes show it in full. Cancelling also frees the table if it was reserved. Find, cancel and reschedule allow 20 tries a minute (then 429). `day_of_week` 0 is Sunday. Times are Asia/Manila.

QR ordering: each table's QR code opens `/table/{table_id}?t={qr_token}`. Screen 23 builds it from the site's own address and the admin `GET /tables` token with `qrcode.react`. Keep `t` for the visit (for example in `sessionStorage`) and send it as `qr_token`. Orders from these routes also carry `table_number`, `subtotal`, `service_charge` and `items`, and each item has the menu item's `name`. Booking times come in steps of `slot_minutes`; a booking's `deposit_amount` is `pax` × `deposit_per_guest` when `deposit_required` is true, otherwise 0.

Live updates (Pusher): the backend sends `order.created`, `order.status` and `order.paid` with `{ order_id, status, payment_status }` only. Staff and kitchen screens (17, 18) subscribe to `private-orders`; the customer's screen 12 subscribes to the order's `channel` (in every Order; it only works for someone who has the table's QR code). On an event, refetch the order or the list from the API: the API is the source of truth. Keep a slow refetch (about every 15 seconds) as a fallback. Without Pusher keys nothing is sent.

SMS: the backend texts the customer when a booking is made, its deposit is paid (cash or online), it is cancelled (by the customer or staff) or moved (rescheduled or edited by staff), and once about 2 hours before (that resets when it moves). Each attempt is a row in `notifications`. A text never blocks the booking. No SMS provider is connected yet (fake mode), so texts are only logged and saved as `sent`.

All times are Asia/Manila, in the database too. Field names and types match `frontend/src/types/db.ts`: `price` is a number, `is_available`, `is_recommended` and `is_open` are true or false. Errors look like `{ "error": "Menu item not found", "status": 404 }`.

## Planned endpoints

None. Every route in `backend/app/config/routes.php` is built.

Before wiring a screen, also confirm with whoever builds the backend:

- The exact URL and method for each endpoint
- The JSON field names (the ERD in `docs/design/ERD.pdf` uses names like `reservation_id`, `menu_items`)
- The login response shape and token name
- That the backend allows requests from `http://localhost:5173` (CORS)
