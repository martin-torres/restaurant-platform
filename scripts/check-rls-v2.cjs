// Check existing RLS policies via service role client
// Uses the postgREST REST API — service role can read pg_policies
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://auushbzgsjxyulkchwae.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Tables we expect to have policies
const expectedTables = [
  'orders', 'order_items', 'staff_actions', 'inventory_items',
  'restaurant_tables', 'staff', 'staff_shifts', 'floor_plans',
  'floor_props', 'restaurant_qr_codes', 'messages',
  'restaurant_commissions', 'owner_actions',
  'anonymous_visits', 'visit_feedback'
];

async function checkRLS() {
  console.log('========================================');
  console.log('CHECKING RLS STATUS PER TABLE');
  console.log('========================================\n');

  for (const table of expectedTables) {
    try {
      // Check if RLS is enabled by trying a simple select
      const { data: rlsCheck, error: rlsError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(0)
        .single();

      if (rlsError) {
        console.log(`${table}: ERROR - ${rlsError.code}: ${rlsError.message}`);
      } else {
        console.log(`${table}: Accessible (RLS may be enabled or table is public)`);
      }
    } catch (e) {
      console.log(`${table}: EXCEPTION - ${e.message}`);
    }
  }

  // Also check pg_policies directly via RPC if available
  console.log('\n========================================');
  console.log('CHECKING VIA /rest/v1/pg_policies');
  console.log('========================================\n');

  try {
    // Try direct REST query on pg_policies
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pg_policies`, {
      headers: {
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`
      }
    });
    const text = await response.text();
    if (response.ok) {
      const policies = JSON.parse(text);
      console.log(`Found ${policies.length} policies:`);
      for (const p of policies) {
        console.log(`  ${p.tablename}: "${p.policyname}" cmd=${p.cmd} permissive=${p.permissive}`);
      }
    } else {
      console.log(`HTTP ${response.status}: ${text}`);
    }
  } catch (e) {
    console.log('Error:', e.message);
    // Try an alternative: use the postgREST schema endpoint
    try {
      const response2 = await fetch(`${SUPABASE_URL}/rest/v1/_schema`, {
        headers: {
          'apikey': SERVICE_ROLE,
          'Authorization': `Bearer ${SERVICE_ROLE}`
        }
      });
      const text2 = await response2.text();
      if (response2.ok) {
        const schemas = JSON.parse(text2);
        console.log('Schemas found:');
        for (const s of schemas) {
          console.log(`  ${s.id}: ${s.name} - ${JSON.stringify(s.config)}`);
        }
      } else {
        console.log('_schema endpoint:', `HTTP ${response2.status}: ${text2}`);
      }
    } catch (e2) {
      console.log('_schema error:', e2.message);
    }
  }

  console.log('\n========================================');
  console.log('Trying to infer from test INSERT/UPDATE');
  console.log('========================================\n');

  // Test actual write operations on key tables to see which need policies
  const testTables = [
    { table: 'orders', op: 'select', id: 'test-check' },
    { table: 'order_items', op: 'select', id: 'test-check' },
    { table: 'staff_actions', op: 'select' },
    { table: 'floor_plans', op: 'select' },
    { table: 'floor_props', op: 'select' },
    { table: 'staff', op: 'select' },
    { table: 'staff_shifts', op: 'select' },
    { table: 'inventory_items', op: 'select' },
  ];

  for (const { table, op } of testTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`${table} SELECT: FORBIDDEN (${error.code}) - needs RLS policy`);
      } else {
        console.log(`${table} SELECT: OK`);
      }
    } catch (e) {
      console.log(`${table}: ERROR - ${e.message}`);
    }
  }
}

checkRLS().catch(e => { console.error('Fatal:', e); process.exit(1); });