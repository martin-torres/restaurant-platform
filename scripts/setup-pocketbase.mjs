#!/usr/bin/env node
/**
 * Bootstrap PocketBase collections + demo seed for the restaurant platform.
 * Usage: node scripts/setup-pocketbase.mjs [PB_URL]
 */
import PocketBase from 'pocketbase'

const PB_URL = process.argv[2] || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@restaurant.local'
const ADMIN_PASS = process.env.PB_ADMIN_PASSWORD || 'admin123456'

const pb = new PocketBase(PB_URL)
pb.autoCancellation(false)

// PocketBase 0.23+ field format (flat, not options-wrapped)
const f = {
  text: (name, opts = {}) => ({ name, type: 'text', required: !!opts.required }),
  number: (name, opts = {}) => ({ name, type: 'number', required: !!opts.required }),
  bool: (name) => ({ name, type: 'bool', required: false }),
  email: (name, opts = {}) => ({ name, type: 'email', required: !!opts.required }),
  json: (name) => ({ name, type: 'json', required: false }),
  select: (name, values, opts = {}) => ({
    name,
    type: 'select',
    required: !!opts.required,
    maxSelect: 1,
    values,
  }),
  relation: (name, collectionId, opts = {}) => ({
    name,
    type: 'relation',
    required: !!opts.required,
    collectionId,
    cascadeDelete: !!opts.cascadeDelete,
    maxSelect: opts.maxSelect ?? 1,
  }),
}

async function getOrCreate(payload) {
  try {
    const existing = await pb.collections.getOne(payload.name)
    // Merge missing fields
    const have = new Set((existing.fields || []).map((x) => x.name))
    const missing = (payload.fields || []).filter((x) => !have.has(x.name))
    if (missing.length) {
      const updated = await pb.collections.update(existing.id, {
        fields: [...existing.fields, ...missing],
        listRule: payload.listRule ?? existing.listRule,
        viewRule: payload.viewRule ?? existing.viewRule,
        createRule: payload.createRule ?? existing.createRule,
        updateRule: payload.updateRule ?? existing.updateRule,
        deleteRule: payload.deleteRule ?? existing.deleteRule,
      })
      console.log(`  ↑ updated: ${payload.name} (+${missing.length} fields)`)
      return updated
    }
    console.log(`  · exists: ${payload.name}`)
    return existing
  } catch {
    const created = await pb.collections.create(payload)
    console.log(`  ✓ created: ${payload.name}`)
    return created
  }
}

async function deleteIfExists(name) {
  try {
    const c = await pb.collections.getOne(name)
    await pb.collections.delete(c.id)
    console.log(`  ✗ deleted temp: ${name}`)
  } catch {
    /* ok */
  }
}

async function main() {
  console.log(`Auth → ${PB_URL}`)
  await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASS)

  // Cleanup probe collections from earlier debugging
  await deleteIfExists('test_sel')
  await deleteIfExists('test_sel2')

  const open = { listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '' }

  console.log('\nCollections')
  const restaurants = await getOrCreate({
    name: 'restaurants',
    type: 'base',
    ...open,
    fields: [
      f.text('name', { required: true }),
      f.text('slug', { required: true }),
      f.text('description'),
      f.text('logo_url'),
      f.text('hero_url'),
      f.text('address'),
      f.text('phone'),
      f.email('email'),
      f.text('website'),
      f.text('cuisine_type'),
      f.text('primary_color'),
      f.text('secondary_color'),
      f.text('accent_color'),
      f.text('background_color'),
      f.text('text_color'),
      f.select('mode', ['to-go', 'dine-in', 'both'], { required: true }),
      f.text('currency'),
      f.text('timezone'),
      f.bool('is_active'),
      f.select('tier', ['basic', 'growth', 'strategic']),
      f.number('commission_percent'),
    ],
  })

  const floorPlans = await getOrCreate({
    name: 'floor_plans',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.number('canvas_w'),
      f.number('canvas_h'),
      f.number('grid_size'),
    ],
  })

  const tables = await getOrCreate({
    name: 'restaurant_tables',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.relation('floor_plan', floorPlans.id),
      f.text('display_name', { required: true }),
      f.number('table_number', { required: true }),
      f.number('seats'),
      f.select('shape', ['circle', 'square', 'rectangle', 'booth_u', 'booth_half_u', 'bar']),
      f.number('x'),
      f.number('y'),
      f.number('width'),
      f.number('height'),
      f.number('rotation'),
      f.json('chair_positions'),
      f.bool('is_interactive'),
      f.bool('visible_to_customers'),
      f.bool('is_available'),
      f.bool('is_reserved'),
      f.text('reservation_time'),
      f.text('reservation_name'),
    ],
  })

  await getOrCreate({
    name: 'floor_props',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.relation('floor_plan', floorPlans.id),
      f.select('prop_type', ['stage', 'bathroom', 'window', 'staircase', 'wall', 'plant', 'other'], { required: true }),
      f.text('label'),
      f.text('display_name'),
      f.select('shape', ['circle', 'square', 'rect', 'booth_u', 'booth_half_u', 'bar']),
      f.number('seats'),
      f.json('chair_positions'),
      f.number('x'),
      f.number('y'),
      f.number('width'),
      f.number('height'),
      f.number('rotation'),
      f.bool('is_interactive'),
      f.bool('visible_to_customers'),
      f.bool('is_available'),
      f.bool('is_reserved'),
    ],
  })

  const staff = await getOrCreate({
    name: 'staff',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.text('name', { required: true }),
      f.select('role', ['manager', 'server', 'foh', 'kitchen', 'bar', 'owner'], { required: true }),
      f.text('pin', { required: true }),
      f.text('passcode_hash'),
      f.bool('is_active'),
    ],
  })

  await getOrCreate({
    name: 'staff_shifts',
    type: 'base',
    ...open,
    fields: [
      f.relation('staff', staff.id, { required: true, cascadeDelete: true }),
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.text('clock_in', { required: true }),
      f.text('clock_out'),
      f.number('tables_served'),
      f.number('total_tips'),
      f.number('total_sales'),
      f.text('notes'),
    ],
  })

  await getOrCreate({
    name: 'staff_actions',
    type: 'base',
    ...open,
    fields: [
      f.relation('staff', staff.id, { required: true, cascadeDelete: true }),
      f.relation('restaurant', restaurants.id),
      f.text('action_type', { required: true }),
      f.text('order_id'),
      f.json('details'),
    ],
  })

  const menuItems = await getOrCreate({
    name: 'menu_items',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.text('category', { required: true }),
      f.text('name', { required: true }),
      f.text('description'),
      f.number('price', { required: true }),
      f.text('image_url'),
      f.bool('is_available'),
      f.bool('track_inventory'),
      f.number('stock'),
      f.select('station', ['kitchen', 'bar', 'both']),
      f.number('sort_order'),
      f.json('options'),
    ],
  })

  await getOrCreate({
    name: 'inventory_items',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.text('name', { required: true }),
      f.text('unit'),
      f.number('stock'),
      f.number('min_stock'),
      f.number('cost_per_unit'),
      f.relation('linked_menu_item', menuItems.id),
    ],
  })

  const orders = await getOrCreate({
    name: 'orders',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.relation('table', tables.id),
      f.text('customer_phone'),
      f.text('customer_name'),
      f.number('seat_number'),
      f.select('order_type', ['dine_in', 'to_go', 'delivery'], { required: true }),
      f.select('status', ['new', 'in_progress', 'ready', 'picking_up', 'delivered', 'cancelled', 'paid'], { required: true }),
      f.select('payment_status', ['unpaid', 'paid', 'refunded']),
      f.number('subtotal'),
      f.number('total'),
      f.number('tip'),
      f.text('notes'),
      f.bool('is_request'),
      f.select('kitchen_status', ['new', 'in_progress', 'ready', 'picking_up', 'delivered', 'cancelled']),
      f.select('bar_status', ['new', 'in_progress', 'ready', 'picking_up', 'delivered', 'cancelled']),
      f.text('foh_request_status'),
      f.json('status_timestamps'),
      f.text('pickup_verification_pin'),
    ],
  })

  await getOrCreate({
    name: 'order_items',
    type: 'base',
    ...open,
    fields: [
      f.relation('order', orders.id, { required: true, cascadeDelete: true }),
      f.relation('menu_item', menuItems.id),
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.number('seat_number'),
      f.text('name', { required: true }),
      f.number('quantity', { required: true }),
      f.number('unit_price', { required: true }),
      f.number('total_price', { required: true }),
      f.select('status', ['new', 'in_progress', 'ready', 'picking_up', 'delivered', 'cancelled']),
      f.relation('assigned_staff', staff.id),
      f.text('notes'),
      f.json('options'),
      f.select('station', ['kitchen', 'bar', 'both']),
    ],
  })

  await getOrCreate({
    name: 'payments',
    type: 'base',
    ...open,
    fields: [
      f.relation('order', orders.id, { required: true, cascadeDelete: true }),
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.select('method', ['card', 'phone', 'cash', 'wallet'], { required: true }),
      f.number('amount', { required: true }),
      f.number('subtotal'),
      f.number('tip'),
      f.number('cash_given'),
      f.number('change_due'),
      f.relation('processed_by', staff.id),
      f.select('status', ['pending', 'completed', 'failed', 'refunded']),
    ],
  })

  await getOrCreate({
    name: 'promos',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.text('name', { required: true }),
      f.text('description'),
      f.select('discount_type', ['percentage', 'fixed', 'bundle']),
      f.number('discount_value'),
      f.number('original_price'),
      f.text('image_url'),
      f.text('category'),
      f.bool('active'),
      f.text('starts_at'),
      f.text('ends_at'),
    ],
  })

  await getOrCreate({
    name: 'visit_feedback',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.relation('order', orders.id),
      f.number('rating', { required: true }),
      f.text('comment'),
    ],
  })

  await getOrCreate({
    name: 'platform_owner',
    type: 'base',
    ...open,
    fields: [
      f.text('name', { required: true }),
      f.email('email', { required: true }),
      f.text('passcode', { required: true }),
    ],
  })

  await getOrCreate({
    name: 'restaurant_owners',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.text('name', { required: true }),
      f.text('phone'),
      f.email('email'),
      f.text('address'),
      f.text('notes'),
      f.text('preferred_contact'),
    ],
  })

  await getOrCreate({
    name: 'restaurant_commissions',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id, { required: true, cascadeDelete: true }),
      f.number('commission_percent', { required: true }),
      f.text('effective_date'),
      f.text('notes'),
    ],
  })

  await getOrCreate({
    name: 'message_threads',
    type: 'base',
    ...open,
    fields: [
      f.relation('restaurant', restaurants.id),
      f.text('subject'),
    ],
  })

  await getOrCreate({
    name: 'messages',
    type: 'base',
    ...open,
    fields: [
      f.text('thread'),
      f.relation('restaurant', restaurants.id),
      f.text('sender_role'),
      f.text('sender_id'),
      f.text('recipient_role'),
      f.text('recipient_id'),
      f.text('content', { required: true }),
      f.select('urgency', ['normal', 'urgent', 'critical']),
      f.text('read_at'),
    ],
  })

  console.log('\nSeed data')
  await seedDemo()
  console.log('\nDone.')
}

async function upsertByFilter(collection, filter, data) {
  try {
    const existing = await pb.collection(collection).getFirstListItem(filter)
    return pb.collection(collection).update(existing.id, data)
  } catch {
    return pb.collection(collection).create(data)
  }
}

async function seedDemo() {
  const restaurant = await upsertByFilter('restaurants', 'slug="di-pasquale"', {
    name: 'Di Pasquale',
    slug: 'di-pasquale',
    description: 'Auténtica cocina italiana desde 1992. Pizzas artesanales, pastas frescas y antipasti.',
    address: 'Calle Morelos 908 Ote, Barrio Antiguo, Monterrey',
    phone: '8180000001',
    cuisine_type: 'Italiana',
    mode: 'dine-in',
    currency: 'MXN',
    timezone: 'America/Monterrey',
    primary_color: '#8B1A1A',
    secondary_color: '#C41E3A',
    accent_color: '#D4AF37',
    background_color: '#0f0f23',
    text_color: '#ffffff',
    is_active: true,
    tier: 'growth',
    commission_percent: 10,
  })
  console.log(`  restaurant: ${restaurant.id} (${restaurant.slug})`)

  await upsertByFilter('platform_owner', 'email="dr.mtorres@icloud.com"', {
    name: 'Martín Torres',
    email: 'dr.mtorres@icloud.com',
    passcode: '2026',
  })

  await upsertByFilter('restaurant_owners', `restaurant="${restaurant.id}"`, {
    restaurant: restaurant.id,
    name: 'Pasquale Vallone',
    phone: '8180000001',
    email: 'pasquale@dipasquale.mx',
  })

  const floor = await upsertByFilter('floor_plans', `restaurant="${restaurant.id}"`, {
    restaurant: restaurant.id,
    canvas_w: 1200,
    canvas_h: 800,
    grid_size: 20,
  })

  const tableDefs = [
    { display_name: 'T1', table_number: 1, seats: 4, shape: 'square', x: 120, y: 140, width: 80, height: 80 },
    { display_name: 'T2', table_number: 2, seats: 4, shape: 'square', x: 280, y: 140, width: 80, height: 80 },
    { display_name: 'T3', table_number: 3, seats: 2, shape: 'circle', x: 440, y: 140, width: 70, height: 70 },
    { display_name: 'T4', table_number: 4, seats: 6, shape: 'rectangle', x: 120, y: 320, width: 140, height: 80 },
    { display_name: 'T5', table_number: 5, seats: 4, shape: 'booth_u', x: 340, y: 320, width: 100, height: 90 },
    { display_name: 'Bar', table_number: 6, seats: 6, shape: 'bar', x: 560, y: 120, width: 60, height: 220 },
  ]

  for (const t of tableDefs) {
    await upsertByFilter('restaurant_tables', `restaurant="${restaurant.id}" && table_number=${t.table_number}`, {
      restaurant: restaurant.id,
      floor_plan: floor.id,
      ...t,
      rotation: 0,
      chair_positions: [],
      is_interactive: true,
      visible_to_customers: true,
      is_available: true,
      is_reserved: false,
    })
  }
  console.log(`  tables: ${tableDefs.length}`)

  const staffDefs = [
    { name: 'Ana Manager', role: 'manager', pin: '1111' },
    { name: 'Luis FOH', role: 'foh', pin: '1112' },
    { name: 'Carlos Kitchen', role: 'kitchen', pin: '1113' },
    { name: 'Sofia Bar', role: 'bar', pin: '1114' },
  ]
  for (const s of staffDefs) {
    await upsertByFilter('staff', `restaurant="${restaurant.id}" && pin="${s.pin}"`, {
      restaurant: restaurant.id,
      ...s,
      is_active: true,
      passcode_hash: s.pin,
    })
  }
  console.log(`  staff: ${staffDefs.length}`)

  const menu = [
    ['Antipasti', 'Bruschetta Toscana', 95, 'kitchen', 1],
    ['Antipasti', 'Carpaccio de Res', 155, 'kitchen', 2],
    ['Pastas', 'Lasagna', 185, 'kitchen', 3],
    ['Pastas', 'Pasta Carbonara', 165, 'kitchen', 4],
    ['Pizzas', 'Regina Margherita', 145, 'kitchen', 5],
    ['Pizzas', 'Pepperoni', 145, 'kitchen', 6],
    ['Postres', 'Tiramisú', 95, 'kitchen', 7],
    ['Bebidas', 'Café Americano', 48, 'bar', 8],
    ['Bebidas', 'Cappuccino', 50, 'bar', 9],
    ['Bebidas', 'Limonada', 35, 'bar', 10],
    ['Bebidas', 'Sangría Topo Chico', 25, 'bar', 11],
  ]

  for (const [category, name, price, station, sort_order] of menu) {
    await upsertByFilter('menu_items', `restaurant="${restaurant.id}" && name="${name}"`, {
      restaurant: restaurant.id,
      category,
      name,
      description: name,
      price,
      station,
      sort_order,
      is_available: true,
      track_inventory: false,
      stock: -1,
      options: [],
    })
  }
  console.log(`  menu items: ${menu.length}`)

  await upsertByFilter('promos', `restaurant="${restaurant.id}" && name="Lunch Special"`, {
    restaurant: restaurant.id,
    name: 'Lunch Special',
    description: '10% off pasta before 3pm',
    discount_type: 'percentage',
    discount_value: 10,
    active: true,
    category: 'Pastas',
  })

  const cafe = await upsertByFilter('restaurants', 'slug="maui-cafe"', {
    name: 'Maui Café',
    slug: 'maui-cafe',
    description: 'Café y brunch relajado.',
    address: 'San Pedro Garza García',
    phone: '8180000005',
    cuisine_type: 'Café',
    mode: 'both',
    currency: 'MXN',
    timezone: 'America/Monterrey',
    primary_color: '#2D6A4F',
    secondary_color: '#40916C',
    accent_color: '#95D5B2',
    background_color: '#081C15',
    text_color: '#ffffff',
    is_active: true,
    tier: 'basic',
    commission_percent: 12,
  })
  await upsertByFilter('menu_items', `restaurant="${cafe.id}" && name="Cold Brew"`, {
    restaurant: cafe.id,
    category: 'Bebidas',
    name: 'Cold Brew',
    description: 'Cold brew de especialidad',
    price: 65,
    station: 'bar',
    sort_order: 1,
    is_available: true,
    track_inventory: false,
    stock: -1,
    options: [],
  })

  console.log(`  discovery restaurant: ${cafe.slug}`)
  console.log(`\n  Customer URL: ?restaurant_id=di-pasquale  (or ${restaurant.id})`)
  console.log(`  Staff PINs: manager 1111 · foh 1112 · kitchen 1113 · bar 1114`)
  console.log(`  Owner: dr.mtorres@icloud.com / 2026`)
}

main().catch((err) => {
  console.error(err?.response || err)
  process.exit(1)
})
