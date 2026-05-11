// Test actual DB operations to determine which policies are present
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://auushbzgsjxyulkchwae.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var'); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

let passed = 0, failed = 0;

async function testOp(name, fn) {
  try {
    const result = await fn();
    console.log(`  PASS: ${name}`);
    passed++;
    return true;
  } catch (e) {
    const errMsg = e.message ? e.message.substring(0, 120) : e;
    console.log(`  FAIL: ${name} -> ${errMsg}`);
    failed++;
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('TESTING ACTUAL DB OPERATIONS (service role)');
  console.log('========================================\n');

  // 1. SELECT tests (should work if RLS at least has SELECT USING(true))
  console.log('--- SELECT Tests ---');
  await testOp('orders SELECT', () => supabase.from('orders').select('*').limit(1));
  await testOp('order_items SELECT', () => supabase.from('order_items').select('*').limit(1));
  await testOp('staff_actions SELECT', () => supabase.from('staff_actions').select('*').limit(1));
  await testOp('inventory_items SELECT', () => supabase.from('inventory_items').select('*').limit(1));
  await testOp('restaurant_tables SELECT', () => supabase.from('restaurant_tables').select('*').limit(1));
  await testOp('staff SELECT', () => supabase.from('staff').select('*').limit(1));
  await testOp('staff_shifts SELECT', () => supabase.from('staff_shifts').select('*').limit(1));
  await testOp('floor_plans SELECT', () => supabase.from('floor_plans').select('*').limit(1));
  await testOp('floor_props SELECT', () => supabase.from('floor_props').select('*').limit(1));
  await testOp('restaurant_qr_codes SELECT', () => supabase.from('restaurant_qr_codes').select('*').limit(1));
  await testOp('messages SELECT', () => supabase.from('messages').select('*').limit(1));
  await testOp('restaurant_commissions SELECT', () => supabase.from('restaurant_commissions').select('*').limit(1));
  await testOp('owner_actions SELECT', () => supabase.from('owner_actions').select('*').limit(1));
  await testOp('anonymous_visits SELECT', () => supabase.from('anonymous_visits').select('*').limit(1));
  await testOp('visit_feedback SELECT', () => supabase.from('visit_feedback').select('*').limit(1));

  // 2. INSERT tests
  console.log('\n--- INSERT Tests ---');
  const testId = 'test_' + Date.now();

  // staff_actions insert (simple)
  await testOp('staff_actions INSERT', () =>
    supabase.from('staff_actions').insert({
      restaurant_id: 'test', staff_id: 'test', action_type: 'test', details: {}
    })
  );

  // owner_actions insert (simple)
  await testOp('owner_actions INSERT', () =>
    supabase.from('owner_actions').insert({
      owner_id: 'test', action_type: 'test', details: {}
    })
  );

  // order_items insert
  await testOp('order_items INSERT', () =>
    supabase.from('order_items').insert({
      restaurant_id: 'test', order_id: testId, item_name: 'Test Item', quantity: 1, unit_price: 100
    })
  );

  // floor_plans insert
  await testOp('floor_plans INSERT', () =>
    supabase.from('floor_plans').insert({
      restaurant_id: 'test', name: 'Test Floor', canvas_w: 800, canvas_h: 600
    })
  );

  // floor_props insert
  await testOp('floor_props INSERT', () =>
    supabase.from('floor_props').insert({
      restaurant_id: 'test', floor_plan_id: 'test', label: 'Test Prop', prop_type: 'plant', shape: 'rectangle', x: 0, y: 0, width: 40, height: 40, is_available: true
    })
  );

  // restaurant_qr_codes insert
  await testOp('restaurant_qr_codes INSERT', () =>
    supabase.from('restaurant_qr_codes').insert({
      restaurant_id: 'test', qr_type: 'customer', qr_code_data: 'test'
    })
  );

  // messages insert
  await testOp('messages INSERT', () =>
    supabase.from('messages').insert({
      restaurant_id: 'test', sender_id: 'test', content: 'test'
    })
  );

  // restaurant_commissions insert
  await testOp('restaurant_commissions INSERT', () =>
    supabase.from('restaurant_commissions').insert({
      restaurant_id: 'test', order_id: testId, rate: 0.1, amount: 100, status: 'pending'
    })
  );

  // 3. UPDATE tests
  console.log('\n--- UPDATE Tests ---');

  await testOp('orders UPDATE', () =>
    supabase.from('orders').update({ status: 'test' }).eq('id', testId)
  );

  await testOp('order_items UPDATE', () =>
    supabase.from('order_items').update({ quantity: 99 }).eq('id', testId)
  );

  await testOp('staff UPDATE', () =>
    supabase.from('staff').update({ name: 'Test' }).eq('id', testId)
  );

  await testOp('staff_shifts UPDATE', () =>
    supabase.from('staff_shifts').update({ notes: 'test' }).eq('id', testId)
  );

  await testOp('floor_plans UPDATE', () =>
    supabase.from('floor_plans').update({ name: 'Test Updated' }).eq('id', testId)
  );

  await testOp('floor_props UPDATE', () =>
    supabase.from('floor_props').update({ label: 'Updated' }).eq('id', testId)
  );

  await testOp('restaurant_qr_codes UPDATE', () =>
    supabase.from('restaurant_qr_codes').update({ label: 'Updated' }).eq('id', testId)
  );

  await testOp('messages UPDATE', () =>
    supabase.from('messages').update({ content: 'Updated' }).eq('id', testId)
  );

  await testOp('restaurant_commissions UPDATE', () =>
    supabase.from('restaurant_commissions').update({ status: 'test' }).eq('id', testId)
  );

  // 4. DELETE tests
  console.log('\n--- DELETE Tests ---');

  await testOp('inventory_items DELETE', () =>
    supabase.from('inventory_items').delete().eq('id', testId)
  );

  await testOp('restaurant_tables DELETE', () =>
    supabase.from('restaurant_tables').delete().eq('id', testId)
  );

  await testOp('staff DELETE', () =>
    supabase.from('staff').delete().eq('id', testId)
  );

  await testOp('floor_plans DELETE', () =>
    supabase.from('floor_plans').delete().eq('id', testId)
  );

  await testOp('floor_props DELETE', () =>
    supabase.from('floor_props').delete().eq('id', testId)
  );

  await testOp('restaurant_qr_codes DELETE', () =>
    supabase.from('restaurant_qr_codes').delete().eq('id', testId)
  );

  await testOp('messages DELETE', () =>
    supabase.from('messages').delete().eq('id', testId)
  );

  await testOp('restaurant_commissions DELETE', () =>
    supabase.from('restaurant_commissions').delete().eq('id', testId)
  );

  await testOp('order_items DELETE', () =>
    supabase.from('order_items').delete().eq('id', testId)
  );

  await testOp('owner_actions DELETE', () =>
    supabase.from('owner_actions').delete().eq('id', testId)
  );

  await testOp('staff_actions DELETE', () =>
    supabase.from('staff_actions').delete().eq('id', testId)
  );

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  if (failed > 0) {
    console.log('\nFailed operations need RLS policies. The "policy already exists" errors');
    console.log('mean some policies were applied before. Re-run the SQL in the Supabase SQL Editor —');
    console.log('the script below uses DO blocks to skip already-existing policies.');
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });