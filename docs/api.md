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

## Planned endpoints

These routes are registered in `backend/app/config/routes.php`, but every one still answers **501 Not implemented**. Keep using `sampleData.ts` for a screen until its endpoint moves up to "Endpoints that exist now".

Who: **public** needs no login. **staff**, **kitchen** and **admin** need the login token, and admin can use everything staff can.

| Method | URL | Who | Screens | Does |
|---|---|---|---|---|
| POST | `/auth/login` | public | 13 | Log in with `email`, `password`. Returns `access_token`, `refresh_token`, user |
| POST | `/auth/refresh` | public | all staff | New `access_token` from a `refresh_token` |
| POST | `/auth/logout` | staff | all staff | Revoke the refresh token |
| GET | `/auth/me` | staff | all staff | The logged-in user |
| GET | `/categories` | public | 02, 08, 20, 22 | All categories by `sort_order` |
| POST | `/categories` | admin | 22 | Add a category |
| PUT | `/categories/{id}` | admin | 22 | Edit a category |
| DELETE | `/categories/{id}` | admin | 22 | Delete a category |
| GET | `/menu-items` | public | 01, 02, 08, 20 | Menu items. Filters: `category_id`, `is_available` |
| GET | `/menu-items/{id}` | public | 09, 21 | One menu item |
| POST | `/menu-items` | admin | 21 | Add a menu item |
| PUT | `/menu-items/{id}` | admin | 21 | Edit a menu item |
| PATCH | `/menu-items/{id}/availability` | admin | 20 | Set `is_available` |
| POST | `/menu-items/{id}/image` | admin | 21 | Upload the photo, sets `image_url` |
| DELETE | `/menu-items/{id}` | admin | 20 | Delete a menu item |
| GET | `/tables` | staff | 14, 16, 23 | Tables with their current order or reservation. Filter: `status` |
| GET | `/tables/{id}` | public | 08–12 | One table, for the QR ordering pages |
| POST | `/tables` | admin | 23 | Add a table. The backend makes the `qr_token` |
| PUT | `/tables/{id}` | admin | 23 | Edit a table |
| PATCH | `/tables/{id}/status` | staff | 16 | Set `status` |
| DELETE | `/tables/{id}` | admin | 23 | Delete a table |
| POST | `/reservations` | public | 03 | Book: `full_name`, `mobile_number`, `email`, `reservation_date`, `reservation_time`, `pax`. Returns `reference_code` |
| POST | `/reservations/find` | public | 06 | Find by `reference_code` and `mobile_number` |
| GET | `/reservations/code/{code}` | public | 04, 05 | One reservation by `reference_code` |
| POST | `/reservations/code/{code}/cancel` | public | 06 | Cancel. Body: `mobile_number` |
| POST | `/reservations/code/{code}/reschedule` | public | 06 | New `reservation_date`, `reservation_time`. Body also: `mobile_number` |
| POST | `/reservations/code/{code}/deposit` | public | 04 | Start the online deposit payment. Returns the payment page URL |
| GET | `/reservations` | staff | 14, 15, 24 | Reservations. Filters: `reservation_date`, `status` |
| GET | `/reservations/{id}` | staff | 15, 24 | One reservation |
| PUT | `/reservations/{id}` | admin | 24 | Edit a reservation, incl. `table_id` |
| PATCH | `/reservations/{id}/status` | staff | 15, 16, 24 | Set `status` (e.g. Mark Arrived) |
| POST | `/orders` | public | 11 | Place an order: `table_id`, `qr_token`, items (`item_id`, `quantity`, `notes`) |
| GET | `/orders` | staff, kitchen | 12, 14, 17, 18, 25 | Orders with items. Filters: `table_id`, `status`, `payment_status`, date range |
| GET | `/orders/{id}` | public | 12, 17 | One order with its items |
| PATCH | `/orders/{id}/status` | kitchen, staff | 17, 18 | Set `status` |
| POST | `/orders/{id}/pay` | public | 11 | Start the online payment for an order. Returns the payment page URL |
| GET | `/payments` | admin | 26 | Payments. Filters: `method`, `status`, date range |
| GET | `/payments/{id}` | admin | 26 | One payment |
| POST | `/payments` | staff | 17 | Record a cash payment: `order_id` or `reservation_id`, `amount` |
| POST | `/payments/webhook` | payment provider | none | The provider reports a paid or failed payment |
| GET | `/users` | admin | 28 | Staff accounts |
| POST | `/users` | admin | 28 | Add a staff account |
| PUT | `/users/{id}` | admin | 28 | Edit a staff account |
| DELETE | `/users/{id}` | admin | 28 | Delete a staff account |
| GET | `/settings` | public | 01, 07, 29 | Restaurant information |
| PUT | `/settings` | admin | 29 | Save restaurant information |
| POST | `/settings/logo` | admin | 29 | Upload the logo, sets `logo_url` |
| GET | `/opening-hours` | public | 01, 07, 29 | All 7 days |
| PUT | `/opening-hours` | admin | 29 | Save all 7 days |
| GET | `/reports` | admin | 27 | Totals and charts. Query: `period` (`daily`, `weekly`, `monthly`), `from`, `to` |
| GET | `/dashboard/staff` | staff | 14 | Counts for today and upcoming reservations |
| GET | `/dashboard/admin` | admin | 19 | Sales today, best sellers, last 7 days, recent orders |

Before wiring a screen, also confirm with whoever builds the backend:

- The exact URL and method for each endpoint
- The JSON field names (the ERD in `docs/design/ERD.pdf` uses names like `reservation_id`, `menu_items`)
- The login response shape and token name
- That the backend allows requests from `http://localhost:5173` (CORS)
