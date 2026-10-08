// Query pg_policies to see which RLS policies already exist on the relevant tables
const { createClient } = require('@supabase/supabase-js');

process.env.SUPABASE_URL || 'https://auushbzgsjxyulkchwae.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  // The tables we need policies for
  const tables = [
    'orders', 'order_items', 'staff_actions', 'inventory_items',
    'restaurant_tables', 'staff', 'staff_shifts', 'floor_plans',
    'floor_props', 'restaurant_qr_codes', 'messages',
    'restaurant_commissions', 'owner_actions',
    'anonymous_visits', 'visit_feedback'
  ];

  console.log('========================================');
  console.log('EXISTING RLS POLICIES (from pg_policies)');
  console.log('========================================');

  for (const table of tables) {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, cmd, qual, with_check')
      .eq('tablename', table);

    if (error) {
      console.log(`\n${table}: ERROR - ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`\n${table} (${data.length} policies):`);
      for (const p of data) {
        console.log(`  - "${p.policyname}" [${p.permissive}] ${p.cmd}`);
      }
    } else {
      console.log(`\n${table}: NO policies found`);
    }
  }

  console.log('\n========================================');
  console.log('ALL POLICIES ON SCHEMA (broader check)');
  console.log('========================================');

  const { data: allPolicies, error: allError } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, permissive, cmd');

  if (allError) {
    console.log('Error fetching all policies:', allError.message);
  } else {
    console.log(`Total policies in schema: ${allPolicies?.length || 0}`);
    for (const p of (allPolicies || [])) {
      console.log(`  ${p.tablename}: "${p.policyname}" [${p.permissive}] ${p.cmd}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });