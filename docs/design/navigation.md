# Screen navigation

Where each button and link goes. This comes from the clickable prototype in the Figma file "Wireframes" (`docs/design/Wireframes.fig`). Use it with each screen's wireframe in `docs/wireframes/` when you build the links. URLs come from [screens-and-routes.md](../screens-and-routes.md).

"Back" means go back to the previous screen (`navigate(-1)`).

## Customer (01–07)

| From | Button or link | Goes to |
|---|---|---|
| 01 Home `/` | Reserve a Table | 03 Reserve a Table `/reserve` |
| 01 Home | View Menu | 02 Menu `/menu` |
| 01 Home | About Us | 07 About Us `/about` |
| 01 Home | Find My Reservation | 06 Find Reservation `/reservation` |
| 01 Home | Staff Login | 13 Staff Login `/staff/login` |
| 02 Menu | Back arrow | Back |
| 03 Reserve a Table | Back arrow | Back |
| 03 Reserve a Table | Continue to Deposit | 04 Deposit Payment `/reserve/payment` |
| 04 Deposit Payment | Back arrow | Back |
| 04 Deposit Payment | Pay ₱000.00 | 05 Reservation Confirmation `/reserve/confirmation/:code` |
| 05 Reservation Confirmation | Back to Home | 01 Home `/` |
| 05 Reservation Confirmation | Manage Reservation | `/my-reservations` when logged in, otherwise 06 Find Reservation `/reservation?code=` |
| 06 Find Reservation | Back arrow | Back |
| 06 Find Reservation | Reschedule | 03 Reserve a Table `/reserve` |
| 07 About Us | Back arrow | Back |

## QR ordering (08–12)

The customer starts here by scanning the table's QR code, so `:tableId` comes from the URL.

| From | Button or link | Goes to |
|---|---|---|
| 08 Table Menu `/table/:tableId/menu` | A menu item | 09 Item Details `/table/:tableId/menu/:itemId` |
| 08 Table Menu | View Cart | 10 Cart `/table/:tableId/cart` |
| 09 Item Details | Back arrow | Back |
| 09 Item Details | Add to Cart | 10 Cart |
| 10 Cart | Back arrow | Back |
| 10 Cart | Proceed to Checkout | 11 Checkout `/table/:tableId/checkout` |
| 11 Checkout | Back arrow | Back |
| 11 Checkout | Place Order | 12 Order Status `/table/:tableId/orders` |
| 12 Order Status | Order More | 08 Table Menu |

## Customer accounts

| From | Button or link | Goes to |
|---|---|---|
| Customer menu (logged out) | Log In | `/login` |
| Account menu (logged in) | My Reservations | `/my-reservations` |
| Account menu (logged in) | Profile | `/profile` |
| Account menu (logged in) | Log Out | 01 Home `/` |
| Log In | Log In | `?next=` page, or `/my-reservations` |
| Log In | Forgot password? | `/forgot-password` (keeps `?next=`) |
| Log In | Create an account | `/register` |
| Create an Account | Create Account | `?next=` page, or `/my-reservations` |
| Reset Password | Save New Password | `/login`, with the earlier `?next=` when in the same browser |
| Profile | Change password | `/forgot-password` |
| My Reservations | Pay Deposit | 04 Deposit Payment `/reserve/payment?code=` |
| My Reservations | Reschedule | 03 Reserve a Table `/reserve?reschedule=` |

## Staff and kitchen (13–18)

| From | Button or link | Goes to |
|---|---|---|
| 13 Staff Login `/staff/login` | Log In | 14 Staff Dashboard `/staff` |
| 14–17 staff sidebar | Dashboard | 14 `/staff` |
| 14–17 staff sidebar | Reservations | 15 Today's Reservations `/staff/reservations` |
| 14–17 staff sidebar | Table Status | 16 Table Status `/staff/tables` |
| 14–17 staff sidebar | Orders and Payments | 17 Orders and Payments `/staff/orders` |
| 14–17 staff sidebar | Log Out | 13 Staff Login |
| 18 Kitchen Display `/kitchen` | Log Out | 13 Staff Login |
| Staff and admin sidebars | Kitchen | 18 Kitchen Display `/kitchen` |
| 18 Kitchen Display `/kitchen` | Back (when opened from a sidebar) | The page it came from |

## Admin (19–29)

Every admin screen has the same sidebar. Each item goes to its screen, and Log Out goes to 13 Staff Login.

| From | Button or link | Goes to |
|---|---|---|
| 19–29 admin sidebar | Dashboard | 19 Admin Dashboard `/admin` |
| 19–29 admin sidebar | Menu | 20 Menu Management `/admin/menu` |
| 19–29 admin sidebar | Categories | 22 Categories `/admin/categories` |
| 19–29 admin sidebar | Tables and QR Codes | 23 `/admin/tables` |
| 19–29 admin sidebar | Reservations | 24 `/admin/reservations` |
| 19–29 admin sidebar | Order History | 25 `/admin/orders` |
| 19–29 admin sidebar | Payments | 26 `/admin/payments` |
| 19–29 admin sidebar | Reports | 27 `/admin/reports` |
| 19–29 admin sidebar | Staff Accounts | 28 `/admin/users` |
| 19–29 admin sidebar | Settings | 29 `/admin/settings` |
| 19–29 admin sidebar | Log Out | 13 Staff Login |
| 20 Menu Management | + Add Menu Item | 21 Add / Edit Menu Item `/admin/menu/new` |
| 21 Add / Edit Menu Item | Save Item | 20 Menu Management |
| 21 Add / Edit Menu Item | Cancel | 20 Menu Management |
