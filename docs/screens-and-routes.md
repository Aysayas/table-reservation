# Screens and routes

Every screen in `docs/wireframes/` already has a URL in `src/router.tsx`. Each one shows a placeholder until someone builds it.

## Customer (390 wide on phones, responsive on tablet and laptop, no login)

Layout: `CustomerLayout`

| # | Screen | URL |
|---|---|---|
| 01 | Home | `/` |
| 02 | Menu | `/menu` |
| 03 | Reserve a Table | `/reserve` |
| 04 | Deposit Payment | `/reserve/payment` |
| 05 | Reservation Confirmation | `/reserve/confirmation/:code` |
| 06 | Find Reservation | `/reservation` |
| 07 | About Us | `/about` |

## QR ordering (mobile, opened by scanning a table's QR code)

Layout: `CustomerLayout`

| # | Screen | URL |
|---|---|---|
| 08 | Table Menu | `/table/:tableId` and `/table/:tableId/menu` |
| 09 | Item Details | `/table/:tableId/menu/:itemId` |
| 10 | Cart | `/table/:tableId/cart` |
| 11 | Checkout | `/table/:tableId/checkout` |
| 12 | Order Status | `/table/:tableId/orders` |

## Staff (desktop, 1440 × 900, login)

| # | Screen | URL | Layout |
|---|---|---|---|
| 13 | Staff Login | `/staff/login` | none |
| 14 | Staff Dashboard | `/staff` | Staff sidebar |
| 15 | Today's Reservations | `/staff/reservations` | Staff sidebar |
| 16 | Table Status | `/staff/tables` | Staff sidebar |
| 17 | Orders and Payments | `/staff/orders` | Staff sidebar |
| 18 | Kitchen Display | `/kitchen` | none (full screen) |

## Admin (desktop, 1440 × 900, login)

Layout: Admin sidebar. Sidebar order matches the wireframes.

| # | Screen | URL |
|---|---|---|
| 19 | Admin Dashboard | `/admin` |
| 20 | Menu Management | `/admin/menu` |
| 21 | Add / Edit Menu Item | `/admin/menu/new` and `/admin/menu/:id/edit` |
| 22 | Categories | `/admin/categories` |
| 23 | Tables and QR Codes | `/admin/tables` |
| 24 | Reservations | `/admin/reservations` |
| 25 | Order History | `/admin/orders` |
| 26 | Payments | `/admin/payments` |
| 27 | Reports | `/admin/reports` |
| 28 | Staff Accounts | `/admin/users` |
| 29 | Settings | `/admin/settings` |

## Customer accounts

Added by the lead after the 29 wireframes: `/reserve` needs a login. Rescheduling by link, Find My Reservation, QR ordering and the public pages don't. Customer layout, responsive like 01–07.

| Screen | URL |
|---|---|
| Log In | `/login` (optional `?next=`) |
| Create an Account | `/register` (optional `?next=`) |
| Forgot Password | `/forgot-password` |
| Reset Password | `/reset-password?token=` |
| My Reservations | `/my-reservations` |
| Profile | `/profile` |

## URL parameters

Parts that start with `:` change per visit. Read them with `useParams`:

```tsx
import { useParams } from 'react-router-dom'

const { tableId } = useParams()
```

| Parameter | Meaning |
|---|---|
| `:code` | Reservation reference code |
| `:tableId` | Table number from the QR code |
| `:itemId`, `:id` | Menu item ID |

## Not done yet

- Login does not protect `/staff`, `/kitchen` or `/admin` yet. Anyone can open them during development.
