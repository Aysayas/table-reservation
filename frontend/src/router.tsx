import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ErrorPage from '@/components/ErrorPage'
import PageLoader from '@/components/PageLoader'
import CustomerLayout from '@/layouts/CustomerLayout'
import DashboardLayout, { type NavItem } from '@/layouts/DashboardLayout'
import RootLayout from '@/layouts/RootLayout'
import NotFound from '@/pages/customer/NotFound'

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

const staffNav: NavItem[] = [
  { to: '/staff', label: 'Dashboard' },
  { to: '/staff/reservations', label: 'Reservations', title: "Today's Reservations" },
  { to: '/staff/tables', label: 'Table Status' },
  { to: '/staff/orders', label: 'Orders and Payments' },
  { to: '/kitchen', label: 'Kitchen' },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', group: 'Today' },
  { to: '/admin/reservations', label: 'Reservations', group: 'Today' },
  { to: '/kitchen', label: 'Kitchen', group: 'Today' },
  { to: '/admin/menu', label: 'Menu', title: 'Menu Management', group: 'Menu & Tables' },
  { to: '/admin/categories', label: 'Categories', group: 'Menu & Tables' },
  { to: '/admin/tables', label: 'Tables and QR Codes', group: 'Menu & Tables' },
  { to: '/admin/orders', label: 'Order History', group: 'Sales' },
  { to: '/admin/payments', label: 'Payments', group: 'Sales' },
  { to: '/admin/reports', label: 'Reports', group: 'Sales' },
  { to: '/admin/users', label: 'Staff Accounts', group: 'Setup' },
  { to: '/admin/settings', label: 'Settings', group: 'Setup' },
]

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    hydrateFallbackElement: <PageLoader />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { path: '/', lazy: page(() => import('@/pages/customer/Home')) },
          {
            path: '/menu',
            handle: { tab: 'Menu' },
            lazy: page(() => import('@/pages/customer/Menu')),
          },
          {
            path: '/reserve',
            handle: { tab: 'Reserve a Table' },
            lazy: page(() => import('@/pages/customer/ReserveTable')),
          },
          {
            path: '/reserve/payment',
            handle: { tab: 'Deposit Payment' },
            lazy: page(() => import('@/pages/customer/DepositPayment')),
          },
          {
            path: '/reserve/confirmation/:code',
            handle: { tab: 'Reservation Confirmed' },
            lazy: page(() => import('@/pages/customer/ReservationConfirmation')),
          },
          {
            path: '/reservation',
            handle: { tab: 'Find My Reservation' },
            lazy: page(() => import('@/pages/customer/FindReservation')),
          },
          {
            path: '/login',
            handle: { tab: 'Log In' },
            lazy: page(() => import('@/pages/customer/Login')),
          },
          {
            path: '/register',
            handle: { tab: 'Create Account' },
            lazy: page(() => import('@/pages/customer/Register')),
          },
          {
            path: '/forgot-password',
            handle: { tab: 'Forgot Password' },
            lazy: page(() => import('@/pages/customer/ForgotPassword')),
          },
          {
            path: '/reset-password',
            handle: { tab: 'Reset Password' },
            lazy: page(() => import('@/pages/customer/ResetPassword')),
          },
          {
            path: '/my-reservations',
            handle: { tab: 'My Reservations' },
            lazy: page(() => import('@/pages/customer/MyReservations')),
          },
          {
            path: '/profile',
            handle: { tab: 'Profile' },
            lazy: page(() => import('@/pages/customer/Profile')),
          },
          {
            path: '/about',
            handle: { tab: 'About Us' },
            lazy: page(() => import('@/pages/customer/About')),
          },
          { path: '*', handle: { tab: 'Page Not Found' }, element: <NotFound /> },
          {
            path: '/table/:tableId',
            handle: { tab: 'Table Menu' },
            lazy: page(() => import('@/pages/customer/TableMenu')),
          },
          {
            path: '/table/:tableId/menu',
            handle: { tab: 'Table Menu' },
            lazy: page(() => import('@/pages/customer/TableMenu')),
          },
          {
            path: '/table/:tableId/menu/:itemId',
            handle: { tab: 'Item Details' },
            lazy: page(() => import('@/pages/customer/ItemDetails')),
          },
          {
            path: '/table/:tableId/cart',
            handle: { tab: 'Cart' },
            lazy: page(() => import('@/pages/customer/Cart')),
          },
          {
            path: '/table/:tableId/checkout',
            handle: { tab: 'Checkout' },
            lazy: page(() => import('@/pages/customer/Checkout')),
          },
          {
            path: '/table/:tableId/orders',
            handle: { tab: 'Order Status' },
            lazy: page(() => import('@/pages/customer/OrderStatus')),
          },
        ],
      },
      {
        path: '/staff/login',
        handle: { tab: 'Staff Login' },
        lazy: page(() => import('@/pages/staff/StaffLogin')),
      },
      {
        path: '/kitchen',
        handle: { tab: 'Kitchen' },
        lazy: page(() => import('@/pages/staff/KitchenDisplay')),
      },
      {
        path: '/staff',
        element: <DashboardLayout title="Staff" items={staffNav} />,
        children: [
          {
            index: true,
            lazy: page(() => import('@/pages/staff/StaffDashboard')),
            handle: { tab: 'Staff Dashboard' },
          },
          {
            path: 'reservations',
            lazy: page(() => import('@/pages/staff/TodaysReservations')),
            handle: { tab: "Today's Reservations" },
          },
          {
            path: 'tables',
            lazy: page(() => import('@/pages/staff/TableStatus')),
            handle: { tab: 'Table Status' },
          },
          {
            path: 'orders',
            lazy: page(() => import('@/pages/staff/OrdersPayments')),
            handle: { tab: 'Orders and Payments' },
          },
          { path: '*', element: <NotFound home="/staff" />, handle: { tab: 'Page Not Found' } },
        ],
      },
      {
        path: '/admin',
        element: <DashboardLayout title="Admin" items={adminNav} />,
        children: [
          {
            index: true,
            lazy: page(() => import('@/pages/admin/AdminDashboard')),
            handle: { tab: 'Admin Dashboard' },
          },
          {
            path: 'menu',
            lazy: page(() => import('@/pages/admin/MenuManagement')),
            handle: { tab: 'Menu Management' },
          },
          {
            path: 'menu/new',
            lazy: page(() => import('@/pages/admin/MenuItemForm')),
            handle: { title: 'Add Menu Item', tab: 'Add Menu Item' },
          },
          {
            path: 'menu/:id/edit',
            lazy: page(() => import('@/pages/admin/MenuItemForm')),
            handle: { title: 'Edit Menu Item', tab: 'Edit Menu Item' },
          },
          {
            path: 'categories',
            lazy: page(() => import('@/pages/admin/Categories')),
            handle: { tab: 'Categories' },
          },
          {
            path: 'tables',
            lazy: page(() => import('@/pages/admin/TablesQr')),
            handle: { tab: 'Tables and QR Codes' },
          },
          {
            path: 'reservations',
            lazy: page(() => import('@/pages/admin/Reservations')),
            handle: { tab: 'Reservations' },
          },
          {
            path: 'orders',
            lazy: page(() => import('@/pages/admin/OrderHistory')),
            handle: { tab: 'Order History' },
          },
          {
            path: 'payments',
            lazy: page(() => import('@/pages/admin/Payments')),
            handle: { tab: 'Payments' },
          },
          {
            path: 'reports',
            lazy: page(() => import('@/pages/admin/Reports')),
            handle: { tab: 'Reports' },
          },
          {
            path: 'users',
            lazy: page(() => import('@/pages/admin/StaffAccounts')),
            handle: { tab: 'Staff Accounts' },
          },
          {
            path: 'settings',
            lazy: page(() => import('@/pages/admin/Settings')),
            handle: { tab: 'Settings' },
          },
          { path: '*', element: <NotFound home="/admin" />, handle: { tab: 'Page Not Found' } },
        ],
      },
    ],
  },
])
