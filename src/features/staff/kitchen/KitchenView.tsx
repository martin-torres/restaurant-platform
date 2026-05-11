import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChefHat, Clock, CheckCircle2, Play, AlertTriangle, Loader2, ListOrdered, UtensilsCrossed, Timer
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { getActiveOrders, updateStationStatus, subscribeToOrders } from '../../../shared/api/orders'
import { restoreStaffSession } from '../auth/StaffLogin'
import { logStaffAction } from '../../../shared/api/staff'
import { useStationFilter, filterOrdersByStation } from '../../../shared/hooks/useStationFilter'
import type { Order, OrderItem } from '../../../types'

type TicketStage = 'new' | 'in_progress' | 'ready'

const STAGE_CONFIG: Record<TicketStage, { label: string; border: string; icon: React.ReactNode; headerBg: string; accent: string }> = {
  new: { label: 'New', border: 'border-fp-blue', icon: <ListOrdered className="w-5 h-5" />, headerBg: 'bg-fp-blue/15', accent: 'text-fp-blue' },
  in_progress: { label: 'In Progress', border: 'border-fp-green', icon: <Play className="w-5 h-5" />, headerBg: 'bg-fp-green/15', accent: 'text-fp-green' },
  ready: { label: 'Ready', border: 'border-fp-red', icon: <CheckCircle2 className="w-5 h-5" />, headerBg: 'bg-fp-red/15', accent: 'text-fp-red' },
}

function KitchenTicket({ order, stage, onAccept, onReady }: { order: Order; stage: TicketStage; onAccept: (id: string) => void; onReady: (id: string) => void }) {
  const config = STAGE_CONFIG[stage]
  const elapsed = order.created_at ? Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000) : 0

  const seatMap = useMemo(() => {
    const map = new Map<number, OrderItem[]>()
    for (const item of order.items || []) { const seat = item.seat_number || 0; if (!map.has(seat)) map.set(seat, []); map.get(seat)!.push(item) }
    return map
  }, [order.items])

  return (
    <div
      onClick={() => {
        if (stage === 'new') onAccept(order.id)
        else if (stage === 'in_progress') onReady(order.id)
      }}
      className={`bg-surface-alt border-t-[3px] ${
        stage === 'new' ? 'border-t-fp-blue' : stage === 'in_progress' ? 'border-t-fp-green' : 'border-t-fp-red'
      } rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg flex-shrink-0 ${stage !== 'ready' ? 'cursor-pointer active:scale-[0.98]' : ''}`}>
      {/* Header */}
      <div className={`${config.headerBg} px-3.5 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-bold text-text">{order.customer_name ? order.customer_name.split(' ')[0] : `#${order.id.slice(0, 6)}`}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface text-text-secondary font-medium uppercase">{order.order_type}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {order.table_id && <span className="text-[11px] text-text-secondary font-mono">T{order.table_id.slice(0, 4)}</span>}
          <span className={`text-[11px] font-mono font-bold flex items-center gap-1 ${elapsed > 20 ? 'text-fp-red' : 'text-text-secondary'}`}>
            <Timer className="w-3 h-3" /> {elapsed}m
          </span>
        </div>
      </div>

      {/* Items by Seat */}
      <div className="p-3.5 space-y-2.5 max-h-[260px] overflow-y-auto">
        {Array.from(seatMap.entries()).sort(([a], [b]) => a - b).map(([seat, items]) => (
          <div key={seat}>
            {seat > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-500 text-[9px] font-bold flex items-center justify-center">{seat}</span>
                <span className="text-[9px] text-text-secondary uppercase tracking-wider font-medium">Seat {seat}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs w-5 text-right">{item.quantity}x</span>
                    <span className="text-text text-sm font-medium">{item.name}</span>
                  </div>
                  {item.notes && <span className="text-[10px] text-fp-amber italic max-w-[80px] truncate">{item.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {(!order.items || order.items.length === 0) && <p className="text-text-muted text-xs text-center py-4">No items</p>}
      </div>

      {/* Order notes */}
      {order.notes && <div className="px-3.5 pb-1"><p className="text-[10px] text-fp-amber italic">📝 {order.notes}</p></div>}

      {/* Action */}
      <div className="px-3.5 pb-3.5">
        {stage === 'new' && (
          <button onClick={(e) => { e.stopPropagation(); onAccept(order.id) }} className="w-full py-2 rounded-lg bg-fp-blue text-white font-semibold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> Accept Order
          </button>
        )}
        {stage === 'in_progress' && (
          <button onClick={(e) => { e.stopPropagation(); onReady(order.id) }} className="w-full py-2 rounded-lg bg-fp-green text-white font-semibold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
          </button>
        )}
        {stage === 'ready' && (
          <div className="w-full py-2 rounded-lg bg-fp-red/10 border border-fp-red/30 text-fp-red text-center text-xs font-semibold flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fp-red pulse-ring" /> Awaiting Pickup
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyKitchen({ label, icon: Icon }: { label: string; icon?: any }) {
  const I = Icon || ChefHat
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-3 px-4">
      <I className="w-12 h-12 text-text-muted" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-text-muted">All orders fulfilled!</p>
    </div>
  )
}

function StageCount({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover">
      <span className={`text-lg font-bold ${color}`}>{count}</span>
      <span className="text-text-secondary text-[11px]">{label}</span>
    </div>
  )
}

export default function KitchenView() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const restaurantId = session?.restaurantId
  const { stationMap } = useStationFilter(restaurantId)

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return
    try {
      setLoading(true)
      const data = await getActiveOrders(restaurantId)
      setOrders(data.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'picking_up'))
      setError(null)
    } catch (err) { setError('Failed to load orders') } finally { setLoading(false) }
  }, [restaurantId])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    if (!restaurantId) return
    const sub = subscribeToOrders(restaurantId, (order) => {
      setOrders((prev) => {
        // Remove delivered, cancelled, or picked-up orders from K/B view
        if (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'picking_up') {
          return prev.filter((o) => o.id !== order.id)
        }
        const idx = prev.findIndex((o) => o.id === order.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = order; return next }
        return [...prev, order]
      })
    })
    return () => { sub.then((s) => supabase.removeChannel(s)) }
  }, [restaurantId])

  const handleAccept = useCallback(async (orderId: string) => {
    const success = await updateStationStatus(orderId, 'kitchen', 'in_progress')
    if (success) {
      if (session) await logStaffAction(session.staff.id, 'kitchen_accepted', { order_id: orderId })
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, kitchen_status: 'in_progress' } : o))
    }
  }, [session])

  const handleReady = useCallback(async (orderId: string) => {
    const success = await updateStationStatus(orderId, 'kitchen', 'ready')
    if (success) {
      if (session) await logStaffAction(session.staff.id, 'kitchen_ready', { order_id: orderId })
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, kitchen_status: 'ready' } : o))
    }
  }, [session])

  const { newOrders, inProgressOrders, readyOrders } = useMemo(() => {
    const kitchenOrders = filterOrdersByStation(orders, stationMap, 'kitchen')
    return {
      newOrders: kitchenOrders.filter((o) => o.kitchen_status === 'new' || (!o.kitchen_status && o.status === 'new')),
      inProgressOrders: kitchenOrders.filter((o) => o.kitchen_status === 'in_progress'),
      readyOrders: kitchenOrders.filter((o) => o.kitchen_status === 'ready' && !o.foh_request_status),
    }
  }, [orders, stationMap])

  if (!session) return (
    <div className="min-h-dvh flex items-center justify-center bg-surface dark">
      <div className="text-center space-y-4"><AlertTriangle className="w-12 h-12 text-fp-amber mx-auto" /><h2 className="text-xl font-bold text-text">Not logged in</h2><p className="text-text-secondary">Please log in via /staff/login</p></div>
    </div>
  )
  if (loading) return (
    <div className="h-dvh flex items-center justify-center bg-surface dark">
      <div className="flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /><p className="text-text-secondary text-sm">Loading orders...</p></div>
    </div>
  )
  if (error) return (
    <div className="h-dvh flex items-center justify-center bg-surface dark">
      <div className="text-center space-y-4 max-w-sm"><AlertTriangle className="w-12 h-12 text-fp-red mx-auto" /><h2 className="text-lg font-bold text-text">Error</h2><p className="text-text-secondary text-sm">{error}</p><button onClick={loadOrders} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors">Retry</button></div>
    </div>
  )

  const totalActive = newOrders.length + inProgressOrders.length + readyOrders.length

  return (
    <div className="h-dvh bg-surface dark overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-hover shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-fp-red/20 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-fp-red" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text">Kitchen</h1>
            <p className="text-[11px] text-text-secondary">{session.staff.name} • {totalActive} active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StageCount label="New" count={newOrders.length} color="text-fp-blue" />
          <StageCount label="In Progress" count={inProgressOrders.length} color="text-fp-green" />
          <StageCount label="Ready" count={readyOrders.length} color="text-fp-red" />
        </div>
      </header>

      {/* Ticket Rails — 3-column Kanban */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* New */}
        <section className="flex-1 min-w-0 border-r border-border flex flex-col">
          <div className="px-4 py-2 bg-fp-blue/10 border-b border-fp-blue/20 shrink-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fp-blue animate-pulse-dot" />
            <h2 className="text-xs font-bold text-fp-blue">New</h2>
            <span className="text-[10px] ml-auto text-text-secondary">{newOrders.length} orders</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {newOrders.length === 0 ? <EmptyKitchen label="No new orders" /> : newOrders.map((order) => <KitchenTicket key={order.id} order={order} stage="new" onAccept={handleAccept} onReady={handleReady} />)}
          </div>
        </section>

        {/* In Progress */}
        <section className="flex-1 min-w-0 border-r border-border flex flex-col">
          <div className="px-4 py-2 bg-fp-green/10 border-b border-fp-green/20 shrink-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fp-green animate-pulse-dot" />
            <h2 className="text-xs font-bold text-fp-green">In Progress</h2>
            <span className="text-[10px] ml-auto text-text-secondary">{inProgressOrders.length} orders</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {inProgressOrders.length === 0 ? <EmptyKitchen label="No orders in progress" /> : inProgressOrders.map((order) => <KitchenTicket key={order.id} order={order} stage="in_progress" onAccept={handleAccept} onReady={handleReady} />)}
          </div>
        </section>

        {/* Ready */}
        <section className="flex-1 min-w-0 flex flex-col">
          <div className="px-4 py-2 bg-fp-red/10 border-b border-fp-red/20 shrink-0 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fp-red animate-pulse-dot" />
            <h2 className="text-xs font-bold text-fp-red">Ready</h2>
            <span className="text-[10px] ml-auto text-text-secondary">{readyOrders.length} orders</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {readyOrders.length === 0 ? <EmptyKitchen label="No ready orders" /> : readyOrders.map((order) => <KitchenTicket key={order.id} order={order} stage="ready" onAccept={handleAccept} onReady={handleReady} />)}
          </div>
        </section>
      </div>
    </div>
  )
}
