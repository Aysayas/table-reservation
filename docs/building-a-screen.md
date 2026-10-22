# Building a screen

Each screen starts as a placeholder in `src/router.tsx`. To build one, make a page file and swap it in.

## Steps

**1. Pick the screen** from [Screens and routes](screens-and-routes.md) and open its file in `docs/wireframes/`. Tell the team which one you are taking so two people don't build the same screen.

**2. Create the page file** in the right area folder:

```tsx
// src/pages/customer/About.tsx
export default function About() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">About Us</h1>
      <p className="mt-2 text-sm">Vencio's Garden, Street, City</p>
    </div>
  )
}
```

**3. Swap the placeholder** in `src/router.tsx`:

```tsx
import About from '@/pages/customer/About'

// before
{ path: '/about', element: <Placeholder screen="07" title="About Us" /> },

// after
{ path: '/about', element: <About /> },
```

**4. Check it** at the screen's URL with `npm run dev`. Customer screens should look right at 390px wide; staff and admin screens at 1440px.

**5. Run the checks** before sharing:

```bash
npm run build
npm run lint
```

## Linking between screens

Use `Link` instead of `<a>` so the page doesn't fully reload:

```tsx
import { Link, useNavigate } from 'react-router-dom'

<Link to="/reserve">Reserve a Table</Link>

const navigate = useNavigate()
navigate(`/reserve/confirmation/${code}`)
```

## Reusing pieces

If something appears on more than one screen (a menu item card, a status badge, a table row), make it a component in `src/components/` and import it in each page.

## Data before the backend exists

Until the API is ready, put sample data in the page so you can lay it out:

```tsx
const items = [
  { id: 1, name: 'Menu Item', price: 0 },
  { id: 2, name: 'Menu Item', price: 0 },
]
```

Swap it for an API call later. See [Calling the API](api.md).
