import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Wine,
  Clock,
  CheckCircle2,
  Play,
  AlertTriangle,
  Loader2,
  ListOrdered,
  GlassWater,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  getActiveOrders,
  updateStationStatus,
  subscribeToOrders,
} from '../../../shared/api/orders'
import {
  restoreStaffSession,
} from '../auth/StaffLogin'
import { logStaffAction } from '../../../shared/api/staff'
import { useStationFilter, filterOrdersByStation } from '../../../shared/hooks/useStationFilter'
import type { Order, OrderItem } from '../../../types'

// ─── Bar ticket color states ───
type TicketStage = 'new' | 'in_progress' | 'ready'

const STAGE_CONFIG: Record<
  TicketStage,
  {
    label: string
    bg: string
    border: string
    icon: React.ReactNode
    headerBg: string
  }
> = {
  new: {
    label: 'New',
    bg: 'bg-surface-alt',
    border: 'border-fp-blue',
    icon: <ListOrdered className="w-5 h-5" />,
    headerBg: 'bg-fp-blue/20',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-surface-alt',
    border: 'border-fp-green',
    icon: <Play className="w-5 h-5" />,
    headerBg: 'bg-fp-green/20',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-surface-alt',
    border: 'border-fp-red',
    icon: <CheckCircle2 className="w-5 h-5" />,
    headerBg: 'bg-fp-red/20',
  },
}

// ─── Bar Ticket Card ───
function BarTicket({
  order,
  stage,
  onAccept,
  onReady,
}: {
  order: Order
  stage: TicketStage
  onAccept: (id: string) => void
  onReady: (id: string) => void
}) {
  const { t } = useTranslation()
  const config = STAGE_CONFIG[stage]
  const elapsed = order.created_at
    ? Math.floor(
        (Date.now() - new Date(order.created_at).getTime()) / 60000
      )
    : 0

  // Group items by seat
  const seatMap = useMemo(() => {
    const map = new Map<number, OrderItem[]>()
    for (const item of order.items || []) {
      const seat = item.seat_number || 0
      if (!map.has(seat)) map.set(seat, [])
      map.get(seat)!.push(item)
    }
    return map
  }, [order.items])

  return (
    <div
      onClick={() => {
        if (stage === 'new') onAccept(order.id)
        else if (stage === 'in_progress') onReady(order.id)
      }}
      className={`${config.bg} border-t-4 ${
        stage === 'new' ? 'border-t-fp-blue' : stage === 'in_progress' ? 'border-t-fp-green' : 'border-t-fp-red'
      } rounded-xl overflow-hidden shadow-lg transition-all duration-200 hover:shadow-xl min-w-[280px] max-w-[360px] flex-shrink-0 ${stage !== 'ready' ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
      {/* Header */}
      <div className={`${config.headerBg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <GlassWater className="w-4 h-4 text-text" />
          <span className="text-lg font-bold text-text">
            {order.customer_name
              ? order.customer_name.split(' ')[0]
              : `#${order.id.slice(0, 6)}`}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-secondary font-medium uppercase">
            {order.order_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {order.table_id && (
            <span className="text-xs text-text-secondary">
              T{order.table_id.slice(0, 4)}
            </span>
          )}
          <span
            className={`text-xs font-mono font-bold ${
              elapsed > 20 ? 'text-fp-red' : 'text-text-secondary'
            }`}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            {elapsed}m
          </span>
        </div>
      </div>

      {/* Items by Seat */}
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {Array.from(seatMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([seat, items]) => (
            <div key={seat}>
              {seat > 0 && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-500 text-[10px] font-bold flex items-center justify-center">
                    {seat}
                  </span>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-medium">
                    Seat {seat}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs">
                        {item.quantity}x
                      </span>
                      <span className="text-text font-medium">
                        {item.name}
                      </span>
                    </div>
                    {item.notes && (
                      <span className="text-[10px] text-fp-amber italic max-w-[100px] truncate">
                        {item.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        {(!order.items || order.items.length === 0) && (
          <p className="text-text-muted text-xs text-center py-4">
            No items
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="px-4 pb-4">
        {stage === 'new' && (
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(order.id) }}
            className="w-full py-2.5 rounded-lg bg-fp-blue text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            {t('bar.accept') || 'Accept'}
          </button>
        )}
        {stage === 'in_progress' && (
          <button
            onClick={(e) => { e.stopPropagation(); onReady(order.id) }}
            className="w-full py-2.5 rounded-lg bg-fp-green text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('bar.ready') || 'Ready'}
          </button>
        )}
        {stage === 'ready' && (
          <div className="w-full py-2.5 rounded-lg bg-fp-red/10 border border-fp-red/30 text-fp-red text-center text-sm font-semibold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fp-red pulse-ring" />
            Awaiting Pickup
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ───
function EmptyBar({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-3">
      <Wine className="w-16 h-16 text-text-muted" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-text-muted">All drinks fulfilled!</p>
    </div>
  )
}

// ─── Loading State ───
function LoadingBar() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-text-secondary text-sm">Loading orders...</p>
      </div>
    </div>
  )
}

// ─── Error State ───
function ErrorBar({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <AlertTriangle className="w-12 h-12 text-fp-red mx-auto" />
        <h2 className="text-lg font-bold text-text">Error</h2>
        <p className="text-text-secondary text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// =========================================================================
// Bar View — Main Component
// =========================================================================
export default function BarView() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const restaurantId = session?.restaurantId
  const { stationMap } = useStationFilter(restaurantId)

  // ─── Load data ───
  const loadOrders = useCallback(async () => {
    if (!restaurantId) return
    try {
      setLoading(true)
      const data = await getActiveOrders(restaurantId)
      // Bar sees all non-delivered, non-cancelled, non-picked-up orders
      const barOrders = data.filter(
        (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'picking_up'
      )
      setOrders(barOrders)
      setError(null)
    } catch (err) {
      console.error('Bar load error:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // ─── Real-time subscription ───
  useEffect(() => {
    if (!restaurantId) return

    const sub = subscribeToOrders(restaurantId, (order) => {
      setOrders((prev) => {
        if (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'picking_up') {
          return prev.filter((o) => o.id !== order.id)
        }
        const idx = prev.findIndex((o) => o.id === order.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = order
          return next
        }
        return [...prev, order]
      })
    })

    return () => {
      sub.then((s) => supabase.removeChannel(s))
    }
  }, [restaurantId])

  // ─── Actions ───
  const handleAccept = useCallback(
    async (orderId: string) => {
      const success = await updateStationStatus(
        orderId,
        'bar',
        'in_progress'
      )
      if (success) {
        if (session) await logStaffAction(session.staff.id, 'bar_accepted', { order_id: orderId })
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, bar_status: 'in_progress' } : o))
      }
    },
    [session]
  )

  const handleReady = useCallback(
    async (orderId: string) => {
      const success = await updateStationStatus(
        orderId,
        'bar',
        'ready'
      )
      if (success) {
        if (session) await logStaffAction(session.staff.id, 'bar_ready', { order_id: orderId })
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, bar_status: 'ready' } : o))
      }
    },
    [session]
  )

  // ─── Categorize ───
  const { newOrders, inProgressOrders, readyOrders } = useMemo(() => {
    const barOrders = filterOrdersByStation(orders, stationMap, 'bar')
    return {
      newOrders: barOrders.filter((o) => o.bar_status === 'new' || (!o.bar_status && o.status === 'new')),
      inProgressOrders: barOrders.filter((o) => o.bar_status === 'in_progress'),
      readyOrders: barOrders.filter((o) => o.bar_status === 'ready'),
    }
  }, [orders, stationMap])

  // ─── Not logged in ───
  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface dark">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-fp-amber mx-auto" />
          <h2 className="text-xl font-bold text-text">Not logged in</h2>
          <p className="text-text-secondary">Please log in via /staff/login</p>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingBar />
  if (error) return <ErrorBar message={error} onRetry={loadOrders} />

  const totalActive =
    newOrders.length + inProgressOrders.length + readyOrders.length

  return (
    <div className="h-dvh bg-surface dark overflow-hidden flex flex-col">
      {/* ── Header Bar ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-hover shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fp-blue/20 flex items-center justify-center">
            <Wine className="w-6 h-6 text-fp-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text">
              {t('bar.title')}
            </h1>
            <p className="text-xs text-text-secondary">
              {session.staff.name} • {totalActive} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <StageCount label="New" count={newOrders.length} color="text-fp-blue" />
          <StageCount
            label="In Progress"
            count={inProgressOrders.length}
            color="text-fp-green"
          />
          <StageCount label="Ready" count={readyOrders.length} color="text-fp-red" />
        </div>
      </header>

      {/* ── Ticket Rails ── */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* New Orders */}
        <section className="flex-1 min-w-0 border-r border-border flex flex-col">
          <div className="px-4 py-2 bg-fp-blue/10 border-b border-fp-blue/20 shrink-0">
            <h2 className="text-sm font-bold text-fp-blue flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              New
              <span className="text-xs ml-auto text-text-secondary">
                {newOrders.length} orders
              </span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {newOrders.length === 0 ? (
              <EmptyBar label="No new drink orders" />
            ) : (
              newOrders.map((order) => (
                <BarTicket
                  key={order.id}
                  order={order}
                  stage="new"
                  onAccept={handleAccept}
                  onReady={handleReady}
                />
              ))
            )}
          </div>
        </section>

        {/* In Progress */}
        <section className="flex-1 min-w-0 border-r border-border flex flex-col">
          <div className="px-4 py-2 bg-fp-green/10 border-b border-fp-green/20 shrink-0">
            <h2 className="text-sm font-bold text-fp-green flex items-center gap-2">
              <Play className="w-4 h-4" />
              In Progress
              <span className="text-xs ml-auto text-text-secondary">
                {inProgressOrders.length} orders
              </span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inProgressOrders.length === 0 ? (
              <EmptyBar label="No drinks in progress" />
            ) : (
              inProgressOrders.map((order) => (
                <BarTicket
                  key={order.id}
                  order={order}
                  stage="in_progress"
                  onAccept={handleAccept}
                  onReady={handleReady}
                />
              ))
            )}
          </div>
        </section>

        {/* Ready */}
        <section className="flex-1 min-w-0 flex flex-col">
          <div className="px-4 py-2 bg-fp-red/10 border-b border-fp-red/20 shrink-0">
            <h2 className="text-sm font-bold text-fp-red flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Ready
              <span className="text-xs ml-auto text-text-secondary">
                {readyOrders.length} orders
              </span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {readyOrders.length === 0 ? (
              <EmptyBar label="No ready drinks" />
            ) : (
              readyOrders.map((order) => (
                <BarTicket
                  key={order.id}
                  order={order}
                  stage="ready"
                  onAccept={handleAccept}
                  onReady={handleReady}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── Helpers ───

function StageCount({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`text-lg font-bold ${color}`}>{count}</span>
      <span className="text-text-secondary text-xs">{label}</span>
    </span>
  )
}
