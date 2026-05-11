import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search, Plus, Minus, ShoppingCart, Loader2, AlertCircle,
  ChevronLeft, ImageOff, Check, UtensilsCrossed, X, SlidersHorizontal
} from 'lucide-react'
import { supabase, getRestaurantIdFromUrl } from '../../../lib/supabase'
import type { MenuItem } from '../../../types'
import { useCartStore } from '../../../shared/hooks/useCartStore'

export default function MenuView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''

  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [addedAnim, setAddedAnim] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const itemCount = useCartStore((s) => s.getItemCount())

  useEffect(() => {
    const restaurantId = getRestaurantIdFromUrl() || useCartStore.getState().restaurant_id
    if (!restaurantId) { setError('No restaurant specified.'); setLoading(false); return }
    const fetchMenu = async () => {
      try {
        const { data, error: err } = await supabase
          .from('menu_items').select('*').eq('restaurant_id', restaurantId).eq('is_available', true).order('sort_order')
        if (err) throw err
        const menuItems = (data as MenuItem[]) || []
        setItems(menuItems)
        const cats = [...new Set(menuItems.map((m) => m.category).filter(Boolean))]
        if (cats.length > 0) setActiveCategory(initialCategory && cats.includes(initialCategory) ? initialCategory : cats[0])
      } catch (err: any) { setError(err.message || 'Failed to load menu')
      } finally { setLoading(false) }
    }
    fetchMenu()
  }, [initialCategory])

  const grouped = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {}
    items.forEach((item) => { const cat = item.category || 'General'; if (!groups[cat]) groups[cat] = []; groups[cat].push(item) })
    return groups
  }, [items])

  const categories = Object.keys(grouped)

  const filteredItems = useMemo(() => {
    let list = activeCategory ? grouped[activeCategory] || [] : items
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((item) => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q))
    }
    return list
  }, [items, grouped, activeCategory, searchQuery])

  const handleAddItem = (item: MenuItem) => {
    addItem(item); setAddedAnim(item.id)
    setTimeout(() => setAddedAnim(null), 800)
  }

  const handleCardClick = (item: MenuItem) => {
    if (!item.is_available || (item.track_inventory && item.stock <= 0)) return
    handleAddItem(item)
  }

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = cartItems.find((ci) => ci.menu_item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
      <p className="text-text-secondary text-sm">{t('loading')}</p>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <AlertCircle className="w-10 h-10 text-danger mb-4" />
      <h2 className="text-lg font-bold mb-1 text-text">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md">{t('retry')}</button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[72px]">
      {/* ── iOS Large Title Header ── */}
      <div className="sticky top-0 z-20 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-hover rounded-xl transition-colors active:scale-95">
            <ChevronLeft className="w-5 h-5 text-text" />
          </button>
          <h1 className="text-lg font-bold text-text">{t('menu.title')}</h1>
          <button onClick={() => setShowSearch(!showSearch)} className={`p-2 -mr-2 rounded-xl transition-colors active:scale-95 ${showSearch ? 'bg-brand-500/10 text-brand-500' : 'hover:bg-surface-hover text-text-muted'}`}>
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* ── Search ── */}
        {showSearch && (
          <div className="px-4 pb-3 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('menu.search')} autoFocus
                className="w-full pl-10 pr-9 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text active:scale-95"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        )}

        {/* ── Category Pill Tabs ── */}
        {categories.length > 0 && !searchQuery && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                  activeCategory === cat
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-surface text-text-secondary border border-border hover:bg-surface-hover hover:border-brand-200 shadow-sm'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Menu Items ── */}
      <div className="flex-1 px-4 pt-3 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
              <ImageOff className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-text-secondary text-sm font-medium">{searchQuery ? `No items match "${searchQuery}"` : t('no_data')}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-stagger">
            {filteredItems.map((item) => {
              const qtyInCart = getItemQuantityInCart(item.id)
              const isOutOfStock = !item.is_available || (item.track_inventory && item.stock <= 0)
              const isAnimating = addedAnim === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`flex gap-3.5 bg-surface rounded-2xl p-3.5 border transition-all cursor-pointer select-none shadow-sm ${
                    isAnimating
                      ? 'ring-2 ring-brand-500/30 border-brand-200 scale-[1.01] shadow-md animate-add-pulse'
                      : 'border-border hover:shadow-lg hover:border-brand-200 active:scale-[0.99]'
                  } ${isOutOfStock ? 'opacity-55 cursor-not-allowed' : ''}`}
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-surface-alt relative shadow-sm">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center') }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-6 h-6 text-text-muted" /></div>
                    )}
                    {isAnimating && (
                      <div className="absolute inset-0 bg-brand-500/25 flex items-center justify-center backdrop-blur-[1px]">
                        <Check className="w-8 h-8 text-white drop-shadow-lg animate-check-bounce" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-[15px] text-text leading-tight">{item.name}</h3>
                      {item.description && <p className="text-xs text-text-secondary line-clamp-1 mt-1">{item.description}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-brand-600 text-[15px]">${item.price.toFixed(2)}</span>
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-danger/10 text-danger rounded-full">Out of stock</span>
                      ) : qtyInCart > 0 ? (
                        <div className="flex items-center gap-1 bg-surface-alt rounded-xl border border-border p-0.5 shadow-sm" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { const store = useCartStore.getState(); store.updateQuantity(item.id, qtyInCart - 1) }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors text-text active:scale-90">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-brand-600">{qtyInCart}</span>
                          <button onClick={() => handleAddItem(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors active:scale-90 shadow-sm">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 text-white shadow-sm active:scale-90 transition-transform">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Floating Cart Button ── */}
      {itemCount > 0 && (
        <button onClick={() => navigate('/cart')} className="fixed bottom-20 right-4 z-30 flex items-center gap-2.5 px-5 py-3.5 bg-brand-500 text-white rounded-2xl shadow-xl shadow-brand-500/25 hover:bg-brand-600 active:scale-95 transition-all animate-scale-in">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2.5 w-5 h-5 flex items-center justify-center bg-white text-brand-600 text-[10px] font-bold rounded-full shadow">{itemCount}</span>
          </div>
          <span className="text-sm font-bold">${useCartStore.getState().getSubtotal().toFixed(2)}</span>
        </button>
      )}
    </div>
  )
}
