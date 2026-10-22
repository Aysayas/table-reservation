# Calling the API

The frontend talks to the LavaLust (PHP) backend in `backend/`, which returns JSON. Every endpoint lives under `/api`. Running it locally needs Docker; see `backend/README.md`.

## Setting the backend address

In `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000/api
```

Restart `npm run dev` after changing it. Only settings that start with `VITE_` reach the browser, and anything in them is public, so **never put API keys or passwords in the frontend**. Keys for payments, SMS, storage and real-time messaging belong in the backend.

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

Screens never call the API directly. They call a function in `src/services/`:

```ts
// src/services/menu.ts, while the endpoint doesn't exist yet
export async function getMenuItems() {
  return sampleMenuItems
}

// after the endpoint is listed below
export async function getMenuItems() {
  const { data } = await api.get('/menu-items')
  return data.data.map((item) => ({ ...item, price: Number(item.price) }))
}
```

- Sample data lives in `src/services/sampleData.ts`, typed by `src/types/db.ts`.
- Field names match the database exactly, so switching to the real API changes only the service function.
- MySQL returns `DECIMAL` values (prices, amounts) as strings. Convert them with `Number()` in the service.

## Agree with the backend team on

## Endpoints that exist now

| Method | URL | Returns |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` when the API is up |
| GET | `/health/db` | `{ "status": "ok", "database": "connected" }`, or 503 if the database is down |
| GET | `/categories` | `{ "data": Category[] }` by `sort_order`, each with `item_count` (its number of menu items). Screens 02, 08, 20, 22 |
| GET | `/menu-items` | `{ "data": MenuItem[] }`. Optional filters `?category_id=1&is_available=1`; a non-number gives 422. Screens 01, 02, 08, 20 |
| GET | `/menu-items/{id}` | `{ "data": MenuItem }`, or 404. Screens 09, 21 |
| POST | `/categories` | Admin. Body `name` (required, up to 50, unique) and `sort_order` (optional whole number, 0 or more; default is one after the last). 201 `{ "data": Category }`, 422 with `errors`. Screen 22 |
| PUT | `/categories/{id}` | Admin. Body `name` and optional `sort_order` (kept if left out). Same checks. `{ "data": Category }`, 404 or 422. Screen 22 |
| DELETE | `/categories/{id}` | Admin. `{ "data": { "message": "Deleted" } }`. 409 while it still has menu items, 404 if missing. Screen 22 |
| POST | `/menu-items` | Admin. Body `category_id` (an existing category), `name` (required, up to 100), `price` (number, 0 to 99999999.99), `description` (optional, up to 1000), `is_available` and `is_recommended` (optional true or false, default true). 201 `{ "data": MenuItem }`, 422 with `errors`. Screen 21 |
| PUT | `/menu-items/{id}` | Admin. Same body and checks as adding; `is_available` and `is_recommended` keep their values if left out. Doesn't change the photo. `{ "data": MenuItem }`, 404 or 422. Screen 21 |
| PATCH | `/menu-items/{id}/availability` | Admin. Body `{ "is_available": true }`. `{ "data": MenuItem }`, 404 or 422. Screen 20 |
| POST | `/menu-items/{id}/image` | Admin. Multipart form with a `photo` file: JPG or PNG, up to 2 MB. Sets `image_url` to `/uploads/menu/<random>.jpg` (served by the backend; put the API's host in front, without `/api`) and removes the old photo. `{ "data": MenuItem }`, 404, or 422 with the reasons. Save the item first, then upload. Screen 21 |
| DELETE | `/menu-items/{id}` | Admin. Deletes the item and its photo: `{ "data": { "message": "Deleted" } }`. 409 if it has ever been ordered (mark it unavailable instead), 404 if missing. Screen 20 |
| GET | `/settings` | `{ "data": RestaurantSettings }`. Screens 01, 07, 29 |
| GET | `/opening-hours` | `{ "data": OpeningHours[] }`, all 7 days, `day_of_week` 0 to 6. Screens 01, 07, 29 |
| POST | `/auth/login` | Body `{ "email", "password" }`. `{ "data": { access_token, refresh_token, expires_in, token_type, user } }`. 401 for a wrong email or password, 422 with an `errors` list if a field is missing or the email is invalid, 429 after 10 tries a minute. Screen 13 |
| POST | `/auth/refresh` | Body `{ "refresh_token" }`. Same shape as login, with a new pair of tokens. The old refresh token stops working. 401 if expired or already used |
| POST | `/auth/logout` | Needs the access token. Body `{ "refresh_token" }`. `{ "data": { "message": "Logged out" } }` |
| GET | `/auth/me` | Needs the access token. `{ "data": User }` without the password |
| GET | `/reservations/availability?date=&pax=` | `{ "data": [{ "time": "18:00:00", "available": true }] }`. Hourly slots from that day's opening hours; past slots today are left out; a closed day gives `[]`. A slot is available while fewer active bookings exist at that time than tables seating `pax`. 422 for a past or invalid date, or pax under 1. Screen 03 |
| POST | `/reservations` | Body `full_name`, `mobile_number` (`09` + 9 digits), `email` (optional), `reservation_date` (YYYY-MM-DD), `reservation_time` (`18:00` or `18:00:00`, must be a slot), `pax`, `special_request` (optional). 201 `{ "data": Reservation }` with status `pending`, a `reference_code` like `RSV-7K3M9Q`, and `deposit_amount` = pax × `deposit_per_guest`. 422 with `errors`, 409 if the slot just filled. Screen 03 |
| GET | `/reservations/code/{code}` | `{ "data": Reservation }`, or 404. Screens 04, 05 |
| POST | `/reservations/find` | Body `reference_code`, `mobile_number`. `{ "data": Reservation }`, or 404 if either doesn't match. Screen 06 |
| POST | `/reservations/code/{code}/cancel` | Body `mobile_number`. Sets `cancelled`. 404 if the mobile doesn't match, 409 unless `pending` or `confirmed`. Screen 06 |
| POST | `/reservations/code/{code}/reschedule` | Body `mobile_number`, `reservation_date`, `reservation_time`. Same checks as booking; clears `table_id`. 404, 409 or 422 as above. Screen 06 |
| GET | `/tables/{id}` | `{ "data": { table_id, table_number, capacity, status } }`, or 404. Never returns `qr_token`. Screens 08–12 |
| GET | `/reservations` | Staff, admin. Filters: `reservation_date` (YYYY-MM-DD, default today), `status`, `search` (ref code or name), `page` (8 per page). `{ "data": Reservation[], "meta": { total, page, per_page } }` by time. 422 for a bad filter. Screen 15 |
| GET | `/reservations/{id}` | Staff, admin. `{ "data": Reservation }`, or 404. Screen 15 |
| PATCH | `/reservations/{id}/status` | Staff, admin. Body `status` and/or `table_id`. Moves: pending → confirmed, no_show or cancelled; confirmed → arrived, no_show or cancelled. Giving a table to a pending reservation confirms it. The table must exist and seat `pax` (422), and must not hold another active booking at that time (409). Arrived needs a table (409). Any other move, or a change to an arrived, no-show or cancelled reservation, gives 409. The table follows: assigned → `reserved` (if it was available), arrived → `occupied`, no_show or cancelled → `available` (if it was reserved). Screens 15, 16 |
| GET | `/tables` | Staff, admin. Filter `status`. `{ "data": [{ table_id, table_number, capacity, status, current_order, next_reservation }] }`. `current_order` is the newest order not yet served or not yet paid (`{ order_id, status, payment_status, total_amount, created_at }`), or null. `next_reservation` is today's first pending or confirmed booking for that table (`{ reservation_id, reference_code, full_name, reservation_time, status }`), or null. Screen 16 |
| PATCH | `/tables/{id}/status` | Staff, admin. Body `status`: `available`, `occupied` or `reserved`. Any change is allowed (for example, freeing a table after guests leave). Returns the same shape as `GET /tables`. Screen 16 |
| POST | `/orders` | Body `table_id`, `qr_token`, `customer_name` (optional, up to 60), `items`: 1 to 50 of `{ item_id, quantity (1–99), notes (optional, up to 255) }`. The server sets `unit_price` from the menu and works out `total_amount` = subtotal plus `service_charge_percent` from settings; prices sent by the browser are ignored. 201 `{ "data": Order }` with status `received` and `payment_status` `unpaid`, whether the customer picked Pay Now or Pay at the Counter. 403 if `qr_token` doesn't match the table, 422 with `errors` for bad input or an unknown or unavailable item, 429 after 10 orders a minute. Screen 11 |
| GET | `/orders/{id}?qr_token=` | `{ "data": Order }`, or 404 if the order doesn't exist or `qr_token` isn't that order's table. 60 a minute. Screen 12 |
| GET | `/orders` | Staff, kitchen, admin. Filters: `table_id`, `status` (comma list, e.g. `received,preparing,ready` for the kitchen), `payment_status`, `date_from`, `date_to` (YYYY-MM-DD). `{ "data": Order[] }`, newest first, with items. 422 for a bad filter. Screens 17, 18 |
| PATCH | `/orders/{id}/status` | Staff, kitchen, admin. Body `status`, one step forward only: received → preparing → ready → served. Skipping, going back or changing a served order gives 409. Screens 17, 18 |
| POST | `/payments` | Staff, admin. Records a cash payment. Body: exactly one of `order_id` or `reservation_id`, and `amount`, which must equal the order's `total_amount` or the reservation's `deposit_amount` (422 otherwise). 409 if already paid, if there's nothing to pay, or if the reservation is no-show or cancelled. 201 `{ "data": Payment }`; an order becomes `payment_status` `paid`. Cash Received and Change are worked out on the screen. Screen 17 |
| GET | `/dashboard/staff` | Staff, admin. `{ "data": { reservations_today, guests_arrived, active_orders, available_tables, total_tables, upcoming_reservations, active_orders_list } }`. Today's pending, confirmed and arrived bookings are counted; `guests_arrived` adds up `pax` of arrived ones. `upcoming_reservations`: up to 7 pending or confirmed from now on, by time (`reservation_id, reference_code, reservation_time, full_name, pax, table_number, status`). `active_orders_list`: up to 7 orders not yet served, newest first (`order_id, table_number, item_count, total_amount, status`); `item_count` adds up quantities. Screen 14 |

Login: save `access_token` with `setToken()` from `src/lib/api.ts`, which then sends it on every request. It lasts 15 minutes (`expires_in` is 900 seconds). When a request returns 401, call `/auth/refresh` with the `refresh_token`, which lasts 7 days. Routes for the wrong role return 403.

Reservations from these routes also carry `customer: { full_name, mobile_number }`, `table_number` (or null) and `deposit_status` (`paid` or `unpaid`). Public routes mask the mobile as `09XX XXX 4567`; staff routes show it in full. Cancelling also frees the table if it was reserved. Find, cancel and reschedule allow 20 tries a minute (then 429). `day_of_week` 0 is Sunday. Times are Asia/Manila.

QR ordering: each table's QR code opens `/table/{table_id}?t={qr_token}`. Keep `t` for the visit (for example in `sessionStorage`) and send it as `qr_token`. Orders from these routes also carry `table_number`, `subtotal`, `service_charge` and `items`, and each item has the menu item's `name`.

Field names and types match `frontend/src/types/db.ts`: `price` is a number, `is_available`, `is_recommended` and `is_open` are true or false. Errors look like `{ "error": "Menu item not found", "status": 404 }`.

## Planned endpoints

These routes are registered in `backend/app/config/routes.php`, but every one still answers **501 Not implemented**. Keep using `sampleData.ts` for a screen until its endpoint moves up to "Endpoints that exist now".

Who: **public** needs no login. **staff**, **kitchen** and **admin** need the login token. Admin can use everything staff can. These role checks already work: a protected route answers 401 or 403 before it gets to 501.

| Method | URL | Who | Screens | Does |
|---|---|---|---|---|
| POST | `/tables` | admin | 23 | Add a table. The backend makes the `qr_token` |
| PUT | `/tables/{id}` | admin | 23 | Edit a table |
| DELETE | `/tables/{id}` | admin | 23 | Delete a table |
| POST | `/reservations/code/{code}/deposit` | public | 04 | Start the online deposit payment. Returns the payment page URL |
| PUT | `/reservations/{id}` | admin | 24 | Edit a reservation, incl. `table_id` |
| POST | `/orders/{id}/pay` | public | 11 | Start the online payment for an order. Returns the payment page URL |
| GET | `/payments` | admin | 26 | Payments. Filters: `method`, `status`, date range |
| GET | `/payments/{id}` | admin | 26 | One payment |
| POST | `/payments/webhook` | payment provider | none | The provider reports a paid or failed payment |
| GET | `/users` | admin | 28 | Staff accounts |
| POST | `/users` | admin | 28 | Add a staff account |
| PUT | `/users/{id}` | admin | 28 | Edit a staff account |
| DELETE | `/users/{id}` | admin | 28 | Delete a staff account |
| PUT | `/settings` | admin | 29 | Save restaurant information |
| POST | `/settings/logo` | admin | 29 | Upload the logo, sets `logo_url` |
| PUT | `/opening-hours` | admin | 29 | Save all 7 days |
| GET | `/reports` | admin | 27 | Totals and charts. Query: `period` (`daily`, `weekly`, `monthly`), `from`, `to` |
| GET | `/dashboard/admin` | admin | 19 | Sales today, best sellers, last 7 days, recent orders |

Before wiring a screen, also confirm with whoever builds the backend:

- The exact URL and method for each endpoint
- The JSON field names (the ERD in `docs/design/ERD.pdf` uses names like `reservation_id`, `menu_items`)
- The login response shape and token name
- That the backend allows requests from `http://localhost:5173` (CORS)
