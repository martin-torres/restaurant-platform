import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Map as MapIcon,
  ChefHat,
  PanelRightOpen,
  PanelRightClose,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Banknote,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  getActiveOrders,
  updateOrderStatus,
  subscribeToOrders,
  processPayment,
} from '../../../shared/api/orders'
import type { PaymentMethod } from '../../../types'
import { getTables, subscribeToTables } from '../../../shared/api/tables'
import { useOrderContext } from '../../../shared/contexts/OrderContext'
import {
  clearStaffSession,
  restoreStaffSession,
} from '../auth/StaffLogin'
import { logStaffAction } from '../../../shared/api/staff'
import FloorPlanCanvas from '../../../shared/components/FloorPlanCanvas'
import { STATUS_LABELS, type TableStatusColor } from '../../../shared/utils/floorPlanColors'
import type { Order, RestaurantTable } from '../../../types'

// ─── Ticket Card (for right sidebar) ───
function TicketCard({
  order,
  onPickUp,
  onDeliver,
}: {
  order: Order
  onPickUp: (id: string) => void
  onDeliver: (id: string) => void
}) {
  const { t } = useTranslation()
  const elapsed = order.created_at
    ? Math.floor(
        (Date.now() - new Date(order.created_at).getTime()) / 60000
      )
    : 0

  return (
    <div
      onClick={() => {
        const isReady = order.status === 'ready' || order.kitchen_status === 'ready' || order.bar_status === 'ready'
        if (isReady) onPickUp(order.id)
        else if (order.status === 'picking_up') onDeliver(order.id)
      }}
      className={`bg-surface-alt border border-border rounded-xl p-4 space-y-3 transition-all duration-200 hover:shadow-md ${
        order.status === 'ready' || order.kitchen_status === 'ready' || order.bar_status === 'ready' || order.status === 'picking_up' ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text">
              {order.customer_name || `Order #${order.id.slice(0, 8)}`}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fp-blue/20 text-fp-blue font-medium">
              {order.order_type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
            {order.table_id && (
              <span>Table {order.table_id.slice(0, 4)}</span>
            )}
            {order.seat_number && <span>Seat {order.seat_number}</span>}
            <span className="font-mono">{elapsed}m</span>
          </div>
        </div>
        <span className="text-lg font-bold text-text">
          ${order.total.toFixed(2)}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {order.items?.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm py-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">
                {item.quantity}x
              </span>
              <span className="text-text">{item.name}</span>
              {item.seat_number && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-surface-hover text-text-muted">
                  S{item.seat_number}
                </span>
              )}
            </div>
            <span className="text-text-secondary text-xs">
              ${item.total_price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {(order.status === 'ready' || order.kitchen_status === 'ready' || order.bar_status === 'ready') && (
        <button
          onClick={(e) => { e.stopPropagation(); onPickUp(order.id) }}
          className="w-full py-2 rounded-lg bg-fp-yellow text-black font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {t('foh.pick_up')}
        </button>
      )}
      {order.status === 'picking_up' && (
        <button
          onClick={(e) => { e.stopPropagation(); onDeliver(order.id) }}
          className="w-full py-2 rounded-lg bg-fp-green text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('foh.deliver')}
        </button>
      )}
    </div>
  )
}

// =========================================================================
// FOH Dashboard — Main Component
// =========================================================================
export default function FOHDashboard() {
  const { t } = useTranslation()
  const [session, setSession] = useState(restoreStaffSession())
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [readyOrders, setReadyOrders] = useState<Order[]>([])
  const [pickingUpOrders, setPickingUpOrders] = useState<Order[]>([])
  const [activeView, setActiveView] = useState<
    'floor' | 'requests' | 'payment'
  >('floor')
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [fohPayMethod, setFohPayMethod] = useState<PaymentMethod>('card')

  const { addNotification } = useOrderContext()

  // Track whether we auto-expanded the sidebar
  const autoExpandedRef = useRef(false)

  const restaurantId = session?.restaurantId

  // ─── Compute table statuses using shared utility ───

  // ─── Load Data ───
  useEffect(() => {
    if (!restaurantId) {
      setError('No restaurant ID — please log in again')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        const [tablesData, ordersData] = await Promise.all([
          getTables(restaurantId),
          getActiveOrders(restaurantId),
        ])
        setTables(tablesData)
        setOrders(ordersData)
      } catch (err) {
        console.error('FOH data load error:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // ─── Real-time subscriptions ───
    const ordersSub = subscribeToOrders(restaurantId, (order) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === order.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = order
          return next
        }
        return [...prev, order]
      })
      // Live notification
      addNotification({
        title: order.status === 'delivered' ? 'Orden Entregada' : 'Nueva Orden',
        message: `Mesa ${order.table_id || 'N/A'} — ${order.order_type || 'Dine-in'}: ${order.status}`,
        type: order.status === 'delivered' ? 'delivered' : 'new',
        orderId: order.id,
        tableId: order.table_id || undefined,
      })
    })

    const tablesSub = subscribeToTables(restaurantId, (table) => {
      setTables((prev) => {
        const idx = prev.findIndex((t) => t.id === table.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = table
          return next
        }
        return [...prev, table]
      })
    })

    // Refresh periodically
    const refreshInterval = setInterval(() => {
      setOrders((current) => [...current])
    }, 10000)

    return () => {
      ordersSub.then((sub) => supabase.removeChannel(sub))
      tablesSub.then((sub) => supabase.removeChannel(sub))
      clearInterval(refreshInterval)
    }
  }, [restaurantId])

  // ─── Derive ready/picking up orders ───
  useEffect(() => {
    const ready = orders.filter(
      (o) => o.status === 'ready' || o.kitchen_status === 'ready' || o.bar_status === 'ready'
    )
    const picking = orders.filter((o) => o.status === 'picking_up')
    setReadyOrders(ready)
    setPickingUpOrders(picking)
  }, [orders])

  // ─── Auto-open sidebar when ready orders appear, auto-collapse when cleared ───
  useEffect(() => {
    if (readyOrders.length > 0) {
      // Auto-expand sidebar when there are ready (red) orders
      setRightCollapsed(false)
      autoExpandedRef.current = true
    } else if (autoExpandedRef.current) {
      // Auto-collapse when all red tickets are cleared (only if we auto-expanded)
      setRightCollapsed(true)
      autoExpandedRef.current = false
    }
  }, [readyOrders.length])

// ─── Computed values (must be before early returns — Rules of Hooks) ───
  const selectedTableOrders = useMemo(() => {
    if (!selectedTableId) return []
    return orders.filter((o) => o.table_id === selectedTableId && !o.is_request)
  }, [orders, selectedTableId])

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) || null,
    [tables, selectedTableId]
  )

  const staffLegendItems = useMemo(() => {
    return (['amber', 'red', 'green', 'yellow', 'blue', 'darkgray', 'lightgray', 'none'] as TableStatusColor[]).map((color) => ({
      color,
      label: STATUS_LABELS[color],
      bgClass: getLegendBgClass(color),
    }))
  }, [])

  // ─── Actions ───
  const handlePickUp = useCallback(
    async (orderId: string) => {
      const success = await updateOrderStatus(orderId, 'picking_up', session?.staff.id)
      if (success) {
        if (session) await logStaffAction(session.staff.id, 'order_picked_up', { order_id: orderId })
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'picking_up' } : o))
      }
    },
    [session]
  )

  const handleDeliver = useCallback(
    async (orderId: string) => {
      const success = await updateOrderStatus(orderId, 'delivered', session?.staff.id)
      if (success) {
        if (session) await logStaffAction(session.staff.id, 'order_delivered', { order_id: orderId })
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      }
    },
    [session]
  )

  // ─── If no session, show login prompt ───
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

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface dark">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="w-12 h-12 text-fp-red mx-auto" />
          <h2 className="text-xl font-bold text-text">{t('error')}</h2>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  // ─── Empty State ───
  const hasNoTables = tables.length === 0

  // ─── Tickets for right sidebar ───
  const tickets = [
    ...readyOrders.map((o) => ({ ...o, ticketType: 'ready' as const })),
    ...pickingUpOrders.map((o) => ({
      ...o,
      ticketType: 'picking_up' as const,
    })),
  ]

  const handleLogout = () => {
    clearStaffSession()
    setSession(null)
    window.location.href = '/staff/login'
  }

  function getLegendBgClass(color: TableStatusColor): string {
    switch (color) {
      case 'amber': return 'bg-fp-amber'
      case 'red': return 'bg-fp-red'
      case 'green': return 'bg-fp-green'
      case 'yellow': return 'bg-fp-yellow'
      case 'blue': return 'bg-fp-blue'
      case 'darkgray': return 'bg-fp-darkgray'
      case 'lightgray': return 'bg-fp-lightgray'
      case 'none': return 'bg-white border border-gray-300'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div className="h-dvh flex bg-surface dark overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside
        className={`${
          leftCollapsed ? 'w-14' : 'w-56'
        } flex-shrink-0 bg-surface-alt border-r border-border transition-all duration-200 flex flex-col`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="h-10 flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-hover transition-colors border-b border-border"
        >
          {leftCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Staff info */}
          {!leftCollapsed && (
            <div className="px-3 py-3 border-b border-border mb-2">
              <p className="text-sm font-bold text-text truncate">
                {session?.staff.name}
              </p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">
                {t(`staff.role_${session?.staff.role}`)}
              </p>
            </div>
          )}

          {/* Nav items */}
          <SidebarButton
            icon={<MapIcon className="w-4 h-4" />}
            label={t('nav.floor_plan')}
            collapsed={leftCollapsed}
            active={activeView === 'floor'}
            onClick={() => setActiveView('floor')}
            badge={
              readyOrders.length > 0
                ? { count: readyOrders.length, color: 'bg-fp-red' }
                : undefined
            }
          />
          <SidebarButton
            icon={<Bell className="w-4 h-4" />}
            label="Requests"
            collapsed={leftCollapsed}
            active={activeView === 'requests'}
            onClick={() => setActiveView('requests')}
          />
          <SidebarButton
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Payment"
            collapsed={leftCollapsed}
            active={activeView === 'payment'}
            onClick={() => setActiveView('payment')}
          />

          {!leftCollapsed && <div className="border-t border-border my-2" />}

          <SidebarButton
            icon={<RefreshCw className="w-4 h-4" />}
            label="Refresh"
            collapsed={leftCollapsed}
            onClick={() => window.location.reload()}
          />
        </div>

        {/* Logout at bottom */}
        <div className="p-2 border-t border-border">
          <SidebarButton
            icon={<LogOut className="w-4 h-4" />}
            label={t('nav.logout')}
            collapsed={leftCollapsed}
            onClick={handleLogout}
          />
        </div>
      </aside>

      {/* ── Center: Floor Plan ── */}
      <main
        className={`flex-1 overflow-auto p-4 transition-all duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-text flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-brand-500" />
            {t('foh.title')}
          </h1>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span>{tables.length} tables</span>
            <span>{orders.length} active</span>
            {readyOrders.length > 0 && (
              <span className="flex items-center gap-1 text-fp-red font-semibold">
                <span className="w-2 h-2 rounded-full bg-fp-red pulse-ring" />
                {readyOrders.length} ready
              </span>
            )}
          </div>
        </div>

        {/* Floor Plan Canvas */}
        {hasNoTables ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-text-secondary gap-3">
            <MapIcon className="w-12 h-12 text-text-muted" />
            <p className="text-sm">No tables configured</p>
            <p className="text-xs text-text-muted">
              Ask a manager to set up the floor plan
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full min-h-[500px] overflow-auto bg-surface-dark rounded-lg border border-border">
            <FloorPlanCanvas
              tables={tables}
              orders={orders as any}
              statusMode="staff"
              onTableClick={(table) => {
                setSelectedTableId(selectedTableId === table.id ? null : table.id)
              }}
              selectedTableId={selectedTableId}
              showChairs={true}
              showSeatNumbers={true}
              showElapsed={true}
              className="p-4"
            />
            {/* Compact status legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-surface/90 backdrop-blur rounded-lg px-2 py-1">
              {staffLegendItems.map(({ color, label, bgClass }) => (
                <div key={color} className="flex items-center gap-0.5" title={label}>
                  <div className={`w-2.5 h-2.5 rounded ${bgClass} ${color === 'none' ? 'border border-gray-300' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request View */}
        {activeView === 'requests' && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-fp-amber" />
              Customer Requests
            </h3>
            {orders.filter((o) => o.is_request).length === 0 ? (
              <p className="text-text-muted text-xs">No active requests</p>
            ) : (
              orders
                .filter((o) => o.is_request)
                .map((req) => (
                  <div
                    key={req.id}
                    className="bg-fp-amber/10 border border-fp-amber/30 rounded-lg p-3"
                  >
                    <p className="text-sm text-text font-medium">
                      {req.notes || 'Customer request'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Table {req.table_id?.slice(0, 4)} • Seat{' '}
                      {req.seat_number}
                    </p>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Payment View — delivered / ready-to-close unpaid orders */}
        {activeView === 'payment' && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              In-Person Payments
            </h3>
            <p className="text-xs text-text-muted">
              Collect card, phone wallet, or cash for delivered unpaid checks.
            </p>
            {orders.filter(
              (o) =>
                (o.status === 'delivered' || o.status === 'picking_up' || o.status === 'ready') &&
                o.payment_status !== 'paid'
            ).length === 0 ? (
              <p className="text-text-muted text-xs">No pending payments</p>
            ) : (
              orders
                .filter(
                  (o) =>
                    (o.status === 'delivered' || o.status === 'picking_up' || o.status === 'ready') &&
                    o.payment_status !== 'paid'
                )
                .map((o) => (
                  <div
                    key={o.id}
                    className="bg-surface-alt border border-border rounded-lg p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text font-medium">
                          {o.customer_name || `Order #${o.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-text-secondary">
                          ${o.total.toFixed(2)} • {o.order_type} • {o.status}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['card', CreditCard, 'Card'],
                          ['phone', Smartphone, 'Phone'],
                          ['cash', Banknote, 'Cash'],
                        ] as const
                      ).map(([method, Icon, label]) => (
                        <button
                          key={method}
                          onClick={() => {
                            setPayingOrderId(o.id)
                            setFohPayMethod(method)
                          }}
                          className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                            payingOrderId === o.id && fohPayMethod === method
                              ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                              : 'border-border text-text-secondary hover:bg-surface-hover'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={payingOrderId === o.id && false}
                      onClick={async () => {
                        setPayingOrderId(o.id)
                        const result = await processPayment({
                          order_id: o.id,
                          restaurant_id: o.restaurant_id,
                          method: payingOrderId === o.id ? fohPayMethod : 'card',
                          amount: o.total,
                          subtotal: o.subtotal,
                          tip: o.tip || 0,
                          processed_by: session?.staff.id,
                        })
                        if (result.ok) {
                          if (session) {
                            await logStaffAction(session.staff.id, 'payment_collected', {
                              order_id: o.id,
                              method: fohPayMethod,
                            })
                          }
                          setOrders((prev) => prev.filter((x) => x.id !== o.id))
                          setPayingOrderId(null)
                        } else {
                          alert(result.error || 'Payment failed')
                        }
                      }}
                      className="w-full py-2 bg-fp-green text-white text-xs font-semibold rounded-lg hover:brightness-110"
                    >
                      Collect {payingOrderId === o.id ? fohPayMethod : 'card'} · ${o.total.toFixed(2)}
                    </button>
                  </div>
                ))
            )}
          </div>
        )}
      </main>

      {/* ── Right Sidebar (persistent collapsible tab) ── */}
      <aside
        className={`${
          rightCollapsed ? 'w-8' : 'w-80'
        } flex-shrink-0 bg-surface-alt border-l border-border transition-all duration-200 flex flex-col ${
          (tickets.length > 0 || selectedTableId) && rightCollapsed ? 'relative' : ''
        }`}
      >
        {/* Header / Collapse toggle */}
        <div className="flex items-center justify-between h-10 border-b border-border px-2">
          {!rightCollapsed && (
            <>
              <h2 className="text-sm font-bold text-text flex items-center gap-2 flex-1">
                {selectedTableId ? (
                  <>
                    <MapIcon className="w-4 h-4 text-brand-500" />
                    {selectedTable ? `Table ${selectedTable.display_name}` : 'Table'}
                    {selectedTableOrders.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-500">
                        {selectedTableOrders.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4 text-fp-red" />
                    {t('foh.tickets')}
                    {tickets.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-fp-red/20 text-fp-red">
                        {tickets.length}
                      </span>
                    )}
                  </>
                )}
              </h2>
              <button
                onClick={() => setRightCollapsed(true)}
                className="text-text-secondary hover:text-text transition-colors"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </>
          )}
          {rightCollapsed && (
            <button
              onClick={() => setRightCollapsed(false)}
              className="w-full flex flex-col items-center gap-1 py-2 text-text-secondary hover:text-text transition-colors group relative"
            >
              <PanelRightOpen className="w-4 h-4" />
              {(tickets.length > 0 || selectedTableId) && (
                <span className="text-[10px] px-1 py-0.5 rounded-full bg-fp-red text-white font-semibold group-hover:brightness-110">
                  {selectedTableId ? selectedTableOrders.length || '!' : tickets.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        {!rightCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {selectedTableId ? (
              // ── Table context view ──
              <>
                {selectedTableOrders.length === 0 ? (
                  <div className="text-center mt-8 space-y-2">
                    <p className="text-text-muted text-xs">
                      No active orders at this table
                    </p>
                    <button
                      onClick={() => setSelectedTableId(null)}
                      className="text-xs text-brand-500 hover:text-brand-400 underline transition-colors"
                    >
                      Clear selection
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedTableOrders.map((order) => (
                      <TicketCard
                        key={order.id}
                        order={order}
                        onPickUp={handlePickUp}
                        onDeliver={handleDeliver}
                      />
                    ))}
                    <button
                      onClick={() => setSelectedTableId(null)}
                      className="w-full text-xs text-text-secondary hover:text-text py-2 transition-colors underline"
                    >
                      Clear table selection
                    </button>
                  </>
                )}
              </>
            ) : tickets.length === 0 ? (
              <p className="text-text-muted text-xs text-center mt-8">
                No tickets yet
              </p>
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  order={ticket}
                  onPickUp={handlePickUp}
                  onDeliver={handleDeliver}
                />
              ))
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

// ─── Helper Components ───

function SidebarButton({
  icon,
  label,
  collapsed,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode
  label: string
  collapsed: boolean
  active?: boolean
  onClick?: () => void
  badge?: { count: number; color: string }
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative ${
        active
          ? 'bg-brand-500/10 text-brand-500'
          : 'text-text-secondary hover:text-text hover:bg-surface-hover'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="truncate flex-1 text-left">{label}</span>
      )}
      {badge && !collapsed && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold ${badge.color}`}
        >
          {badge.count}
        </span>
      )}
      {badge && collapsed && (
        <span
          className={`absolute top-0 right-0 w-2 h-2 rounded-full ${badge.color}`}
        />
      )}
    </button>
  )
}