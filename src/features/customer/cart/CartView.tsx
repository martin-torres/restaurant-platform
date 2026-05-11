import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShoppingCart, Trash2, Plus, Minus, ChevronLeft, ChevronRight,
  MessageSquare, User, AlertCircle, ShoppingBag, Hash, CreditCard, UtensilsCrossed, Receipt
} from 'lucide-react'
import { useCartStore } from '../../../shared/hooks/useCartStore'

export default function CartView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const notes = useCartStore((s) => s.notes)
  const setNotes = useCartStore((s) => s.setNotes)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})

  const subtotal = getSubtotal()
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  if (items.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt pb-[72px]">
      <div className="w-20 h-20 rounded-3xl bg-surface-hover flex items-center justify-center mb-5">
        <ShoppingCart className="w-10 h-10 text-text-muted" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-text mb-1">{t('cart.title')}</h2>
      <p className="text-text-secondary text-sm mb-8 text-center">{t('cart.empty')}</p>
      <button onClick={() => navigate('/menu')} className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 active:scale-95 transition-all shadow-lg shadow-brand-500/20">
        <UtensilsCrossed className="w-4 h-4" /> Browse Menu
      </button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[80px]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate('/menu')} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl transition-colors active:scale-95">
            <ChevronLeft className="w-5 h-5 text-text" />
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-text -ml-10">{t('cart.title')}</h1>
        </div>
      </div>

      {/* ── Scrollable items area ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-2 space-y-3">
        {items.map((item) => (
          <div key={item.menu_item.id} className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              {/* Header */}
              <div className="flex items-start gap-3">
                {item.menu_item.image_url && <img src={item.menu_item.image_url} alt={item.menu_item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-text">{item.menu_item.name}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">${item.menu_item.price.toFixed(2)} each</p>
                  {item.seat_number && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <User className="w-3 h-3 text-text-muted" />
                      <span className="text-[10px] text-text-secondary bg-surface-alt px-2 py-0.5 rounded-md font-medium border border-border-light">Seat {item.seat_number}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => removeItem(item.menu_item.id)} className="p-2 hover:bg-danger/10 rounded-xl transition-colors flex-shrink-0 active:scale-90">
                  <Trash2 className="w-4 h-4 text-text-muted hover:text-danger transition-colors" />
                </button>
              </div>

              {/* Stepper + Total */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                <div className="flex items-center gap-1 bg-surface-alt rounded-xl border border-border p-0.5 shadow-sm">
                  <button onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors text-text active:scale-90">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-text">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors active:scale-90 shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="font-bold text-brand-600 text-sm">${(item.menu_item.price * item.quantity).toFixed(2)}</span>
              </div>

              {/* Notes toggle */}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setExpandedNotes((p) => ({ ...p, [item.menu_item.id]: !p[item.menu_item.id] }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors active:scale-95 ${item.notes ? 'bg-brand-500/10 text-brand-600' : 'bg-surface-alt text-text-secondary hover:bg-surface-hover border border-border-light'}`}>
                  <MessageSquare className="w-3 h-3" />
                  {item.notes ? 'Edit note' : 'Add note'}
                </button>
              </div>

              {expandedNotes[item.menu_item.id] && (
                <div className="mt-2 animate-fade-in">
                  <textarea value={item.notes || ''} onChange={(e) => useCartStore.getState().updateItemNotes(item.menu_item.id, e.target.value)}
                    placeholder="Special instructions..." rows={2}
                    className="w-full text-xs bg-surface-alt border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text shadow-sm" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order Notes */}
        <div className="mt-5">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Order notes
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests for the whole order..." rows={2}
            className="w-full text-sm bg-surface border border-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text shadow-sm" />
        </div>

      {/* ── Footer ── */}
      <div className="sticky bottom-0 bg-surface-alt/95 backdrop-blur-xl border-t border-border/50 px-4 py-3 safe-bottom">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-text-secondary">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-text-secondary">{t('cart.total')}:</span>
            <span className="font-bold text-text text-lg">${subtotal.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => navigate('/checkout')} disabled={items.length === 0}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-brand-500 text-white rounded-2xl font-semibold shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> {t('cart.checkout')}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
