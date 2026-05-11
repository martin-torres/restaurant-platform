// ============================================================================
// CommissionsPage — Per-restaurant commission management
// ============================================================================
import { useState, useEffect, useMemo } from 'react'
import {
  Percent,
  DollarSign,
  History,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Save,
  X,
  Check,
  BarChart3,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  getCommissions,
  setCommission,
  getCommissionHistory,
  getRestaurantsExtended,
} from '../../../shared/api/owner'
import type { CommissionWithRestaurant, RestaurantExtended } from '../../../shared/api/owner'
import type { RestaurantCommission } from '../../../types'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionWithRestaurant[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPercent, setEditPercent] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewHistory, setViewHistory] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<RestaurantCommission[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [commissionsData, restaurantsData] = await Promise.all([
        getCommissions(),
        getRestaurantsExtended(),
      ])
      setCommissions(commissionsData)
      setRestaurants(restaurantsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load commissions')
    } finally {
      setLoading(false)
    }
  }

  // Latest commission per restaurant (most recent effective_date)
  const latestCommissions = useMemo(() => {
    const map = new Map<string, CommissionWithRestaurant>()
    for (const c of commissions) {
      const existing = map.get(c.restaurant_id)
      if (!existing || new Date(c.effective_date) > new Date(existing.effective_date)) {
        map.set(c.restaurant_id, c)
      }
    }
    return Array.from(map.values())
  }, [commissions])

  const filtered = useMemo(() => {
    if (!searchQuery) return latestCommissions
    const q = searchQuery.toLowerCase()
    return latestCommissions.filter((c) =>
      (c.restaurant_name || '').toLowerCase().includes(q)
    )
  }, [latestCommissions, searchQuery])

  // Network overview
  const networkStats = useMemo(() => {
    if (latestCommissions.length === 0) return null
    const totalCommissionRevenue = restaurants.reduce(
      (s, r) => s + (r.commission_earned_mtd || 0), 0
    )
    const avgPercent = latestCommissions.reduce((s, c) => s + c.commission_percent, 0) / latestCommissions.length
    const sorted = [...latestCommissions].sort((a, b) => b.commission_percent - a.commission_percent)

    return {
      totalRevenue: totalCommissionRevenue,
      avgPercent: Math.round(avgPercent * 10) / 10,
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
      distribution: [
        { name: '0-5%', value: latestCommissions.filter((c) => c.commission_percent <= 5).length },
        { name: '5-10%', value: latestCommissions.filter((c) => c.commission_percent > 5 && c.commission_percent <= 10).length },
        { name: '10-15%', value: latestCommissions.filter((c) => c.commission_percent > 10 && c.commission_percent <= 15).length },
        { name: '15-20%', value: latestCommissions.filter((c) => c.commission_percent > 15 && c.commission_percent <= 20).length },
        { name: '20%+', value: latestCommissions.filter((c) => c.commission_percent > 20).length },
      ],
    }
  }, [latestCommissions, restaurants])

  const DISTRIBUTION_COLORS = ['#2b8a3e', '#4c6ef5', '#e67700', '#c92a2a', '#6741d9']

  async function handleSave(restaurantId: string) {
    const percent = parseFloat(editPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) return

    setSaving(true)
    const success = await setCommission(restaurantId, percent, editNotes || undefined)
    setSaving(false)

    if (success) {
      setEditingId(null)
      setEditPercent('')
      setEditNotes('')
      setSuccessMsg(`Commission updated successfully`)
      await loadData()
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setError('Failed to save commission')
    }
  }

  async function loadHistory(restaurantId: string) {
    setHistoryLoading(true)
    const data = await getCommissionHistory(restaurantId)
    setHistoryData(data)
    setHistoryLoading(false)
  }

  function openHistory(restaurantId: string) {
    setViewHistory(restaurantId)
    loadHistory(restaurantId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <span className="text-sm">Loading commissions...</span>
        </div>
      </div>
    )
  }

  if (error && commissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-danger" />
          <div>
            <h3 className="text-lg font-semibold text-text mb-1">Failed to Load</h3>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-success/10 border border-success/30 text-success rounded-lg px-4 py-3 text-sm">
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">Commissions</h1>
          <p className="text-sm text-text-secondary">Manage commission rates across all restaurants</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-500/40 w-48"
            />
          </div>
        </div>
      </div>

      {/* Network Overview */}
      {networkStats && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Total Commission Revenue (MTD)</div>
            <div className="text-2xl font-bold text-text">${networkStats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Average Commission %</div>
            <div className="text-2xl font-bold text-text">{networkStats.avgPercent}%</div>
          </div>
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Highest Commission</div>
            <div className="text-2xl font-bold text-text">
              {networkStats.highest?.commission_percent}%
              <span className="text-xs font-normal text-text-secondary ml-2">
                ({networkStats.highest?.restaurant_name})
              </span>
            </div>
          </div>
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Lowest Commission</div>
            <div className="text-2xl font-bold text-text">
              {networkStats.lowest?.commission_percent}%
              <span className="text-xs font-normal text-text-secondary ml-2">
                ({networkStats.lowest?.restaurant_name})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {networkStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Distribution Pie */}
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text mb-3">Commission Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={networkStats.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {networkStats.distribution.map((_, idx) => (
                    <Cell key={idx} fill={DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Commission by Restaurant Bar */}
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text mb-3">Commission % by Restaurant</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={latestCommissions
                  .sort((a, b) => b.commission_percent - a.commission_percent)
                  .slice(0, 15)
                  .map((c) => ({
                    name: (c.restaurant_name || '').length > 10
                      ? (c.restaurant_name || '').slice(0, 10) + '…'
                      : c.restaurant_name || 'Unknown',
                    percent: c.commission_percent,
                  }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
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
                  formatter={(value: number) => [`${value}%`, 'Commission']}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                  {latestCommissions.slice(0, 15).map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length]}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Commissions Table */}
      <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left py-3 px-4 text-text-muted font-medium text-[10px] uppercase tracking-wide">Restaurant</th>
                <th className="text-left py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide hidden sm:table-cell">Tier</th>
                <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Current %</th>
                <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide hidden md:table-cell">Earned MTD</th>
                <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide hidden md:table-cell">Revenue</th>
                <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Effective</th>
                <th className="text-center py-3 pl-3 pr-4 text-text-muted font-medium text-[10px] uppercase tracking-wide w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-text-muted text-sm">
                    No commissions found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const rest = restaurants.find((r) => r.id === c.restaurant_id)
                  const isEditing = editingId === c.restaurant_id

                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${
                            rest?.health_status === 'healthy' ? 'bg-success'
                            : rest?.health_status === 'warning' ? 'bg-warning'
                            : 'bg-danger'
                          }`} />
                          <span className="text-sm font-medium text-text">
                            {c.restaurant_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                          c.restaurant_tier === 'strategic' ? 'bg-brand-600/10 text-brand-400'
                          : c.restaurant_tier === 'growth' ? 'bg-warning/10 text-warning'
                          : 'bg-text-muted/10 text-text-muted'
                        }`}>
                          {c.restaurant_tier || 'basic'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              value={editPercent}
                              onChange={(e) => setEditPercent(e.target.value)}
                              className="w-16 bg-surface border border-border rounded px-2 py-1 text-sm text-text text-right font-mono focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                              min="0"
                              max="100"
                              step="0.5"
                              autoFocus
                            />
                            <span className="text-text-muted text-xs">%</span>
                          </div>
                        ) : (
                          <span className="font-mono tabular-nums text-text font-semibold">
                            {c.commission_percent}%
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary hidden md:table-cell">
                        ${(rest?.commission_earned_mtd || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary hidden md:table-cell">
                        ${(rest?.revenue_mtd || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-text-muted text-xs">
                        {new Date(c.effective_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSave(c.restaurant_id)}
                              disabled={saving}
                              className="p-1.5 rounded text-success hover:bg-success/10 transition"
                              title="Save"
                            >
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingId(c.restaurant_id)
                                setEditPercent(c.commission_percent.toString())
                                setEditNotes('')
                              }}
                              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover transition"
                              title="Edit Commission"
                            >
                              <Percent className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openHistory(c.restaurant_id)}
                              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover transition"
                              title="View History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {viewHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-surface-alt border border-border rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                <History className="w-5 h-5" />
                Commission History
              </h3>
              <button onClick={() => setViewHistory(null)} className="text-text-muted hover:text-text transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">No history available</div>
              ) : (
                <div className="space-y-3">
                  {historyData.map((h) => (
                    <div key={h.id} className="bg-surface border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg font-bold text-text">{h.commission_percent}%</span>
                        <span className="text-xs text-text-muted">
                          {new Date(h.effective_date).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>
                      {h.notes && (
                        <div className="text-xs text-text-secondary mt-1">{h.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
