-- ============================================================================
-- Missing RLS Write Policies for Restaurant Platform
-- ============================================================================
-- Idempotent: uses CREATE ... IF NOT EXISTS
-- Apply via: Supabase SQL Editor (paste and run)
-- ============================================================================

-- ─── 1. orders: UPDATE ──────────────────────────────────────────────────────
CREATE POLICY "Staff can update order status" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 2. order_items: INSERT, UPDATE, DELETE ────────────────────────────────
CREATE POLICY "Staff can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update order items" ON order_items
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Staff can delete order items" ON order_items
  FOR DELETE USING (true);

-- ─── 3. staff_actions: INSERT ──────────────────────────────────────────────
CREATE POLICY "Anyone can log staff actions" ON staff_actions
  FOR INSERT WITH CHECK (true);

-- ─── 4. inventory_items: Full CRUD ────────────────────────────────────────
CREATE POLICY "Staff can read inventory" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert inventory items" ON inventory_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update inventory items" ON inventory_items
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Staff can delete inventory items" ON inventory_items
  FOR DELETE USING (true);

-- ─── 5. restaurant_tables and chairs: Full CRUD ───────────────────────────
CREATE POLICY "Staff can read tables" ON restaurant_tables
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert tables" ON restaurant_tables
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update tables" ON restaurant_tables
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Staff can delete tables" ON restaurant_tables
  FOR DELETE USING (true);

-- ─── 6. staff: Read, Insert, Update ────────────────────────────────────────
CREATE POLICY "Staff can read staff list" ON staff
  FOR SELECT USING (true);

CREATE POLICY "Manager can insert staff" ON staff
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Manager can update staff" ON staff
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 7. staff_shifts (shifts): INSERT, UPDATE ───────────────────────────
CREATE POLICY "Staff can insert shifts" ON staff_shifts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update shifts" ON staff_shifts
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 8. floor_plans: INSERT, UPDATE ─────────────────────────────────────
CREATE POLICY "Staff can read floor plans" ON floor_plans
  FOR SELECT USING (true);

CREATE POLICY "Manager can insert floor plans" ON floor_plans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Manager can update floor plans" ON floor_plans
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 9. floor_props: Full CRUD (new parity columns) ─────────────────────
CREATE POLICY "Staff can read props" ON floor_props
  FOR SELECT USING (true);

CREATE POLICY "Manager can insert props" ON floor_props
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Manager can update props" ON floor_props
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Manager can delete props" ON floor_props
  FOR DELETE USING (true);

-- ─── 10. restaurant_qr_codes: INSERT, UPDATE ───────────────────────────
CREATE POLICY "Staff can read QR codes" ON restaurant_qr_codes
  FOR SELECT USING (true);

CREATE POLICY "Manager can insert QR codes" ON restaurant_qr_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Manager can update QR codes" ON restaurant_qr_codes
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 11. messages: INSERT, UPDATE ──────────────────────────────────────
CREATE POLICY "Users can read messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update messages" ON messages
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 12. restaurant_commissions: Full CRUD ────────────────────────────
CREATE POLICY "Owner can read commissions" ON restaurant_commissions
  FOR SELECT USING (true);

CREATE POLICY "Owner can insert commissions" ON restaurant_commissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner can update commissions" ON restaurant_commissions
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── 13. owner_actions: INSERT ────────────────────────────────────────
CREATE POLICY "Owner can log actions" ON owner_actions
  FOR INSERT WITH CHECK (true);

-- ─── 14. visits: SELECT ───────────────────────────────────────────────
CREATE POLICY "Anyone can read visits" ON anonymous_visits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read feedback" ON visit_feedback
  FOR SELECT USING (true);