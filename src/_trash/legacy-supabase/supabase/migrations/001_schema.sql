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
