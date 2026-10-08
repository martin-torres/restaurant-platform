// Apply RLS policies to the live Supabase database
// Uses service_role key from seed script
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://auushbzgsjxyulkchwae.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceRoleKey) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const policies = [
  // 1. orders: UPDATE
  `CREATE POLICY "Staff can update order status" ON orders FOR UPDATE USING (true) WITH CHECK (true)`,
  // 2. order_items: INSERT
  `CREATE POLICY "Staff can insert order items" ON order_items FOR INSERT WITH CHECK (true)`,
  // 3. order_items: UPDATE
  `CREATE POLICY "Staff can update order items" ON order_items FOR UPDATE USING (true) WITH CHECK (true)`,
  // 4. staff_actions: INSERT
  `CREATE POLICY "Anyone can log staff actions" ON staff_actions FOR INSERT WITH CHECK (true)`,
  // 5. inventory_items: SELECT
  `CREATE POLICY "Staff can read inventory" ON inventory_items FOR SELECT USING (true)`,
  // 6. inventory_items: INSERT
  `CREATE POLICY "Staff can insert inventory items" ON inventory_items FOR INSERT WITH CHECK (true)`,
  // 7. inventory_items: UPDATE
  `CREATE POLICY "Staff can update inventory items" ON inventory_items FOR UPDATE USING (true) WITH CHECK (true)`,
  // 8. inventory_items: DELETE
  `CREATE POLICY "Staff can delete inventory items" ON inventory_items FOR DELETE USING (true)`,
  // 9. restaurant_tables: SELECT
  `CREATE POLICY "Staff can read tables" ON restaurant_tables FOR SELECT USING (true)`,
  // 10. restaurant_tables: INSERT
  `CREATE POLICY "Staff can insert tables" ON restaurant_tables FOR INSERT WITH CHECK (true)`,
  // 11. restaurant_tables: UPDATE
  `CREATE POLICY "Staff can update tables" ON restaurant_tables FOR UPDATE USING (true) WITH CHECK (true)`,
  // 12. restaurant_tables: DELETE
  `CREATE POLICY "Staff can delete tables" ON restaurant_tables FOR DELETE USING (true)`,
  // 13. staff: SELECT
  `CREATE POLICY "Staff can read staff list" ON staff FOR SELECT USING (true)`,
  // 14. staff: INSERT
  `CREATE POLICY "Manager can insert staff" ON staff FOR INSERT WITH CHECK (true)`,
  // 15. staff: UPDATE
  `CREATE POLICY "Manager can update staff" ON staff FOR UPDATE USING (true) WITH CHECK (true)`,
  // 16. staff_shifts: INSERT
  `CREATE POLICY "Staff can insert shifts" ON staff_shifts FOR INSERT WITH CHECK (true)`,
  // 17. staff_shifts: UPDATE
  `CREATE POLICY "Staff can update shifts" ON staff_shifts FOR UPDATE USING (true) WITH CHECK (true)`,
  // 18. floor_plans: SELECT
  `CREATE POLICY "Staff can read floor plans" ON floor_plans FOR SELECT USING (true)`,
  // 19. floor_plans: INSERT
  `CREATE POLICY "Manager can insert floor plans" ON floor_plans FOR INSERT WITH CHECK (true)`,
  // 20. floor_plans: UPDATE
  `CREATE POLICY "Manager can update floor plans" ON floor_plans FOR UPDATE USING (true) WITH CHECK (true)`,
  // 21. floor_props: SELECT
  `CREATE POLICY "Staff can read props" ON floor_props FOR SELECT USING (true)`,
  // 22. floor_props: INSERT
  `CREATE POLICY "Manager can insert props" ON floor_props FOR INSERT WITH CHECK (true)`,
  // 23. floor_props: UPDATE
  `CREATE POLICY "Manager can update props" ON floor_props FOR UPDATE USING (true) WITH CHECK (true)`,
  // 24. floor_props: DELETE
  `CREATE POLICY "Manager can delete props" ON floor_props FOR DELETE USING (true)`,
  // 25. restaurant_qr_codes: SELECT
  `CREATE POLICY "Staff can read QR codes" ON restaurant_qr_codes FOR SELECT USING (true)`,
  // 26. restaurant_qr_codes: INSERT
  `CREATE POLICY "Manager can insert QR codes" ON restaurant_qr_codes FOR INSERT WITH CHECK (true)`,
  // 27. restaurant_qr_codes: UPDATE
  `CREATE POLICY "Manager can update QR codes" ON restaurant_qr_codes FOR UPDATE USING (true) WITH CHECK (true)`,
  // 28. messages: SELECT
  `CREATE POLICY "Users can read messages" ON messages FOR SELECT USING (true)`,
  // 29. messages: INSERT
  `CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true)`,
  // 30. messages: UPDATE
  `CREATE POLICY "Users can update messages" ON messages FOR UPDATE USING (true) WITH CHECK (true)`,
  // 31. restaurant_commissions: SELECT
  `CREATE POLICY "Owner can read commissions" ON restaurant_commissions FOR SELECT USING (true)`,
  // 32. restaurant_commissions: INSERT
  `CREATE POLICY "Owner can insert commissions" ON restaurant_commissions FOR INSERT WITH CHECK (true)`,
  // 33. restaurant_commissions: UPDATE
  `CREATE POLICY "Owner can update commissions" ON restaurant_commissions FOR UPDATE USING (true) WITH CHECK (true)`,
  // 34. owner_actions: INSERT
  `CREATE POLICY "Owner can log actions" ON owner_actions FOR INSERT WITH CHECK (true)`,
  // 35. anonymous_visits: SELECT
  `CREATE POLICY "Anyone can read visits" ON anonymous_visits FOR SELECT USING (true)`,
  // 36. visit_feedback: SELECT
  `CREATE POLICY "Anyone can read feedback" ON visit_feedback FOR SELECT USING (true)`,
];

async function main() {
  let ok = 0;
  let err = 0;
  for (const sql of policies) {
    const label = sql.match(/CREATE POLICY "([^"]+)"/)?.[1] || sql.substring(0, 50);
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql });
      if (error) {
        // 409 = already exists, that's fine
        if (error.code === '409' || error.message?.includes('already exists')) {
          console.log(`SKIP (already exists): ${label}`);
        } else {
          console.log(`ERROR: ${label} — ${error.message}`);
          err++;
        }
      } else {
        console.log(`OK: ${label}`);
        ok++;
      }
    } catch (e) {
      console.log(`EXCEPTION: ${label} — ${e.message}`);
      err++;
    }
  }
  console.log(`\nDone: ${ok} applied, ${err} errors`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch(e => { console.error(e.message); process.exit(1); });