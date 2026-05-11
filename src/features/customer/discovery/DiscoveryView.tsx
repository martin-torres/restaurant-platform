import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Store, MapPin, Clock, Navigation, List, MapIcon, Loader2, AlertCircle,
  ChevronRight, Search, UtensilsCrossed, Star, ArrowUpRight, Compass
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { listRestaurants } from '../../../shared/api/restaurants'
import type { Restaurant } from '../../../types'

function SimpleMap({ restaurants, onSelect }: { restaurants: Restaurant[]; onSelect: (r: Restaurant) => void }) {
  if (restaurants.length === 0) return null
  return (
    <div className="relative w-full min-h-[300px] bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative w-full h-full p-4" style={{ minHeight: 300 }}>
        {restaurants.map((r, idx) => {
          const positions = [{ top: '15%', left: '20%' }, { top: '40%', left: '60%' }, { top: '65%', left: '30%' }, { top: '25%', left: '75%' }, { top: '55%', left: '10%' }, { top: '75%', left: '70%' }, { top: '10%', left: '50%' }, { top: '50%', left: '80%' }]
          const pos = positions[idx % positions.length]
          return (
            <button key={r.id} onClick={() => onSelect(r)} className="absolute flex flex-col items-center group" style={pos}>
              <div className="w-11 h-11 rounded-full bg-brand-500 shadow-lg shadow-brand-500/25 flex items-center justify-center text-white group-hover:scale-110 transition-transform active:scale-95">
                <Store className="w-5 h-5" />
              </div>
              <span className="mt-1.5 px-2.5 py-1 bg-surface/95 border border-border rounded-lg text-[10px] font-bold whitespace-nowrap shadow-sm text-text">{r.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DiscoveryView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await listRestaurants()
        setRestaurants(data)
      } catch (err: any) { setError(err.message || 'Failed to load nearby restaurants') } finally { setLoading(false) }
    }
    fetchRestaurants()
  }, [])

  const filtered = restaurants.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.cuisine_type?.toLowerCase().includes(q)
  })

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    navigate(`/?restaurant_id=${restaurant.id}`)
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
      <h2 className="text-lg font-bold text-text mb-1">{t('error')}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 transition-colors shadow-md">{t('retry')}</button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-surface-alt pb-[72px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-text flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-500" /> Nearby
          </h1>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-0.5 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors active:scale-95 ${viewMode === 'list' ? 'bg-surface-alt shadow-sm text-brand-500' : 'text-text-muted hover:text-text'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-lg transition-colors active:scale-95 ${viewMode === 'map' ? 'bg-surface-alt shadow-sm text-brand-500' : 'text-text-muted hover:text-text'}`}>
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants..." className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-text shadow-sm" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
              <Navigation className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="font-bold text-text mb-1">No restaurants found</h2>
            <p className="text-text-secondary text-sm text-center">There are no restaurants available in your area right now.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="px-4 pt-3 pb-6 space-y-3 animate-stagger">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-text-secondary text-sm font-medium">No restaurants match your search.</p>
              </div>
            ) : (
              filtered.map((restaurant) => (
                <button key={restaurant.id} onClick={() => handleSelectRestaurant(restaurant)}
                  className="w-full flex items-start gap-4 bg-surface rounded-2xl p-4 border border-border shadow-sm hover:shadow-lg hover:border-brand-200 active:scale-[0.99] transition-all text-left">
                  {/* Logo */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-surface-alt shadow-sm">
                    {restaurant.logo_url ? <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-text-muted" /></div>}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-text">{restaurant.name}</h3>
                        {restaurant.cuisine_type && <div className="flex items-center gap-1 mt-0.5"><UtensilsCrossed className="w-3 h-3 text-text-muted" /><span className="text-xs text-text-secondary">{restaurant.cuisine_type}</span></div>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-1" />
                    </div>
                    {restaurant.description && <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{restaurant.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {restaurant.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-text-muted" /><span className="text-[10px] text-text-muted truncate max-w-[140px]">{restaurant.address}</span></div>}
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-text-muted" /><span className="text-[10px] text-text-muted font-medium">Open</span></div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 pb-6">
            <SimpleMap restaurants={filtered} onSelect={handleSelectRestaurant} />
            {filtered.length > 0 && (
              <div className="mt-4 space-y-2 animate-stagger">
                {filtered.map((r) => (
                  <button key={r.id} onClick={() => handleSelectRestaurant(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-border hover:shadow-md hover:border-brand-200 active:scale-[0.99] transition-all shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center">
                      <Store className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-text">{r.name}</p>
                      <p className="text-xs text-text-muted">{r.cuisine_type}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
