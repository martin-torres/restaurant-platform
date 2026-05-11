import { useEffect, useRef, useState } from 'react'
import type { RestaurantTable } from '../../types'
import { deriveTableKey } from '../contexts/OrderContext'

/**
 * Detects status transitions on tables by comparing is_available/is_reserved
 * between renders. Returns a Set of table IDs that changed. Pulse clears
 * automatically after animation completes (~1.5s).
 */
export function useTableStatusPulses(
  tables: RestaurantTable[],
): Set<string> {
  const prevRef = useRef<Map<string, string>>(new Map())
  const [pulsing, setPulsing] = useState<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const changed = new Set<string>()
    const current = new Map<string, string>()

    for (const table of tables) {
      const key = deriveTableKey(table)
      current.set(table.id, key)
      const prev = prevRef.current.get(table.id)
      if (prev !== undefined && prev !== key) {
        changed.add(table.id)
      }
    }

    prevRef.current = current

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
  }, [tables])

  return pulsing
}