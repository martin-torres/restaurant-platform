import { useEffect, useRef, useState } from 'react'
import { useOrderEvents, type OrderEvent } from '../contexts/OrderContext'
import type { Order } from '../../types'

// ─── Status display helpers ───

const STATUS_LABELS: Record<string, string> = {
  new: 'New Order',
  in_progress: 'In Progress',
  ready: 'Ready to Pick Up',
  picking_up: 'Being Delivered',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

// ─── Notification type ───

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  icon: string
  timestamp: number
  read: boolean
}

// ─── Mapping logic ───

function eventToNotification(event: OrderEvent): Notification | null {
  const oid = event.order.id.slice(0, 8)
  const tableNum = event.order.table_id?.slice(0, 4) ?? 'N/A'

  switch (event.type) {
    case 'created':
      return {
        id: crypto.randomUUID(),
        title: '🆕 New Order',
        message: `Table ${tableNum} — #${oid}${event.order.is_request ? ' (Customer Request)' : ''}`,
        type: 'info',
        icon: '🆕',
        timestamp: Date.now(),
        read: false,
      }

    case 'updated': {
      const newLabel = statusLabel(event.order.status)
      const isUrgent = event.order.status === 'ready'

      // Skip trivial no-op updates
      if (event.previousStatus === event.order.status) return null

      return {
        id: crypto.randomUUID(),
        title: isUrgent ? '🔴 Order Ready' : '📋 Status Changed',
        message: `Table ${tableNum} → ${newLabel}${
          event.previousStatus ? ` (was ${statusLabel(event.previousStatus)})` : ''
        }`,
        type: isUrgent ? 'warning' : 'success',
        icon: isUrgent ? '🔔' : '🔄',
        timestamp: Date.now(),
        read: false,
      }
    }

    default:
      return null
  }
}

// ─── Hook ───

export function useOrderNotifications(): {
  notifications: Notification[]
  markRead: (id: string) => void
  markAllRead: () => void
  unreadCount: number
} {
  const { events } = useOrderEvents()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const event of events) {
      // Deduplicate by order ID + event type to avoid repeat notifications
      const dedupeKey = `${event.order.id}:${event.type}:${event.order.status}`
      if (seenIds.current.has(dedupeKey)) continue
      seenIds.current.add(dedupeKey)

      const notif = eventToNotification(event)
      if (notif) {
        setNotifications((prev) => [notif, ...prev].slice(0, 50))
      }
    }
  }, [events])

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, markRead, markAllRead, unreadCount }
}