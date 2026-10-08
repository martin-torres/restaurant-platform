import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, User, ClipboardList, MessageSquare,
  Loader2, AlertCircle, CheckCircle2, Hash, ShoppingBag, CreditCard, Store, Sofa, Bike
} from 'lucide-react'
import { getRestaurantIdFromUrl, resolveRestaurantId } from '../../../lib/supabase'
import { createOrder } from '../../../shared/api/orders'
import { useCartStore } from '../../../shared/hooks/useCartStore'
import type { OrderType } from '../../../types'

export default function CheckoutView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const restaurantId = useCartStore((s) => s.restaurant_id)
  const items = useCartStore((s) => s.items)
  const tableId = useCartStore((s) => s.table_id)
  const seatNumber = useCartStore((s) => s.seat_number)
  const orderType = useCartStore((s) => s.order_type)
  const notes = useCartStore((s) => s.notes)
  const setOrderType = useCartStore((s) => s.setOrderType)
  const setSeatNumber = useCartStore((s) => s.setSeatNumber)
  const clearCart = useCartStore((s) => s.clearCart)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const subtotal = getSubtotal()

  const [localOrderType, setLocalOrderType] = useState<OrderType>(orderType)
  const [localSeat, setLocalSeat] = useState<number | null>(seatNumber)
  const [customerName, setCustomerName] = useState('')
  const [localNotes, setLocalNotes] = useState(notes)
  const [placing, setPlacing] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOrderTypeChange = (type: OrderType) => { setLocalOrderType(type); setOrderType(type); if (type !== 'dine_in') { setLocalSeat(null); setSeatNumber(null) } }

  const handlePlaceOrder = async () => {
    if (items.length === 0) return
    const rid = await resolveRestaurantId(restaurantId || getRestaurantIdFromUrl())
    if (!rid) { setError('No restaurant selected.'); return }
    setPlacing(true); setError(null)
    try {
      const order = await createOrder({
        restaurant_id: rid,
        table_id: localOrderType === 'dine_in' ? tableId || undefined : undefined,
        seat_number: localOrderType === 'dine_in' ? localSeat || undefined : undefined,
        order_type: localOrderType, customer_name: customerName || undefined, notes: localNotes || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menu_item.id, seat_number: item.seat_number || localSeat || undefined,
          name: item.menu_item.name, quantity: item.quantity, unit_price: item.menu_item.price,
          notes: item.notes || undefined,
          options: Object.entries(item.selected_options || {}).map(([name, choices]) => ({ name, choices })),
        })),
      })
      if (!order) throw new Error('Failed to create order.')
      setPlacedOrderId(order.id); clearCart()
      setTimeout(() => { navigate(`/tracking/${order.id}`) }, 1500)
    } catch (err: any) { setError(err.message || 'Something went wrong.') } finally { setPlacing(false) }
  }

  if (placedOrderId) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5 animate-scale-in">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-1">Order Placed!</h2>
      <div className="flex items-center gap-1.5 mb-1">
        <Hash className="w-4 h-4 text-text-muted" />
        <span className="font-mono text-brand-600 font-bold text-lg">#{placedOrderId.slice(0, 8)}</span>
      </div>
      <p className="text-text-muted text-sm text-center">Redirecting to order tracking...</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[72px]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate('/cart')} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl active:scale-95 transition-colors"><ChevronLeft className="w-5 h-5 text-text" /></button>
          <h1 className="flex-1 text-lg font-bold text-center mr-6">{t('checkout.title')}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto space-y-5">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {/* ── Order Summary Card ── */}
        <section className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-text">{items.reduce((s, i) => s + i.quantity, 0)} items</p>
              <p className="text-xs text-text-secondary">${subtotal.toFixed(2)} subtotal</p>
            </div>
            <button onClick={() => navigate('/cart')} className="text-xs font-bold text-brand-500 hover:text-brand-600 active:scale-95 transition-all px-3 py-1.5 bg-brand-500/10 rounded-full">
              Edit
            </button>
          </div>
        </section>

        {/* ── Order Type ── */}
        <section>
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Order Type
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['dine_in', 'Dine In', Sofa],
              ['to_go', 'To Go', Store],
              ['delivery', 'Delivery', Bike]
            ] as [OrderType, string, any][]).map(([type, label, Icon]) => (
              <button key={type} onClick={() => handleOrderTypeChange(type)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-bold border-2 transition-all active:scale-95 ${localOrderType === type ? 'border-brand-500 bg-brand-500/10 text-brand-600 shadow-sm' : 'border-border bg-surface text-text-secondary hover:bg-surface-hover shadow-sm'}`}>
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Seat Selector ── */}
        {localOrderType === 'dine_in' && (
          <section className="animate-fade-in">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Seat Number
            </h2>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button key={n} onClick={() => { setLocalSeat(n); setSeatNumber(n) }}
                  className={`w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all active:scale-90 ${localSeat === n ? 'border-brand-500 bg-brand-500/10 text-brand-600 shadow-sm' : 'border-border bg-surface text-text-secondary hover:bg-surface-hover shadow-sm'}`}>
                  {n}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Name ── */}
        <section>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <User className="w-3 h-3" /> Name (optional)
          </label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your name" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text shadow-sm" />
        </section>

        {/* ── Notes ── */}
        <section>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Notes (optional)
          </label>
          <textarea value={localNotes} onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Any special requests..." rows={2}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text resize-none shadow-sm" />
        </section>

        {/* ── Table info ── */}
        {localOrderType === 'dine_in' && tableId && (
          <section className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Table Info</h3>
            <p className="text-sm text-text font-medium">
              Table #{tableId.slice(0, 8).toUpperCase()}
              {localSeat ? ` · Seat ${localSeat}` : ''}
            </p>
            <p className="text-xs text-text-secondary mt-1">Payment and tip will be handled after your meal when you request the bill.</p>
          </section>
        )}
      </div>

      {/* ── Place Order ── */}
      <div className="sticky bottom-0 bg-surface-alt/95 backdrop-blur-xl border-t border-border/50 px-4 py-3 safe-bottom">
        <button onClick={handlePlaceOrder} disabled={placing || items.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {placing ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing order...</> : <><CreditCard className="w-5 h-5" /> {t('checkout.place_order')} — ${subtotal.toFixed(2)}</>}
        </button>
      </div>
    </div>
  )
}
