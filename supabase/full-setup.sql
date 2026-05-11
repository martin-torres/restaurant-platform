-- ============================================================================
-- Restaurant Platform — Full Schema (v2 + v3 + v4)
-- Supabase Migration 001
-- ============================================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- RESTAURANTS (multi-tenant root)
-- ============================================================================
create table restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  logo_url    text,
  hero_url    text,
  address     text,
  phone       text,
  email       text,
  website     text,
  cuisine_type text,
  primary_color    text default '#1a1a2e',
  secondary_color  text default '#16213e',
  accent_color     text default '#e94560',
  background_color text default '#0f0f23',
  text_color       text default '#ffffff',
  mode        text not null default 'dine-in' check (mode in ('to-go', 'dine-in', 'both')),
  currency    text default 'MXN',
  timezone    text default 'America/Monterrey',
  is_active   boolean default true,
  tier        text default 'basic' check (tier in ('basic', 'growth', 'strategic')),
  commission_percent numeric(5,2) default 10.00,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================================
-- SETTINGS (JSON blob per restaurant)
-- ============================================================================
create table restaurant_settings (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade unique,
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- FLOOR PLANS
-- ============================================================================
create table floor_plans (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  canvas_w        integer default 1200,
  canvas_h        integer default 800,
  grid_size       integer default 20,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- TABLES (on floor plan)
-- ============================================================================
create type table_shape as enum ('circle', 'square', 'rectangle', 'booth_u', 'booth_half_u', 'bar');

create table restaurant_tables (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  floor_plan_id   uuid references floor_plans(id) on delete set null,
  display_name    text not null,
  table_number    integer not null,
  seats           integer default 4,
  shape           table_shape default 'square',
  x               real not null default 0,
  y               real not null default 0,
  width           real default 60,
  height          real default 60,
  rotation        integer default 0 check (rotation >= 0 and rotation <= 360 and rotation % 90 = 0),
  chair_positions jsonb default '[]'::jsonb,
  is_interactive  boolean default true,
  visible_to_customers boolean default true,
  is_available    boolean default true,
  is_reserved     boolean default false,
  reservation_time timestamptz,
  reservation_name text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- PROPS (non-interactive placeholders: stage, bathroom, etc.)
-- ============================================================================
create table floor_props (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  floor_plan_id   uuid references floor_plans(id) on delete set null,
  prop_type       text not null check (prop_type in ('stage', 'bathroom', 'window', 'staircase', 'wall', 'plant', 'other')),
  label           text,
  x               real not null default 0,
  y               real not null default 0,
  width           real default 40,
  height          real default 40,
  rotation        integer default 0,
  display_name    text,
  shape           text not null default 'rect' check (shape in ('circle', 'square', 'rect', 'booth_u', 'booth_half_u', 'bar')),
  seats           integer default 0,
  chair_positions jsonb default '[]'::jsonb,
  is_interactive  boolean default false,
  visible_to_customers boolean default true,
  is_available    boolean default true,
  is_reserved     boolean default false,
  status_color    text default 'none',
  secondary_color  text,
  created_at      timestamptz default now()
);

-- ============================================================================
-- STAFF
-- ============================================================================
create type staff_role as enum ('manager', 'server', 'foh', 'kitchen', 'bar', 'owner');

create table staff (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  name            text not null,
  passcode_hash   text not null,
  role            staff_role not null default 'server',
  pin             text not null,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- SHIFTS
-- ============================================================================
create table staff_shifts (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid not null references staff(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  clock_in        timestamptz not null default now(),
  clock_out       timestamptz,
  tables_served   integer default 0,
  total_tips      numeric(10,2) default 0,
  total_sales     numeric(10,2) default 0,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================================
-- MENU ITEMS
-- ============================================================================
create table menu_items (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  category        text not null,
  name            text not null,
  description     text,
  price           numeric(10,2) not null,
  image_url       text,
  is_available    boolean default true,
  track_inventory boolean default false,
  stock           integer default -1,  -- -1 = unlimited
  station         text check (station in ('kitchen', 'bar', 'both')) default 'kitchen',
  sort_order      integer default 0,
  options         jsonb default '[]'::jsonb,  -- size, toppings, etc.
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- INVENTORY (for COGS, waste tracking)
-- ============================================================================
create table inventory_items (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  name            text not null,
  unit            text default 'pcs',
  stock           numeric(10,2) default 0,
  min_stock       numeric(10,2) default 0,
  cost_per_unit   numeric(10,2) default 0,
  linked_menu_item_id uuid references menu_items(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table inventory_alerts (
  id              uuid primary key default gen_random_uuid(),
  inventory_id    uuid not null references inventory_items(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  alert_type      text default 'low_stock',
  resolved        boolean default false,
  created_at      timestamptz default now()
);

-- ============================================================================
-- ORDERS
-- ============================================================================
create type order_status as enum ('new', 'in_progress', 'ready', 'picking_up', 'delivered', 'cancelled');
create type order_type as enum ('dine_in', 'to_go', 'delivery');
create type payment_method as enum ('wallet', 'card', 'cash');

create table orders (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  table_id          uuid references restaurant_tables(id) on delete set null,
  customer_phone    text,
  customer_name     text,
  seat_number       integer,  -- which seat at the table
  order_type        order_type not null default 'dine_in',
  status            order_status not null default 'new',
  subtotal          numeric(10,2) default 0,
  total             numeric(10,2) default 0,
  tip               numeric(10,2) default 0,
  notes             text,
  is_request        boolean default false,  -- customer service/bill request
  kitchen_status    order_status,
  bar_status        order_status,
  foh_request_status text,
  status_timestamps jsonb default '{}'::jsonb,
  pickup_verification_pin text,  -- 4-digit PIN for pickup
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================================
-- ORDER ITEMS
-- ============================================================================
create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  menu_item_id    uuid references menu_items(id) on delete set null,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  seat_number     integer,
  name            text not null,
  quantity        integer not null default 1,
  unit_price      numeric(10,2) not null,
  total_price     numeric(10,2) not null,
  status          order_status not null default 'new',
  assigned_staff_id uuid references staff(id) on delete set null,
  notes           text,
  options         jsonb default '[]'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
create table payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  method          payment_method not null,
  amount          numeric(10,2) not null,
  subtotal        numeric(10,2) default 0,
  tip             numeric(10,2) default 0,
  cash_given      numeric(10,2),  -- for cash payments
  change_due      numeric(10,2),
  processed_by    uuid references staff(id) on delete set null,
  status          text default 'completed',
  created_at      timestamptz default now()
);

-- ============================================================================
-- PROMOS & EVENTS
-- ============================================================================
create table promos (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  name              text not null,
  description       text,
  discount_type     text check (discount_type in ('percentage', 'fixed', 'bundle')) default 'percentage',
  discount_value    numeric(10,2),
  original_price    numeric(10,2),
  image_url         text,
  category          text,
  active            boolean default true,
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table events (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  name              text not null,
  description       text,
  event_date        timestamptz,
  image_url         text,
  active            boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================================
-- CUSTOMER TRACKING (v3 — Anonymous visits + attribution)
-- ============================================================================
create table anonymous_visits (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  ip_address      inet,
  qr_type         text,
  device_info     jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create table customer_profiles (
  id              uuid primary key default gen_random_uuid(),
  phone           text unique,
  email           text,
  name            text,
  wallet_id       text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table customer_visits (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references customer_profiles(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  ip_address      inet,
  visit_type      text default 'scan',
  created_at      timestamptz default now()
);

create table ip_to_customer (
  id              uuid primary key default gen_random_uuid(),
  ip_address      inet not null,
  customer_id     uuid not null references customer_profiles(id) on delete cascade,
  linked_at       timestamptz default now()
);

-- ============================================================================
-- VISIT FEEDBACK (v3)
-- ============================================================================
create table visit_feedback (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  customer_id     uuid references customer_profiles(id) on delete set null,
  order_id        uuid references orders(id) on delete set null,
  rating          integer not null check (rating >= 1 and rating <= 5),
  comment         text,
  created_at      timestamptz default now()
);

-- ============================================================================
-- QR CODES (v3)
-- ============================================================================
create type qr_type as enum ('customer', 'server', 'kitchen', 'manager', 'owner');

create table restaurant_qr_codes (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  qr_type           qr_type not null,
  qr_code_data      text not null,
  is_active         boolean default true,
  generated_at      timestamptz default now(),
  unique(restaurant_id, qr_type)
);

-- ============================================================================
-- MESSAGING (v4 — Universal in-app messaging)
-- ============================================================================
create type message_urgency as enum ('normal', 'urgent', 'critical');

create table message_threads (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  subject         text,
  created_at      timestamptz default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid references message_threads(id) on delete cascade,
  restaurant_id   uuid references restaurants(id) on delete cascade,
  sender_role     text not null,  -- 'platform_owner', 'restaurant_owner', 'manager', 'foh', 'kitchen', 'bar'
  sender_id       uuid,  -- references staff.id or platform_owner
  recipient_role  text,
  recipient_id    uuid,
  content         text not null,
  urgency         message_urgency default 'normal',
  read_at         timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================================
-- RESTAURANT OWNERS (v4)
-- ============================================================================
create table restaurant_owners (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade unique,
  name            text not null,
  phone           text,
  email           text,
  address         text,
  notes           text,
  preferred_contact text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- PLATFORM OWNER (v4 — Martín)
-- ============================================================================
create table platform_owner (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  name            text not null,
  passcode_hash   text not null,
  created_at      timestamptz default now()
);

-- ============================================================================
-- COMMISSION MANAGEMENT (v4)
-- ============================================================================
create table restaurant_commissions (
  id                  uuid primary key default gen_random_uuid(),
  restaurant_id       uuid not null references restaurants(id) on delete cascade,
  commission_percent  numeric(5,2) not null,
  effective_date      timestamptz not null default now(),
  notes               text,
  created_at          timestamptz default now()
);

-- ============================================================================
-- PLATFORM METRICS (v4 — Infrastructure monitoring)
-- ============================================================================
create table platform_revenue (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid references restaurants(id) on delete cascade,
  revenue         numeric(12,2) not null,
  commissions     numeric(12,2) default 0,
  recorded_date   date not null default current_date,
  created_at      timestamptz default now()
);

create table platform_metrics (
  id              uuid primary key default gen_random_uuid(),
  metric_name     text not null,
  metric_value    numeric(12,2) not null,
  metric_unit     text,
  recorded_at     timestamptz default now()
);

create table restaurant_health_log (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  health_status   text check (health_status in ('healthy', 'warning', 'critical')),
  revenue_today   numeric(10,2),
  orders_active   integer,
  avg_wait_time   integer,  -- minutes
  recorded_at     timestamptz default now()
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================
create table staff_actions (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid not null references staff(id) on delete cascade,
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  action_type     text not null,
  table_id        uuid references restaurant_tables(id) on delete set null,
  order_id        uuid references orders(id) on delete set null,
  details         jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create table owner_actions (
  id              uuid primary key default gen_random_uuid(),
  action_type     text not null,
  restaurant_id   uuid references restaurants(id) on delete set null,
  details         jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create table table_status_history (
  id              uuid primary key default gen_random_uuid(),
  table_id        uuid not null references restaurant_tables(id) on delete cascade,
  old_status      text,
  new_status      text not null,
  changed_by      uuid references staff(id) on delete set null,
  created_at      timestamptz default now()
);

-- ============================================================================
-- WASTE & COMP TRACKING (v3 Tier 3)
-- ============================================================================
create table waste_log (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  order_item_id   uuid references order_items(id) on delete set null,
  reason_code     text not null,  -- 'mistake', 'overprep', 'expired', 'comp'
  quantity        integer not null,
  cost            numeric(10,2) default 0,
  notes           text,
  created_at      timestamptz default now()
);

-- ============================================================================
-- MARKETING CAMPAIGNS (v3 Tier 3)
-- ============================================================================
create table marketing_campaigns (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  name              text not null,
  promo_code        text,
  discount_type     text check (discount_type in ('percentage', 'fixed')),
  discount_value    numeric(10,2),
  max_redemptions   integer,
  starts_at         timestamptz,
  ends_at           timestamptz,
  active            boolean default true,
  created_at        timestamptz default now()
);

create table campaign_redemptions (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references marketing_campaigns(id) on delete cascade,
  order_id          uuid references orders(id) on delete cascade,
  discount_applied  numeric(10,2),
  created_at        timestamptz default now()
);

-- ============================================================================
-- REVIEW AGGREGATIONS (v3 Tier 3 — cached external reviews)
-- ============================================================================
create table review_aggregations (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references restaurants(id) on delete cascade unique,
  google_rating     numeric(3,2),
  google_review_count integer,
  yelp_rating       numeric(3,2),
  yelp_review_count integer,
  in_app_avg_rating numeric(3,2),
  in_app_count      integer,
  sentiment_trend   text,  -- 'up', 'down', 'stable'
  last_fetched_at   timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_restaurant_tables_restaurant on restaurant_tables(restaurant_id);
create index idx_menu_items_restaurant on menu_items(restaurant_id);
create index idx_menu_items_category on menu_items(restaurant_id, category);
create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_table on orders(table_id);
create index idx_orders_status on orders(restaurant_id, status);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_status on order_items(order_id, status);
create index idx_staff_restaurant on staff(restaurant_id);
create index idx_staff_actions_staff on staff_actions(staff_id);
create index idx_staff_actions_restaurant on staff_actions(restaurant_id);
create index idx_payments_order on payments(order_id);
create index idx_messages_thread on messages(thread_id);
create index idx_messages_recipient on messages(recipient_id, read_at);
create index idx_anonymous_visits_ip on anonymous_visits(ip_address);
create index idx_customer_visits_customer on customer_visits(customer_id);
create index idx_visit_feedback_restaurant on visit_feedback(restaurant_id);
create index idx_platform_revenue_date on platform_revenue(recorded_date);
create index idx_restaurant_health_log on restaurant_health_log(restaurant_id, recorded_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table restaurants enable row level security;
alter table restaurant_settings enable row level security;
alter table floor_plans enable row level security;
alter table restaurant_tables enable row level security;
alter table floor_props enable row level security;
alter table staff enable row level security;
alter table staff_shifts enable row level security;
alter table menu_items enable row level security;
alter table inventory_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table promos enable row level security;
alter table events enable row level security;
alter table visit_feedback enable row level security;
alter table restaurant_qr_codes enable row level security;
alter table messages enable row level security;
alter table restaurant_owners enable row level security;

-- Customer-facing: public read for their restaurant's data
create policy "Public can read restaurants" on restaurants for select using (true);
create policy "Public can read menu_items" on menu_items for select using (true);
create policy "Public can read restaurant_tables" on restaurant_tables for select using (true);
create policy "Public can read promos" on promos for select using (true);
create policy "Public can read events" on events for select using (true);
create policy "Public can read floor_plans" on floor_plans for select using (true);

-- Customers can create orders
create policy "Customers can create orders" on orders for insert with check (true);
create policy "Customers can read own orders" on orders for select using (true);

-- Feedback: anyone can create
create policy "Anyone can submit feedback" on visit_feedback for insert with check (true);

-- Anonymous visits: anyone can insert
create policy "Anyone can record visit" on anonymous_visits for insert with check (true);

-- ============================================================================
-- Seed Data: 5 Restaurants for Testing & Demo
-- Run after migration. All prices in MXN.
-- ============================================================================

-- ============================================================================
-- 1. DI PASQUALE — Italian Restaurant (Morelos 908, Barrio Antiguo)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
(md5('r_dipasquale')::uuid, 'Di Pasquale', 'di-pasquale', 'Auténtica cocina italiana desde 1992. Pizzas artesanales, pastas frescas y antipasti en el corazón de Barrio Antiguo.', 'Calle Morelos 908 Ote, Barrio Antiguo, Centro, 64000 Monterrey', '8180000001', 'Italiana', 'dine-in', 'MXN', '#8B1A1A', '#C41E3A', '#D4AF37');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES (md5('r_dipasquale')::uuid, 'Pasquale Vallone', '8180000001', 'pasquale@dipasquale.mx');

-- Antipasti
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Antipasti', 'Bruschetta Toscana', 'Tostín gratinado con queso mozzarella, tomate y especias', 95, 'kitchen', 1),
(md5('r_dipasquale')::uuid, 'Antipasti', 'Portobello', 'Hongo portobello asado a las finas hierbas y gratinado con queso mozzarella', 120, 'kitchen', 2),
(md5('r_dipasquale')::uuid, 'Antipasti', 'Carpaccio de Res', 'Finas láminas de res acompañadas de arúgula y queso parmesano', 155, 'kitchen', 3),
(md5('r_dipasquale')::uuid, 'Antipasti', 'Crema de Tomate', 'Crema suave de tomate con albahaca fresca', 85, 'kitchen', 4);

-- Ensaladas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Ensaladas', 'Ensalada César', 'Lechuga romana, crutones, queso parmesano y aderezo César', 140, 'kitchen', 5),
(md5('r_dipasquale')::uuid, 'Ensaladas', 'Ensalada Mediterránea', 'Mezcla de lechugas con queso mozzarella y carnes frías, aderezo de finas hierbas', 135, 'kitchen', 6),
(md5('r_dipasquale')::uuid, 'Ensaladas', 'Ensalada Caprese', 'Queso mozzarella fresco, tomate, albahaca y pesto', 130, 'kitchen', 7);

-- Pastas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Pastas', 'Lasagna', 'Láminas de pasta con salsa bolognesa, bechamel, mozzarella y parmesano gratinado', 185, 'kitchen', 8),
(md5('r_dipasquale')::uuid, 'Pastas', 'Pasta Carbonara', 'Yema, pancetta (tocino italiano) y queso parmesano', 165, 'kitchen', 9),
(md5('r_dipasquale')::uuid, 'Pastas', 'Pasta Alfredo con Champiñón', 'Salsa de crema con queso parmesano y champiñón', 140, 'kitchen', 10),
(md5('r_dipasquale')::uuid, 'Pastas', 'Pasta Pomodoro', 'Salsa tradicional de tomate con albahaca fresca', 130, 'kitchen', 11),
(md5('r_dipasquale')::uuid, 'Pastas', 'Pasta Pesto Verde', 'Albahaca fresca, piñones, aceite de oliva y queso parmesano', 150, 'kitchen', 12),
(md5('r_dipasquale')::uuid, 'Pastas', 'Pasta Arrabiata', 'Salsa de tomate picante con chile de árbol', 140, 'kitchen', 13),
(md5('r_dipasquale')::uuid, 'Pastas', 'Pasta 4 Quesos', 'Mozzarella, gorgonzola, emmental y gouda en salsa cremosa', 160, 'kitchen', 14),
(md5('r_dipasquale')::uuid, 'Pastas', 'Linguini Gamberi', 'Linguini al pesto con camarón (200g)', 195, 'kitchen', 15),
(md5('r_dipasquale')::uuid, 'Pastas', 'Espagueti Frutti di Mare', 'Mezcla de mariscos con salsa pomodoro', 210, 'kitchen', 16);

-- Pizzas (individual 30cm)
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Pizzas', 'Regina Margherita', 'Mozzarella, albahaca y aceite de oliva extra virgen', 145, 'kitchen', 17),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Pepperoni', 'Pepperoni, champiñones y mozzarella', 145, 'kitchen', 18),
(md5('r_dipasquale')::uuid, 'Pizzas', '4 Formaggi', 'Mozzarella, emmental, gorgonzola y gouda con salsa alfredo', 195, 'kitchen', 19),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Saporita', 'Base 4 quesos, tomates horneados y jamón serrano', 240, 'kitchen', 20),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Toscana', 'Mozzarella, jamón serrano, arúgula, parmesano y salami', 235, 'kitchen', 21),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Contessa', 'Jamón serrano, queso de cabra, mozzarella y espinacas baby', 195, 'kitchen', 22),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Mari e Monti', 'Camarones, champiñones, hojuelas de chile y mozzarella', 205, 'kitchen', 23),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Hawaii', 'Jamón de pavo, piña y tocino', 135, 'kitchen', 24),
(md5('r_dipasquale')::uuid, 'Pizzas', 'Americana Hot', 'Doble mozzarella picante, pepperoni y hojuelas de chile', 160, 'kitchen', 25);

-- Especiales
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Especiales', 'Huachinango al Limoncello', 'Huachinango montado sobre pasta blanca cremosa', 240, 'kitchen', 26),
(md5('r_dipasquale')::uuid, 'Especiales', 'Salmón Siciliano', '220g de salmón acompañado con vegetales salteados', 260, 'kitchen', 27),
(md5('r_dipasquale')::uuid, 'Especiales', 'Rib Eye a las Finas Hierbas', '300g de rib eye con papitas al romero', 320, 'kitchen', 28),
(md5('r_dipasquale')::uuid, 'Especiales', 'Pechuga de Pollo al Grill', '220g de pechuga con vegetales y papitas al romero', 195, 'kitchen', 29);

-- Postres
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Postres', 'Tiramisú', 'Clásico postre italiano con mascarpone, café y cacao', 95, 'kitchen', 30),
(md5('r_dipasquale')::uuid, 'Postres', 'Mousse de Glorias', 'Suave mousse con sabor a glorias', 95, 'kitchen', 31),
(md5('r_dipasquale')::uuid, 'Postres', 'Brownie con Nieve', 'Brownie de chocolate caliente con nieve de vainilla', 90, 'kitchen', 32);

-- Bebidas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_dipasquale')::uuid, 'Bebidas', 'Café Americano', 'Café americano recién preparado', 48, 'bar', 33),
(md5('r_dipasquale')::uuid, 'Bebidas', 'Cappuccino', 'Cappuccino italiano espumoso', 50, 'bar', 34),
(md5('r_dipasquale')::uuid, 'Bebidas', 'Limonada', 'Limonada natural fresca', 35, 'bar', 35),
(md5('r_dipasquale')::uuid, 'Bebidas', 'Sangría Topo Chico', 'Sangría original o light 600ml', 25, 'bar', 36),
(md5('r_dipasquale')::uuid, 'Bebidas', 'Coca-Cola', 'Coca-Cola original o light 500ml', 25, 'bar', 37),
(md5('r_dipasquale')::uuid, 'Bebidas', 'Agua Embotellada', 'Agua purificada 500ml', 20, 'bar', 38);

-- ============================================================================
-- 2. AZÚCAR Y NUEZ — Artisan Desserts (Guadalupe Centro)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
(md5('r_azucarynuez')::uuid, 'Azúcar y Nuez', 'azucar-y-nuez', 'Postres artesanales recién hechos, sin conservadores y con ingredientes de la mejor calidad. Cheesecakes, pays y más.', 'Guadalupe Centro, Monterrey', '8180000002', 'Postres', 'to-go', 'MXN', '#8B4513', '#D2691E', '#F5DEB3');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES (md5('r_azucarynuez')::uuid, 'María Azúcar', '8180000002', 'hola@azucarynuez.mx');

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_azucarynuez')::uuid, 'Cheesecakes', 'Cheesecake Clásico', 'Cheesecake cremoso con base de galleta', 95, 'kitchen', 1),
(md5('r_azucarynuez')::uuid, 'Cheesecakes', 'Cheesecake de Manzana con Canela', 'Cheesecake con lajitas de manzana, canela y crujientes trocitos de nuez', 110, 'kitchen', 2),
(md5('r_azucarynuez')::uuid, 'Cheesecakes', 'Cheesecake de Plátano', 'Cheesecake suave con plátano natural y caramelo', 110, 'kitchen', 3),
(md5('r_azucarynuez')::uuid, 'Cheesecakes', 'Cheesecake Tortuga', 'Cheesecake con caramelo, nuez y chocolate', 120, 'kitchen', 4),
(md5('r_azucarynuez')::uuid, 'Cheesecakes', 'Cheesecake de Coco', 'Cheesecake con coco rallado y base de galleta', 110, 'kitchen', 5);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_azucarynuez')::uuid, 'Pays', 'Pay de Nuez Clásico', 'Pay de nuez con relleno suave de cajeta y nuez caramelizada', 95, 'kitchen', 6),
(md5('r_azucarynuez')::uuid, 'Pays', 'Pay de Queso', 'Pay de queso cremoso con cubierta de mermelada', 90, 'kitchen', 7),
(md5('r_azucarynuez')::uuid, 'Pays', 'Pay de Limón', 'Pay de limón con merengue italiano', 90, 'kitchen', 8);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_azucarynuez')::uuid, 'Postres Individuales', 'Mostachón', 'Clásico mostachón con crema, nuez y merengue', 75, 'kitchen', 9),
(md5('r_azucarynuez')::uuid, 'Postres Individuales', 'Alfajor', 'Suaves capas rellenas de dulce de leche con azúcar glass', 45, 'kitchen', 10),
(md5('r_azucarynuez')::uuid, 'Postres Individuales', 'Beso de Ángel', 'Suave suspiro relleno de crema', 40, 'kitchen', 11),
(md5('r_azucarynuez')::uuid, 'Postres Individuales', 'Flan Napolitano', 'Flan cremoso de vainilla con caramelo', 55, 'kitchen', 12);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_azucarynuez')::uuid, 'Bebidas', 'Café Americano', 'Café de especialidad americano', 35, 'bar', 13),
(md5('r_azucarynuez')::uuid, 'Bebidas', 'Café de Olla', 'Café de olla con canela y piloncillo', 40, 'bar', 14),
(md5('r_azucarynuez')::uuid, 'Bebidas', 'Capuccino', 'Capuccino espumoso', 45, 'bar', 15),
(md5('r_azucarynuez')::uuid, 'Bebidas', 'Chocolate Caliente', 'Chocolate caliente artesanal', 45, 'bar', 16),
(md5('r_azucarynuez')::uuid, 'Bebidas', 'Limonada Natural', 'Limonada fresca', 30, 'bar', 17);

-- ============================================================================
-- 3. LOS BUCANEROS — Mexican Seafood & Breakfast (Monterrey)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
(md5('r_bucaneros')::uuid, 'Los Bucaneros', 'los-bucaneros', 'Cocina de mar y desayunos tradicionales. Nuestros huevos bucaneros y chilaquiles marineros son famosos en Monterrey.', 'Monterrey Centro', '8180000003', 'Mariscos y Mexicana', 'dine-in', 'MXN', '#1B4965', '#0D1B2A', '#E0A96D');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES (md5('r_bucaneros')::uuid, 'Capitán Bucanero', '8180000003', 'capitan@bucaneros.mx');

-- Desayunos
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_bucaneros')::uuid, 'Desayunos', 'Huevos Bucaneros', 'Dos huevos estrellados sobre cama de camarones bañados en salsa ranchera, con aguacate y frijoles refritos', 185, 'kitchen', 1),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Huevos Rancheros', 'Huevos con salsa ranchera de la casa, chilaquiles y frijoles refritos', 155, 'kitchen', 2),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Omelette Tradicional', 'Relleno de jamón y queso bañado en salsa ranchera con chilaquiles', 155, 'kitchen', 3),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Omelette Portobello', 'Relleno de portobello sazonado con tomates y queso panela, bañado en alioli de chile ancho', 160, 'kitchen', 4),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Omelette de Claras', 'Claras de 3 huevos rellenas de espinacas, cebolla y champiñones con ensalada caprese', 150, 'kitchen', 5),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Chilaquiles Verdes/Rojos', 'Chilaquiles con crema, cebolla morada, gratinados con queso y frijoles refritos', 125, 'kitchen', 6),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Chilaquiles Marineros', 'Bañados en salsa de chile güerito con camarón o pulpo gratinados, aguacate y frijoles', 175, 'kitchen', 7),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Enchiladas Suizas', 'Tres enchiladas de pollo bañadas con salsa cremosa de chilaca', 165, 'kitchen', 8),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Enchiladas Bucaneros', 'Tres enchiladas de camarón o marlin a la mexicana con ensalada y frijoles', 175, 'kitchen', 9),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Machaca de Res', 'Dos huevos revueltos con machaca a la mexicana, chilaquiles y frijoles', 185, 'kitchen', 10),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Pozole de Camarón', 'Maíz pozolero con camarón fresco y seco, cebolla, lechuga, totopos y salsita roja', 175, 'kitchen', 11),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Pancakes Bucaneros', 'Tres hot cakes grandes con fresas, kiwi, tocino y buttermilk', 130, 'kitchen', 12),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Chocowaffles', 'Dos waffles bañados con chocolate, frutos rojos y buttermilk', 115, 'kitchen', 13),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Panini del Chef', 'Pan chapata con pechuga de pollo a la plancha, espinaca y jocoque, con ensalada caprese', 175, 'kitchen', 14),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Molletes Mexicanos', 'Con chorizo, queso gratinado y pico de gallo', 130, 'kitchen', 15),
(md5('r_bucaneros')::uuid, 'Desayunos', 'Plato de Frutas', 'Melón, piña, papaya, kiwi, fresas con miel, granola y queso cottage', 120, 'kitchen', 16);

-- Entradas
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_bucaneros')::uuid, 'Entradas', 'Cucurucho de Atún', 'Tres canastitas de maíz rellenas de atún fresco con mango, cacahuate y aguacate', 205, 'kitchen', 17),
(md5('r_bucaneros')::uuid, 'Entradas', 'Arroz Marinero', 'Arroz frito con vino blanco, almeja, mejillones, camarón y filete de pescado', 205, 'kitchen', 18),
(md5('r_bucaneros')::uuid, 'Entradas', 'Pulpo Bucaneros', 'Pulpo a las brasas perfumado con ajillo y aceite de olivo', 345, 'kitchen', 19),
(md5('r_bucaneros')::uuid, 'Entradas', 'Pulpo Zarandeado', 'Pulpo zarandeado con receta especial de la casa terminado en carbón', 345, 'kitchen', 20),
(md5('r_bucaneros')::uuid, 'Entradas', 'Tacos Gober de Camarón', 'Tacos estilo gober con camarón fresco', 175, 'kitchen', 21);

-- Bebidas desayuno
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_bucaneros')::uuid, 'Bebidas', 'Café Americano', 'Café americano', 28, 'bar', 22),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Cappuccino', 'Cappuccino espumoso', 45, 'bar', 23),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Expresso', 'Café expresso', 35, 'bar', 24),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Jugo de Naranja', 'Jugo de naranja fresco', 40, 'bar', 25),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Juego Verde', 'Espinaca, piña, plátano y miel', 50, 'bar', 26),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Licuado de Plátano', 'Licuado de plátano con leche', 35, 'bar', 27),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Licuado de Fresa', 'Licuado de fresa con leche', 45, 'bar', 28),
(md5('r_bucaneros')::uuid, 'Bebidas', 'Chocolate Caliente', 'Chocolate caliente', 30, 'bar', 29);

-- ============================================================================
-- 4. SENCILLITO CAFÉ — Café & Books (Mina 918, Barrio Antiguo)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
(md5('r_sencillito')::uuid, 'Sencillito Café', 'sencillito-cafe', 'Café de especialidad y libros en el corazón de Barrio Antiguo. Ambiente acogedor con vistas al centro. Waffles, postres y café.', 'Francisco Javier Mina 918, Barrio Antiguo, Centro, 64000 Monterrey', '8180000004', 'Cafetería', 'dine-in', 'MXN', '#2C1810', '#4A2F1A', '#C4956A');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES (md5('r_sencillito')::uuid, 'Sencillito Café', '8180000004', 'sencillitocafe@gmail.com');

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_sencillito')::uuid, 'Café', 'Café Americano', 'Café de especialidad americano', 32, 'bar', 1),
(md5('r_sencillito')::uuid, 'Café', 'Cappuccino', 'Cappuccino de especialidad', 49, 'bar', 2),
(md5('r_sencillito')::uuid, 'Café', 'Cappuccino Frío', 'Cappuccino frío de especialidad', 54, 'bar', 3),
(md5('r_sencillito')::uuid, 'Café', 'Expresso', 'Café expresso', 32, 'bar', 4),
(md5('r_sencillito')::uuid, 'Café', 'Expresso Cortado', 'Expresso cortado con leche', 32, 'bar', 5),
(md5('r_sencillito')::uuid, 'Café', 'Macchiato', 'Macchiato de especialidad', 49, 'bar', 6),
(md5('r_sencillito')::uuid, 'Café', 'Descafeinado', 'Café descafeinado de especialidad', 32, 'bar', 7);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_sencillito')::uuid, 'Tés', 'Té Marrakesh', 'Té verde con menta y especias', 32, 'bar', 8),
(md5('r_sencillito')::uuid, 'Tés', 'Té Negro', 'Té negro clásico', 30, 'bar', 9),
(md5('r_sencillito')::uuid, 'Tés', 'Té de Hierbas', 'Infusión de hierbas naturales', 30, 'bar', 10),
(md5('r_sencillito')::uuid, 'Tés', 'Matcha Latte', 'Matcha latte cremoso', 55, 'bar', 11);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_sencillito')::uuid, 'Comida', 'Croissant de Jamón Serrano', 'Croissant recién horneado con jamón serrano y queso manchego, acompañado de papas', 95, 'kitchen', 12),
(md5('r_sencillito')::uuid, 'Comida', 'Bandeja Paisa', 'Bandeja paisa tradicional con frijoles, arroz, chicharrón, plátano, huevo y aguacate', 135, 'kitchen', 13),
(md5('r_sencillito')::uuid, 'Comida', 'Waffle Clásico', 'Waffle crujiente con miel y fruta fresca', 85, 'kitchen', 14),
(md5('r_sencillito')::uuid, 'Comida', 'Waffle con Chocolate', 'Waffle bañado en chocolate con frutos rojos', 95, 'kitchen', 15),
(md5('r_sencillito')::uuid, 'Comida', 'Castacón', 'Tostón de plátano verde relleno', 120, 'kitchen', 16);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_sencillito')::uuid, 'Postres', 'Pastel de Chocolate', 'Rebanada de pastel de chocolate artesanal', 65, 'kitchen', 17),
(md5('r_sencillito')::uuid, 'Postres', 'Cheesecake', 'Cheesecake cremoso de la casa', 70, 'kitchen', 18),
(md5('r_sencillito')::uuid, 'Postres', 'Galleta Artesanal', 'Galleta recién horneada', 25, 'kitchen', 19);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_sencillito')::uuid, 'Bebidas Frías', 'Limonada Natural', 'Limonada fresca natural', 35, 'bar', 20),
(md5('r_sencillito')::uuid, 'Bebidas Frías', 'Limonada de Coco', 'Limonada con agua de coco', 45, 'bar', 21),
(md5('r_sencillito')::uuid, 'Bebidas Frías', 'Coca-Cola', 'Coca-Cola 355ml', 25, 'bar', 22);

-- ============================================================================
-- 5. MAUI CAFÉ — Venezuelan-Mexican Fusion (Morelos 1045, Barrio Antiguo)
-- ============================================================================
INSERT INTO restaurants (id, name, slug, description, address, phone, cuisine_type, mode, currency, primary_color, secondary_color, accent_color) VALUES
(md5('r_maui')::uuid, 'Maui Café', 'maui-cafe', 'Fusión México-Venezuela en Barrio Antiguo. Arepas, empanadas, hamburguesas, tacos y coctelería de autor. Ambiente único.', 'José María Morelos 1045, Barrio Antiguo, Centro, 64000 Monterrey', '8181207032', 'Fusión Venezolana', 'dine-in', 'MXN', '#1A5276', '#2E86C1', '#F39C12');

INSERT INTO restaurant_owners (restaurant_id, name, phone, email) VALUES (md5('r_maui')::uuid, 'Maui', '8181207032', 'hola@mauimty.mx');

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_maui')::uuid, 'Arepas', 'Arepa Clásica', 'Arepa venezolana rellena de queso blanco', 75, 'kitchen', 1),
(md5('r_maui')::uuid, 'Arepas', 'Arepa Pelúa', 'Arepa rellena de carne mechada y queso', 95, 'kitchen', 2),
(md5('r_maui')::uuid, 'Arepas', 'Arepa Reina Pepiada', 'Arepa rellena de pollo con aguacate', 95, 'kitchen', 3),
(md5('r_maui')::uuid, 'Arepas', 'Arepa de Pernil', 'Arepa rellena de pernil de cerdo', 100, 'kitchen', 4);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_maui')::uuid, 'Entradas', 'Empanadas Venezolanas (3)', 'Tres empanadas de harina de maíz rellenas (carne, pollo o queso)', 85, 'kitchen', 5),
(md5('r_maui')::uuid, 'Entradas', 'Tequeños (6)', 'Seis palitos de queso enrollados en masa y fritos', 90, 'kitchen', 6),
(md5('r_maui')::uuid, 'Entradas', 'Nachos Maui', 'Nachos con carne, queso, guacamole y pico de gallo', 110, 'kitchen', 7),
(md5('r_maui')::uuid, 'Entradas', 'Patacón', 'Tostón de plátano verde con carne mechada y queso', 115, 'kitchen', 8);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_maui')::uuid, 'Hamburguesas', 'Hamburguesa Clásica', 'Carne angus 150g con queso, lechuga, tomate y cebolla', 110, 'kitchen', 9),
(md5('r_maui')::uuid, 'Hamburguesas', 'Hamburguesa Maui', 'Carne angus 200g con queso gouda, tocino, cebolla caramelizada y salsa especial', 135, 'kitchen', 10),
(md5('r_maui')::uuid, 'Hamburguesas', 'Hamburguesa Hawaiana', 'Carne angus con piña asada, jamón y queso', 120, 'kitchen', 11);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_maui')::uuid, 'Tacos', 'Tacos de Camarón (3)', 'Tres tacos de camarón con salsa especial', 95, 'kitchen', 12),
(md5('r_maui')::uuid, 'Tacos', 'Tacos de Arrachera (3)', 'Tres tacos de arrachera con cebolla caramelizada', 110, 'kitchen', 13),
(md5('r_maui')::uuid, 'Tacos', 'Tacos al Pastor (3)', 'Tres tacos al pastor estilo Maui', 85, 'kitchen', 14);

-- Coctelería
INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_maui')::uuid, 'Coctelería', 'Mojito Clásico', 'Ron, hierbabuena, limón, azúcar y soda', 168, 'bar', 15),
(md5('r_maui')::uuid, 'Coctelería', 'Mojito Tropical', 'Ron, frutas tropicales, hierbabuena y limón', 168, 'bar', 16),
(md5('r_maui')::uuid, 'Coctelería', 'Cuba Libre', 'Ron, Coca-Cola y limón', 160, 'bar', 17),
(md5('r_maui')::uuid, 'Coctelería', 'Mezcalita Cool Fruit', 'Mezcal con frutas de temporada y limón', 185, 'bar', 18),
(md5('r_maui')::uuid, 'Coctelería', 'Snow Malibu', 'Malibu, crema de coco, piña y hielo', 220, 'bar', 19),
(md5('r_maui')::uuid, 'Coctelería', 'Long Island', 'Vodka, ron, tequila, ginebra, triple sec y Coca-Cola', 250, 'bar', 20),
(md5('r_maui')::uuid, 'Coctelería', 'Pain Killer', 'Ron oscuro, crema de coco, piña y naranja', 220, 'bar', 21);

INSERT INTO menu_items (restaurant_id, category, name, description, price, station, sort_order) VALUES
(md5('r_maui')::uuid, 'Bebidas', 'Cerveza Clara', 'Cerveza clara nacional 355ml', 35, 'bar', 22),
(md5('r_maui')::uuid, 'Bebidas', 'Cerveza Oscura', 'Cerveza oscura nacional 355ml', 40, 'bar', 23),
(md5('r_maui')::uuid, 'Bebidas', 'Refresco', 'Refresco embotellado 355ml', 20, 'bar', 24),
(md5('r_maui')::uuid, 'Bebidas', 'Agua Natural', 'Agua purificada 500ml', 15, 'bar', 25),
(md5('r_maui')::uuid, 'Bebidas', 'Limonada Natural', 'Limonada fresca natural', 30, 'bar', 26);

-- ============================================================================
-- FLOOR PLANS & TABLES (sample layout for each restaurant)
-- ============================================================================

-- Di Pasquale: small intimate restaurant (8 tables)
INSERT INTO floor_plans (id, restaurant_id, canvas_w, canvas_h, grid_size) VALUES
(md5('fp_dipasquale')::uuid, md5('r_dipasquale')::uuid, 800, 600, 20);

INSERT INTO restaurant_tables (restaurant_id, floor_plan_id, display_name, table_number, seats, shape, x, y, width, height, rotation, chair_positions) VALUES
(md5('r_dipasquale')::uuid, md5('fp_dipasquale')::uuid, 'Mesa 1', 1, 2, 'square', 100, 150, 60, 60, 0, '[{"seat_number":1,"x":0,"y":-25},{"seat_number":2,"x":0,"y":25}]'),
(md5('r_dipasquale')::uuid, md5('fp_dipasquale')::uuid, 'Mesa 2', 2, 2, 'square', 300, 150, 60, 60, 0, '[{"seat_number":1,"x":0,"y":-25},{"seat_number":2,"x":0,"y":25}]'),
(md5('r_dipasquale')::uuid, md5('fp_dipasquale')::uuid, 'Mesa 3', 3, 4, 'square', 500, 150, 80, 80, 0, '[{"seat_number":1,"x":-25,"y":-25},{"seat_number":2,"x":25,"y":-25},{"seat_number":3,"x":-25,"y":25},{"seat_number":4,"x":25,"y":25}]'),
(md5('r_dipasquale')::uuid, md5('fp_dipasquale')::uuid, 'Mesa 4', 4, 4, 'square', 100, 350, 80, 80, 0, '[{"seat_number":1,"x":-25,"y":-25},{"seat_number":2,"x":25,"y":-25},{"seat_number":3,"x":-25,"y":25},{"seat_number":4,"x":25,"y":25}]'),
(md5('r_dipasquale')::uuid, md5('fp_dipasquale')::uuid, 'Mesa 5', 5, 6, 'rectangle', 300, 320, 120, 80, 0, '[{"seat_number":1,"x":-25,"y":-25},{"seat_number":2,"x":25,"y":-25},{"seat_number":3,"x":-25,"y":25},{"seat_number":4,"x":25,"y":25},{"seat_number":5,"x":0,"y":-35},{"seat_number":6,"x":0,"y":35}]'),
(md5('r_dipasquale')::uuid, md5('fp_dipasquale')::uuid, 'Mesa 6', 6, 4, 'circle', 550, 350, 80, 80, 0, '[{"seat_number":1,"x":0,"y":-30},{"seat_number":2,"x":30,"y":0},{"seat_number":3,"x":0,"y":30},{"seat_number":4,"x":-30,"y":0}]');

-- Bucaneros: larger restaurant (12 tables)
INSERT INTO floor_plans (id, restaurant_id, canvas_w, canvas_h, grid_size) VALUES
(md5('fp_bucaneros')::uuid, md5('r_bucaneros')::uuid, 1200, 800, 20);

INSERT INTO restaurant_tables (restaurant_id, floor_plan_id, display_name, table_number, seats, shape, x, y, width, height, rotation) VALUES
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 1', 1, 2, 'square', 80, 100, 60, 60, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 2', 2, 2, 'square', 220, 100, 60, 60, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 3', 3, 4, 'square', 400, 80, 80, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 4', 4, 4, 'square', 600, 80, 80, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 5', 5, 2, 'square', 800, 100, 60, 60, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 6', 6, 6, 'rectangle', 150, 300, 120, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 7', 7, 4, 'square', 400, 300, 80, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 8', 8, 4, 'square', 600, 300, 80, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 9', 9, 6, 'rectangle', 150, 500, 120, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 10', 10, 4, 'square', 400, 500, 80, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 11', 11, 4, 'square', 600, 500, 80, 80, 0),
(md5('r_bucaneros')::uuid, md5('fp_bucaneros')::uuid, 'Mesa 12', 12, 8, 'rectangle', 800, 350, 160, 100, 0);

-- ============================================================================
-- PROMOS (sample promotions)
-- ============================================================================
INSERT INTO promos (restaurant_id, name, description, discount_type, discount_value, original_price, category, active) VALUES
(md5('r_dipasquale')::uuid, 'Pizza + Bebida', 'Pizza individual + bebida por solo $179', 'fixed', 179, 195, 'Pizzas', true),
(md5('r_bucaneros')::uuid, 'Desayuno Completo', 'Café + desayuno tradicional a elegir', 'fixed', 169, 200, 'Desayunos', true),
(md5('r_sencillito')::uuid, 'Café + Postre', 'Americano + postre artesanal', 'fixed', 79, 97, 'Café', true),
(md5('r_maui')::uuid, '2x1 en Mojitos', 'Mojito clásico 2x1 todos los martes', 'percentage', 50, 168, 'Coctelería', true),
(md5('r_azucarynuez')::uuid, 'Cheesecake + Café', 'Rebanada de cheesecake + café americano', 'fixed', 110, 130, 'Cheesecakes', true);

-- ============================================================================
-- STAFF (sample accounts for testing)
-- ============================================================================
-- Di Pasquale staff
INSERT INTO staff (restaurant_id, name, pin, role, passcode_hash, is_active) VALUES
(md5('r_dipasquale')::uuid, 'Marco Manager', '1111', 'manager', '$2b$10$cWCth.ZXnpj/unSX7eRQ3OSGbRu0A6BLCL.urw0OCgC9lwsMWA2zy', true),
(md5('r_dipasquale')::uuid, 'Sofia Server', '1112', 'server', '$2b$10$vBGhGhmua0pCxSFATGn6vOXLHWNOlq0zLtaMfziEInVcWOqlDiVea', true),
(md5('r_dipasquale')::uuid, 'Luigi Chef', '1113', 'kitchen', '$2b$10$xKo2phGpUKKHX4oM/zUseenZCXbqlNnhrhqVbdplAn9P9nIl60HlG', true),
(md5('r_dipasquale')::uuid, 'Bartender', '1114', 'bar', '$2b$10$AJViDJZO4y1Ik3Ne9U9MsOpA/Y8VoXxkhZu4hePboj5h3.DwNZqHu', true);

-- Bucaneros staff
INSERT INTO staff (restaurant_id, name, pin, role, is_active) VALUES
(md5('r_bucaneros')::uuid, 'Admin Bucanero', '2221', 'manager', true),
(md5('r_bucaneros')::uuid, 'Mesa Server', '2222', 'foh', true),
(md5('r_bucaneros')::uuid, 'Cocina Chef', '2223', 'kitchen', true);

-- ============================================================================
-- QR CODES
-- ============================================================================
INSERT INTO restaurant_qr_codes (restaurant_id, qr_type, qr_code_data) VALUES
(md5('r_dipasquale')::uuid, 'customer', 'http://localhost:5173/?restaurant_id=r_dipasquale'),
(md5('r_dipasquale')::uuid, 'manager', 'http://localhost:5173/staff/login?restaurant_id=r_dipasquale'),
(md5('r_bucaneros')::uuid, 'customer', 'http://localhost:5173/?restaurant_id=r_bucaneros'),
(md5('r_bucaneros')::uuid, 'manager', 'http://localhost:5173/staff/login?restaurant_id=r_bucaneros'),
(md5('r_sencillito')::uuid, 'customer', 'http://localhost:5173/?restaurant_id=r_sencillito'),
(md5('r_maui')::uuid, 'customer', 'http://localhost:5173/?restaurant_id=r_maui'),
(md5('r_azucarynuez')::uuid, 'customer', 'http://localhost:5173/?restaurant_id=r_azucarynuez');

-- ============================================================================
-- PLATFORM OWNER (Martín Torres — Admin Panel Access)
-- ============================================================================
INSERT INTO platform_owner (id, email, name, passcode_hash) VALUES
(md5('owner_martin')::uuid, 'dr.mtorres@icloud.com', 'Martín Torres', '$2b$10$s/KnzbVe0.timfJ6fgR/lOuG4Layc8jpNiab266.68BQNHPGPPDMy');

-- ============================================================================
-- SAMPLE REVIEWS (for testing dashboard analytics)
-- ============================================================================
INSERT INTO visit_feedback (restaurant_id, rating, comment) VALUES
(md5('r_dipasquale')::uuid, 5, 'La mejor lasagna de Monterrey, increíble atención'),
(md5('r_dipasquale')::uuid, 4, 'Pizza muy buena, el lugar es acogedor'),
(md5('r_dipasquale')::uuid, 5, 'Auténtico sabor italiano, volveremos'),
(md5('r_bucaneros')::uuid, 4, 'Los huevos bucaneros son deliciosos'),
(md5('r_bucaneros')::uuid, 5, 'Excelente desayuno, el pulpo zarandeado espectacular'),
(md5('r_sencillito')::uuid, 5, 'El café de especialidad es increíble, el ambiente súper relajado'),
(md5('r_sencillito')::uuid, 4, 'Waffles deliciosos y el croissant de jamón serrano imperdible'),
(md5('r_maui')::uuid, 5, 'Las arepas pelúas son como en Venezuela, 10/10'),
(md5('r_maui')::uuid, 4, 'Los mojitos y el ambiente, perfectos para una cena'),
(md5('r_azucarynuez')::uuid, 5, 'El cheesecake de manzana es el mejor postre de Monterrey');
