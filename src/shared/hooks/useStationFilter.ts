import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../types'

type Station = 'kitchen' | 'bar' | 'both'

/**
 * Fetches the station mapping (menu_item_id → station) for a restaurant.
 * Used to filter order items by kitchen/bar/FOH.
 */
export function useStationFilter(restaurantId: string | undefined) {
  const [stationMap, setStationMap] = useState<Record<string, Station>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) return
    setLoading(true)
    supabase
      .from('menu_items')
      .select('id, station')
      .eq('restaurant_id', restaurantId)
      .then(({ data }) => {
        const map: Record<string, Station> = {}
        for (const item of data || []) {
          map[item.id] = item.station as Station
        }
        setStationMap(map)
        setLoading(false)
      })
  }, [restaurantId])

  return { stationMap, loading }
}

/**
 * Filters orders so only items matching `targetStation` remain.
 * Orders with no matching items after filtering are removed.
 */
export function filterOrdersByStation(
  orders: Order[],
  stationMap: Record<string, Station>,
  targetStation: 'kitchen' | 'bar'
): Order[] {
  return orders
    .map((order) => ({
      ...order,
      items: (order.items || []).filter((item) => {
        const s = stationMap[item.menu_item_id || '']
        return s === targetStation || s === 'both'
      }),
    }))
    .filter((order) => order.items.length > 0)
}
