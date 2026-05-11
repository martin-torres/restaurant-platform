import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Order, RestaurantTable } from '../types'

// ─── Types ───

export type OrderNotification = {
  id: string
  title: string
  message: string
  type: 'new' | 'status_change' | 'delivered' | 'cancelled'
  timestamp: number
  read: boolean
  orderId?: string
  tableId?: string
}

interface OrderContextValue {
  notifications: OrderNotification[]
  addNotification: (n: Omit<OrderNotification, 'id' | 'timestamp' | 'read'>) => void
  markAllRead: () => void
  markRead: (id: string) => void
  clearNotifications: () => void
  unreadCount: number
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function useOrderContext() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrderContext must be used within OrderProvider')
  return ctx
}

const STORAGE_KEY = 'restaurant_notifications'
const MAX_NOTIFICATIONS = 50

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<OrderNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  const addNotification = (n: Omit<OrderNotification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications((prev) => {
      const entry: OrderNotification = { ...n, id: crypto.randomUUID(), timestamp: Date.now(), read: false }
      return [entry, ...prev].slice(0, MAX_NOTIFICATIONS)
    })
  }

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )

  const clearNotifications = () => setNotifications([])
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <OrderContext.Provider
      value={{ notifications, addNotification, markAllRead, markRead, clearNotifications, unreadCount }}
    >
      {children}
    </OrderContext.Provider>
  )
}

// ─── Helpers ───

const STATUS_LABELS_ES: Record<string, string> = {
  new: 'Nueva',
  in_progress: 'En preparación',
  ready: 'Lista',
  picking_up: 'Recogiendo',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS_ES[status] || status.replace(/_/g, ' ')
}

export function deriveTableKey(table: RestaurantTable): string {
  return `${table.is_available}|${table.is_reserved}`
}

/** Detect status changes between two table snapshots, returns changed table IDs */
export function diffTables(
  prev: Map<string, string>,
  current: RestaurantTable[],
): Set<string> {
  const changed = new Set<string>()
  for (const table of current) {
    const key = deriveTableKey(table)
    const prevKey = prev.get(table.id)
    if (prevKey !== undefined && prevKey !== key) {
      changed.add(table.id)
    }
  }
  return changed
}