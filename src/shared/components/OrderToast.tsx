import React, { useEffect, useRef, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Clock, ShoppingBag } from 'lucide-react'
import { useOrderContext } from '../contexts/OrderContext'

/* ────────────────────────────────────────────
   Toast: visible on EVERY surface (customer,
   staff, owner) via OrderProvider wrapper.
   ──────────────────────────────────────────── */

const TOAST_LIFETIME = 5000 // ms
const MAX_VISIBLE = 3

export default function OrderToaster() {
  const { notifications, markRead } = useOrderContext()
  const [visible, setVisible] = useState<string[]>([])
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Surface unread notifications first
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read)
    const newIds = unread
      .filter((n) => !visible.includes(n.id))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_VISIBLE)
      .map((n) => n.id)

    if (newIds.length > 0) {
      setVisible((prev) => {
        const combined = [...new Set([...prev, ...newIds])]
        return combined.slice(0, MAX_VISIBLE)
      })
    }

    // Remove IDs for notifications that are now read
    setVisible((prev) =>
      prev.filter((id) => {
        const n = notifications.find((no) => no.id === id)
        return n && !n.read
      }),
    )
  }, [notifications])

  // Auto-dismiss timer
  useEffect(() => {
    for (const id of visible) {
      if (timeoutRefs.current.has(id)) continue
      const timer = setTimeout(() => {
        setVisible((prev) => prev.filter((v) => v !== id))
        timeoutRefs.current.delete(id)
      }, TOAST_LIFETIME)
      timeoutRefs.current.set(id, timer)
    }
    return () => {
      for (const [id, timer] of timeoutRefs.current.entries()) {
        if (!visible.includes(id)) {
          clearTimeout(timer)
          timeoutRefs.current.delete(id)
        }
      }
    }
  }, [visible])

  useEffect(() => {
    return () => {
      for (const timer of timeoutRefs.current.values()) clearTimeout(timer)
      timeoutRefs.current.clear()
    }
  }, [])

  if (visible.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {visible.map((id) => {
        const n = notifications.find((no) => no.id === id)
        if (!n) return null
        const iconColor =
          n.type === 'new'
            ? 'text-brand-500'
            : n.type === 'delivered'
            ? 'text-success'
            : n.type === 'cancelled'
            ? 'text-danger'
            : 'text-warning'

        return (
          <div
            key={id}
            className={`
              pointer-events-auto
              bg-surface border border-border rounded-xl shadow-xl p-4
              flex items-start gap-3 text-sm
              animate-slide-in-right animate-fade-in
              border-l-4
              ${n.type === 'new' ? 'border-l-brand-500' : ''}
              ${n.type === 'status_change' ? 'border-l-warning' : ''}
              ${n.type === 'delivered' ? 'border-l-success' : ''}
              ${n.type === 'cancelled' ? 'border-l-danger' : ''}
            `}
            role="alert"
            aria-live="assertive"
          >
            <div className={`shrink-0 ${iconColor}`}>
              {n.type === 'new' && <ShoppingBag className="w-5 h-5" />}
              {n.type === 'status_change' && <Clock className="w-5 h-5" />}
              {n.type === 'delivered' && <CheckCircle2 className="w-5 h-5" />}
              {n.type === 'cancelled' && <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text text-xs">{n.title}</p>
              <p className="text-text-secondary text-[11px] mt-0.5">{n.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                markRead(n.id)
                setVisible((prev) => prev.filter((v) => v !== id))
              }}
              className="shrink-0 text-text-muted hover:text-text transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}