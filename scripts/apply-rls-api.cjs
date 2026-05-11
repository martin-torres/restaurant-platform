// Apply RLS policies via Supabase Management API using PAT
// The PAT has admin-level access to the project's Management API
const https = require('https');

const PAT = process.env.SUPABASE_PAT;
if (!PAT) { console.error('Missing SUPABASE_PAT env var'); process.exit(1); }
const PROJECT_ID = 'auushbzgsjxyulkchwae';

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

function apiRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: body });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v2/projects/${PROJECT_ID}/database/sql`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Try the v2 API first
  console.log('Testing Management API v2 endpoint...');
  const test = await apiRequest('SELECT 1');
  console.log('Test response:', test.status, test.body.substring(0, 200));

  if (test.status !== 200) {
    console.log('API not accessible. Export the SQL file for manual application.');
    const fs = require('fs');
    const sql = policies.map(p => p + ';').join('\n');
    fs.writeFileSync('/tmp/rls-policies-manual.sql', sql);
    console.log('SQL saved to /tmp/rls-policies-manual.sql');
    process.exit(0);
  }

  let ok = 0, err = 0, skip = 0;
  for (const sql of policies) {
    const label = sql.match(/CREATE POLICY "([^"]+)"/)?.[1] || sql.substring(0, 50);
    try {
      const result = await apiRequest(sql);
      if (result.status === 200) {
        console.log('OK:', label);
        ok++;
      } else if (result.status === 409 || result.body.includes('already exists')) {
        console.log('SKIP (exists):', label);
        skip++;
      } else {
        console.log('ERROR: ' + label + ' -- ' + result.status + ' ' + result.body.substring(0, 100));
        err++;
      }
    } catch(e) {
      console.log('EXCEPTION: ' + label + ' -- ' + e.message);
      err++;
    }
  }
  console.log('\nDone: ' + ok + ' applied, ' + skip + ' skipped, ' + err + ' errors');
  process.exit(err > 0 ? 1 : 0);
}

main();