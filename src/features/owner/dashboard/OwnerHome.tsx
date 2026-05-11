// ============================================================================
// OwnerHome — Main dashboard with Network Pulse, Restaurant Grid, Charts
// ============================================================================
import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  Activity,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Loader2,
  Map,
  Grid3X3,
  MessageSquare,
  ExternalLink,
  Settings as SettingsIcon,
  ToggleLeft,
  Search,
  ArrowUpDown,
  Filter,
  RefreshCw,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  getNetworkPulse,
  getRestaurantsExtended,
  getRevenueTrends,
  getHealthGrid,
} from '../../../shared/api/owner'
import type { NetworkPulse, RestaurantExtended, RevenueTrendPoint, HealthGridRow } from '../../../shared/api/owner'
import type { HealthStatus } from '../../../types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = 'currentColor', height = 24 }: { data?: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  return (
    <div className="sparkline" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="sparkline-bar"
          style={{
            height: `${((v - min) / range) * 100}%`,
            background: color,
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  )
}

function PulseCard({ metric, color }: { metric: any; color: string }) {
  const valueStr = typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value
  return (
    <div className="bg-surface-alt border border-border rounded-xl p-4 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide truncate">
          {metric.label}
        </span>
        {metric.alert && (
          <span className="flex items-center gap-1 text-[10px] text-danger font-medium bg-danger/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <AlertTriangle className="w-3 h-3" />
            {metric.alert_label}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text tabular-nums">{valueStr}</span>
        {metric.change && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            metric.change.direction === 'up' ? 'text-success' : 'text-danger'
          }`}>
            {metric.change.direction === 'up' ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {metric.change.value}% {metric.change.label}
          </span>
        )}
      </div>
      {metric.sparkline && (
        <div className="mt-2" style={{ color }}>
          <Sparkline data={metric.sparkline} color={color} />
        </div>
      )}
    </div>
  )
}

function HealthBadge({ status }: { status?: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    critical: 'bg-danger/15 text-danger border-danger/30',
  }
  const labels: Record<HealthStatus, string> = {
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status || 'healthy']}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'healthy' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'
      }`} />
      {labels[status || 'healthy']}
    </span>
  )
}

// ─── OwnerHome ──────────────────────────────────────────────────────────────

export default function OwnerHome() {
  const [pulse, setPulse] = useState<NetworkPulse | null>(null)
  const [restaurants, setRestaurants] = useState<RestaurantExtended[]>([])
  const [trends, setTrends] = useState<RevenueTrendPoint[]>([])
  const [healthGrid, setHealthGrid] = useState<HealthGridRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [chartTab, setChartTab] = useState<'revenue' | 'profit' | 'growth' | 'health'>('revenue')
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [trendMode, setTrendMode] = useState<'absolute' | 'percent'>('absolute')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'profit' | 'commission' | 'health'>('revenue')
  const [healthFilter, setHealthFilter] = useState<HealthStatus | 'all'>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [pulseData, restaurantsData, trendsData, healthData] = await Promise.all([
        getNetworkPulse(),
        getRestaurantsExtended(),
        getRevenueTrends('daily'),
        getHealthGrid(),
      ])
      setPulse(pulseData)
      setRestaurants(restaurantsData)
      setTrends(trendsData)
      setHealthGrid(healthData)
      if (restaurantsData.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(restaurantsData[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Filtered & sorted restaurants
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(q))
    }

    // Health filter
    if (healthFilter !== 'all') {
      list = list.filter((r) => r.health_status === healthFilter)
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'revenue': return (b.revenue_mtd || 0) - (a.revenue_mtd || 0)
        case 'orders': return (b.active_orders_today || 0) - (a.active_orders_today || 0)
        case 'profit': return (b.profit_mtd || 0) - (a.profit_mtd || 0)
        case 'commission': return (b.commission_percent || 0) - (a.commission_percent || 0)
        case 'health': {
          const order: Record<HealthStatus, number> = { healthy: 0, warning: 1, critical: 2 }
          return (order[b.health_status || 'healthy'] || 0) - (order[a.health_status || 'healthy'] || 0)
        }
        default: return 0
      }
    })

    return list
  }, [restaurants, searchQuery, healthFilter, sortBy])

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId)

  // Charts data
  const profitChartData = useMemo(() => {
    return restaurants
      .map((r) => ({
        name: r.name.length > 15 ? r.name.slice(0, 15) + '…' : r.name,
        value: r.profit_mtd || 0,
        revenue: r.revenue_mtd || 0,
        health: r.health_status,
      }))
      .sort((a, b) => b.value - a.value)
  }, [restaurants])

  const growthChartData = useMemo(() => {
    return restaurants.map((r) => ({
      name: r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name,
      growth: Math.round((Math.random() * 30 - 5) * 10) / 10,
      health: r.health_status,
    }))
  }, [restaurants])

  // Trend data transformation
  const trendData = useMemo(() => {
    if (trendMode === 'percent' && trends.length > 1) {
      const base = trends[0].value || 1
      return trends.map((p) => ({
        ...p,
        value: Math.round(((p.value - base) / base) * 10000) / 100,
      }))
    }
    return trends
  }, [trends, trendMode])

  // Health grid colors
  function healthGridColor(val: number, col: string): string {
    if (col === 'health') return 'transparent'
    if (col === 'waitTime') {
      if (val > 25) return 'bg-danger/20 text-danger'
      if (val > 15) return 'bg-warning/20 text-warning'
      return 'bg-success/20 text-success'
    }
    if (val > 0) {
      if (val > 10000) return 'bg-success/20 text-success'
      if (val > 1000) return 'bg-success/10 text-success'
      return 'bg-text-muted/10 text-text-muted'
    }
    return 'bg-danger/10 text-danger'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-danger" />
          <div>
            <h3 className="text-lg font-semibold text-text mb-1">Failed to Load Dashboard</h3>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* ── Network Pulse Strip ── */}
      {pulse && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <PulseCard metric={pulse.totalRevenue} color="#4c6ef5" />
          <PulseCard metric={pulse.activeOrders} color="#2b8a3e" />
          <PulseCard metric={pulse.totalRestaurants} color="#e67700" />
          <PulseCard metric={pulse.growthRate} color="#6741d9" />
          <PulseCard metric={pulse.anomalies} color="#c92a2a" />
        </div>
      )}

      {/* ── Main 3-Column Layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left — Restaurant List */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <div className="bg-surface-alt border border-border rounded-xl">
            {/* Search & Filters */}
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants..."
                  className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                >
                  <option value="revenue">Revenue</option>
                  <option value="orders">Orders</option>
                  <option value="profit">Profit</option>
                  <option value="commission">Commission %</option>
                  <option value="health">Health</option>
                </select>
                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value as any)}
                  className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                >
                  <option value="all">All Health</option>
                  <option value="healthy">Healthy</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Restaurant List */}
            <div className="overflow-y-auto max-h-[60vh] divide-y divide-border">
              {filteredRestaurants.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-sm">
                  {searchQuery ? 'No restaurants match your search' : 'No restaurants found'}
                </div>
              ) : (
                filteredRestaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRestaurantId(r.id)}
                    className={`
                      w-full text-left px-3 py-2.5 transition hover:bg-surface-hover
                      ${selectedRestaurantId === r.id ? 'bg-brand-600/15 ring-1 ring-brand-500/30' : 'ring-0'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          r.health_status === 'healthy' ? 'bg-success'
                          : r.health_status === 'warning' ? 'bg-warning'
                          : 'bg-danger'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text truncate">{r.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-text-muted">
                          <span>${(r.revenue_mtd || 0).toLocaleString()}</span>
                          <span>•</span>
                          <span>{r.active_orders_today || 0} orders</span>
                        </div>
                      </div>
                      <div className="text-xs text-text-secondary font-mono tabular-nums">
                        {r.commission_percent}%
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="p-3 border-t border-border bg-surface-alt/50">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{filteredRestaurants.length} of {restaurants.length} restaurants</span>
                <span className="font-medium text-text-secondary">
                  ${filteredRestaurants.reduce((s, r) => s + (r.revenue_mtd || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center — Restaurant Grid/Map */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface-alt border border-border rounded-xl">
            {/* View Toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text">
                {viewMode === 'grid' ? 'Restaurant Grid' : 'Restaurant Map'}
              </h3>
              <div className="flex items-center bg-surface rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === 'grid' ? 'bg-brand-600 text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === 'map' ? 'bg-brand-600 text-white shadow-sm' : 'text-text-secondary hover:text-text'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Map
                </button>
              </div>
            </div>

            {/* Content */}
            {viewMode === 'grid' ? (
              <div className="p-4">
                {filteredRestaurants.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                    No restaurants to display
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredRestaurants.map((r) => {
                      const revenue = r.revenue_mtd || 0
                      const maxRev = Math.max(...restaurants.map((x) => x.revenue_mtd || 0), 1)
                      const scale = 0.6 + (revenue / maxRev) * 0.6
                      const sizeClass = scale > 1 ? 'col-span-2 row-span-2' : scale > 0.8 ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1'
                      const borderColor = r.health_status === 'healthy' ? 'border-success/50'
                        : r.health_status === 'warning' ? 'border-warning/50'
                        : 'border-danger/50'
                      const bgColor = r.health_status === 'healthy' ? 'bg-success/5'
                        : r.health_status === 'warning' ? 'bg-warning/5'
                        : 'bg-danger/5'

                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRestaurantId(r.id)}
                          className={`${sizeClass} ${bgColor} border-2 ${borderColor} rounded-xl p-3 transition hover:shadow-lg hover:scale-[1.02] text-left`}
                          style={{ minHeight: scale > 1 ? '140px' : '100px' }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${
                              r.health_status === 'healthy' ? 'bg-success'
                              : r.health_status === 'warning' ? 'bg-warning'
                              : 'bg-danger'
                            }`} />
                            <span className="text-sm font-semibold text-text truncate">{r.name}</span>
                          </div>
                          <div className="text-lg font-bold text-text tabular-nums">
                            ${(r.revenue_mtd || 0).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-text-muted mt-1">
                            <span>{r.active_orders_today || 0} active</span>
                            <span>•</span>
                            <span>{r.commission_percent}%</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Map View (simplified) */
              <div className="p-4">
                <div className="relative bg-surface rounded-xl border border-border overflow-hidden" style={{ minHeight: 400 }}>
                  {/* Grid background */}
                  <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" className="text-border" />
                  </svg>

                  {/* Restaurant pins */}
                  {filteredRestaurants.map((r, i) => {
                    const cols = 6
                    const row = Math.floor(i / cols)
                    const col = i % cols
                    const x = 5 + col * 17 + Math.random() * 3
                    const y = 5 + row * 17 + Math.random() * 3
                    const size = Math.max(24, Math.min(60, ((r.revenue_mtd || 0) / 1000) * 2))
                    const color = r.health_status === 'healthy' ? '#2b8a3e'
                      : r.health_status === 'warning' ? '#e67700'
                      : '#c92a2a'

                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRestaurantId(r.id)}
                        className="absolute transition hover:z-10"
                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <div
                          className="rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[9px] font-bold"
                          style={{
                            width: size,
                            height: size,
                            background: color,
                            fontSize: Math.max(8, size / 4),
                          }}
                        >
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                      </button>
                    )
                  })}

                  {filteredRestaurants.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
                      No restaurants to display on map
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Selected Restaurant Details */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          {selectedRestaurant ? (
            <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedRestaurant.health_status === 'healthy' ? 'bg-success'
                    : selectedRestaurant.health_status === 'warning' ? 'bg-warning'
                    : 'bg-danger'
                  }`} />
                  <h3 className="text-lg font-semibold text-text truncate">{selectedRestaurant.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="capitalize">{selectedRestaurant.tier}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.cuisine_type || 'Various'}</span>
                  <span>•</span>
                  <span>Since {new Date(selectedRestaurant.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-4 text-sm divide-y divide-border">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 pb-3">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Revenue MTD</div>
                    <div className="text-lg font-bold text-text">${(selectedRestaurant.revenue_mtd || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Avg Ticket</div>
                    <div className="text-lg font-bold text-text">${(selectedRestaurant.avg_ticket || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Active Orders</div>
                    <div className="text-lg font-bold text-text">{selectedRestaurant.active_orders_today || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Transactions</div>
                    <div className="text-lg font-bold text-text">{selectedRestaurant.transaction_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Commission</div>
                    <div className="text-lg font-bold text-text">{selectedRestaurant.commission_percent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">Commission Earned</div>
                    <div className="text-lg font-bold text-text">${(selectedRestaurant.commission_earned_mtd || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Owner Info */}
                {selectedRestaurant.owner && (
                  <div className="py-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Owner</div>
                    <div className="space-y-1 text-sm">
                      <div className="text-text font-medium">{selectedRestaurant.owner.name}</div>
                      {selectedRestaurant.owner.email && (
                        <div className="text-text-secondary">{selectedRestaurant.owner.email}</div>
                      )}
                      {selectedRestaurant.owner.phone && (
                        <div className="text-text-secondary">{selectedRestaurant.owner.phone}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Health */}
                <div className="py-3">
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Health</div>
                  <div className="flex items-center gap-2 mb-2">
                    <HealthBadge status={selectedRestaurant.health_status} />
                    {selectedRestaurant.active_alerts && selectedRestaurant.active_alerts > 0 && (
                      <span className="text-xs text-warning">{selectedRestaurant.active_alerts} alert(s)</span>
                    )}
                  </div>
                  {selectedRestaurant.last_issue && (
                    <div className="text-xs text-text-secondary bg-surface rounded-lg px-2.5 py-1.5">
                      Last: {selectedRestaurant.last_issue}
                    </div>
                  )}
                  {selectedRestaurant.avg_prep_time && (
                    <div className="flex gap-3 mt-2 text-xs text-text-muted">
                      <span>Prep: ~{selectedRestaurant.avg_prep_time}m</span>
                      <span>Wait: ~{selectedRestaurant.avg_wait_time}m</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {selectedRestaurant.address && (
                  <div className="py-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Address</div>
                    <div className="text-xs text-text-secondary">{selectedRestaurant.address}</div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-3 flex flex-wrap gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 rounded-lg text-xs font-medium transition">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-lg text-xs font-medium transition">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Dashboard
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-border text-text-secondary rounded-lg text-xs font-medium transition">
                    <SettingsIcon className="w-3.5 h-3.5" />
                    Settings
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-alt border border-border rounded-xl p-8 text-center">
              <Store className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <div className="text-sm text-text-secondary">Select a restaurant to view details</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: Charts & Insights ── */}
      <div className="bg-surface-alt border border-border rounded-xl">
        {/* Tabs */}
        <div className="flex items-center border-b border-border overflow-x-auto">
          {[
            { key: 'revenue', label: 'Revenue Trends', icon: TrendingUp },
            { key: 'profit', label: 'Profit by Rest.', icon: DollarSign },
            { key: 'growth', label: 'Growth', icon: Activity },
            { key: 'health', label: 'Health Grid', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setChartTab(tab.key as any)}
              className={`
                flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition whitespace-nowrap
                ${chartTab === tab.key
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-text-secondary hover:text-text hover:border-text-muted/30'
                }
              `}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 lg:p-6">
          {chartTab === 'revenue' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-text">Network Revenue Trends</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={trendPeriod}
                    onChange={(e) => setTrendPeriod(e.target.value as any)}
                    className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    onClick={() => setTrendMode(trendMode === 'absolute' ? 'percent' : 'absolute')}
                    className="px-2 py-1 bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-text transition"
                  >
                    {trendMode === 'absolute' ? 'Absolute' : '% Change'}
                  </button>
                </div>
              </div>
              {trendData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-text-muted text-sm">No trend data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => trendMode === 'percent' ? `${v}%` : `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [
                        trendMode === 'percent' ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`,
                        'Revenue',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#4c6ef5"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#4c6ef5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {chartTab === 'profit' && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Profit by Restaurant</h4>
              {profitChartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-text-muted text-sm">No profit data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={profitChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {profitChartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.value >= 0 ? '#2b8a3e' : '#c92a2a'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {chartTab === 'growth' && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">MoM Growth per Restaurant</h4>
              {growthChartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-text-muted text-sm">No growth data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={growthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface-alt)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Growth']}
                    />
                    <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                      {growthChartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.growth >= 0 ? '#2b8a3e' : '#c92a2a'}
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {chartTab === 'health' && (
            <div>
              <h4 className="text-sm font-semibold text-text mb-4">Health Grid — Restaurant Overview</h4>
              {healthGrid.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-text-muted text-sm">No health data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-text-muted font-medium">Restaurant</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">Revenue</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">Orders</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">Profit</th>
                        <th className="text-right py-2 px-3 text-text-muted font-medium">Wait Time</th>
                        <th className="text-center py-2 pl-3 text-text-muted font-medium">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthGrid.map((row) => (
                        <tr key={row.restaurant} className="border-b border-border/50 hover:bg-surface-hover/50 transition">
                          <td className="py-2 pr-4 text-text font-medium">{row.restaurant}</td>
                          <td className={`py-2 px-3 text-right font-mono tabular-nums ${healthGridColor(row.revenue, 'revenue')}`}>
                            ${row.revenue.toLocaleString()}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono tabular-nums ${healthGridColor(row.orders, 'orders')}`}>
                            {row.orders}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono tabular-nums ${healthGridColor(row.profit, 'profit')}`}>
                            ${row.profit.toLocaleString()}
                          </td>
                          <td className={`py-2 px-3 text-right font-mono tabular-nums ${healthGridColor(row.waitTime, 'waitTime')}`}>
                            {row.waitTime}m
                          </td>
                          <td className="py-2 pl-3 text-center">
                            <HealthBadge status={row.health} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
