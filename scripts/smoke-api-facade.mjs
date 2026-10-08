#!/usr/bin/env node
/**
 * Smoke-test the same operations the UI API layer performs against PocketBase.
 * Mirrors src/shared/api/orders.ts create → station → pay without Vite.
 */
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')
pb.autoCancellation(false)

async function createOrderViaApi(restaurantId, tableId, items) {
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const needsKitchen = items.some((i) => i.station !== 'bar')
  const needsBar = items.some((i) => i.station === 'bar' || i.station === 'both')

  const order = await pb.collection('orders').create({
    restaurant: restaurantId,
    table: tableId || null,
    order_type: 'dine_in',
    status: 'new',
    payment_status: 'unpaid',
    customer_name: 'Facade Test',
    subtotal,
    total: subtotal,
    tip: 0,
    kitchen_status: needsKitchen ? 'new' : null,
    bar_status: needsBar ? 'new' : null,
    status_timestamps: { created: new Date().toISOString() },
  })

  for (const item of items) {
    await pb.collection('order_items').create({
      order: order.id,
      menu_item: item.menu_item_id,
      restaurant: restaurantId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      status: 'new',
      station: item.station,
      options: [],
    })
  }
  return order
}

async function updateStationStatus(orderId, station, newStatus) {
  const current = await pb.collection('orders').getOne(orderId)
  const kitchenStatus = station === 'kitchen' ? newStatus : current.kitchen_status
  const barStatus = station === 'bar' ? newStatus : current.bar_status
  const kitchenDone = !kitchenStatus || kitchenStatus === 'ready'
  const barDone = !barStatus || barStatus === 'ready'
  let overall = current.status
  if (!['picking_up', 'delivered', 'paid', 'cancelled'].includes(current.status)) {
    if (kitchenDone && barDone && (kitchenStatus || barStatus)) overall = 'ready'
    else if (newStatus === 'in_progress' || kitchenStatus === 'in_progress' || barStatus === 'in_progress')
      overall = 'in_progress'
  }
  return pb.collection('orders').update(orderId, {
    [station === 'kitchen' ? 'kitchen_status' : 'bar_status']: newStatus,
    status: overall,
  })
}

async function processPayment(orderId, restaurantId, method) {
  const order = await pb.collection('orders').getOne(orderId)
  await pb.collection('payments').create({
    order: orderId,
    restaurant: restaurantId,
    method,
    amount: order.total,
    subtotal: order.subtotal,
    tip: 0,
    status: 'completed',
  })
  return pb.collection('orders').update(orderId, {
    payment_status: 'paid',
    status: 'paid',
  })
}

async function main() {
  const restaurant = await pb.collection('restaurants').getFirstListItem('slug="di-pasquale"')
  const table = await pb.collection('restaurant_tables').getFirstListItem(
    `restaurant="${restaurant.id}" && table_number=2`
  )
  const kitchen = await pb.collection('menu_items').getFirstListItem(
    `restaurant="${restaurant.id}" && station="kitchen"`
  )

  console.log('create')
  let order = await createOrderViaApi(restaurant.id, table.id, [
    {
      menu_item_id: kitchen.id,
      name: kitchen.name,
      quantity: 1,
      unit_price: kitchen.price,
      station: 'kitchen',
    },
  ])
  console.log('  status', order.status, 'kitchen', order.kitchen_status)

  console.log('kitchen accept')
  order = await updateStationStatus(order.id, 'kitchen', 'in_progress')
  if (order.status !== 'in_progress') throw new Error('rollup in_progress failed')

  console.log('kitchen ready')
  order = await updateStationStatus(order.id, 'kitchen', 'ready')
  if (order.status !== 'ready') throw new Error('rollup ready failed: ' + order.status)

  console.log('foh deliver')
  order = await pb.collection('orders').update(order.id, { status: 'delivered' })

  console.log('pay phone')
  order = await processPayment(order.id, restaurant.id, 'phone')
  if (order.payment_status !== 'paid' || order.status !== 'paid') {
    throw new Error('payment failed')
  }

  console.log('API FACADE SMOKE OK', order.id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
