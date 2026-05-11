import { supabase } from '../../lib/supabase'
import type { Order, OrderItem, OrderStatus } from '../../types'

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
  // Calculate totals
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )

  // Create the order
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
      subtotal,
      total: subtotal,
      status_timestamps: { created: new Date().toISOString() },
      pickup_verification_pin: order.order_type === 'to_go'
        ? Math.floor(1000 + Math.random() * 9000).toString()
        : null,
    })
    .select()
    .single()

  if (orderError || !orderData) {
    console.error('Order creation error:', orderError)
    return null
  }

  // Create order items
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
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items creation error:', itemsError)
    // Optionally delete the order if items fail
    await supabase.from('orders').delete().eq('id', orderData.id)
    return null
  }

  // Track anonymous visit -> order conversion
  // (In a real app, we'd link IP to customer here)

  return orderData as Order
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
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true })

  return (data as unknown as Order[]) || []
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  staffId?: string
): Promise<boolean> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Track status timestamp
  const { data: current } = await supabase
    .from('orders')
    .select('status_timestamps')
    .eq('id', orderId)
    .single()

  if (current) {
    const timestamps = { ...(current as any).status_timestamps }
    timestamps[status] = new Date().toISOString()
    updates.status_timestamps = timestamps
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()

  if (error || !data || data.length === 0) {
    console.error('Order status update failed:', error?.message ?? 'No rows affected — likely RLS block')
    return false
  }

  // Log staff action
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

export async function updateStationStatus(
  orderId: string,
  station: 'kitchen' | 'bar',
  newStatus: OrderStatus
): Promise<boolean> {
  const field = station === 'kitchen' ? 'kitchen_status' : 'bar_status'
  const { error } = await supabase
    .from('orders')
    .update({ [field]: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  return !error
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
        // Realtime payloads don't include joined items.
        // For INSERT, fetch the full order with items so stations can route them.
        // For UPDATE, the payload has the status change — items already in state.
        const order = payload.new as Order
        if (payload.eventType === 'INSERT') {
          const full = await getOrder(order.id)
          if (full) {
            callback(full)
          } else {
            // Fallback: payload has no items but we still need to show it
            // The station filter will return empty until items arrive
            callback(order)
          }
        } else if (payload.eventType === 'UPDATE') {
          callback(order)
        }
        // DELETEs are ignored — component handles via status filter
      }
    )
    .subscribe()
}
