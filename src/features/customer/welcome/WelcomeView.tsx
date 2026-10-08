import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  UtensilsCrossed, MapPin, ChevronRight, Clock, Star, Sparkles,
  Loader2, AlertCircle, Percent, ArrowRight, Tag, Timer, Store, Search, LayoutGrid, Flame, ArrowUpRight, X, ShoppingBag
} from 'lucide-react'
import { supabase, getRestaurantIdFromUrl, resolveRestaurantId } from '../../../lib/supabase'
import type { Restaurant, Promo } from '../../../types'
import { useCartStore } from '../../../shared/hooks/useCartStore'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'appetizers': <Flame className="w-5 h-5" />,
  'mains': <UtensilsCrossed className="w-5 h-5" />,
  'desserts': <Star className="w-5 h-5" />,
  'drinks': <Clock className="w-5 h-5" />,
}

export default function WelcomeView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [promos, setPromos] = useState<Promo[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurantSlug, setRestaurantSlug] = useState<string>('')
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null)

  const setRestaurantId = useCartStore((s) => s.setRestaurantId)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('restaurant_id') || ''
    setRestaurantSlug(slug)

    const fetchData = async () => {
      try {
        const raw = getRestaurantIdFromUrl()
        if (!raw) {
          setError('No restaurant specified. Please scan a QR code to get started.')
          setLoading(false)
          return
        }
        const restaurantId = await resolveRestaurantId(raw)
        if (!restaurantId) {
          setError('Restaurant not found.')
          setLoading(false)
          return
        }
        setRestaurantId(restaurantId)

        const { data: restData, error: restErr } = await supabase
          .from('restaurants').select('*').eq('id', restaurantId).single()
        if (restErr) throw restErr
        setRestaurant(restData as Restaurant)

        const { data: promoData } = await supabase
          .from('promos').select('*').eq('restaurant_id', restaurantId).eq('active', true).order('created_at', { ascending: false })
        setPromos((promoData as Promo[]) || [])

        const { data: catData } = await supabase
          .from('menu_items').select('category').eq('restaurant_id', restaurantId).eq('is_available', true).order('sort_order')
        const cats = [...new Set((catData as { category: string }[] | null)?.map((c) => c.category) || [])]
        setCategories(cats.filter(Boolean))
      } catch (err: any) {
        console.error('Welcome load error:', err)
        setError(err.message || 'Failed to load restaurant')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setRestaurantId])

  const q = (path: string) => `${path}?restaurant_id=${encodeURIComponent(restaurantSlug)}`

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
      <p className="text-text-secondary text-sm">{t('loading')}</p>
    </div>
  )

  if (error || !restaurant) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-alt">
      <AlertCircle className="w-10 h-10 text-danger mb-4" />
      <h2 className="text-lg font-bold mb-1 text-text">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6 max-w-xs">{error || 'Could not load restaurant information.'}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 active:scale-95 transition-all shadow-lg">
        {t('retry')}
      </button>
    </div>
  )

  const heroBg = restaurant.hero_url
    ? { backgroundImage: `url(${restaurant.hero_url})` }
    : { background: `linear-gradient(135deg, ${restaurant.primary_color || '#5c7cfa'}, ${restaurant.secondary_color || '#4c6ef5'})` }

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[72px]">
      {/* ── Hero Header ── */}
      <div className="relative min-h-[260px] flex flex-col justify-end px-5 pb-6 pt-14 bg-cover bg-center" style={heroBg}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="relative flex items-end gap-3.5">
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-18 h-18 rounded-2xl shadow-xl object-cover border-2 border-white/20" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-none">{restaurant.name}</h1>
            {restaurant.description && <p className="text-white/70 text-sm leading-snug mt-1.5 line-clamp-2">{restaurant.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              {restaurant.cuisine_type && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-white">
                  <UtensilsCrossed className="w-3 h-3" /> {restaurant.cuisine_type}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-white">
                <Timer className="w-3 h-3" /> 15-25 min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate(q('/floor-plan'))}
            className="flex items-center gap-3 px-5 py-4 bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-500/25 hover:bg-brand-600 active:scale-[0.98] transition-all font-semibold"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <span className="text-sm block leading-tight">Find a Table</span>
              <span className="text-[10px] text-white/70 font-medium">Select a table to start ordering</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
          <button onClick={() => navigate(q('/menu'))}
            className="flex items-center gap-3 px-5 py-4 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-brand-200 active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-brand-500" />
            </div>
            <div className="text-left flex-1">
              <span className="text-sm font-semibold text-text block leading-tight">Browse Menu</span>
              <span className="text-[10px] text-text-muted font-medium">Order to your table or to-go</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>

      {/* ── Promos Row ── */}
      {promos.length > 0 && (
        <div className="px-4 mt-7">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Specials</h2>
            </div>
            <button onClick={() => navigate(q('/menu'))} className="text-xs font-semibold text-brand-500 flex items-center gap-0.5">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none animate-stagger">
            {promos.map((promo) => (
              <button key={promo.id} onClick={() => setSelectedPromo(promo)}
                className="flex-shrink-0 w-48 bg-surface rounded-2xl p-0 border border-border shadow-sm hover:shadow-lg hover:border-brand-200 active:scale-[0.98] transition-all text-left overflow-hidden"
              >
                {promo.image_url && <img src={promo.image_url} alt={promo.name} className="w-full h-24 object-cover" />}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-text truncate">{promo.name}</h3>
                      {promo.description && <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{promo.description}</p>}
                    </div>
                    {promo.discount_value && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-bold rounded-full">
                        {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-$${promo.discount_value}`}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Grid ── */}
      {categories.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <LayoutGrid className="w-4 h-4 text-brand-500" />
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('welcome.subtitle')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 animate-stagger">
            {categories.slice(0, 6).map((cat) => (
              <button key={cat} onClick={() => navigate(q(`/menu&category=${encodeURIComponent(cat)}`))}
                className="flex items-center gap-3 px-4 py-3.5 bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:border-brand-200 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500">
                  {CATEGORY_ICONS[cat.toLowerCase()] || <LayoutGrid className="w-4 h-4" />}
                </div>
                <span className="font-semibold text-sm text-text flex-1 text-left">{cat}</span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Promo Detail Modal ── */}
      {selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedPromo(null)}>
          <div className="bg-surface rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {selectedPromo.image_url && (
              <img src={selectedPromo.image_url} alt={selectedPromo.name} className="w-full h-56 object-cover" />
            )}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-text">{selectedPromo.name}</h3>
                  {selectedPromo.discount_value && (
                    <span className="inline-block mt-1.5 px-3 py-0.5 bg-danger/10 text-danger text-xs font-bold rounded-full">
                      {selectedPromo.discount_type === 'percentage' ? `-${selectedPromo.discount_value}% OFF` : `-$${selectedPromo.discount_value}`}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelectedPromo(null)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              {selectedPromo.description && (
                <p className="text-sm text-text-secondary leading-relaxed">{selectedPromo.description}</p>
              )}
              <button onClick={() => { setSelectedPromo(null); navigate(q('/menu')) }}
                className="w-full py-3.5 bg-brand-500 text-white rounded-2xl font-semibold text-sm hover:bg-brand-600 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Order This Deal
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
