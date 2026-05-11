// Apply RLS policies via pg module (direct connection)
const { Client } = require('pg');

const PASSWORD = process.argv[2] || '';

const client = new Client({
  host: process.env.SUPABASE_DB_HOST || 'db.auushbzgsjxyulkchwae.supabase.co',
  port: 6543,
  user: 'postgres',
  password: PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase');
  } catch(e) {
    console.log('Connection failed:', e.message);
    process.exit(1);
  }

  const policies = [
    `CREATE POLICY "Staff can update order status" ON orders FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Staff can insert order items" ON order_items FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Staff can update order items" ON order_items FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Anyone can log staff actions" ON staff_actions FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Staff can read inventory" ON inventory_items FOR SELECT USING (true)`,
    `CREATE POLICY "Staff can insert inventory items" ON inventory_items FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Staff can update inventory items" ON inventory_items FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Staff can delete inventory items" ON inventory_items FOR DELETE USING (true)`,
    `CREATE POLICY "Staff can read tables" ON restaurant_tables FOR SELECT USING (true)`,
    `CREATE POLICY "Staff can insert tables" ON restaurant_tables FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Staff can update tables" ON restaurant_tables FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Staff can delete tables" ON restaurant_tables FOR DELETE USING (true)`,
    `CREATE POLICY "Staff can read staff list" ON staff FOR SELECT USING (true)`,
    `CREATE POLICY "Manager can insert staff" ON staff FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Manager can update staff" ON staff FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Staff can insert shifts" ON staff_shifts FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Staff can update shifts" ON staff_shifts FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Staff can read floor plans" ON floor_plans FOR SELECT USING (true)`,
    `CREATE POLICY "Manager can insert floor plans" ON floor_plans FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Manager can update floor plans" ON floor_plans FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Staff can read props" ON floor_props FOR SELECT USING (true)`,
    `CREATE POLICY "Manager can insert props" ON floor_props FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Manager can update props" ON floor_props FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Manager can delete props" ON floor_props FOR DELETE USING (true)`,
    `CREATE POLICY "Staff can read QR codes" ON restaurant_qr_codes FOR SELECT USING (true)`,
    `CREATE POLICY "Manager can insert QR codes" ON restaurant_qr_codes FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Manager can update QR codes" ON restaurant_qr_codes FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Users can read messages" ON messages FOR SELECT USING (true)`,
    `CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Users can update messages" ON messages FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Owner can read commissions" ON restaurant_commissions FOR SELECT USING (true)`,
    `CREATE POLICY "Owner can insert commissions" ON restaurant_commissions FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Owner can update commissions" ON restaurant_commissions FOR UPDATE USING (true) WITH CHECK (true)`,
    `CREATE POLICY "Owner can log actions" ON owner_actions FOR INSERT WITH CHECK (true)`,
    `CREATE POLICY "Anyone can read visits" ON anonymous_visits FOR SELECT USING (true)`,
    `CREATE POLICY "Anyone can read feedback" ON visit_feedback FOR SELECT USING (true)`,
  ];

  let ok = 0, err = 0, skip = 0;

  for (const sql of policies) {
    const label = sql.match(/CREATE POLICY "([^"]+)"/)?.[1] || sql.substring(0, 50);
    try {
      await client.query(sql);
      console.log('OK: ' + label);
      ok++;
    } catch(e) {
      if (e.code === '42P10' || (e.message && e.message.includes('already exists'))) {
        console.log('SKIP (exists): ' + label);
        skip++;
      } else {
        console.log('ERROR: ' + label + ' -- ' + (e.message || '').substring(0, 80));
        err++;
      }
    }
  }
  console.log('\nDone: ' + ok + ' applied, ' + skip + ' skipped, ' + err + ' errors');
  await client.end();
  process.exit(err > 0 ? 1 : 0);
}

main();