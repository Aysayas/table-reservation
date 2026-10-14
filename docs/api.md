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

const { data } = await api.post('/auth/login', { username, password })
setToken(data.access_token)
```

Call `setToken(null)` on Log Out.

## Agree with the backend team on

## Endpoints that exist now

| Method | URL | Returns |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` when the API is up |
| GET | `/health/db` | `{ "status": "ok", "database": "connected" }`, or 503 if the database is down |

The other endpoint names above are examples. Before wiring a screen, confirm with whoever builds the backend:

- The exact URL and method for each endpoint
- The JSON field names (the ERD in `docs/design/ERD.pdf` uses names like `reservation_id`, `menu_items`)
- The login response shape and token name
- That the backend allows requests from `http://localhost:5173` (CORS)
