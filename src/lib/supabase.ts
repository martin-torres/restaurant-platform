// @ts-nocheck
import { createClient } from '@insforge/sdk'
import { md5 } from 'js-md5'

const insforgeUrl = import.meta.env.VITE_INSFORGE_URL || ''
const insforgeAnonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || ''

if (!insforgeUrl || !insforgeAnonKey) {
  console.warn(
    'InsForge credentials not found. Set VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY in .env'
  )
}

let realtimeConnected = false

function ensureRealtimeConnected() {
  if (!realtimeConnected) {
    try {
      insforge.realtime.connect()
      realtimeConnected = true
    } catch (e) {
      console.warn('Realtime connect failed:', e)
    }
  }
}

const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
})

// ─── Database proxy: wraps .insert() to use array format ───

function wrapInsert(queryBuilder: any) {
  const originalInsert = queryBuilder.insert.bind(queryBuilder)
  queryBuilder.insert = (value: any) => {
    const arrayVal = Array.isArray(value) ? value : [value]
    return originalInsert(arrayVal)
  }
  return queryBuilder
}

// ─── Supabase-like facade ───

export const supabase = {
  from(table: string) {
    const qb = insforge.database.from(table)
    return wrapInsert(qb)
  },

  rpc(fn: string, params?: Record<string, any>) {
    return insforge.database.rpc(fn, params)
  },

  channel(name: string) {
    ensureRealtimeConnected()

    let unsub: (() => void) | null = null
    const handlers: Array<{ config: any; callback: (payload: any) => void }> = []

    const api = {
      on(_type: string, config: any, callback: (payload: any) => void) {
        handlers.push({ config, callback })
        return api
      },
      subscribe(cb?: () => void) {
        const handler = handlers[0]
        if (handler) {
          const chanName = handler.config?.table
            ? `db:${handler.config.schema || 'public'}:${handler.config.table}`
            : name

          const sub = insforge.realtime.subscribe(chanName, (payload: any) => {
            for (const h of handlers) {
              h.callback({ eventType: 'INSERT', new: payload, old: null })
            }
          })
          unsub = typeof sub === 'function' ? sub : () => {}
        }
        if (cb) cb()
        return { unsubscribe: () => unsub?.() }
      },
    }
    return api
  },

  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
}

// ─── Helpers ───

export function stringIdToUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(id)) return id

  const hash = md5(id)
  return hash.substring(0, 8) + '-' + hash.substring(8, 12) + '-' + hash.substring(12, 16) + '-' + hash.substring(16, 20) + '-' + hash.substring(20)
}

export function getRestaurantIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('restaurant_id')
  if (!id) return null
  return stringIdToUuid(id)
}

export function getQrTypeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('qr_type')
}
