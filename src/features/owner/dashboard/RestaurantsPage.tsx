// ============================================================================
// RestaurantsPage — Full CRUD for restaurants
// ============================================================================
import { useState, useEffect, useMemo } from 'react'
import {
  Store,
  Plus,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  Check,
  Upload,
  Download,
  QrCode,
  ChevronDown,
  ChevronUp,
  Filter,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ImagePlus,
} from 'lucide-react'
import {
  getRestaurantsExtended,
  createRestaurant,
  updateRestaurant,
  deactivateRestaurant,
  getRestaurantImpactSummary,
} from '../../../shared/api/owner'
import type { RestaurantExtended } from '../../../shared/api/owner'
import type { HealthStatus } from '../../../types'
import { useNavigate } from 'react-router-dom'

// ─── Health Badge ───────────────────────────────────────────────────────────

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

// ─── Add/Edit Modal ─────────────────────────────────────────────────────────

function RestaurantFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<boolean>
  initial?: Partial<RestaurantExtended>
}) {
  const [name, setName] = useState(initial?.name || '')
  const [slug, setSlug] = useState(initial?.slug || '')
  const [address, setAddress] = useState(initial?.address || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [cuisineType, setCuisineType] = useState(initial?.cuisine_type || '')
  const [commissionPercent, setCommissionPercent] = useState(initial?.commission_percent?.toString() || '0')
  const [tier, setTier] = useState<'basic' | 'growth' | 'strategic'>(initial?.tier || 'basic')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  useEffect(() => {
    if (!initial && name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [name, initial])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !slug) {
      setError('Name and slug are required')
      return
    }
    setSaving(true)
    setError(null)

    const success = await onSave({
      name,
      slug,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      cuisine_type: cuisineType || undefined,
      commission_percent: parseFloat(commissionPercent) || 0,
      tier,
    })

    setSaving(false)
    if (success) {
      onClose()
    } else {
      setError('Failed to save restaurant')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-surface-alt border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text">
            {initial ? 'Edit Restaurant' : 'Add Restaurant'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Restaurant Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="La Trattoria"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40 font-mono"
                placeholder="la-trattoria"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="123 Main St, City"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="+1 555-0123"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="owner@restaurant.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Cuisine Type</label>
              <input
                type="text"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                placeholder="Italian, Mexican..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                <option value="basic">Basic</option>
                <option value="growth">Growth</option>
                <option value="strategic">Strategic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Commission %</label>
              <input
                type="number"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                min="0"
                max="100"
                step="0.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name || !slug}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? 'Save Changes' : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ──────────────────────────────────────────────

function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  restaurant,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<boolean>
  restaurant: RestaurantExtended | null
}) {
  const [impact, setImpact] = useState<{ revenue_mtd: number; active_orders: number; staff_count: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && restaurant) {
      setLoading(true)
      getRestaurantImpactSummary(restaurant.id).then((data) => {
        setImpact(data)
        setLoading(false)
      })
    }
  }, [isOpen, restaurant])

  if (!isOpen || !restaurant) return null

  async function handleConfirm() {
    setConfirming(true)
    setError(null)
    const success = await onConfirm()
    setConfirming(false)
    if (success) onClose()
    else setError('Failed to deactivate restaurant')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-surface-alt border border-border rounded-2xl shadow-xl">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-danger flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Deactivate Restaurant
          </h3>
        </div>

        <div className="p-6">
          <p className="text-sm text-text mb-4">
            Are you sure you want to deactivate <strong>{restaurant.name}</strong>?
            This is a soft delete — the restaurant will be disabled but data preserved.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading impact summary...
            </div>
          ) : impact ? (
            <div className="bg-surface rounded-xl p-4 space-y-2 text-sm border border-border">
              <div className="flex justify-between">
                <span className="text-text-secondary">Revenue (MTD)</span>
                <span className="text-text font-medium">${impact.revenue_mtd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Active Orders</span>
                <span className="text-text font-medium">{impact.active_orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Staff Count</span>
                <span className="text-text font-medium">{impact.staff_count}</span>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mt-3 flex items-center gap-2 bg-danger/10 text-danger rounded-lg px-3 py-2 text-xs">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-text transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Deactivate
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── QR Code Modal ──────────────────────────────────────────────────────────

function QRCodeModal({
  isOpen,
  onClose,
  restaurant,
}: {
  isOpen: boolean
  onClose: () => void
  restaurant: RestaurantExtended | null
}) {
  if (!isOpen || !restaurant) return null

  const qrTypes = [
    { type: 'customer', label: 'Customer Menu' },
    { type: 'server', label: 'Server View' },
    { type: 'kitchen', label: 'Kitchen View' },
    { type: 'manager', label: 'Manager Dashboard' },
    { type: 'owner', label: 'Owner View' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-surface-alt border border-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Codes — {restaurant.name}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            Generate QR codes for each surface type. Each QR code links to the appropriate interface.
          </p>

          {qrTypes.map((qt) => {
            const url = `${window.location.origin}/${restaurant.slug}?qr_type=${qt.type}&restaurant_id=${restaurant.id}`
            return (
              <div key={qt.type} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-text capitalize">{qt.label}</div>
                    <div className="text-[10px] text-text-muted font-mono">{qt.type}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url)
                    }}
                    className="text-xs text-brand-400 hover:text-brand-300 transition"
                  >
                    Copy URL
                  </button>
                </div>
                <div className="bg-surface-alt rounded-lg p-3 text-xs text-text-muted font-mono break-all border border-border">
                  {url}
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-center pt-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm transition">
              <Download className="w-4 h-4" />
              Download All QR Codes (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantExtended | undefined>(undefined)
  const [deletingRestaurant, setDeletingRestaurant] = useState<RestaurantExtended | null>(null)
  const [qrRestaurant, setQrRestaurant] = useState<RestaurantExtended | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await getRestaurantsExtended()
      setRestaurants(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...restaurants]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((r) => r.name.toLowerCase().includes(q))
    }
    if (tierFilter !== 'all') {
      list = list.filter((r) => r.tier === tierFilter)
    }
    return list
  }, [restaurants, searchQuery, tierFilter])

  async function handleCreate(data: any) {
    const result = await createRestaurant(data)
    if (result) {
      await loadData()
      return true
    }
    return false
  }

  async function handleUpdate(data: any) {
    if (!editingRestaurant) return false
    const result = await updateRestaurant(editingRestaurant.id, data)
    if (result) {
      await loadData()
      return true
    }
    return false
  }

  async function handleDelete() {
    if (!deletingRestaurant) return false
    const result = await deactivateRestaurant(deletingRestaurant.id)
    if (result) {
      await loadData()
      return true
    }
    return false
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <span className="text-sm">Loading restaurants...</span>
        </div>
      </div>
    )
  }

  if (error && restaurants.length === 0) {
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
          <h1 className="text-xl font-bold text-text">Restaurants</h1>
          <p className="text-sm text-text-secondary">{restaurants.length} total restaurants</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-text transition">
                <Download className="w-3.5 h-3.5" />
                Export ({selectedIds.size})
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary hover:text-text transition">
                <Filter className="w-3.5 h-3.5" />
                Batch Update
              </button>
            </>
          )}
          <button
            onClick={() => {
              setEditingRestaurant(undefined)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-surface-alt border border-border rounded-xl px-4 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="basic">Basic</option>
          <option value="growth">Growth</option>
          <option value="strategic">Strategic</option>
        </select>
        <div className="text-xs text-text-muted">
          {filtered.length} of {restaurants.length} shown
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-surface-alt border border-border rounded-xl p-12 text-center">
          <Store className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-text mb-1">
            {searchQuery || tierFilter !== 'all' ? 'No restaurants match your filters' : 'No restaurants yet'}
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {searchQuery || tierFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first restaurant to get started'}
          </p>
          {!searchQuery && tierFilter === 'all' && (
            <button
              onClick={() => {
                setEditingRestaurant(undefined)
                setShowForm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Restaurant
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface-alt border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-3 pl-4 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Restaurant</th>
                  <th className="text-left py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide hidden md:table-cell">Tier</th>
                  <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Revenue MTD</th>
                  <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide hidden sm:table-cell">Orders</th>
                  <th className="text-right py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide">Commission</th>
                  <th className="text-center py-3 px-3 text-text-muted font-medium text-[10px] uppercase tracking-wide hidden lg:table-cell">Health</th>
                  <th className="text-center py-3 pl-3 pr-4 text-text-muted font-medium text-[10px] uppercase tracking-wide w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-surface-hover/50 transition"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            r.health_status === 'healthy' ? 'bg-success'
                            : r.health_status === 'warning' ? 'bg-warning'
                            : 'bg-danger'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-text">{r.name}</div>
                          <div className="text-[10px] text-text-muted">{r.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                        r.tier === 'strategic' ? 'bg-brand-600/10 text-brand-400'
                        : r.tier === 'growth' ? 'bg-warning/10 text-warning'
                        : 'bg-text-muted/10 text-text-muted'
                      }`}>
                        {r.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-text font-semibold">
                      ${(r.revenue_mtd || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary hidden sm:table-cell">
                      {r.active_orders_today || 0}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-text-secondary">
                      {r.commission_percent}%
                    </td>
                    <td className="py-3 px-3 text-center hidden lg:table-cell">
                      <HealthBadge status={r.health_status} />
                    </td>
                    <td className="py-3 pl-3 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRestaurant(r)
                            setShowForm(true)
                          }}
                          className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover transition"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setQrRestaurant(r)}
                          className="p-1.5 rounded text-text-muted hover:text-text hover:bg-surface-hover transition"
                          title="QR Codes"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRestaurant(r)}
                          className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/50">
            <div className="text-xs text-text-muted">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filtered.length} restaurants`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                Total revenue: ${filtered.reduce((s, r) => s + (r.revenue_mtd || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RestaurantFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingRestaurant(undefined)
        }}
        onSave={editingRestaurant ? handleUpdate : handleCreate}
        initial={editingRestaurant ? {
          name: editingRestaurant.name,
          slug: editingRestaurant.slug,
          address: editingRestaurant.address,
          phone: editingRestaurant.phone,
          email: editingRestaurant.email,
          cuisine_type: editingRestaurant.cuisine_type,
          commission_percent: editingRestaurant.commission_percent,
          tier: editingRestaurant.tier,
        } : undefined}
      />

      <DeleteModal
        isOpen={!!deletingRestaurant}
        onClose={() => setDeletingRestaurant(null)}
        onConfirm={handleDelete}
        restaurant={deletingRestaurant}
      />

      <QRCodeModal
        isOpen={!!qrRestaurant}
        onClose={() => setQrRestaurant(null)}
        restaurant={qrRestaurant}
      />
    </div>
  )
}
