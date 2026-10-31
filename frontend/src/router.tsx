import { createBrowserRouter } from 'react-router-dom'
import CustomerLayout from '@/layouts/CustomerLayout'
import DashboardLayout, { type NavItem } from '@/layouts/DashboardLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import Categories from '@/pages/admin/Categories'
import MenuItemForm from '@/pages/admin/MenuItemForm'
import MenuManagement from '@/pages/admin/MenuManagement'
import OrderHistory from '@/pages/admin/OrderHistory'
import Payments from '@/pages/admin/Payments'
import Reports from '@/pages/admin/Reports'
import Reservations from '@/pages/admin/Reservations'
import Settings from '@/pages/admin/Settings'
import StaffAccounts from '@/pages/admin/StaffAccounts'
import TablesQr from '@/pages/admin/TablesQr'
import Placeholder from '@/pages/Placeholder'
import About from '@/pages/customer/About'
import Cart from '@/pages/customer/Cart'
import Checkout from '@/pages/customer/Checkout'
import DepositPayment from '@/pages/customer/DepositPayment'
import FindReservation from '@/pages/customer/FindReservation'
import Home from '@/pages/customer/Home'
import ItemDetails from '@/pages/customer/ItemDetails'
import Menu from '@/pages/customer/Menu'
import OrderStatus from '@/pages/customer/OrderStatus'
import ReservationConfirmation from '@/pages/customer/ReservationConfirmation'
import ReserveTable from '@/pages/customer/ReserveTable'
import TableMenu from '@/pages/customer/TableMenu'
import OrdersPayments from '@/pages/staff/OrdersPayments'
import StaffDashboard from '@/pages/staff/StaffDashboard'
import ForgotPassword from '@/pages/customer/ForgotPassword'
import Login from '@/pages/customer/Login'
import MyReservations from '@/pages/customer/MyReservations'
import Register from '@/pages/customer/Register'
import ResetPassword from '@/pages/customer/ResetPassword'
import KitchenDisplay from '@/pages/staff/KitchenDisplay'
import StaffLogin from '@/pages/staff/StaffLogin'
import TableStatus from '@/pages/staff/TableStatus'
import TodaysReservations from '@/pages/staff/TodaysReservations'

const staffNav: NavItem[] = [
  { to: '/staff', label: 'Dashboard' },
  { to: '/staff/reservations', label: 'Reservations', title: "Today's Reservations" },
  { to: '/staff/tables', label: 'Table Status' },
  { to: '/staff/orders', label: 'Orders and Payments' },
]

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/menu', label: 'Menu', title: 'Menu Management' },
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
      { path: '/reservation', element: <FindReservation /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/my-reservations', element: <MyReservations /> },
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
  { path: '/kitchen', element: <KitchenDisplay /> },
  {
    path: '/staff',
    element: <DashboardLayout title="Staff" items={staffNav} />,
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: 'reservations', element: <TodaysReservations /> },
      { path: 'tables', element: <TableStatus /> },
      { path: 'orders', element: <OrdersPayments /> },
    ],
  },
  {
    path: '/admin',
    element: <DashboardLayout title="Admin" items={adminNav} />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'menu', element: <MenuManagement /> },
      { path: 'menu/new', element: <MenuItemForm />, handle: { title: 'Add Menu Item' } },
      {
        path: 'menu/:id/edit',
        element: <MenuItemForm />,
        handle: { title: 'Edit Menu Item' },
      },
      { path: 'categories', element: <Categories /> },
      { path: 'tables', element: <TablesQr /> },
      { path: 'reservations', element: <Reservations /> },
      { path: 'orders', element: <OrderHistory /> },
      { path: 'payments', element: <Payments /> },
      { path: 'reports', element: <Reports /> },
      { path: 'users', element: <StaffAccounts /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Placeholder screen="—" title="Page Not Found" /> },
])
