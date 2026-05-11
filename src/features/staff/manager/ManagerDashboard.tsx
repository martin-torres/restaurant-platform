import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Users,
  BarChart3,
  Package,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Plus,
  Trash2,
  Undo2,
  Save,
  Upload,
  Download,
  Grid3X3,
  Circle,
  Square,
  X,
  Search,
  Edit3,
  UserPlus,
  UserX,
  ToggleLeft,
  ToggleRight,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  Eye,
  EyeOff,
  Move,
  Table2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import {
  getActiveOrders,
  subscribeToOrders,
} from '../../../shared/api/orders'
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  subscribeToTables,
  getFloorPlan,
  createFloorPlan,
  getFloorProps,
  createFloorProp,
  deleteFloorProp,
  updateFloorProp,
  autoGenerateChairPositions,
  getDefaultSeatsForShape,
} from '../../../shared/api/tables'
import { getMenuItems } from '../../../shared/api/menu'
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember as deleteStaffMemberApi,
  getActiveShift,
  clockIn,
  clockOut,
  logStaffAction,
} from '../../../shared/api/staff'
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../../../shared/api/inventory'
import { useStationFilter } from '../../../shared/hooks/useStationFilter'
import {
  restoreStaffSession,
  clearStaffSession,
} from '../auth/StaffLogin'
import type {
  RestaurantTable,
  TableShape,
  FloorPlan,
  FloorProp,
  PropShape,
  Order,
  OrderItem,
  StaffMember,
  StaffRole,
  MenuItem,
  InventoryItem,
  PulseMetric,
} from '../../../types'
import FloorPlanCanvas, { useTableStatusMap } from '../../../shared/components/FloorPlanCanvas'
import {
  computeTableStatusExtended,
  STATUS_CSS_VARS,
} from '../../../shared/utils/floorPlanColors'

// ═══════════════════════════════════════════════════════════════════════════
// MANAGER DASHBOARD — Layout & Router
// ═══════════════════════════════════════════════════════════════════════════

export default function ManagerDashboard() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    { path: '/staff/manager', icon: <LayoutDashboard className="w-4 h-4" />, label: t('manager.title') },
    { path: '/staff/manager/floor-plan', icon: <MapIcon className="w-4 h-4" />, label: t('manager.floor_plan_editor') },
    { path: '/staff/manager/menu', icon: <Menu className="w-4 h-4" />, label: t('manager.menu_editor') },
    { path: '/staff/manager/staff', icon: <Users className="w-4 h-4" />, label: t('manager.staff_editor') },
    { path: '/staff/manager/analytics', icon: <BarChart3 className="w-4 h-4" />, label: t('manager.analytics') },
    { path: '/staff/manager/inventory', icon: <Package className="w-4 h-4" />, label: t('manager.inventory') },
  ]

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

  const handleLogout = () => {
    clearStaffSession()
    window.location.href = '/staff/login'
  }

  return (
    <div className="h-dvh flex bg-surface dark overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-14' : 'w-56'
        } flex-shrink-0 bg-surface-alt border-r border-border transition-all duration-200 flex flex-col`}
      >
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-10 flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-hover transition-colors border-b border-border"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 py-3 border-b border-border mb-2">
              <p className="text-sm font-bold text-text truncate">{session.staff.name}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-wider">
                {t('staff.role_manager')}
              </p>
            </div>
          )}

          {navItems.map((item) => {
            const isActive =
              item.path === '/staff/manager'
                ? location.pathname === '/staff/manager'
                : location.pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
              </button>
            )
          })}
        </div>

        <div className="p-2 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text hover:bg-surface-hover transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route index element={<ManagerHome />} />
          <Route path="floor-plan" element={<FloorPlanEditor />} />
          <Route path="menu" element={<MenuEditor />} />
          <Route path="staff" element={<StaffManager />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="inventory" element={<Inventory />} />
        </Routes>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. MANAGER HOME — Full Dashboard
// ═══════════════════════════════════════════════════════════════════════════

function ManagerHome() {
  const session = restoreStaffSession()
  const restaurantId = session?.restaurantId
  const { stationMap } = useStationFilter(restaurantId)
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState<'all' | 'kitchen' | 'bar' | 'foh'>('all')

  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      try {
        const [tablesData, ordersData] = await Promise.all([
          getTables(restaurantId),
          getActiveOrders(restaurantId),
        ])
        setTables(tablesData)
        setOrders(ordersData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()

    const ordersSub = subscribeToOrders(restaurantId, (order) => {
      setOrders((prev) => {
        if (order.status === 'delivered' || order.status === 'cancelled') {
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
      addNotification({
        title: 'Nueva Orden',
        message: `Mesa ${order.table_id || 'N/A'} — ${order.order_type || 'Dine-in'}`,
        type: 'new',
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

    return () => {
      ordersSub.then((s) => supabase.removeChannel(s))
      tablesSub.then((s) => supabase.removeChannel(s))
    }
  }, [restaurantId])

  // ─── Compute metrics ───
  const metrics = useMemo((): PulseMetric[] => {
    const todaySales = orders
      .filter((o) => {
        const d = new Date(o.created_at)
        const now = new Date()
        return d.toDateString() === now.toDateString()
      })
      .reduce((sum, o) => sum + o.total, 0)

    const avgWait =
      orders.length > 0
        ? Math.round(
            orders.reduce((sum, o) => {
              const created = new Date(o.created_at).getTime()
              const updated = new Date(o.updated_at).getTime()
              return sum + (updated - created) / 60000
            }, 0) / orders.length
          )
        : 0

    return [
      {
        label: "Today's Sales",
        value: `$${todaySales.toFixed(2)}`,
        sparkline: [4, 6, 5, 8, 10, 7, 9, 12, 11, 14, 13, todaySales > 0 ? Math.min(todaySales / 10, 20) : 2],
        change: todaySales > 0 ? { value: 12, direction: 'up', label: 'vs yesterday' } : undefined,
      },
      {
        label: 'Active Orders',
        value: orders.length,
        alert: orders.length > 15,
        alert_label: orders.length > 15 ? 'High volume' : undefined,
      },
      {
        label: 'Avg Wait Time',
        value: `${avgWait}m`,
        alert: avgWait > 20,
        alert_label: avgWait > 20 ? 'Exceeds target' : undefined,
      },
      {
        label: 'Tables',
        value: `${tables.filter((t) => t.is_available).length}/${tables.length}`,
        sparkline: [10, 12, 8, 15, 14, 11, 13, 9, 10, 12, 14, tables.length],
      },
    ]
  }, [orders, tables])

  // ─── Table status map (using shared utility) ───
  const tableStatusMap = useTableStatusMap(tables, orders as any, 'staff')

  // ─── Selected table details ───
  const selectedTable = useMemo(
    () => (selectedTableId ? tables.find((t) => t.id === selectedTableId) : null),
    [selectedTableId, tables]
  )
  const selectedTableOrders = useMemo(
    () => orders.filter((o) => o.table_id === selectedTableId),
    [orders, selectedTableId]
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pulse Strip */}
      <div className="flex items-stretch gap-4 px-4 py-3 border-b border-border bg-surface-alt shrink-0 overflow-x-auto">
        {metrics.map((m, i) => (
          <MetricCard key={i} metric={m} />
        ))}
      </div>

      {/* Middle Section: Left panel + Floor Plan + Right panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Active Orders Panel */}
        <aside
          className={`${
            leftPanelCollapsed ? 'w-0 overflow-hidden border-0' : 'w-64'
          } flex-shrink-0 border-r border-border bg-surface-alt transition-all duration-200 flex flex-col`}
        >
          <div className="flex items-center justify-between px-3 h-9 border-b border-border shrink-0">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">Orders</h3>
            <button
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="text-text-secondary hover:text-text"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-2 py-2 border-b border-border">
            {(['all', 'kitchen', 'bar', 'foh'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${
                  orderFilter === f ? 'bg-brand-500/20 text-brand-500' : 'text-text-secondary hover:text-text'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {orders.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">No active orders</p>
            ) : (
              orders
                .filter((o) => {
                  if (orderFilter === 'all') return true
                  if (orderFilter === 'foh') return o.is_request
                  // Kitchen/bar filter
                  return (o.items || []).some((item) => {
                    const s = stationMap[item.menu_item_id || '']
                    if (orderFilter === 'kitchen') return s === 'kitchen' || s === 'both'
                    if (orderFilter === 'bar') return s === 'bar' || s === 'both'
                    return false
                  })
                })
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                .map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSelectedTableId(o.table_id || null)
                      setRightPanelCollapsed(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover text-left text-xs"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        o.status === 'ready'
                          ? 'bg-fp-red'
                          : o.status === 'in_progress'
                            ? 'bg-fp-green'
                            : o.status === 'new'
                              ? 'bg-fp-blue'
                              : 'bg-fp-yellow'
                      }`}
                    />
                    <span className="text-text flex-1 truncate">
                      {o.customer_name || `#${o.id.slice(0, 6)}`}
                    </span>
                    <span className="text-text-muted font-mono">
                      ${o.total.toFixed(2)}
                    </span>
                  </button>
                ))
            )}
          </div>
        </aside>

        {/* Collapse left panel button (when collapsed) */}
        {leftPanelCollapsed && (
          <button
            onClick={() => setLeftPanelCollapsed(false)}
            className="shrink-0 w-5 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-hover border-r border-border"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Center: Floor Plan */}
        <div className="flex-1 overflow-auto p-4">
          <FloorPlanCanvas
            tables={tables}
            orders={orders as any}
            statusMode="staff"
            onTableClick={(table) => {
              setSelectedTableId(selectedTableId === table.id ? null : table.id)
              setRightPanelCollapsed(false)
            }}
            selectedTableId={selectedTableId}
            showChairs={true}
            showSeatNumbers={true}
            showElapsed={true}
            className="min-h-[400px]"
          />
        </div>

        {/* Collapse right panel button (when collapsed) */}
        {rightPanelCollapsed && (
          <button
            onClick={() => setRightPanelCollapsed(false)}
            className="shrink-0 w-5 flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-hover border-l border-border"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right: Contextual Details */}
        <aside
          className={`${
            rightPanelCollapsed ? 'w-0 overflow-hidden border-0' : 'w-72'
          } flex-shrink-0 border-l border-border bg-surface-alt transition-all duration-200 flex flex-col`}
        >
          <div className="flex items-center justify-between px-3 h-9 border-b border-border shrink-0">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              {selectedTable ? selectedTable.display_name : 'Details'}
            </h3>
            <button
              onClick={() => setRightPanelCollapsed(true)}
              className="text-text-secondary hover:text-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {!selectedTable ? (
              <p className="text-xs text-text-muted text-center py-4">Select a table</p>
            ) : (
              <>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Shape</span>
                    <span className="text-text font-medium capitalize">{selectedTable.shape}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Seats</span>
                    <span className="text-text font-medium">{selectedTable.seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status</span>
                    <span className="text-text font-medium">
                      {selectedTable.is_reserved
                        ? 'Reserved'
                        : selectedTable.is_available
                          ? 'Available'
                          : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Orders</span>
                    <span className="text-text font-medium">{selectedTableOrders.length}</span>
                  </div>
                </div>

                {/* Elapsed Time */}
                {(() => { const s = tableStatusMap.get(selectedTable.id); return s?.elapsed != null && s.elapsed > 0; })() && (
                    <div
                      className={`px-3 py-2 rounded-lg text-xs ${
                        (() => { const s = tableStatusMap.get(selectedTable.id); return s?.elapsed != null && s.elapsed > 20; })()
                          ? 'bg-fp-red/10 text-fp-red'
                          : 'bg-surface-hover text-text-secondary'
                      }`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      {tableStatusMap.get(selectedTable.id)!.elapsed} min since first order
                    </div>
                  )}

                {/* Order Items */}
                {selectedTableOrders.map((o) => (
                  <div key={o.id} className="bg-surface-hover rounded-lg p-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text font-medium">
                        {o.customer_name || `#${o.id.slice(0, 6)}`}
                      </span>
                      <span className="text-text-secondary">${o.total.toFixed(2)}</span>
                    </div>
                    {o.items?.map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center justify-between text-[10px] text-text-secondary">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                    {o.notes && (
                      <p className="text-[10px] text-fp-amber italic">📝 {o.notes}</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom: Trends */}
      <div className="border-t border-border bg-surface-alt shrink-0">
        <TrendTabs orders={orders} />
      </div>
    </div>
  )
}

// ─── Metric Card ───
function MetricCard({ metric }: { metric: PulseMetric }) {
  return (
    <div className="flex flex-col justify-between min-w-[140px] px-3 py-2 bg-surface rounded-lg border border-border">
      <span className="text-[10px] text-text-secondary uppercase tracking-wider">{metric.label}</span>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-xl font-bold text-text font-display">{metric.value}</span>
        {metric.sparkline && (
          <div className="sparkline mb-0.5">
            {metric.sparkline.slice(-8).map((v, i) => (
              <div
                key={i}
                className="sparkline-bar"
                style={{ height: `${Math.max(2, (v / Math.max(...metric.sparkline!)) * 16)}px` }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {metric.change && (
          <span
            className={`text-[10px] flex items-center gap-0.5 ${
              metric.change.direction === 'up' ? 'text-fp-green' : 'text-fp-red'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            {metric.change.value}%
          </span>
        )}
        {metric.alert && (
          <span className="text-[10px] text-fp-red flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" />
            {metric.alert_label}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Trend Tabs ───
function TrendTabs({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<'hourly' | 'popular' | 'peak'>('hourly')

  const hourlyData = useMemo(() => {
    const hourMap = new Map<number, { sales: number; count: number }>()
    for (let h = 8; h <= 19; h++) hourMap.set(h, { sales: 0, count: 0 })
    for (const o of orders) {
      const h = new Date(o.created_at).getHours()
      const existing = hourMap.get(h)
      if (existing) {
        existing.sales += o.total || 0
        existing.count += 1
      }
    }
    return Array.from(hourMap.entries()).map(([hour, data]) => ({
      hour: `${hour}:00`,
      sales: Math.round(data.sales) || 0,
      count: data.count || 0,
    }))
  }, [orders])

  const popularItems = useMemo(() => {
    const itemCount = new Map<string, number>()
    for (const o of orders) {
      for (const item of o.items || []) {
        itemCount.set(item.name, (itemCount.get(item.name) || 0) + item.quantity)
      }
    }
    return Array.from(itemCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [orders])

  const peakHourData = useMemo(() => {
    const hourMap = new Map<number, number>()
    for (let h = 8; h <= 19; h++) hourMap.set(h, 0)
    for (const o of orders) {
      const h = new Date(o.created_at).getHours()
      hourMap.set(h, (hourMap.get(h) || 0) + 1)
    }
    return Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, count }))
  }, [orders])

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        {(['hourly', 'popular', 'peak'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium uppercase ${
              tab === t ? 'bg-brand-500/20 text-brand-500' : 'text-text-secondary hover:text-text'
            }`}
          >
            {t === 'hourly' ? 'Hourly Sales' : t === 'popular' ? 'Popular Items' : 'Peak Hours'}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-1 h-16">
        {tab === 'hourly' &&
          hourlyData.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-brand-500/60 rounded-t-sm transition-all"
                style={{ height: `${(h.sales / Math.max(...hourlyData.map(h => h.sales), 1)) * 48}px` }}
              />
              <span className="text-[8px] text-text-muted">{h.hour.split(':')[0]}</span>
            </div>
          ))}
        {tab === 'popular' &&
          popularItems.map(([name, count]) => (
            <div key={name} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <div
                className="w-full bg-fp-green/60 rounded-t-sm transition-all"
                style={{ height: `${(count / Math.max(...popularItems.map(([, c]) => c))) * 48}px` }}
              />
              <span className="text-[8px] text-text-muted truncate w-full text-center">{name}</span>
              <span className="text-[8px] text-text-secondary">{count}</span>
            </div>
          ))}
        {tab === 'peak' &&
          peakHourData.map((d) => {
            const maxCount = Math.max(...peakHourData.map(d => d.count), 1)
            const intensity = d.count / maxCount
            return (
              <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${intensity * 48}px`,
                    backgroundColor: intensity > 0.7 ? 'rgba(239, 68, 68, 0.7)' :
                                     intensity > 0.4 ? 'rgba(250, 204, 21, 0.6)' :
                                     intensity > 0 ? 'rgba(34, 197, 94, 0.4)' :
                                     'rgba(100, 100, 100, 0.1)',
                  }}
                />
                <span className="text-[8px] text-text-muted">{d.hour}</span>
                {d.count > 0 && <span className="text-[8px] text-text-secondary">{d.count}</span>}
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. FLOOR PLAN EDITOR — Drag & Drop Canvas
// ═══════════════════════════════════════════════════════════════════════════

function FloorPlanEditor() {
  const session = restoreStaffSession()
  const restaurantId = session?.restaurantId
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [props, setProps] = useState<FloorProp[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<RestaurantTable[][]>([])
  const [showGrid, setShowGrid] = useState(true)
  const [propsPanelCollapsed, setPropsPanelCollapsed] = useState(false)
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null)
  const [propDragging, setPropDragging] = useState(false)
  const [propDragOffset, setPropDragOffset] = useState({ x: 0, y: 0 })
  const [propDraggingId, setPropDraggingId] = useState<string | null>(null)
  const [propResizing, setPropResizing] = useState(false)
  const [propResizeStart, setPropResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragPosRef = useRef({ x: 0, y: 0 })
  const propDragPosRef = useRef({ x: 0, y: 0 })
  const propResizeRef = useRef({ w: 40, h: 40 })

  // Active orders for live status colors
  const [activeOrders, setActiveOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!restaurantId) return
    getActiveOrders(restaurantId).then(setActiveOrders).catch(() => {})
    const sub = subscribeToOrders(restaurantId, (order) => {
      setActiveOrders((prev) => {
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
      sub.then((s: any) => {
        if (s?.unsubscribe) s.unsubscribe()
        else supabase.removeChannel(s)
      })
    }
  }, [restaurantId])

  // Compute table status colors from active orders using shared utility
  const tableOrderStatus = useMemo(() => {
    const map = new Map<string, { bg: string; border: string; hasReservation: boolean }>()
    for (const table of tables) {
      const tableOrders = activeOrders.filter((o) => o.table_id === table.id)
      const status = computeTableStatusExtended({
        orders: tableOrders.map((o) => ({
          status: o.status,
          is_request: o.is_request,
          kitchen_status: o.kitchen_status,
          bar_status: o.bar_status,
        })),
        isAvailable: table.is_available,
        isReserved: table.is_reserved,
        isBeingCleaned: !table.is_available && tableOrders.length === 0,
      })

      const bgColor = STATUS_CSS_VARS[status.primary] || STATUS_CSS_VARS.none
      const borderColor = status.hasReservation
        ? STATUS_CSS_VARS.indigo
        : status.secondary
          ? STATUS_CSS_VARS[status.secondary] || STATUS_CSS_VARS.none
          : STATUS_CSS_VARS[status.primary] || STATUS_CSS_VARS.none

      map.set(table.id, {
        bg: bgColor,
        border: borderColor,
        hasReservation: status.hasReservation,
      })
    }
    return map
  }, [tables, activeOrders])

  const gridSize = floorPlan?.grid_size || 20

  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      try {
        const [fp, tbls, prps] = await Promise.all([
          getFloorPlan(restaurantId),
          getTables(restaurantId),
          getFloorProps(restaurantId),
        ])
        if (!fp) {
          const created = await createFloorPlan({
            restaurant_id: restaurantId,
            canvas_w: 800,
            canvas_h: 600,
            grid_size: 20,
          })
          setFloorPlan(created)
        } else {
          setFloorPlan(fp)
        }
        setTables(tbls)
        // Auto-generate chair positions for tables that don't have them
        for (const t of tbls) {
          if (!t.chair_positions || t.chair_positions.length === 0) {
            const chairs = autoGenerateChairPositions(t.shape, t.seats, t.width, t.height)
            if (chairs.length > 0) {
              await updateTable(t.id, { chair_positions: chairs as any })
              t.chair_positions = chairs
            }
          }
        }
        setProps(prps)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [restaurantId])

  const snapToGrid = useCallback(
    (val: number) => Math.round(val / gridSize) * gridSize,
    [gridSize]
  )

  const addTable = useCallback(
    async (shape: TableShape) => {
      if (!restaurantId) return
      const seats = getDefaultSeatsForShape(shape)
      const w = shape === 'circle' || shape === 'square' ? 60 : 80
      const h = shape === 'circle' || shape === 'square' ? 60 : 50

      const newTable = {
        restaurant_id: restaurantId,
        floor_plan_id: floorPlan?.id,
        display_name: `T${tables.length + 1}`,
        table_number: tables.length + 1,
        seats,
        shape,
        x: snapToGrid(100 + Math.random() * 200),
        y: snapToGrid(100 + Math.random() * 200),
        width: w,
        height: h,
        rotation: 0,
        chair_positions: autoGenerateChairPositions(shape, seats, w, h),
      }

      const created = await createTable(newTable)
      if (created) {
        setHistory((prev) => [...prev, tables])
        setTables((prev) => [...prev, created])
        setSelectedTableId(created.id)
        if (session) {
          await logStaffAction(session.staff.id, 'table_added', {
            table_id: created.id,
            shape,
          })
        }
      }
    },
    [restaurantId, floorPlan, tables, snapToGrid, session]
  )

  const addProp = useCallback(
    async (propType: FloorProp['prop_type']) => {
      if (!restaurantId) return
      const labels: Record<string, string> = {
        stage: 'Stage',
        bathroom: 'Bathroom',
        window: 'Window',
        staircase: 'Staircase',
        wall: 'Wall',
        plant: 'Plant',
        other: 'Prop',
      }
      const defaultShape = propType === 'stage' ? 'rect' : propType === 'wall' ? 'rect' : propType === 'bathroom' ? 'rect' : 'rect'
      const defaultSeats = 0
      const defaultW = propType === 'stage' ? 120 : propType === 'wall' ? 160 : 40
      const defaultH = propType === 'stage' ? 80 : propType === 'wall' ? 20 : 40
      const chairs = defaultSeats > 0 ? autoGenerateChairPositions(defaultShape as PropShape, defaultSeats, defaultW, defaultH) : []
      const newProp = {
        restaurant_id: restaurantId,
        floor_plan_id: floorPlan?.id,
        prop_type: propType,
        label: labels[propType] || 'Prop',
        x: snapToGrid(60 + Math.random() * 200),
        y: snapToGrid(60 + Math.random() * 200),
        width: defaultW,
        height: defaultH,
        rotation: 0,
        shape: defaultShape as PropShape,
        seats: defaultSeats,
        chair_positions: chairs,
        is_interactive: false,
        visible_to_customers: true,
        is_available: true,
        is_reserved: false,
        display_name: labels[propType] || 'Prop',
      }
      const created = await createFloorProp(newProp)
      if (created) {
        setProps((prev) => [...prev, created])
      }
    },
    [restaurantId, floorPlan, snapToGrid]
  )

  const updateTablePosition = useCallback(
    async (id: string, x: number, y: number) => {
      const sx = snapToGrid(x)
      const sy = snapToGrid(y)
      dragPosRef.current = { x: sx, y: sy }
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, x: sx, y: sy } : t)))
    },
    [snapToGrid]
  )

  const updatePropPosition = useCallback(
    async (id: string, x: number, y: number) => {
      const sx = snapToGrid(x)
      const sy = snapToGrid(y)
      propDragPosRef.current = { x: sx, y: sy }
      setProps((prev) => prev.map((p) => (p.id === id ? { ...p, x: sx, y: sy } : p)))
    },
    [snapToGrid]
  )

  const updatePropSize = useCallback(
    async (id: string, width: number, height: number) => {
      const w = Math.max(20, width)
      const h = Math.max(20, height)
      propResizeRef.current = { w, h }
      setProps((prev) => prev.map((p) => (p.id === id ? { ...p, width: w, height: h } : p)))
    },
    []
  )

  const rotateTable = useCallback(
    async (id: string) => {
      const newRotation = (tables.find((t) => t.id === id)?.rotation || 0) + 45
      // CSS transform: rotate() on the parent div handles chair positioning.
      // Only update individual chair rotation for shapes that have it (e.g. circle).
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const rotatedChairs = (t.chair_positions || []).map((chair) => ({
            ...chair,
            rotation: chair.rotation != null ? chair.rotation + 45 : undefined,
          }))
          return { ...t, rotation: newRotation % 360, chair_positions: rotatedChairs }
        })
      )
      await updateTable(id, { rotation: newRotation % 360 })
    },
    [tables]
  )

  const removeTable = useCallback(
    async (id: string) => {
      setHistory((prev) => [...prev, tables])
      setTables((prev) => prev.filter((t) => t.id !== id))
      await deleteTable(id)
      if (selectedTableId === id) setSelectedTableId(null)
      if (session) {
        await logStaffAction(session.staff.id, 'table_deleted', { table_id: id })
      }
    },
    [tables, selectedTableId, session]
  )

  const undo = useCallback(() => {
    const prev = history[history.length - 1]
    if (prev) {
      setTables(prev)
      setHistory((h) => h.slice(0, -1))
    }
  }, [history])

  const selectedTable = tables.find((t) => t.id === selectedTableId)

  const handleCanvasMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return
    const table = tables.find((t) => t.id === tableId)
    if (!table) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragOffset({ x: e.clientX - rect.left - table.x, y: e.clientY - rect.top - table.y })
    setDragging(true)
    setSelectedTableId(tableId)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    if (dragging && selectedTableId) {
      const x = e.clientX - rect.left - dragOffset.x
      const y = e.clientY - rect.top - dragOffset.y
      updateTablePosition(selectedTableId, x, y)
    }
    if (propDragging && propDraggingId) {
      const x = e.clientX - rect.left - propDragOffset.x
      const y = e.clientY - rect.top - propDragOffset.y
      updatePropPosition(propDraggingId, x, y)
    }
    if (propResizing && selectedPropId) {
      const dx = e.clientX - propResizeStart.x
      const dy = e.clientY - propResizeStart.y
      updatePropSize(selectedPropId, propResizeStart.w + dx, propResizeStart.h + dy)
    }
  }

  const handleCanvasMouseUp = async () => {
    if (dragging && selectedTableId) {
      const pos = dragPosRef.current
      await updateTable(selectedTableId, { x: pos.x, y: pos.y })
    }
    if (propDragging && propDraggingId) {
      const pos = propDragPosRef.current
      await updateFloorProp(propDraggingId, { x: pos.x, y: pos.y })
    }
    if (propResizing && selectedPropId) {
      const size = propResizeRef.current
      await updateFloorProp(selectedPropId, { width: size.w, height: size.h })
    }
    setDragging(false)
    setPropDragging(false)
    setPropDraggingId(null)
    setPropResizing(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex dark">
      {/* Left: Table Types */}
      <div className="w-48 flex-shrink-0 border-r border-border bg-surface-alt p-3 space-y-2 overflow-y-auto">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-3">Table Types</h3>

        <TableTypeButton shape="square" label="Square (4)" onClick={() => addTable('square')} />
        <TableTypeButton shape="rectangle" label="Rectangle (6)" onClick={() => addTable('rectangle')} />
        <TableTypeButton shape="circle" label="Round (4)" onClick={() => addTable('circle')} />
        <TableTypeButton shape="booth_u" label="Booth U (6)" onClick={() => addTable('booth_u')} />
        <TableTypeButton shape="booth_half_u" label="Booth ½U (4)" onClick={() => addTable('booth_half_u')} />
        <TableTypeButton shape="bar" label="Bar (4)" onClick={() => addTable('bar')} />

        <div className="border-t border-border my-3" />
        <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-3">Props</h3>

        <PropTypeButton label="Stage" icon="🎭" onClick={() => addProp('stage')} />
        <PropTypeButton label="Bathroom" icon="🚻" onClick={() => addProp('bathroom')} />
        <PropTypeButton label="Window" icon="🪟" onClick={() => addProp('window')} />
        <PropTypeButton label="Staircase" icon="🪜" onClick={() => addProp('staircase')} />
        <PropTypeButton label="Wall" icon="🧱" onClick={() => addProp('wall')} />
        <PropTypeButton label="Plant" icon="🌿" onClick={() => addProp('plant')} />
        <PropTypeButton label="Other" icon="📦" onClick={() => addProp('other')} />

        <div className="border-t border-border my-3" />
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text hover:bg-surface-hover disabled:opacity-30 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto bg-surface relative"
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div
          className="relative"
          style={{
            width: floorPlan?.canvas_w || 800,
            height: floorPlan?.canvas_h || 600,
            backgroundImage: showGrid
              ? `radial-gradient(circle, var(--color-border-light) 1px, transparent 1px)`
              : undefined,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        >
          {/* Tables with chairs inside (inherit rotation) */}
          {tables.map((table) => (
            <div
              key={table.id}
              onMouseDown={(e) => handleCanvasMouseDown(e, table.id)}
              className={`absolute flex items-center justify-center cursor-grab active:cursor-grabbing rounded-lg border-2 transition-shadow ${
                selectedTableId === table.id ? 'ring-2 ring-brand-500 shadow-lg' : 'hover:ring-1 hover:ring-brand-500/50'
              }`}
              style={{
                left: table.x,
                top: table.y,
                width: table.width,
                height: table.height,
                transform: `rotate(${table.rotation}deg)`,
                borderRadius:
                  table.shape === 'circle'
                    ? '50%'
                    : table.shape === 'booth_u' || table.shape === 'booth_half_u'
                      ? '12px 12px 0 0'
                      : '8px',
                backgroundColor:
                  (() => {
                    const s = tableOrderStatus.get(table.id)
                    if (!s) return table.shape === 'bar' ? 'var(--color-brand-600)' : STATUS_CSS_VARS.none
                    // Bar tables with no active status get brand color
                    if (s.bg === STATUS_CSS_VARS.none && table.shape === 'bar') return 'var(--color-brand-600)'
                    return s.bg
                  })(),
                borderColor:
                  (() => {
                    const s = tableOrderStatus.get(table.id)
                    // Indigo reservation border always takes precedence
                    if (s?.hasReservation) return STATUS_CSS_VARS.indigo
                    return s?.border || 'var(--color-border)'
                  })(),
                zIndex: selectedTableId === table.id ? 10 : 1,
              }}
            >
              <span className="text-[10px] font-bold text-text drop-shadow-sm">
                {table.display_name}
              </span>
              {/* Chairs — always visible, locked to table, rotate with it */}
              {(table.chair_positions || []).map((chair) => (
                <div
                  key={`${table.id}-chair-${chair.seat_number}`}
                  className="absolute w-3 h-3 rounded-full bg-brand-500 border border-brand-600"
                  style={{
                    left: chair.x - 6,
                    top: chair.y - 6,
                    transform: chair.rotation ? `rotate(${chair.rotation}deg)` : undefined,
                  }}
                />
              ))}
              {/* Resize handles on corners */}
              {selectedTableId === table.id && (
                <>
                  {['nw', 'ne', 'sw', 'se'].map((corner) => (
                    <div
                      key={`${table.id}-resize-${corner}`}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        if (!selectedTableId) return
                        setDragging(true)
                        setDragOffset({ x: 0, y: 0 })
                        const resizeStart = { x: e.clientX, y: e.clientY }
                        const tableOrig = { x: table.x, y: table.y, w: table.width, h: table.height }
                        const onMove = (ev: MouseEvent) => {
                          const dx = ev.clientX - resizeStart.x
                          const dy = ev.clientY - resizeStart.y
                          const updates: Partial<RestaurantTable> = {}
                          if (corner.includes('n')) { updates.y = tableOrig.y + dy; updates.height = tableOrig.h - dy }
                          if (corner.includes('s')) { updates.height = tableOrig.h + dy }
                          if (corner.includes('w')) { updates.x = tableOrig.x + dx; updates.width = tableOrig.w - dx }
                          if (corner.includes('e')) { updates.width = tableOrig.w + dx }
                          if (updates.width != null && updates.width < 40) updates.width = 40
                          if (updates.height != null && updates.height < 40) updates.height = 40
                          setTables((prev) => prev.map((t) => t.id === table.id ? { ...t, ...updates } : t))
                        }
                        const onUp = async () => {
                          document.removeEventListener('mousemove', onMove)
                          document.removeEventListener('mouseup', onUp)
                          setDragging(false)
                          const t = tables.find((tt) => tt.id === table.id)
                          if (t) await updateTable(table.id, { x: t.x, y: t.y, width: t.width, height: t.height })
                        }
                        document.addEventListener('mousemove', onMove)
                        document.addEventListener('mouseup', onUp)
                      }}
                      className={`absolute w-3 h-3 bg-white border border-brand-500 rounded-sm cursor-${corner}-resize`}
                      style={{
                        [corner.includes('n') ? 'top' : 'bottom']: -5,
                        [corner.includes('w') ? 'left' : 'right']: -5,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          ))}

          {/* Props rendered on canvas */}
          {props.map((prop) => (
            <div
              key={prop.id}
              onMouseDown={(e) => {
                if (e.button !== 0) return
                e.stopPropagation()
                setSelectedTableId(null)
                setSelectedPropId(prop.id)
                const rect = canvasRef.current?.getBoundingClientRect()
                if (!rect) return
                setPropDragOffset({ x: e.clientX - rect.left - prop.x, y: e.clientY - rect.top - prop.y })
                setPropDragging(true)
                setPropDraggingId(prop.id)
              }}
              className={`absolute flex items-center justify-center text-xs group ${
                selectedPropId === prop.id ? 'ring-2 ring-brand-400 rounded-sm' : ''
              } ${!prop.is_available ? 'opacity-50' : ''}`}
              style={{
                left: prop.x,
                top: prop.y,
                width: prop.width || 40,
                height: prop.height || 40,
                transform: prop.rotation ? `rotate(${prop.rotation}deg)` : undefined,
                zIndex: 0,
                cursor: 'move',
                borderRadius:
                  prop.shape === 'circle'
                    ? '50%'
                    : prop.shape === 'booth_u' || prop.shape === 'booth_half_u'
                      ? '12px 12px 0 0'
                      : '8px',
                backgroundColor:
                  !prop.is_available
                    ? 'var(--color-fp-darkgray)'
                    : prop.is_interactive
                      ? 'var(--color-surface-hover)'
                      : 'var(--color-surface)',
                borderColor: prop.is_reserved ? 'var(--color-fp-indigo)' : 'var(--color-border)',
                borderWidth: prop.is_reserved ? '3px' : '2px',
                borderStyle: 'solid',
              }}
              title={`${prop.display_name || prop.label} (drag to move)`}
            >
              {/* Display name or icon */}
              {(prop.display_name || prop.label) && (prop.width || 40) > 50 ? (
                <span className="text-[10px] font-bold text-text drop-shadow-sm truncate px-1">
                  {prop.display_name || prop.label}
                </span>
              ) : prop.prop_type === 'window' ? (
                /* CAD-style 2D window: thick outline with cross */
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 border-[3px] border-text-muted/60 rounded-sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-[2px] bg-text-muted/30" />
                    <div className="absolute inset-y-0 left-1/2 w-[2px] bg-text-muted/30" />
                  </div>
                </div>
              ) : prop.prop_type === 'stage' ? (
                <span className="text-sm opacity-60">🎭</span>
              ) : prop.prop_type === 'bathroom' ? (
                <span className="text-sm opacity-60">🚻</span>
              ) : prop.prop_type === 'staircase' ? (
                <span className="text-sm opacity-60">🪜</span>
              ) : prop.prop_type === 'wall' ? (
                <span className="text-sm opacity-60">🧱</span>
              ) : prop.prop_type === 'plant' ? (
                <span className="text-sm opacity-60">🌿</span>
              ) : (
                <span className="text-sm opacity-60">📦</span>
              )}
              {/* Chairs — if seats > 0 */}
              {(prop.chair_positions || []).map((chair) => (
                <div
                  key={`${prop.id}-chair-${chair.seat_number}`}
                  className="absolute w-3 h-3 rounded-full bg-brand-500/70 border border-brand-600"
                  style={{
                    left: chair.x - 6,
                    top: chair.y - 6,
                    transform: chair.rotation ? `rotate(${chair.rotation}deg)` : undefined,
                  }}
                />
              ))}
              {/* Resize handle bottom-right */}
              {selectedPropId === prop.id && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setPropResizing(true)
                    setPropResizeStart({ x: e.clientX, y: e.clientY, w: prop.width || 40, h: prop.height || 40 })
                  }}
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-brand-500 rounded-full cursor-se-resize"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Properties — collapsible */}
      <div className="flex-shrink-0 relative">
        {propsPanelCollapsed ? (
          <button
            onClick={() => setPropsPanelCollapsed(false)}
            className="w-5 h-10 mt-2 flex items-center justify-center bg-surface-alt border border-border rounded-r text-text-secondary hover:text-text"
            title="Show properties"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-56 border-l border-border bg-surface-alt h-full overflow-y-auto p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">Properties</h3>
              <button
                onClick={() => setPropsPanelCollapsed(true)}
                className="text-text-secondary hover:text-text"
                title="Collapse properties"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {selectedTable ? (
              <>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-text-secondary block mb-0.5">Name</label>
                    <input
                      type="text"
                      value={selectedTable.display_name}
                      onChange={async (e) => {
                        const name = e.target.value
                        setTables((prev) =>
                          prev.map((t) => (t.id === selectedTable.id ? { ...t, display_name: name } : t))
                        )
                        await updateTable(selectedTable.id, { display_name: name })
                      }}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-text-secondary block mb-0.5">Seats</label>
                    <input
                      type="number"
                      value={selectedTable.seats}
                      onChange={async (e) => {
                        const seats = Math.max(1, parseInt(e.target.value) || 1)
                        setTables((prev) =>
                          prev.map((t) =>
                            t.id === selectedTable.id
                              ? {
                                  ...t,
                                  seats,
                                  chair_positions: autoGenerateChairPositions(
                                    t.shape,
                                    seats,
                                    t.width,
                                    t.height
                                  ),
                                }
                              : t
                          )
                        )
                        await updateTable(selectedTable.id, { seats })
                      }}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-text-secondary block mb-0.5">Shape</label>
                    <p className="text-text font-medium capitalize">{selectedTable.shape}</p>
                  </div>
                  <div>
                    <label className="text-text-secondary block mb-0.5">Position</label>
                    <p className="text-text font-mono text-[10px]">
                      X: {selectedTable.x}, Y: {selectedTable.y}
                    </p>
                  </div>
                  <div>
                    <label className="text-text-secondary block mb-0.5">Rotation</label>
                    <p className="text-text font-mono text-[10px]">{selectedTable.rotation}°</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => rotateTable(selectedTable.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-surface-hover text-text-secondary hover:text-text text-xs"
                  >
                    <RotateCw className="w-3 h-3" />
                    45°
                  </button>
                  <button
                    onClick={() => removeTable(selectedTable.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-fp-red/10 text-fp-red hover:bg-fp-red/20 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-text-secondary italic">Select a table to edit</p>
            )}

            {/* Prop Properties */}
            {selectedPropId && !selectedTableId && (() => {
              const prop = props.find((p) => p.id === selectedPropId)
              if (!prop) return null
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text pb-2 border-b border-border">
                    <span>📐</span>
                    <span>{prop.label}</span>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Display Name</label>
                    <input
                      type="text"
                      value={prop.display_name || ''}
                      onChange={async (e) => {
                        const display_name = e.target.value
                        setProps((prev) => prev.map((p) => (p.id === prop.id ? { ...p, display_name } : p)))
                        await updateFloorProp(prop.id, { display_name })
                      }}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                      placeholder="Prop name"
                    />
                  </div>

                  {/* Label (type label) */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Label</label>
                    <input
                      type="text"
                      value={prop.label || ''}
                      onChange={async (e) => {
                        const label = e.target.value
                        setProps((prev) => prev.map((p) => (p.id === prop.id ? { ...p, label } : p)))
                        await updateFloorProp(prop.id, { label })
                      }}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Type</label>
                    <p className="text-sm text-text capitalize">{prop.prop_type}</p>
                  </div>

                  {/* Shape */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Shape</label>
                    <select
                      value={prop.shape || 'rect'}
                      onChange={async (e) => {
                        const shape = e.target.value as PropShape
                        const seats = prop.seats || getDefaultSeatsForShape(shape)
                        const width = prop.width || 40
                        const height = prop.height || 40
                        const chair_positions = seats > 0
                          ? autoGenerateChairPositions(shape, seats, width, height)
                          : []
                        setProps((prev) =>
                          prev.map((p) =>
                            p.id === prop.id ? { ...p, shape, seats, chair_positions } : p
                          )
                        )
                        await updateFloorProp(prop.id, { shape, seats, chair_positions } as Partial<FloorProp>)
                      }}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                    >
                      <option value="rect">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="booth_u">Booth U</option>
                      <option value="booth_half_u">Booth ½U</option>
                      <option value="bar">Bar</option>
                    </select>
                  </div>

                  {/* Seats */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Seats</label>
                    <input
                      type="number"
                      value={prop.seats || 0}
                      min={0}
                      onChange={async (e) => {
                        const seats = Math.max(0, parseInt(e.target.value) || 0)
                        const shape = (prop.shape || 'rect') as PropShape
                        const width = prop.width || 40
                        const height = prop.height || 40
                        const chair_positions = seats > 0
                          ? autoGenerateChairPositions(shape, seats, width, height)
                          : []
                        setProps((prev) =>
                          prev.map((p) =>
                            p.id === prop.id ? { ...p, seats, chair_positions } : p
                          )
                        )
                        await updateFloorProp(prop.id, { seats, chair_positions } as Partial<FloorProp>)
                      }}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Position</label>
                    <p className="text-text font-mono text-[10px]">X: {prop.x}, Y: {prop.y}</p>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="text-text-secondary block mb-0.5 text-[10px] uppercase">Rotation</label>
                    <p className="text-text font-mono text-[10px]">{prop.rotation}°</p>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prop.is_interactive ?? false}
                        onChange={async (e) => {
                          const is_interactive = e.target.checked
                          setProps((prev) => prev.map((p) => (p.id === prop.id ? { ...p, is_interactive } : p)))
                          await updateFloorProp(prop.id, { is_interactive } as Partial<FloorProp>)
                        }}
                        className="rounded border-border"
                      />
                      Interactive
                    </label>
                    <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prop.visible_to_customers ?? true}
                        onChange={async (e) => {
                          const visible_to_customers = e.target.checked
                          setProps((prev) => prev.map((p) => (p.id === prop.id ? { ...p, visible_to_customers } : p)))
                          await updateFloorProp(prop.id, { visible_to_customers } as Partial<FloorProp>)
                        }}
                        className="rounded border-border"
                      />
                      Visible to customers
                    </label>
                    <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prop.is_available ?? true}
                        onChange={async (e) => {
                          const is_available = e.target.checked
                          setProps((prev) => prev.map((p) => (p.id === prop.id ? { ...p, is_available } : p)))
                          await updateFloorProp(prop.id, { is_available } as Partial<FloorProp>)
                        }}
                        className="rounded border-border"
                      />
                      Available
                    </label>
                    <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prop.is_reserved ?? false}
                        onChange={async (e) => {
                          const is_reserved = e.target.checked
                          setProps((prev) => prev.map((p) => (p.id === prop.id ? { ...p, is_reserved } : p)))
                          await updateFloorProp(prop.id, { is_reserved } as Partial<FloorProp>)
                        }}
                        className="rounded border-border"
                      />
                      Reserved
                    </label>
                  </div>

                  {/* Delete */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={async () => {
                        await deleteFloorProp(prop.id)
                        setProps((prev) => prev.filter((p) => p.id !== prop.id))
                        setSelectedPropId(null)
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

function TableTypeButton({
  shape,
  label,
  onClick,
}: {
  shape: TableShape
  label: string
  onClick: () => void
}) {
  const shapeIcon =
    shape === 'circle' ? (
      <Circle className="w-4 h-4" />
    ) : shape === 'square' ? (
      <Square className="w-4 h-4" />
    ) : shape === 'booth_u' || shape === 'booth_half_u' ? (
      <Table2 className="w-4 h-4" />
    ) : (
      <Move className="w-4 h-4" />
    )

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors"
    >
      {shapeIcon}
      <Plus className="w-3 h-3 text-brand-500" />
      {label}
    </button>
  )
}

function PropTypeButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text hover:bg-surface-hover transition-colors"
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. MENU EDITOR — CRUD for menu items
// ═══════════════════════════════════════════════════════════════════════════

function MenuEditor() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const restaurantId = session?.restaurantId
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      try {
        const data = await getMenuItems(restaurantId)
        setItems(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [restaurantId])

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.category?.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  )

  const handleSave = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({
        name: editForm.name || item.name,
        price: editForm.price ?? item.price,
        category: editForm.category || item.category,
        description: editForm.description ?? item.description,
        is_available: editForm.is_available ?? item.is_available,
        stock: editForm.stock ?? item.stock,
      })
      .eq('id', item.id)

    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                name: editForm.name || i.name,
                price: editForm.price ?? i.price,
                category: editForm.category || i.category,
                description: editForm.description ?? i.description,
                is_available: editForm.is_available ?? i.is_available,
                stock: editForm.stock ?? i.stock,
              }
            : i
        )
      )
      setEditingId(null)
      if (session) {
        await logStaffAction(session.staff.id, 'menu_item_updated', { item_id: item.id })
      }
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      if (session) {
        await logStaffAction(session.staff.id, 'menu_item_deleted', { item_id: id })
      }
    }
  }

  const handleToggleAvailability = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    if (!error) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)))
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-text">{t('manager.menu_editor')}</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="pl-7 pr-3 py-1.5 rounded-lg bg-surface-alt border border-border text-text text-xs w-48"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs hover:bg-brand-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border text-text-secondary rounded-lg text-xs hover:text-text transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border text-text-secondary rounded-lg text-xs hover:text-text transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="text-left py-2 px-2 font-medium">Name</th>
              <th className="text-left py-2 px-2 font-medium">Category</th>
              <th className="text-right py-2 px-2 font-medium">Price</th>
              <th className="text-right py-2 px-2 font-medium">Stock</th>
              <th className="text-center py-2 px-2 font-medium">Station</th>
              <th className="text-center py-2 px-2 font-medium">Active</th>
              <th className="text-right py-2 px-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                <td className="py-2 px-2">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editForm.name ?? item.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-text font-medium">{item.name}</span>
                      {item.description && (
                        <span className="text-text-muted text-[10px] truncate max-w-[120px]">
                          {item.description}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-2 px-2">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editForm.category ?? item.category}
                      onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-2 py-1 rounded bg-surface border border-border text-text text-xs"
                    />
                  ) : (
                    <span className="text-text-secondary">{item.category}</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editForm.price ?? item.price}
                      onChange={(e) => setEditForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 rounded bg-surface border border-border text-text text-xs text-right"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-text font-mono">${item.price.toFixed(2)}</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editForm.stock ?? item.stock}
                      onChange={(e) => setEditForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 rounded bg-surface border border-border text-text text-xs text-right"
                    />
                  ) : (
                    <span className={`font-mono ${item.stock <= 0 ? 'text-fp-red' : 'text-text'}`}>
                      {item.stock}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.station === 'kitchen'
                        ? 'bg-fp-green/10 text-fp-green'
                        : item.station === 'bar'
                          ? 'bg-fp-blue/10 text-fp-blue'
                          : 'bg-brand-500/10 text-brand-500'
                    }`}
                  >
                    {item.station}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`p-1 rounded transition-colors ${
                      item.is_available ? 'text-fp-green hover:bg-fp-green/10' : 'text-text-muted hover:bg-surface-hover'
                    }`}
                  >
                    {item.is_available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => handleSave(item)}
                          className="p-1 text-fp-green hover:bg-fp-green/10 rounded"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-text-secondary hover:bg-surface-hover rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(item.id)
                            setEditForm({})
                          }}
                          className="p-1 text-text-secondary hover:text-text hover:bg-surface-hover rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-text-secondary hover:text-fp-red hover:bg-fp-red/10 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary gap-2">
            <Menu className="w-12 h-12 text-text-muted" />
            <p className="text-sm">No menu items</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. STAFF MANAGER — CRUD for staff
// ═══════════════════════════════════════════════════════════════════════════

function StaffManager() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const restaurantId = session?.restaurantId
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', role: 'server' as StaffRole, pin: '' })
  const [shifts, setShifts] = useState<Map<string, { id: string; clock_in: string }>>(new Map())

  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      try {
        const data = await getStaffMembers(restaurantId)
        setStaff(data)

        // Load active shifts
        const shiftData = await Promise.all(
          data.map(async (s) => {
            const shift = await getActiveShift(s.id)
            return { staffId: s.id, shift }
          })
        )
        const shiftMap = new Map<string, { id: string; clock_in: string }>()
        for (const { staffId, shift } of shiftData) {
          if (shift) shiftMap.set(staffId, { id: shift.id, clock_in: shift.clock_in })
        }
        setShifts(shiftMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [restaurantId])

  const handleAddStaff = async () => {
    if (!restaurantId || !addForm.name || !addForm.pin) return
    const created = await createStaffMember({
      restaurant_id: restaurantId,
      name: addForm.name,
      role: addForm.role,
      pin: addForm.pin,
    })
    if (created) {
      setStaff((prev) => [...prev, created])
      setAddForm({ name: '', role: 'server', pin: '' })
      setShowAdd(false)
    }
  }

  const handleToggleActive = async (member: StaffMember) => {
    const success = await updateStaffMember(member.id, { is_active: !member.is_active })
    if (success) {
      setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, is_active: !s.is_active } : s)))
    }
  }

  const handleDelete = async (id: string) => {
    const success = await deleteStaffMemberApi(id)
    if (success) {
      setStaff((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const handleClockIn = async (member: StaffMember) => {
    if (!restaurantId) return
    const shift = await clockIn(member.id, restaurantId)
    if (shift) {
      setShifts((prev) => new Map(prev).set(member.id, { id: shift.id, clock_in: shift.clock_in }))
    }
  }

  const handleClockOut = async (member: StaffMember) => {
    const shift = shifts.get(member.id)
    if (!shift) return
    const success = await clockOut(shift.id, member.id)
    if (success) {
      setShifts((prev) => {
        const next = new Map(prev)
        next.delete(member.id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-text">{t('manager.staff_editor')}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs hover:bg-brand-700 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Staff
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-4 p-4 bg-surface-alt border border-border rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-text">New Staff Member</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
            />
            <select
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
            >
              <option value="server">Server</option>
              <option value="foh">Host</option>
              <option value="kitchen">Kitchen</option>
              <option value="bar">Bar</option>
              <option value="manager">Manager</option>
            </select>
            <input
              type="password"
              value={addForm.pin}
              onChange={(e) => setAddForm((f) => ({ ...f, pin: e.target.value }))}
              placeholder="PIN (4-6 digits)"
              maxLength={6}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddStaff}
              className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs hover:bg-brand-700 transition-colors"
            >
              {t('save')}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 bg-surface-hover text-text-secondary rounded-lg text-xs hover:text-text transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="text-left py-2 px-2 font-medium">Name</th>
              <th className="text-left py-2 px-2 font-medium">Role</th>
              <th className="text-center py-2 px-2 font-medium">Status</th>
              <th className="text-center py-2 px-2 font-medium">Shift</th>
              <th className="text-right py-2 px-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const activeShift = shifts.get(member.id)
              return (
                <tr key={member.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-xs font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-text font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                        member.role === 'manager'
                          ? 'bg-brand-500/10 text-brand-500'
                          : member.role === 'kitchen'
                            ? 'bg-fp-green/10 text-fp-green'
                            : member.role === 'bar'
                              ? 'bg-fp-blue/10 text-fp-blue'
                              : 'bg-fp-amber/10 text-fp-amber'
                      }`}
                    >
                      {t(`staff.role_${member.role}`)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => handleToggleActive(member)}
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                        member.is_active
                          ? 'bg-fp-green/10 text-fp-green'
                          : 'bg-fp-red/10 text-fp-red'
                      }`}
                    >
                      {member.is_active ? (
                        <>
                          <ToggleRight className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {activeShift ? (
                      <button
                        onClick={() => handleClockOut(member)}
                        className="text-[10px] px-2 py-0.5 rounded bg-fp-amber/10 text-fp-amber hover:bg-fp-amber/20 transition-colors"
                      >
                        Clocked in
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClockIn(member)}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface-hover text-text-secondary hover:text-text transition-colors"
                        disabled={!member.is_active}
                      >
                        Clock in
                      </button>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1 text-text-secondary hover:text-fp-red hover:bg-fp-red/10 rounded"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {staff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary gap-2">
            <Users className="w-12 h-12 text-text-muted" />
            <p className="text-sm">No staff members</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ANALYTICS — Charts & Trends
// ═══════════════════════════════════════════════════════════════════════════

function Analytics() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const restaurantId = session?.restaurantId
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      try {
        const data = await getActiveOrders(restaurantId)
        setOrders(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [restaurantId])

  // Derived metrics
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0)
  const avgTicketSize = orders.length > 0 ? totalSales / orders.length : 0
  const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)

  // Item popularity
  const itemPopularity = useMemo(() => {
    const count = new Map<string, number>()
    for (const o of orders) {
      for (const item of o.items || []) {
        count.set(item.name, (count.get(item.name) || 0) + item.quantity)
      }
    }
    return Array.from(count.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [orders])

  // Hourly trend
  const hourlyTrend = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8
      const hourOrders = orders.filter((o) => {
        const d = new Date(o.created_at)
        return d.getHours() === hour
      })
      return {
        label: `${hour}:00`,
        value: hourOrders.reduce((sum, o) => sum + o.total, 0),
      }
    })
    return hours
  }, [orders])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <h1 className="text-lg font-bold text-text">{t('manager.analytics')}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
        />
        <SummaryCard
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Orders"
          value={orders.length.toString()}
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Avg Ticket"
          value={`$${avgTicketSize.toFixed(2)}`}
        />
        <SummaryCard
          icon={<Package className="w-4 h-4" />}
          label="Items Sold"
          value={totalItems.toString()}
        />
      </div>

      {/* Hourly Sales Chart */}
      <div className="bg-surface-alt border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-text mb-3">Hourly Sales Trend</h3>
        <div className="flex items-end gap-2 h-40">
          {hourlyTrend.map((h, i) => {
            const maxVal = Math.max(...hourlyTrend.map((x) => x.value), 1)
            const height = (h.value / maxVal) * 140
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-text-secondary font-mono">${h.value.toFixed(0)}</span>
                <div
                  className="w-full bg-brand-500/60 rounded-t-sm transition-all hover:bg-brand-500/80"
                  style={{ height: `${Math.max(4, height)}px` }}
                />
                <span className="text-[8px] text-text-muted">{h.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Item Popularity + Table Turnover */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-alt border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold text-text mb-3">Popular Items</h3>
          <div className="space-y-2">
            {itemPopularity.map(([name, count], i) => {
              const maxCount = Math.max(...itemPopularity.map(([, c]) => c), 1)
              const pct = (count / maxCount) * 100
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-5">{i + 1}.</span>
                  <span className="text-xs text-text flex-1 truncate">{name}</span>
                  <div className="flex-1 h-4 bg-surface-hover rounded-sm overflow-hidden max-w-[120px]">
                    <div className="h-full bg-fp-green/60 rounded-sm" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-text-secondary font-mono w-8 text-right">{count}</span>
                </div>
              )
            })}
            {itemPopularity.length === 0 && (
              <p className="text-xs text-text-muted">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-surface-alt border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold text-text mb-3">Table Turnover</h3>
          <p className="text-xs text-text-muted">Requires historical data to compute turnover rates.</p>
          <div className="mt-4 flex items-center justify-center h-32 text-text-muted">
            <BarChart3 className="w-12 h-12 opacity-30" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-surface-alt border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1 text-text-secondary">{icon}</div>
      <p className="text-xl font-bold text-text font-display">{value}</p>
      <p className="text-[10px] text-text-secondary uppercase tracking-wider">{label}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. INVENTORY — Stock management
// ═══════════════════════════════════════════════════════════════════════════

function Inventory() {
  const { t } = useTranslation()
  const session = restoreStaffSession()
  const restaurantId = session?.restaurantId
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    unit: 'kg',
    stock: 0,
    min_stock: 0,
    cost_per_unit: 0,
  })

  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      try {
        const data = await getInventoryItems(restaurantId)
        setItems(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [restaurantId])

  const handleAdd = async () => {
    if (!restaurantId || !addForm.name) return
    const created = await createInventoryItem({
      restaurant_id: restaurantId,
      name: addForm.name,
      unit: addForm.unit,
      stock: addForm.stock,
      min_stock: addForm.min_stock,
      cost_per_unit: addForm.cost_per_unit,
    })
    if (created) {
      setItems((prev) => [...prev, created])
      setAddForm({ name: '', unit: 'kg', stock: 0, min_stock: 0, cost_per_unit: 0 })
      setShowAdd(false)
    }
  }

  const handleUpdateStock = async (id: string, stock: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stock: Math.max(0, stock) } : i)))
    await updateInventoryItem(id, { stock: Math.max(0, stock) })
  }

  const handleDelete = async (id: string) => {
    await deleteInventoryItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  const zeroStock = items.filter((i) => i.stock <= 0)

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text">{t('manager.inventory')}</h1>
          {zeroStock.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fp-red/10 text-fp-red">
              <AlertTriangle className="w-3 h-3" />
              {zeroStock.length} out of stock
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-4 p-4 bg-surface-alt border border-border rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-text">New Inventory Item</h3>
          <div className="grid grid-cols-5 gap-3">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ingredient name"
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
            />
            <select
              value={addForm.unit}
              onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="mL">mL</option>
              <option value="pcs">pieces</option>
              <option value="bags">bags</option>
            </select>
            <input
              type="number"
              value={addForm.stock}
              onChange={(e) => setAddForm((f) => ({ ...f, stock: parseFloat(e.target.value) || 0 }))}
              placeholder="Stock"
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
              step="0.1"
            />
            <input
              type="number"
              value={addForm.min_stock}
              onChange={(e) => setAddForm((f) => ({ ...f, min_stock: parseFloat(e.target.value) || 0 }))}
              placeholder="Min stock"
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
              step="0.1"
            />
            <input
              type="number"
              value={addForm.cost_per_unit}
              onChange={(e) => setAddForm((f) => ({ ...f, cost_per_unit: parseFloat(e.target.value) || 0 }))}
              placeholder="Cost/unit"
              className="px-3 py-2 rounded-lg bg-surface border border-border text-text text-xs"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs hover:bg-brand-700 transition-colors">
              {t('save')}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-surface-hover text-text-secondary rounded-lg text-xs hover:text-text transition-colors">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="text-left py-2 px-2 font-medium">Name</th>
              <th className="text-left py-2 px-2 font-medium">Unit</th>
              <th className="text-right py-2 px-2 font-medium">Stock</th>
              <th className="text-right py-2 px-2 font-medium">Min Stock</th>
              <th className="text-right py-2 px-2 font-medium">Cost/Unit</th>
              <th className="text-center py-2 px-2 font-medium">Status</th>
              <th className="text-right py-2 px-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.stock <= 0
              const isWarning = item.stock > 0 && item.stock <= item.min_stock
              return (
                <tr key={item.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="py-2 px-2">
                    <span className="text-text font-medium">{item.name}</span>
                  </td>
                  <td className="py-2 px-2 text-text-secondary">{item.unit}</td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      value={item.stock}
                      onChange={(e) => handleUpdateStock(item.id, parseFloat(e.target.value) || 0)}
                      className={`w-20 px-2 py-0.5 rounded bg-surface border text-xs text-right ${
                        isLow ? 'border-fp-red text-fp-red' : isWarning ? 'border-fp-amber text-fp-amber' : 'border-border text-text'
                      }`}
                      step="0.1"
                    />
                  </td>
                  <td className="py-2 px-2 text-right text-text-secondary">{item.min_stock}</td>
                  <td className="py-2 px-2 text-right text-text font-mono">
                    ${item.cost_per_unit.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fp-red/10 text-fp-red">
                        <AlertTriangle className="w-3 h-3" />
                        Out of Stock
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fp-amber/10 text-fp-amber">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fp-green/10 text-fp-green">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-text-secondary hover:text-fp-red hover:bg-fp-red/10 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary gap-2">
            <Package className="w-12 h-12 text-text-muted" />
            <p className="text-sm">No inventory items</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
