export type UserRole = 'admin' | 'staff' | 'kitchen'
export type TableStatus = 'available' | 'occupied' | 'reserved'
export type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled'
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served'
export type OrderPaymentStatus = 'unpaid' | 'paid'
export type PaymentMethod = 'online' | 'cash'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type NotificationStatus = 'sent' | 'failed'

export type User = {
  user_id: number
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export type Customer = {
  customer_id: number
  full_name: string
  mobile_number: string
  email: string | null
  created_at: string
}

export type RestaurantTable = {
  table_id: number
  table_number: string
  capacity: number
  qr_token: string
  status: TableStatus
}

export type Reservation = {
  reservation_id: number
  customer_id: number
  table_id: number | null
  reference_code: string
  reservation_date: string
  reservation_time: string
  pax: number
  special_request: string | null
  deposit_amount: number
  status: ReservationStatus
  created_at: string
}

export type PublicReservation = Reservation & {
  customer: { full_name: string; mobile_number: string }
  table_number: string | null
  deposit_status: 'paid' | 'unpaid'
}

export type Category = {
  category_id: number
  name: string
  sort_order: number
}

export type MenuItem = {
  item_id: number
  category_id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  is_recommended: boolean
}

export type Order = {
  order_id: number
  table_id: number
  customer_id: number | null
  customer_name: string | null
  status: OrderStatus
  total_amount: number
  payment_status: OrderPaymentStatus
  created_at: string
}

export type OrderItem = {
  order_item_id: number
  order_id: number
  item_id: number
  quantity: number
  unit_price: number
  notes: string | null
}

export type Payment = {
  payment_id: number
  order_id: number | null
  reservation_id: number | null
  received_by: number | null
  method: PaymentMethod
  provider_reference: string | null
  amount: number
  status: PaymentStatus
  paid_at: string | null
}

export type Notification = {
  notification_id: number
  customer_id: number
  type: 'sms'
  message: string
  status: NotificationStatus
  sent_at: string
}

export type RestaurantSettings = {
  setting_id: number
  restaurant_name: string
  address: string | null
  contact_number: string | null
  email: string | null
  facebook_url: string | null
  logo_url: string | null
  deposit_per_guest: number
  service_charge_percent: number
  slot_minutes: number
  max_pax: number
  deposit_required: boolean
  updated_at: string
}

export type OpeningHours = {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_open: boolean
}
