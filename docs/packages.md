# Packages

What each installed library is for. Check here before adding a new one, so we don't end up with two libraries doing the same job.

## App libraries

| Package | Use it for | Docs |
|---|---|---|
| `react-router-dom` | URLs and moving between screens | [reactrouter.com](https://reactrouter.com) |
| `axios` | Sending requests to the backend, through `src/lib/api.ts` | [axios-http.com](https://axios-http.com) |
| `@tanstack/react-query` | Loading and caching backend data, with loading and error states | [tanstack.com/query](https://tanstack.com/query/latest) |
| `zustand` | State shared across screens: cart, logged-in user | [zustand docs](https://zustand.docs.pmnd.rs) |
| `react-hook-form` | Form inputs and submit handling | [react-hook-form.com](https://react-hook-form.com) |
| `zod` + `@hookform/resolvers` | Rules for form fields (required, mobile number format, no past dates) | [zod.dev](https://zod.dev) |
| `date-fns` | Formatting and comparing dates and times | [date-fns.org](https://date-fns.org) |
| `qrcode.react` | Table QR codes on screen 23 | [npm](https://www.npmjs.com/package/qrcode.react) |
| `recharts` | Charts on screens 19 and 27 | [recharts.org](https://recharts.org) |
| `lucide-react` | Icons | [lucide.dev](https://lucide.dev/icons) |
| `sonner` | Pop-up messages ("Order sent") | [sonner.emilkowal.ski](https://sonner.emilkowal.ski) |
| `tailwindcss` | Styling. See [Styling rules](styling.md) | [tailwindcss.com](https://tailwindcss.com/docs) |

React Query and the pop-up messages are already switched on in `src/main.tsx`, so every screen can use them.

## Fonts

| Package | Use it for | Docs |
|---|---|---|
| `@fontsource/montserrat` | The main font (`font-sans`), weights 400, 600 and 700 | [fontsource.org](https://fontsource.org/fonts/montserrat) |
| `@fontsource/dancing-script` | The script title font (`font-display`), weight 700 | [fontsource.org](https://fontsource.org/fonts/dancing-script) |

Both are imported once in `src/index.css`. See the [brand guide](design/brand.md) for when to use each.

## Developer tools

| Package | Use it for |
|---|---|
| `typescript` | Type checking, run by `npm run build` |
| `oxlint` | Code checks, `npm run lint` |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting and Tailwind class order, `npm run format` |
| `@playwright/test` | Browser tests. See [Testing](testing.md) |

## Quick examples

**Loading data**

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const { data, isLoading, isError } = useQuery({
  queryKey: ['menu-items'],
  queryFn: () => api.get('/menu-items').then((res) => res.data),
})
```

**Shared state**

```ts
// src/stores/cartStore.ts
import { create } from 'zustand'

type CartState = {
  items: { id: number; qty: number }[]
  add: (id: number) => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (id) => set((s) => ({ items: [...s.items, { id, qty: 1 }] })),
}))
```

**A form with checks**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Enter your name'),
  mobile: z.string().regex(/^09\d{9}$/, 'Use 09XXXXXXXXX'),
  pax: z.coerce.number().min(1).max(20),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})
```

**Pop-up message**

```ts
import { toast } from 'sonner'

toast.success('Order sent to the kitchen')
```

## Not installed yet

| Integration | Package | When |
|---|---|---|
| Real-Time Messaging | `pusher-js`, `ably` or `firebase` | After the team picks a provider |

Payments, SMS, cloud storage and recommendations need no frontend package. The backend handles them and React calls the API.

## Adding a new package

Ask the team first, then:

```bash
npm install package-name
```

Add a row to this page saying what it is for.
