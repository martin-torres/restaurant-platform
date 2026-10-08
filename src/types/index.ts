// ============================================================================
// Restaurant Platform — Shared TypeScript Types
// ============================================================================

// ─── Enums ───
export type TableShape = 'circle' | 'square' | 'rectangle' | 'booth_u' | 'booth_half_u' | 'bar';
export type StaffRole = 'manager' | 'server' | 'foh' | 'kitchen' | 'bar' | 'owner';
export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'picking_up' | 'delivered' | 'cancelled' | 'paid';
export type OrderType = 'dine_in' | 'to_go' | 'delivery';
/** card = credit/debit · phone = Apple Pay / Google Pay / phone wallet · cash */
export type PaymentMethod = 'card' | 'phone' | 'cash' | 'wallet'
export type QrType = 'customer' | 'server' | 'kitchen' | 'manager' | 'owner';
export type MessageUrgency = 'normal' | 'urgent' | 'critical';
export type HealthStatus = 'healthy' | 'warning' | 'critical';
export type Surface = 'customer' | 'foh' | 'kitchen' | 'bar' | 'manager' | 'owner';
export type DiscountType = 'percentage' | 'fixed' | 'bundle';

// ─── Floor Plan Color Priority (v2) ───
export type TableStatusColor =
  | 'amber'    // 1 — Customer request
  | 'red'      // 2 — Ready to pick up
  | 'green'    // 3 — In progress
  | 'yellow'   // 4 — Being delivered
  | 'blue'     // 5 — New order
  | 'darkgray' // 6 — Being cleaned
  | 'lightgray'// 7 — Occupied, no issues
  | 'none'     // 8 — Empty & available
  | 'indigo';  // Reservation (border only)

export const STATUS_PRIORITY: Record<TableStatusColor, number> = {
  amber: 1, red: 2, green: 3, yellow: 4, blue: 5,
  darkgray: 6, lightgray: 7, none: 8, indigo: 9,
};

// ─── Restaurant ───
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  hero_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  cuisine_type?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  mode: 'to-go' | 'dine-in' | 'both';
  currency: string;
  timezone: string;
  is_active: boolean;
  tier: 'basic' | 'growth' | 'strategic';
  commission_percent: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  id?: string;
  restaurant_id: string;
  data: Record<string, any>;
}

// ─── Table (Floor Plan) ───
export interface ChairPosition {
  seat_number: number;
  x: number;
  y: number;
  rotation?: number;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  floor_plan_id?: string;
  display_name: string;
  table_number: number;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  chair_positions: ChairPosition[];
  is_interactive: boolean;
  visible_to_customers: boolean;
  is_available: boolean;
  is_reserved: boolean;
  reservation_time?: string;
  reservation_name?: string;
  // Runtime status (computed, not stored)
  status_color?: TableStatusColor;
  secondary_color?: TableStatusColor;
  elapsed_minutes?: number;
}

export type PropShape = 'circle' | 'square' | 'rect' | 'booth_u' | 'booth_half_u' | 'bar';

export interface FloorProp {
  id: string;
  restaurant_id: string;
  floor_plan_id?: string;
  prop_type: 'stage' | 'bathroom' | 'window' | 'staircase' | 'wall' | 'plant' | 'other';
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // Parity with tables
  display_name?: string;
  shape: PropShape;
  seats: number;
  chair_positions: ChairPosition[];
  is_interactive: boolean;
  visible_to_customers: boolean;
  is_available: boolean;
  is_reserved: boolean;
  // Runtime status (computed, not stored)
  status_color?: string;
  secondary_color?: string;
  created_at: string;
}

export interface FloorPlan {
  id: string;
  restaurant_id: string;
  canvas_w: number;
  canvas_h: number;
  grid_size: number;
}

// ─── Menu ───
export interface MenuItem {
  id: string;
  restaurant_id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  track_inventory: boolean;
  stock: number;
  station: 'kitchen' | 'bar' | 'both';
  sort_order: number;
  options: MenuItemOption[];
}

export interface MenuItemOption {
  name: string;
  type: 'select' | 'radio' | 'checkbox';
  required: boolean;
  choices: { name: string; price_adjust: number }[];
}

// ─── Staff ───
export interface StaffMember {
  id: string;
  restaurant_id: string;
  name: string;
  role: StaffRole;
  pin: string;
  is_active: boolean;
  created_at: string;
}

export interface StaffShift {
  id: string;
  staff_id: string;
  restaurant_id: string;
  clock_in: string;
  clock_out?: string;
  tables_served: number;
  total_tips: number;
  total_sales: number;
  notes?: string;
}

// ─── Orders ───
export interface Order {
  id: string;
  restaurant_id: string;
  table_id?: string;
  customer_phone?: string;
  customer_name?: string;
  seat_number?: number;
  order_type: OrderType;
  status: OrderStatus;
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  subtotal: number;
  total: number;
  tip: number;
  notes?: string;
  is_request: boolean;
  kitchen_status?: OrderStatus;
  bar_status?: OrderStatus;
  foh_request_status?: string;
  status_timestamps: Record<string, string>;
  pickup_verification_pin?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  restaurant_id: string;
  seat_number?: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  assigned_staff_id?: string;
  notes?: string;
  options: any[];
  created_at: string;
}

// ─── Payments ───
export interface Payment {
  id: string;
  order_id: string;
  restaurant_id: string;
  method: PaymentMethod;
  amount: number;
  subtotal: number;
  tip: number;
  cash_given?: number;
  change_due?: number;
  processed_by?: string;
  status: string;
  created_at: string;
}

// ─── Promos & Events ───
export interface Promo {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value?: number;
  original_price?: number;
  image_url?: string;
  category?: string;
  active: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface Event {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  event_date?: string;
  image_url?: string;
  active: boolean;
}

// ─── Feedback ───
export interface VisitFeedback {
  id: string;
  restaurant_id: string;
  customer_id?: string;
  order_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ─── QR Code ───
export interface RestaurantQRCode {
  id: string;
  restaurant_id: string;
  qr_type: QrType;
  qr_code_data: string;
  is_active: boolean;
}

// ─── Messaging (v4) ───
export interface MessageThread {
  id: string;
  restaurant_id?: string;
  subject?: string;
}

export interface Message {
  id: string;
  thread_id: string;
  restaurant_id?: string;
  sender_role: string;
  sender_id: string;
  recipient_role?: string;
  recipient_id?: string;
  content: string;
  urgency: MessageUrgency;
  read_at?: string;
  created_at: string;
}

// ─── Customer ───
export interface CustomerProfile {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  wallet_id?: string;
}

export interface AnonymousVisit {
  id: string;
  restaurant_id?: string;
  ip_address: string;
  qr_type?: string;
  device_info: Record<string, any>;
}

// ─── Cart (Client-side only) ───
export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  seat_number?: number;
  selected_options: Record<string, string[]>;
  notes?: string;
}

export interface Cart {
  restaurant_id: string;
  table_id?: string;
  seat_number?: number;
  order_type: OrderType;
  items: CartItem[];
  notes?: string;
}

// ─── Inventory ───
export interface InventoryItem {
  id: string;
  restaurant_id: string;
  name: string;
  unit: string;
  stock: number;
  min_stock: number;
  cost_per_unit: number;
  linked_menu_item_id?: string;
}

// ─── Marketing ───
export interface MarketingCampaign {
  id: string;
  restaurant_id: string;
  name: string;
  promo_code?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_redemptions?: number;
  active: boolean;
}

// ─── Owner Panel (v4) ───
export interface RestaurantOwner {
  id: string;
  restaurant_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  preferred_contact?: string;
}

export interface RestaurantCommission {
  id: string;
  restaurant_id: string;
  commission_percent: number;
  effective_date: string;
  notes?: string;
}

export interface OwnerAction {
  id: string;
  action_type: string;
  restaurant_id?: string;
  details: Record<string, any>;
  created_at: string;
}

// ─── Dashboard Metrics (v3 + v4) ───
export interface PulseMetric {
  label: string;
  value: string | number;
  change?: { value: number; direction: 'up' | 'down'; label: string };
  sparkline?: number[];
  alert?: boolean;
  alert_label?: string;
}

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineDataPoint {
  date: string;
  value: number;
}
