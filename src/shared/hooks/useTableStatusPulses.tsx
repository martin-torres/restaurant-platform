import { useEffect, useRef, useState } from 'react'
import type { RestaurantTable } from '../../types'
import { deriveTableKey } from '../contexts/OrderContext'
import type { OrderForStatus } from '../components/FloorPlanCanvas'

/**
 * Detects status transitions on tables AND on their active orders.
 * Returns a Set of table IDs that have *just changed* so the
 * FloorPlanCanvas can flash a pulse ring on affected tables.
 * Pulse clears automatically after ~1.5 s.
 */
export function useTableStatusPulses(
  tables: RestaurantTable[],
  orders: OrderForStatus[],
): Set<string> {
  const prevRef = useRef<{ tables: string; orders: string }>({ tables: '', orders: '' })
  const [pulsing, setPulsing] = useState<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const tableKey = tables
      .map((t) => `${t.id}:${t.is_available}|${t.is_reserved}`)
      .join(';')
    const orderKey = orders
      .map((o) => `${o.table_id || 'none'}:${o.status}`)
      .sort()
      .join(';')

    const prev = prevRef.current
    const changed = new Set<string>()

    if (tableKey !== prev.tables) {
      for (const table of tables) changed.add(table.id)
    }

    if (orderKey !== prev.orders) {
      for (const order of orders) {
        if (order.table_id) changed.add(order.table_id)
      }
    }

    prevRef.current = { tables: tableKey, orders: orderKey }

    if (changed.size > 0) {
      setPulsing(new Set(changed))
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setPulsing(new Set())
        timerRef.current = null
      }, 1500)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [tables, orders])

  return pulsing
}