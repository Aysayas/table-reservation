import { createBrowserRouter } from 'react-router-dom'
import CustomerLayout from '@/layouts/CustomerLayout'
import DashboardLayout, { type NavItem } from '@/layouts/DashboardLayout'
import Placeholder from '@/pages/Placeholder'
import About from '@/pages/customer/About'
import Cart from '@/pages/customer/Cart'
import Checkout from '@/pages/customer/Checkout'
import DepositPayment from '@/pages/customer/DepositPayment'
import Home from '@/pages/customer/Home'
import ItemDetails from '@/pages/customer/ItemDetails'
import Menu from '@/pages/customer/Menu'
import OrderStatus from '@/pages/customer/OrderStatus'
import ReservationConfirmation from '@/pages/customer/ReservationConfirmation'
import ReserveTable from '@/pages/customer/ReserveTable'
import TableMenu from '@/pages/customer/TableMenu'
import StaffLogin from '@/pages/staff/StaffLogin'

const staffNav: NavItem[] = [
  { to: '/staff', label: 'Dashboard' },
  { to: '/staff/reservations', label: "Today's Reservations" },
  { to: '/staff/tables', label: 'Table Status' },
  { to: '/staff/orders', label: 'Orders and Payments' },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/menu', label: 'Menu' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/tables', label: 'Tables and QR Codes' },
  { to: '/admin/reservations', label: 'Reservations' },
  { to: '/admin/orders', label: 'Order History' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/users', label: 'Staff Accounts' },
  { to: '/admin/settings', label: 'Settings' },
]

export const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/menu', element: <Menu /> },
      { path: '/reserve', element: <ReserveTable /> },
      { path: '/reserve/payment', element: <DepositPayment /> },
      {
        path: '/reserve/confirmation/:code',
        element: <ReservationConfirmation />,
      },
      { path: '/reservation', element: <Placeholder screen="06" title="Find Reservation" /> },
      { path: '/about', element: <About /> },
      { path: '/table/:tableId', element: <TableMenu /> },
      { path: '/table/:tableId/menu', element: <TableMenu /> },
      {
        path: '/table/:tableId/menu/:itemId',
        element: <ItemDetails />,
      },
      { path: '/table/:tableId/cart', element: <Cart /> },
      { path: '/table/:tableId/checkout', element: <Checkout /> },
      { path: '/table/:tableId/orders', element: <OrderStatus /> },
    ],
  },
  { path: '/staff/login', element: <StaffLogin /> },
  { path: '/kitchen', element: <Placeholder screen="18" title="Kitchen Display" /> },
  {
    path: '/staff',
    element: <DashboardLayout title="Staff" items={staffNav} />,
    children: [
      { index: true, element: <Placeholder screen="14" title="Staff Dashboard" /> },
      { path: 'reservations', element: <Placeholder screen="15" title="Today's Reservations" /> },
      { path: 'tables', element: <Placeholder screen="16" title="Table Status" /> },
      { path: 'orders', element: <Placeholder screen="17" title="Orders and Payments" /> },
    ],
  },
  {
    path: '/admin',
    element: <DashboardLayout title="Admin" items={adminNav} />,
    children: [
      { index: true, element: <Placeholder screen="19" title="Admin Dashboard" /> },
      { path: 'menu', element: <Placeholder screen="20" title="Menu Management" /> },
      { path: 'menu/new', element: <Placeholder screen="21" title="Add Menu Item" /> },
      { path: 'menu/:id/edit', element: <Placeholder screen="21" title="Edit Menu Item" /> },
      { path: 'categories', element: <Placeholder screen="22" title="Categories" /> },
      { path: 'tables', element: <Placeholder screen="23" title="Tables and QR Codes" /> },
      { path: 'reservations', element: <Placeholder screen="24" title="Reservations" /> },
      { path: 'orders', element: <Placeholder screen="25" title="Order History" /> },
      { path: 'payments', element: <Placeholder screen="26" title="Payments" /> },
      { path: 'reports', element: <Placeholder screen="27" title="Reports" /> },
      { path: 'users', element: <Placeholder screen="28" title="Staff Accounts" /> },
      { path: 'settings', element: <Placeholder screen="29" title="Settings" /> },
    ],
  },
  { path: '*', element: <Placeholder screen="—" title="Page Not Found" /> },
])
