// Test service role key and find correct way to apply SQL
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://auushbzgsjxyulkchwae.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
if (!serviceRoleKey || !anonKey) { console.error('Missing required env vars'); process.exit(1); }

const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
const anonSupabase = createClient(supabaseUrl, anonKey);

async function main() {
  // Test 1: Verify service role key works for normal query
  console.log('Test 1: Service role select from staff...');
  const { data: d1, error: e1 } = await serviceSupabase.from('staff').select('count', { count: 'exact', head: true });
  console.log('  Result:', e1 ? 'ERROR: ' + e1.message : 'OK, count=' + d1);

  // Test 2: Check if execute_sql RPC exists
  console.log('Test 2: Check execute_sql RPC exists...');
  const { data: d2, error: e2 } = await serviceSupabase.rpc('execute_sql', { sql: 'SELECT 1' });
  console.log('  Result:', e2 ? 'ERROR: ' + e2.message + ' (code: ' + e2.code + ')' : 'OK: ' + JSON.stringify(d2));

  // Test 3: Try anon key with execute_sql
  console.log('Test 3: Anon key with execute_sql...');
  const { data: d3, error: e3 } = await anonSupabase.rpc('execute_sql', { sql: 'SELECT 1' });
  console.log('  Result:', e3 ? 'ERROR: ' + e3.message + ' (code: ' + e3.code + ')' : 'OK: ' + JSON.stringify(d3));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });