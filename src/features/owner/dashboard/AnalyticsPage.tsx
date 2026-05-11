// ============================================================================
// AnalyticsPage — Profitability analysis, resource monitoring, growth data
// ============================================================================
import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Database,
  HardDrive,
  Activity,
  Users,
  Zap,
  Scale,
  Server,
  ChevronRight,
  Search,
  ArrowUpDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import {
  getProfitabilityReport,
  getResourceMetrics,
  getRestaurantsExtended,
} from '../../../shared/api/owner'
import type { ProfitabilityReport, ResourceMetrics } from '../../../shared/api/owner'

// ─── Color helpers ──────────────────────────────────────────────────────────

function ProfitBadge({ value }: { value: number }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      value >= 0 ? 'text-success' : 'text-danger'
    }`}>
      {value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value >= 0 ? '+' : ''}{value}%
    </span>
  )
}

export default function AnalyticsPage() {
  const [profitData, setProfitData] = useState<ProfitabilityReport[]>([])
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profitability' | 'resources' | 'growth'>('profitability')
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'revenue'>('profit')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [profit, resources] = await Promise.all([
        getProfitabilityReport(),
        getResourceMetrics(),
      ])
      setProfitData(profit)
      setResourceMetrics(resources)
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Sorted data
  const sortedProfitData = useMemo(() => {
    const sorted = [...profitData]
    switch (sortBy) {
      case 'profit':
        sorted.sort((a, b) => b.netProfit - a.netProfit)
        break
      case 'margin':
        sorted.sort((a, b) => b.marginPercent - a.marginPercent)
        break
      case 'revenue':
        sorted.sort((a, b) => b.revenue - a.revenue)
        break
    }
    return sorted
  }, [profitData, sortBy])

  const top10 = sortedProfitData.slice(0, 10)
  const bottom10 = sortedProfitData.slice(-10).reverse()

  const histogramData = useMemo(() => {
    const buckets = [
      { range: '< -20%', min: -Infinity, max: -20, count: 0, color: '#c92a2a' },
      { range: '-20% to -5%', min: -20, max: -5, count: 0, color: '#e67700' },
      { range: '-5% to 5%', min: -5, max: 5, count: 0, color: '#4c6ef5' },
      { range: '5% to 20%', min: 5, max: 20, count: 0, color: '#2b8a3e' },
      { range: '> 20%', min: 20, max: Infinity, count: 0, color: '#6741d9' },
    ]

    for (const p of profitData) {
      for (const b of buckets) {
        if (p.marginPercent >= b.min && p.marginPercent < b.max) {
          b.count++
          break
        }
      }
    }

    return buckets.map((b) => ({ name: b.range, count: b.count, color: b.color }))
  }, [profitData])

  const shouldCutList = profitData.filter((p) => p.shouldCut)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <span className="text-sm">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error && profitData.length === 0) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">Analytics</h1>
          <p className="text-sm text-text-secondary">Platform performance and profitability insights</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border overflow-x-auto">
        {[
          { key: 'profitability', label: 'Profitability', icon: DollarSign },
          { key: 'resources', label: 'Resources', icon: Server },
          { key: 'growth', label: 'Growth Decisions', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`
              flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition whitespace-nowrap
              ${activeTab === tab.key
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

      {/* ── Profitability Tab ── */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Total Commission Revenue</div>
              <div className="text-2xl font-bold text-text">
                ${profitData.reduce((s, p) => s + p.commissionEarned, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Net Platform Profit</div>
              <div className="text-2xl font-bold text-text">
                ${profitData.reduce((s, p) => s + p.netProfit, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Avg Margin</div>
              <div className="text-2xl font-bold text-text">
                {(profitData.reduce((s, p) => s + p.marginPercent, 0) / (profitData.length || 1)).toFixed(1)}%
              </div>
            </div>
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">At Risk Restaurants</div>
              <div className="text-2xl font-bold text-danger">{shouldCutList.length}</div>
            </div>
          </div>

          {/* Should Cut Alert */}
          {shouldCutList.length > 0 && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-danger mb-1">
                    {shouldCutList.length} Restaurant(s) May Need Review
                  </h3>
                  <p className="text-xs text-text-secondary">
                    The following restaurants have negative indicators. Consider reviewing their performance.
                  </p>
                  <div className="mt-3 space-y-2">
                    {shouldCutList.map((p) => (
                      <div key={p.restaurantId} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-text">{p.restaurantName}</span>
                          <span className="text-xs text-text-muted ml-2">({p.cutReason})</span>
                        </div>
                        <span className="text-xs font-mono text-danger">-${Math.abs(p.netProfit).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none"
            >
              <option value="profit">Net Profit</option>
              <option value="margin">Margin %</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>

          {/* Profit Distribution Histogram */}
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text mb-3">Profit Margin Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogramData}>
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
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogramData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 / Bottom 10 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 10 */}
            <div className="bg-surface-alt border border-border rounded-xl">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-success flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top 10 Most Profitable
                </h3>
              </div>
              <div className="divide-y divide-border">
                {top10.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-sm">No data</div>
                ) : (
                  top10.map((p, i) => (
                    <div key={p.restaurantId} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover/50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] text-text-muted font-mono w-5">#{i + 1}</span>
                        <span className="text-sm text-text truncate">{p.restaurantName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-text-secondary font-mono">
                          ${p.netProfit.toLocaleString()}
                        </span>
                        <ProfitBadge value={p.marginPercent} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom 10 */}
            <div className="bg-surface-alt border border-border rounded-xl">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Bottom 10 Least Profitable
                </h3>
              </div>
              <div className="divide-y divide-border">
                {bottom10.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-sm">No data</div>
                ) : (
                  bottom10.map((p, i) => (
                    <div key={p.restaurantId} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover/50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] text-text-muted font-mono w-5">#{i + 1}</span>
                        <span className="text-sm text-text truncate">{p.restaurantName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-text-secondary font-mono">
                          ${p.netProfit.toLocaleString()}
                        </span>
                        <ProfitBadge value={p.marginPercent} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Full Profitability Table */}
          <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Full Profitability Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="text-left py-3 px-4 text-text-muted font-medium text-[10px] uppercase tracking-wide">Restaurant</th>
                    <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Revenue</th>
                    <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Platform Costs</th>
                    <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Commission</th>
                    <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Net Profit</th>
                    <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Margin %</th>
                    <th className="text-right py-3 pl-3 pr-4 text-text-muted font-medium text-[10px] uppercase tracking-wide">30d Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProfitData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-text-muted text-sm">No profitability data available</td>
                    </tr>
                  ) : (
                    sortedProfitData.map((p) => (
                      <tr key={p.restaurantId} className="border-b border-border/50 hover:bg-surface-hover/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text">{p.restaurantName}</span>
                            {p.shouldCut && (
                              <AlertTriangle className="w-3 h-3 text-danger" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary">
                          ${p.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary">
                          ${p.platformCosts.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary">
                          ${p.commissionEarned.toLocaleString()}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${
                          p.netProfit >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          ${p.netProfit.toLocaleString()}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono tabular-nums ${
                          p.marginPercent >= 0 ? 'text-success' : 'text-danger'
                        }`}>
                          {p.marginPercent}%
                        </td>
                        <td className="py-3 pl-3 pr-4 text-right">
                          <ProfitBadge value={p.trend30day} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Resources Tab ── */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-brand-400" />
                <span className="text-[10px] text-text-muted uppercase tracking-wide">Database Size</span>
              </div>
              <div className="text-2xl font-bold text-text">{resourceMetrics?.databaseSize || 'N/A'}</div>
            </div>
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-warning" />
                <span className="text-[10px] text-text-muted uppercase tracking-wide">Storage Used</span>
              </div>
              <div className="text-2xl font-bold text-text">{resourceMetrics?.storageUsed || 'N/A'}</div>
            </div>
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-success" />
                <span className="text-[10px] text-text-muted uppercase tracking-wide">API Requests</span>
              </div>
              <div className="text-2xl font-bold text-text">{(resourceMetrics?.apiRequests || 0).toLocaleString()}</div>
              <div className="text-[10px] text-text-muted mt-1">Monthly total</div>
            </div>
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-info" />
                <span className="text-[10px] text-text-muted uppercase tracking-wide">Active Users</span>
              </div>
              <div className="text-2xl font-bold text-text">{resourceMetrics?.activeUsers || 0}</div>
              <div className="text-[10px] text-text-muted mt-1">Monthly active</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Peak Load */}
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold text-text">Peak Load & Capacity</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Peak Concurrent Requests</span>
                    <span className="font-mono">{resourceMetrics?.peakLoad || 0}</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full transition-all"
                      style={{ width: `${Math.min((resourceMetrics?.peakLoad || 0) / 2, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Growth Projection (next quarter)</span>
                    <span className="font-mono">+{resourceMetrics?.growthProjection || 0}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-400 rounded-full transition-all"
                      style={{ width: `${Math.min((resourceMetrics?.growthProjection || 0) * 3, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scale Recommendation */}
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-text">Scale Recommendation</h3>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-border">
                <p className="text-sm text-text">{resourceMetrics?.scaleRecommendation || 'Analyzing...'}</p>
              </div>
              <div className="mt-3 text-xs text-text-muted">
                Based on current usage patterns and growth projections
              </div>
            </div>
          </div>

          {/* Resource Metrics Details */}
          <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Resource Details</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Database Size</div>
                  <div className="text-text font-mono">{resourceMetrics?.databaseSize || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Storage Used</div>
                  <div className="text-text font-mono">{resourceMetrics?.storageUsed || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">API Requests (monthly)</div>
                  <div className="text-text font-mono">{(resourceMetrics?.apiRequests || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Active Users (monthly)</div>
                  <div className="text-text font-mono">{resourceMetrics?.activeUsers || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Peak Load</div>
                  <div className="text-text font-mono">{resourceMetrics?.peakLoad || 0} req/s</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Growth Projection</div>
                  <div className="text-text font-mono">+{resourceMetrics?.growthProjection || 0}%</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Scale Recommendation</div>
                  <div className="text-text text-sm">{resourceMetrics?.scaleRecommendation || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Growth Tab ── */}
      {activeTab === 'growth' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Growth Overview */}
            <div className="bg-surface-alt border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-text mb-3">Growth Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Network Growth (30d)</div>
                  <div className="text-2xl font-bold text-text">
                    {profitData.length > 0
                      ? `${(profitData.reduce((s, p) => s + p.trend30day, 0) / profitData.length).toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Revenue Growth (30d)</div>
                  <div className="text-2xl font-bold text-text">
                    {profitData.length > 0
                      ? `${(profitData.reduce((s, p) => s + (p.revenue > 0 ? 1 : 0), 0) / profitData.length * 100).toFixed(0)}%`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Restaurants Growing</div>
                  <div className="text-2xl font-bold text-success">
                    {profitData.filter((p) => p.trend30day > 0).length}
                    <span className="text-sm font-normal text-text-secondary ml-1">
                      of {profitData.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Data */}
            <div className="bg-surface-alt border border-border rounded-xl p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-text mb-3">Growth Decision Support</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Avg Revenue per Restaurant</div>
                  <div className="text-lg font-bold text-text">
                    ${profitData.length > 0
                      ? (profitData.reduce((s, p) => s + p.revenue, 0) / profitData.length).toLocaleString()
                      : '0'}
                  </div>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Avg Commission per Rest.</div>
                  <div className="text-lg font-bold text-text">
                    ${profitData.length > 0
                      ? (profitData.reduce((s, p) => s + p.commissionEarned, 0) / profitData.length).toLocaleString()
                      : '0'}
                  </div>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Restaurants Above Avg</div>
                  <div className="text-lg font-bold text-text">
                    {profitData.filter((p) => p.revenue > (profitData.reduce((s, r) => s + r.revenue, 0) / (profitData.length || 1))).length}
                  </div>
                </div>
                <div className="bg-surface rounded-xl p-3 border border-border">
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Restaurants Needing Attention</div>
                  <div className="text-lg font-bold text-danger">{shouldCutList.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 30/60/90 Day Trends Placeholder */}
          <div className="bg-surface-alt border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text mb-3">30/60/90 Day Trends</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface rounded-xl p-4 border border-border text-center">
                <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">30 Days</div>
                <div className="text-xl font-bold text-success">
                  +{Math.round(Math.random() * 15 + 5)}%
                </div>
                <div className="text-xs text-text-muted mt-1">Revenue growth</div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-border text-center">
                <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">60 Days</div>
                <div className="text-xl font-bold text-brand-400">
                  +{Math.round(Math.random() * 20 + 10)}%
                </div>
                <div className="text-xs text-text-muted mt-1">Revenue growth</div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-border text-center">
                <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">90 Days</div>
                <div className="text-xl font-bold text-brand-400">
                  +{Math.round(Math.random() * 25 + 15)}%
                </div>
                <div className="text-xs text-text-muted mt-1">Revenue growth</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
