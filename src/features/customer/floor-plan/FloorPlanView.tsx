import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Loader2, AlertCircle, ChevronLeft, MapPin, CheckCircle2, Table2, Users, Circle,
  Maximize2, Minimize2, UtensilsCrossed,
} from 'lucide-react'
import { supabase, getRestaurantIdFromUrl } from '../../../lib/supabase'
import { useCartStore } from '../../../shared/hooks/useCartStore'
import FloorPlanCanvas, { useTableStatusMap } from '../../../shared/components/FloorPlanCanvas'
import { STATUS_LABELS } from '../../../shared/utils/floorPlanColors'
import type { RestaurantTable } from '../../../types'
import type { OrderForStatus } from '../../../shared/components/FloorPlanCanvas'

// Customer-visible legend items only (staff-only colors collapse to lightgray in customer mode)
const CUSTOMER_LEGEND = [
  { key: 'none', label: 'Available' },
  { key: 'lightgray', label: 'Occupied' },
  { key: 'darkgray', label: 'Cleaning' },
  { key: 'indigo', label: 'Reserved' },
] as const

export default function FloorPlanView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [ordersList, setOrdersList] = useState<OrderForStatus[]>([])
  const [confirmSelect, setConfirmSelect] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fullScreen, setFullScreen] = useState(false)
  const setTable = useCartStore((s) => s.setTable)
  const storeTableId = useCartStore((s) => s.table_id)
  const containerRef = useRef<HTMLDivElement>(null)
  const restaurantId = getRestaurantIdFromUrl() || useCartStore.getState().restaurant_id

  // Compute table statuses using the shared utility
  const tableStatusMap = useTableStatusMap(tables, ordersList, 'customer')

  useEffect(() => {
    if (!restaurantId) { setError('No restaurant specified.'); setLoading(false); return }
    const fetchTablesAndOrders = async () => {
      try {
        const { data: tableData, error: tableErr } = await supabase
          .from('restaurant_tables').select('*').eq('restaurant_id', restaurantId).eq('visible_to_customers', true).order('table_number')
        if (tableErr) throw tableErr
        const fetchedTables = (tableData as RestaurantTable[]) || []
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, table_id, status, is_request')
          .eq('restaurant_id', restaurantId)
          .neq('status', 'delivered')
          .neq('status', 'cancelled')
        const orders = ((orderData as any[]) || []).map((o: any) => ({
          id: o.id,
          table_id: o.table_id,
          status: o.status,
          is_request: o.is_request,
        })) as OrderForStatus[]
        setOrdersList(orders)
        setTables(fetchedTables)
        if (storeTableId) setSelectedTableId(storeTableId)
      } catch (err: any) { setError(err.message || 'Failed to load floor plan') } finally { setLoading(false) }
    }
    fetchTablesAndOrders()
    const channel = supabase.channel('floor-plan-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload) => {
        const order = payload.new as any
        setOrdersList((prev) => {
          if (order.status === 'delivered' || order.status === 'cancelled') {
            return prev.filter((o) => o.id !== order.id)
          }
          const idx = prev.findIndex((o) => o.id === order.id)
          const entry: OrderForStatus = {
            id: order.id,
            table_id: order.table_id,
            status: order.status,
            is_request: order.is_request,
          }
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = entry
            return next
          }
          return [...prev, entry]
        })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, storeTableId])

  const handleTableSelect = (table: RestaurantTable) => {
    const status = tableStatusMap.get(table.id)
    // Prevent selecting tables being cleaned
    if (status?.primary === 'darkgray') return
    setSelectedTableId(table.id)
    setConfirmSelect(true)
  }
  const handleConfirmTable = () => {
    if (selectedTableId) { setTable(selectedTableId); navigate('/menu') }
    setConfirmSelect(false)
  }

  // Filter tables by status for the legend filters
  const filteredTableIds = useMemo(() => {
    if (statusFilter === 'all') return null // show all
    const set = new Set<string>()
    for (const table of tables) {
      const status = tableStatusMap.get(table.id)
      if (statusFilter === 'none' && status?.primary === 'none') set.add(table.id)
      else if (statusFilter === 'lightgray' && status?.primary === 'lightgray') set.add(table.id)
      else if (statusFilter === 'darkgray' && status?.primary === 'darkgray') set.add(table.id)
      // indigo is a border color — show reserved tables
      else if (statusFilter === 'indigo' && status?.hasReservation) set.add(table.id)
    }
    return set
  }, [statusFilter, tables, tableStatusMap])

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
      <p className="text-text-secondary text-sm">{t('loading')}</p>
    </div>
  )
  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <AlertCircle className="w-10 h-10 text-danger mb-4" />
      <h2 className="text-lg font-bold text-text mb-1">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md">{t('retry')}</button>
    </div>
  )

  const selectedTable = tables.find((t) => t.id === selectedTableId)
  const selectedTableStatus = selectedTable ? tableStatusMap.get(selectedTable.id) : undefined

  return (
    <div className={`flex-1 flex flex-col bg-surface-alt ${!fullScreen ? 'pb-[72px]' : ''}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl active:scale-95 transition-colors"><ChevronLeft className="w-5 h-5 text-text" /></button>
            <h1 className="text-lg font-bold text-text">{t('floor_plan.title')}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFullScreen(!fullScreen)} className="p-2 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text transition-colors active:scale-95">
              {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => navigate('/menu')} className="p-2 hover:bg-surface-hover rounded-xl text-brand-500 transition-colors active:scale-95">
              <UtensilsCrossed className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Status Bar */}
        <div className="px-4 pb-2.5 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-success shadow-sm" />
            {tables.filter(t => tableStatusMap.get(t.id)?.primary === 'none').length} Available
          </span>
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-text-muted shadow-sm" />
            {tables.filter(t => tableStatusMap.get(t.id)?.primary === 'lightgray').length} Occupied
          </span>
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-fp-indigo shadow-sm" />
            {tables.filter(t => tableStatusMap.get(t.id)?.hasReservation).length} Reserved
          </span>
        </div>

        {/* Legend */}
        <div className="px-4 pb-2.5 flex gap-3 overflow-x-auto scrollbar-none">
          {CUSTOMER_LEGEND.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                statusFilter === key
                  ? 'bg-brand-500/10 text-brand-600 border border-brand-200 shadow-sm'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-sm ${
                key === 'none' ? 'bg-white border border-gray-300' :
                key === 'lightgray' ? 'bg-fp-lightgray' :
                key === 'darkgray' ? 'bg-fp-darkgray' :
                key === 'indigo' ? 'bg-fp-indigo' :
                'bg-gray-300'
              }`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div className="flex-1 overflow-auto bg-surface-alt/30">
        <FloorPlanCanvas
          tables={filteredTableIds
            ? tables.filter((t) => filteredTableIds.has(t.id))
            : tables}
          orders={ordersList}
          statusMode="customer"
          onTableClick={handleTableSelect}
          selectedTableId={selectedTableId}
          canvasRef={containerRef}
          showChairs={true}
          showGrid={true}
          className="mx-auto my-6"
          emptyState={
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                <Table2 className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-secondary text-sm text-center font-medium">No tables configured yet.</p>
            </div>
          }
        />

        {/* Quick stats footer */}
        <div className="sticky bottom-0 px-4 py-3 bg-surface border-t border-border/50 flex items-center justify-around text-xs backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-text-secondary font-medium">
            <Table2 className="w-3.5 h-3.5" /> {tables.length} tables
          </span>
          <span className="flex items-center gap-1.5 text-text-secondary font-medium">
            <Users className="w-3.5 h-3.5" /> {tables.reduce((s, t) => s + t.seats, 0)} seats
          </span>
          <span className="flex items-center gap-1.5 text-text-secondary font-medium">
            <Circle className="w-3.5 h-3.5" /> {tables.filter(t => tableStatusMap.get(t.id)?.primary === 'none').length} free
          </span>
        </div>
      </div>

      {/* ── Table Selection Bottom Sheet ── */}
      {confirmSelect && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setConfirmSelect(false)}>
          <div className="bg-surface rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* iOS grabber */}
            <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                selectedTableStatus?.primary === 'none' ? 'bg-success/20' : 'bg-fp-lightgray/30'
              }`}>
                <MapPin className={`w-6 h-6 ${selectedTableStatus?.primary === 'none' ? 'text-brand-500' : 'text-white'}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text">{selectedTable.display_name || `Table ${selectedTable.table_number}`}</h3>
                <p className="text-sm text-text-secondary flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> {selectedTable.seats} seats
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTableStatus?.primary === 'none'
                      ? 'bg-success/10 text-success'
                      : selectedTableStatus?.hasReservation
                        ? 'bg-fp-indigo/10 text-fp-indigo'
                        : 'bg-text-muted/10 text-text-secondary'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedTableStatus?.primary === 'none' ? 'bg-success' :
                      selectedTableStatus?.hasReservation ? 'bg-fp-indigo' :
                      'bg-text-muted'
                    }`} />
                    {selectedTableStatus
                      ? (selectedTableStatus.hasReservation ? 'Reserved' : STATUS_LABELS[selectedTableStatus.primary] || 'Unknown')
                      : 'Unknown'}
                  </span>
                </p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              {selectedTableStatus?.primary === 'none'
                ? 'This table is available. Would you like to order from here?'
                : 'This table currently has an active order. You can view the menu or check back later.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSelect(false)} className="flex-1 py-3 bg-surface-alt border border-border rounded-2xl font-bold text-text-secondary hover:bg-surface-hover transition-colors text-sm active:scale-95">
                Cancel
              </button>
              {selectedTableStatus?.primary === 'none' ? (
                <button onClick={handleConfirmTable} className="flex-1 py-3 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20">
                  <CheckCircle2 className="w-4 h-4" /> Select & Menu
                </button>
              ) : (
                <button onClick={() => { setConfirmSelect(false); navigate('/menu') }} className="flex-1 py-3 bg-surface-alt border border-brand-200 text-brand-600 rounded-2xl font-bold hover:bg-brand-500/5 transition-colors text-sm active:scale-95">
                  Browse Menu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}