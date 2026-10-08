import { supabase } from '../../lib/supabase'
import type { Order, OrderStatus, PaymentMethod } from '../../types'

async function getMenuStations(
  menuItemIds: string[]
): Promise<Record<string, 'kitchen' | 'bar' | 'both'>> {
  const map: Record<string, 'kitchen' | 'bar' | 'both'> = {}
  if (menuItemIds.length === 0) return map
  // Fetch individually — small carts; avoids complex IN filter edge cases
  await Promise.all(
    menuItemIds.map(async (id) => {
      const { data } = await supabase
        .from('menu_items')
        .select('id, station')
        .eq('id', id)
        .maybeSingle()
      if (data) map[data.id] = (data.station || 'kitchen') as any
    })
  )
  return map
}

function deriveStationFlags(
  stations: Array<'kitchen' | 'bar' | 'both' | undefined>
): { needsKitchen: boolean; needsBar: boolean } {
  let needsKitchen = false
  let needsBar = false
  for (const s of stations) {
    if (!s || s === 'kitchen') needsKitchen = true
    else if (s === 'bar') needsBar = true
    else if (s === 'both') {
      needsKitchen = true
      needsBar = true
    }
  }
  // Default to kitchen if somehow empty
  if (!needsKitchen && !needsBar) needsKitchen = true
  return { needsKitchen, needsBar }
}

export async function createOrder(order: {
  restaurant_id: string
  table_id?: string
  seat_number?: number
  order_type: 'dine_in' | 'to_go' | 'delivery'
  customer_phone?: string
  customer_name?: string
  notes?: string
  items: {
    menu_item_id: string
    seat_number?: number
    name: string
    quantity: number
    unit_price: number
    notes?: string
    options?: any[]
  }[]
}): Promise<Order | null> {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )

  const stationMap = await getMenuStations(
    order.items.map((i) => i.menu_item_id).filter(Boolean)
  )
  const { needsKitchen, needsBar } = deriveStationFlags(
    order.items.map((i) => stationMap[i.menu_item_id])
  )

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: order.restaurant_id,
      table_id: order.table_id || null,
      seat_number: order.seat_number || null,
      order_type: order.order_type,
      customer_phone: order.customer_phone || null,
      customer_name: order.customer_name || null,
      notes: order.notes || null,
      status: 'new',
      payment_status: 'unpaid',
      subtotal,
      total: subtotal,
      tip: 0,
      kitchen_status: needsKitchen ? 'new' : null,
      bar_status: needsBar ? 'new' : null,
      status_timestamps: { created: new Date().toISOString() },
      pickup_verification_pin:
        order.order_type === 'to_go'
          ? Math.floor(1000 + Math.random() * 9000).toString()
          : null,
    })
    .select()
    .single()

  if (orderError || !orderData) {
    console.error('Order creation error:', orderError)
    return null
  }

  const orderItems = order.items.map((item) => ({
    order_id: orderData.id,
    menu_item_id: item.menu_item_id,
    restaurant_id: order.restaurant_id,
    seat_number: item.seat_number || order.seat_number || null,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    status: 'new',
    notes: item.notes || null,
    options: item.options || [],
    station: stationMap[item.menu_item_id] || 'kitchen',
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items creation error:', itemsError)
    await supabase.from('orders').delete().eq('id', orderData.id)
    return null
  }

  return (await getOrder(orderData.id)) as Order
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .single()

  return data as unknown as Order | null
}

export async function getOrdersByTable(
  restaurantId: string,
  tableId: string
): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('restaurant_id', restaurantId)
    .eq('table_id', tableId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  return (data as unknown as Order[]) || []
}

export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('restaurant_id', restaurantId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true })

  // Active = not fully closed (paid or cancelled). Keep delivered+unpaid for bill/FOH.
  const orders = ((data as unknown as Order[]) || []).filter((o) => {
    if (o.status === 'cancelled') return false
    if (o.status === 'paid' || o.payment_status === 'paid') return false
    return true
  })
  return orders
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  staffId?: string
): Promise<boolean> {
  const updates: any = {
    status,
  }

  const { data: current } = await supabase
    .from('orders')
    .select('status_timestamps')
    .eq('id', orderId)
    .single()

  if (current) {
    const timestamps = { ...((current as any).status_timestamps || {}) }
    timestamps[status] = new Date().toISOString()
    updates.status_timestamps = timestamps
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    console.error(
      'Order status update failed:',
      error?.message ?? 'No rows affected'
    )
    return false
  }

  if (staffId) {
    const { error: logError } = await supabase.from('staff_actions').insert({
      staff_id: staffId,
      action_type: `order_${status}`,
      order_id: orderId,
    })
    if (logError) console.warn('Failed to log staff action:', logError.message)
  }

  return true
}

/**
 * Update kitchen/bar station status AND roll up the overall order.status.
 * This was the broken link: kitchen only wrote kitchen_status, so tracking
 * and payment never advanced past "new".
 */
export async function updateStationStatus(
  orderId: string,
  station: 'kitchen' | 'bar',
  newStatus: OrderStatus
): Promise<boolean> {
  const { data: current, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (fetchErr || !current) {
    console.error('updateStationStatus fetch failed:', fetchErr?.message)
    return false
  }

  const field = station === 'kitchen' ? 'kitchen_status' : 'bar_status'
  const kitchenStatus =
    station === 'kitchen' ? newStatus : current.kitchen_status
  const barStatus = station === 'bar' ? newStatus : current.bar_status

  // Roll up overall status from station states
  let overall: string = current.status
  const kitchenDone =
    !kitchenStatus ||
    kitchenStatus === 'ready' ||
    kitchenStatus === 'delivered' ||
    kitchenStatus === 'picking_up'
  const barDone =
    !barStatus ||
    barStatus === 'ready' ||
    barStatus === 'delivered' ||
    barStatus === 'picking_up'
  const kitchenWorking = kitchenStatus === 'in_progress'
  const barWorking = barStatus === 'in_progress'

  // Don't regress past picking_up / delivered / paid
  const locked = ['picking_up', 'delivered', 'paid', 'cancelled'].includes(
    current.status
  )
  if (!locked) {
    if (kitchenDone && barDone && (kitchenStatus || barStatus)) {
      overall = 'ready'
    } else if (kitchenWorking || barWorking || newStatus === 'in_progress') {
      overall = 'in_progress'
    } else if (newStatus === 'new') {
      overall = 'new'
    }
  }

  const timestamps = { ...(current.status_timestamps || {}) }
  timestamps[`${station}_${newStatus}`] = new Date().toISOString()
  if (overall !== current.status) {
    timestamps[overall] = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orders')
    .update({
      [field]: newStatus,
      status: overall,
      status_timestamps: timestamps,
    })
    .eq('id', orderId)

  if (error) {
    console.error('updateStationStatus failed:', error.message)
    return false
  }
  return true
}

export async function processPayment(params: {
  order_id: string
  restaurant_id: string
  method: PaymentMethod
  amount: number
  subtotal: number
  tip: number
  cash_given?: number
  change_due?: number
  processed_by?: string
}): Promise<{ ok: boolean; error?: string }> {
  const method =
    params.method === 'wallet' ? 'phone' : params.method

  const { error: payError } = await supabase.from('payments').insert({
    order_id: params.order_id,
    restaurant_id: params.restaurant_id,
    method,
    amount: params.amount,
    subtotal: params.subtotal,
    tip: params.tip,
    cash_given: params.cash_given ?? null,
    change_due: params.change_due ?? null,
    processed_by: params.processed_by || null,
    status: 'completed',
  })

  if (payError) {
    return { ok: false, error: payError.message || 'Payment insert failed' }
  }

  const { data: current } = await supabase
    .from('orders')
    .select('status_timestamps, status')
    .eq('id', params.order_id)
    .single()

  const timestamps = { ...((current as any)?.status_timestamps || {}) }
  timestamps.paid = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'paid',
      total: params.amount,
      tip: params.tip,
      status_timestamps: timestamps,
    })
    .eq('id', params.order_id)

  if (updateError) {
    return { ok: false, error: updateError.message || 'Order update failed' }
  }

  return { ok: true }
}

export async function subscribeToOrders(
  restaurantId: string,
  callback: (order: Order) => void
) {
  return supabase
    .channel('orders-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        const order = payload.new as Order
        if (payload.eventType === 'INSERT') {
          const full = await getOrder(order.id)
          callback(full || order)
        } else if (payload.eventType === 'UPDATE') {
          // Refresh items so station filters keep working
          const full = await getOrder(order.id)
          callback(full || order)
        }
      }
    )
    .subscribe()
}
