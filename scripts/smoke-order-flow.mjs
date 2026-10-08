#!/usr/bin/env node
/** End-to-end smoke: create order → kitchen → FOH → pay */
import PocketBase from 'pocketbase'

const PB = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
const pb = new PocketBase(PB)
pb.autoCancellation(false)

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  const restaurant = await pb.collection('restaurants').getFirstListItem('slug="di-pasquale"')
  const menu = await pb.collection('menu_items').getFullList({
    filter: `restaurant="${restaurant.id}"`,
  })
  const kitchenItem = menu.find((m) => m.station === 'kitchen')
  const barItem = menu.find((m) => m.station === 'bar')
  const table = await pb.collection('restaurant_tables').getFirstListItem(
    `restaurant="${restaurant.id}" && table_number=1`
  )
  assert(kitchenItem && barItem && table, 'seed missing kitchen/bar/table')

  console.log('1) Create order with kitchen + bar items')
  const order = await pb.collection('orders').create({
    restaurant: restaurant.id,
    table: table.id,
    order_type: 'dine_in',
    status: 'new',
    payment_status: 'unpaid',
    customer_name: 'Smoke Test',
    subtotal: kitchenItem.price + barItem.price,
    total: kitchenItem.price + barItem.price,
    tip: 0,
    kitchen_status: 'new',
    bar_status: 'new',
    status_timestamps: { created: new Date().toISOString() },
  })
  await pb.collection('order_items').create({
    order: order.id,
    menu_item: kitchenItem.id,
    restaurant: restaurant.id,
    name: kitchenItem.name,
    quantity: 1,
    unit_price: kitchenItem.price,
    total_price: kitchenItem.price,
    status: 'new',
    station: 'kitchen',
    options: [],
  })
  await pb.collection('order_items').create({
    order: order.id,
    menu_item: barItem.id,
    restaurant: restaurant.id,
    name: barItem.name,
    quantity: 1,
    unit_price: barItem.price,
    total_price: barItem.price,
    status: 'new',
    station: 'bar',
    options: [],
  })
  console.log('   order', order.id)

  console.log('2) Kitchen accept → in_progress')
  await pb.collection('orders').update(order.id, {
    kitchen_status: 'in_progress',
    status: 'in_progress',
  })
  let cur = await pb.collection('orders').getOne(order.id)
  assert(cur.status === 'in_progress', 'expected in_progress')

  console.log('3) Kitchen + bar ready → ready')
  await pb.collection('orders').update(order.id, { kitchen_status: 'ready' })
  await pb.collection('orders').update(order.id, {
    bar_status: 'ready',
    status: 'ready',
  })
  cur = await pb.collection('orders').getOne(order.id)
  assert(cur.status === 'ready', 'expected ready')

  console.log('4) FOH pick up → picking_up → delivered')
  await pb.collection('orders').update(order.id, { status: 'picking_up' })
  await pb.collection('orders').update(order.id, { status: 'delivered' })
  cur = await pb.collection('orders').getOne(order.id)
  assert(cur.status === 'delivered', 'expected delivered')

  console.log('5) Pay with card')
  const tip = 20
  const amount = cur.total + tip
  await pb.collection('payments').create({
    order: order.id,
    restaurant: restaurant.id,
    method: 'card',
    amount,
    subtotal: cur.subtotal,
    tip,
    status: 'completed',
  })
  await pb.collection('orders').update(order.id, {
    payment_status: 'paid',
    status: 'paid',
    tip,
    total: amount,
  })
  cur = await pb.collection('orders').getOne(order.id)
  assert(cur.payment_status === 'paid', 'expected payment_status paid')
  assert(cur.status === 'paid', 'expected status paid')

  console.log('6) Pay with phone + cash variants (new mini orders)')
  for (const method of ['phone', 'cash']) {
    const o = await pb.collection('orders').create({
      restaurant: restaurant.id,
      order_type: 'to_go',
      status: 'delivered',
      payment_status: 'unpaid',
      customer_name: `Pay ${method}`,
      subtotal: 50,
      total: 50,
      tip: 0,
      kitchen_status: 'ready',
      status_timestamps: {},
      pickup_verification_pin: '4321',
    })
    await pb.collection('payments').create({
      order: o.id,
      restaurant: restaurant.id,
      method,
      amount: 50,
      subtotal: 50,
      tip: 0,
      status: 'completed',
      cash_given: method === 'cash' ? 100 : null,
      change_due: method === 'cash' ? 50 : null,
    })
    await pb.collection('orders').update(o.id, {
      payment_status: 'paid',
      status: 'paid',
    })
    const paid = await pb.collection('orders').getOne(o.id)
    assert(paid.payment_status === 'paid', `${method} payment failed`)
    console.log(`   ${method} ok`)
  }

  console.log('\nSMOKE OK')
}

main().catch((e) => {
  console.error('SMOKE FAIL', e?.message || e)
  process.exit(1)
})
