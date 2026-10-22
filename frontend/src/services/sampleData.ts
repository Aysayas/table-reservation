import type {
  Category,
  Customer,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  Reservation,
  RestaurantTable,
  User,
} from '@/types/db'

export const sampleCategories: Category[] = [
  { category_id: 1, name: 'Category 1', sort_order: 1 },
  { category_id: 2, name: 'Category 2', sort_order: 2 },
  { category_id: 3, name: 'Category 3', sort_order: 3 },
]

export const sampleMenuItems: MenuItem[] = Array.from({ length: 9 }, (_, i) => ({
  item_id: i + 1,
  category_id: (i % 3) + 1,
  name: `Menu Item ${i + 1}`,
  description: 'Short description of the dish.',
  price: 0,
  image_url: null,
  is_available: i !== 8,
}))

export const sampleTables: RestaurantTable[] = Array.from({ length: 8 }, (_, i) => ({
  table_id: i + 1,
  table_number: `T${i + 1}`,
  capacity: i < 4 ? 2 : 4,
  qr_token: `sample-qr-token-${i + 1}`,
  status: i === 1 ? 'occupied' : i === 2 ? 'reserved' : 'available',
}))

export const sampleCustomers: Customer[] = [
  {
    customer_id: 1,
    full_name: 'Customer Name',
    mobile_number: '09000000000',
    email: 'customer@placeholder-domain.com',
    created_at: '2026-01-01T00:00:00',
  },
  {
    customer_id: 2,
    full_name: 'Customer Name',
    mobile_number: '09000000000',
    email: null,
    created_at: '2026-01-01T00:00:00',
  },
]

export const sampleReservations: Reservation[] = [
  {
    reservation_id: 1,
    customer_id: 1,
    table_id: 3,
    reference_code: 'RSV-000001',
    reservation_date: '2026-01-01',
    reservation_time: '18:00:00',
    pax: 4,
    special_request: null,
    deposit_amount: 0,
    status: 'confirmed',
    created_at: '2026-01-01T00:00:00',
  },
  {
    reservation_id: 2,
    customer_id: 2,
    table_id: null,
    reference_code: 'RSV-000002',
    reservation_date: '2026-01-01',
    reservation_time: '19:30:00',
    pax: 2,
    special_request: null,
    deposit_amount: 0,
    status: 'pending',
    created_at: '2026-01-01T00:00:00',
  },
]

export const sampleOrders: Order[] = [
  {
    order_id: 1,
    table_id: 2,
    customer_id: null,
    customer_name: 'Juan',
    status: 'preparing',
    total_amount: 0,
    payment_status: 'unpaid',
    created_at: '2026-01-01T12:00:00',
  },
  {
    order_id: 2,
    table_id: 5,
    customer_id: null,
    customer_name: null,
    status: 'served',
    total_amount: 0,
    payment_status: 'paid',
    created_at: '2026-01-01T12:30:00',
  },
]

export const sampleOrderItems: OrderItem[] = [
  { order_item_id: 1, order_id: 1, item_id: 1, quantity: 2, unit_price: 0, notes: null },
  { order_item_id: 2, order_id: 1, item_id: 4, quantity: 1, unit_price: 0, notes: 'No onions' },
  { order_item_id: 3, order_id: 2, item_id: 2, quantity: 1, unit_price: 0, notes: null },
]

export const samplePayments: Payment[] = [
  {
    payment_id: 1,
    order_id: 2,
    reservation_id: null,
    received_by: 2,
    method: 'cash',
    provider_reference: null,
    amount: 0,
    status: 'paid',
    paid_at: '2026-01-01T13:00:00',
  },
]

export const sampleUsers: User[] = [
  {
    user_id: 1,
    full_name: 'Admin Name',
    email: 'admin@placeholder-domain.com',
    role: 'admin',
    created_at: '2026-01-01T00:00:00',
  },
  {
    user_id: 2,
    full_name: 'Staff Name',
    email: 'staff@placeholder-domain.com',
    role: 'staff',
    created_at: '2026-01-01T00:00:00',
  },
  {
    user_id: 3,
    full_name: 'Kitchen Name',
    email: 'kitchen@placeholder-domain.com',
    role: 'kitchen',
    created_at: '2026-01-01T00:00:00',
  },
]
