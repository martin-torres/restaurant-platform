-- =====================================
-- MISSING RLS POLICIES + REALTIME PUBLICATION
-- Tables already RLS-enabled but missing write policies.
-- Each table name matches the actual schema exactly.
-- =====================================

-- === ENABLE REALTIME (needed for live order/table updates) ===
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table restaurant_tables;

-- === FLOOR PLAN: allow 45-degree rotation increments ===
alter table restaurant_tables drop constraint if exists restaurant_tables_rotation_check;
alter table restaurant_tables add constraint restaurant_tables_rotation_check
  check (rotation >= 0 and rotation <= 360 and rotation % 45 = 0);

-- === ORDER FLOW (staff: kitchen/bar/FOH) ===

create policy "Staff can update orders" on orders
  for update using (true) with check (true);

create policy "Staff can read order_items" on order_items
  for select using (true);

create policy "Staff can insert order_items" on order_items
  for insert with check (true);

create policy "Staff can update order_items" on order_items
  for update using (true) with check (true);

create policy "Staff can insert staff_actions" on staff_actions
  for insert with check (true);

-- === STAFF & SHIFTS (manager) ===

create policy "Anyone can read staff" on staff
  for select using (true);

create policy "Manager insert staff" on staff
  for insert with check (true);

create policy "Manager update staff" on staff
  for update using (true) with check (true);

create policy "Staff can read own shifts" on staff_shifts
  for select using (true);

create policy "Staff can clock in" on staff_shifts
  for insert with check (true);

create policy "Staff can clock out" on staff_shifts
  for update using (true) with check (true);

-- === INVENTORY (manager) ===

create policy "Manager read inventory" on inventory_items
  for select using (true);

create policy "Manager insert inventory" on inventory_items
  for insert with check (true);

create policy "Manager update inventory" on inventory_items
  for update using (true) with check (true);

create policy "Manager delete inventory" on inventory_items
  for delete using (true);

-- === TABLES & FLOOR PLANS (manager) ===

create policy "Manager insert tables" on restaurant_tables
  for insert with check (true);

create policy "Manager update tables" on restaurant_tables
  for update using (true) with check (true);

create policy "Manager delete tables" on restaurant_tables
  for delete using (true);

create policy "Manager insert floor_plans" on floor_plans
  for insert with check (true);

create policy "Manager update floor_plans" on floor_plans
  for update using (true) with check (true);

create policy "Manager read floor_props" on floor_props
  for select using (true);

create policy "Manager insert floor_props" on floor_props
  for insert with check (true);

create policy "Manager delete floor_props" on floor_props
  for delete using (true);

create policy "Manager update floor_props" on floor_props
  for update using (true) with check (true);

-- === PAYMENTS (customer) ===

create policy "Anyone can insert payments" on payments
  for insert with check (true);

create policy "Anyone can read payments" on payments
  for select using (true);

-- === OWNER PANEL ===

create policy "Owner insert qr_codes" on restaurant_qr_codes
  for insert with check (true);

create policy "Owner update qr_codes" on restaurant_qr_codes
  for update using (true) with check (true);

create policy "Owner insert messages" on messages
  for insert with check (true);

create policy "Owner update messages" on messages
  for update using (true) with check (true);

create policy "Owner insert commissions" on restaurant_commissions
  for insert with check (true);

create policy "Owner update commissions" on restaurant_commissions
  for update using (true) with check (true);

create policy "Owner insert actions" on owner_actions
  for insert with check (true);
